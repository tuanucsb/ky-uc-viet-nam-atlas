#!/usr/bin/env python3
"""
Ký Ức Việt Nam Atlas (1954–1975) — SQLite API & Static Web Server
Serves static files from the project root and exposes read-only REST & CSV/JSON
endpoints backed by db/ky_uc_viet_nam.sqlite.
"""

from __future__ import annotations

import csv
import io
import json
import os
import sqlite3
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT_DIR = Path(__file__).resolve().parent
DB_PATH = ROOT_DIR / "db" / "ky_uc_viet_nam.sqlite"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


class AtlasRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        try:
            super().log_message(fmt, *args)
        except BrokenPipeError:
            pass

    def _send_json(self, payload: object, status: int = 200) -> None:
        raw = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(raw)

    def _send_csv(self, filename: str, headers: list[str], rows: list[list[object]]) -> None:
        buf = io.StringIO()
        buf.write("\ufeff")  # UTF-8 BOM so Excel opens Vietnamese diacritics cleanly
        writer = csv.writer(buf)
        writer.writerow(headers)
        writer.writerows(rows)
        raw = buf.getvalue().encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if not path.startswith("/api/"):
            return super().do_GET()

        if not DB_PATH.exists():
            return self._send_json({"error": "SQLite database not initialized"}, status=503)

        params = parse_qs(parsed.query)
        try:
            with get_db() as conn:
                if path == "/api/stats":
                    stats = {
                        "battles": conn.execute("SELECT COUNT(*) FROM battles").fetchone()[0],
                        "martyrs": conn.execute("SELECT COUNT(*) FROM martyrs").fetchone()[0],
                        "individual_martyrs": conn.execute(
                            "SELECT COUNT(*) FROM martyrs WHERE is_collective = 0"
                        ).fetchone()[0],
                        "collective_memorials": conn.execute(
                            "SELECT COUNT(*) FROM martyrs WHERE is_collective = 1"
                        ).fetchone()[0],
                        "martyr_families": conn.execute(
                            "SELECT COUNT(*) FROM martyr_families"
                        ).fetchone()[0],
                        "martyrs_in_multi_martyr_families": conn.execute(
                            "SELECT COUNT(*) FROM martyrs WHERE family_id IS NOT NULL AND family_id != ''"
                        ).fetchone()[0],
                        "martyr_links": conn.execute(
                            "SELECT COUNT(*) FROM martyr_links"
                        ).fetchone()[0],
                        "martyrs_with_photos": conn.execute(
                            "SELECT COUNT(*) FROM martyrs WHERE portrait_url IS NOT NULL AND portrait_url != ''"
                        ).fetchone()[0],
                        "martyrs_with_letters": conn.execute(
                            "SELECT COUNT(*) FROM martyrs WHERE letter_text IS NOT NULL AND letter_text != ''"
                        ).fetchone()[0],
                        "cemeteries": conn.execute("SELECT COUNT(*) FROM cemeteries").fetchone()[0],
                        "total_cemetery_graves": conn.execute(
                            "SELECT COALESCE(SUM(total_graves), 0) FROM cemeteries"
                        ).fetchone()[0],
                        "awards_catalog": conn.execute(
                            "SELECT COUNT(*) FROM awards_catalog"
                        ).fetchone()[0],
                        "martyr_award_records": conn.execute(
                            "SELECT COUNT(*) FROM martyr_awards WHERE source_name IS NOT NULL AND source_name != ''"
                        ).fetchone()[0],
                        "units": conn.execute("SELECT COUNT(*) FROM units").fetchone()[0],
                    }
                    return self._send_json(stats)

                if path == "/api/cemeteries":
                    rows = conn.execute(
                        """
                        SELECT c.*,
                               (SELECT COUNT(*) FROM martyrs m WHERE m.cemetery_id = c.id) AS linked_martyrs_count
                        FROM cemeteries c
                        ORDER BY COALESCE(c.total_graves, 0) DESC, c.name ASC
                        """
                    ).fetchall()
                    return self._send_json([dict(r) for r in rows])

                if path == "/api/awards":
                    rows = conn.execute(
                        """
                        SELECT a.*,
                               (SELECT COUNT(*) FROM martyr_awards ma
                                WHERE ma.award_id = a.id AND ma.source_name IS NOT NULL AND ma.source_name != '') AS recipient_count
                        FROM awards_catalog a
                        ORDER BY a.rank_order ASC
                        """
                    ).fetchall()
                    return self._send_json([dict(r) for r in rows])

                if path == "/api/families":
                    fam_rows = conn.execute(
                        """
                        SELECT mf.*
                        FROM martyr_families mf
                        ORDER BY mf.total_martyrs DESC, mf.family_name ASC
                        """
                    ).fetchall()
                    result = []
                    for fr in fam_rows:
                        item = dict(fr)
                        m_rows = conn.execute(
                            """
                            SELECT m.id, m.name, m.birth_year, m.age_at_sacrifice,
                                   m.sacrifice_date, m.death_date, m.death_date_precision,
                                   m.rank_role, m.unit_code, m.unit_raw, m.family_role,
                                   m.battle_id, b.name AS battle_name
                            FROM martyrs m
                            JOIN battles b ON b.id = m.battle_id
                            WHERE m.family_id = ?
                            ORDER BY COALESCE(m.sacrifice_year, b.year) ASC, m.name ASC
                            """,
                            (fr["id"],),
                        ).fetchall()
                        item["martyrs"] = [dict(mr) for mr in m_rows]
                        result.append(item)
                    return self._send_json(result)

                if path == "/api/martyr-links":
                    martyr_id = params.get("martyr_id", [None])[0]
                    rel_type = params.get("relation_type", [None])[0]
                    if martyr_id:
                        clauses = ["(ml.martyr_a_id = ? OR ml.martyr_b_id = ?)"]
                        args_lnk: list[object] = [martyr_id, martyr_id]
                        if rel_type:
                            clauses.append("ml.relation_type = ?")
                            args_lnk.append(rel_type)
                        rows = conn.execute(
                            f"""
                            SELECT ml.id, ml.relation_type, ml.relation_label, ml.shared_context,
                                   CASE WHEN ml.martyr_a_id = ? THEN ml.martyr_b_id ELSE ml.martyr_a_id END AS partner_id,
                                   pm.name AS partner_name,
                                   pm.rank_role AS partner_rank_role,
                                   pm.unit_code AS partner_unit_code,
                                   pm.battle_id AS partner_battle_id,
                                   pb.name AS partner_battle_name
                            FROM martyr_links ml
                            JOIN martyrs pm ON pm.id = (CASE WHEN ml.martyr_a_id = ? THEN ml.martyr_b_id ELSE ml.martyr_a_id END)
                            JOIN battles pb ON pb.id = pm.battle_id
                            WHERE {" AND ".join(clauses)}
                            ORDER BY CASE ml.relation_type
                                       WHEN 'family' THEN 1
                                       WHEN 'same_squad' THEN 2
                                       ELSE 3
                                     END ASC,
                                     pm.name ASC
                            """,
                            [martyr_id, martyr_id, *args_lnk],
                        ).fetchall()
                        return self._send_json([dict(r) for r in rows])

                    clauses = []
                    args_all: list[object] = []
                    if rel_type:
                        clauses.append("relation_type = ?")
                        args_all.append(rel_type)
                    where_sql = (" WHERE " + " AND ".join(clauses)) if clauses else ""
                    rows = conn.execute(
                        f"SELECT * FROM martyr_links{where_sql} ORDER BY id ASC",
                        args_all,
                    ).fetchall()
                    return self._send_json([dict(r) for r in rows])

                if path == "/api/battles":
                    period = params.get("period", [None])[0]
                    sql = """
                        SELECT b.*,
                               (SELECT COUNT(*) FROM martyrs m WHERE m.battle_id = b.id) AS martyr_count
                        FROM battles b
                    """
                    args: list[object] = []
                    if period and period != "ALL":
                        sql += " WHERE b.period_id = ?"
                        args.append(period)
                    sql += " ORDER BY b.year ASC, b.id ASC"
                    rows = conn.execute(sql, args).fetchall()
                    return self._send_json([dict(r) for r in rows])

                if path == "/api/martyrs":
                    clauses = []
                    args = []
                    if params.get("battle_id"):
                        clauses.append("m.battle_id = ?")
                        args.append(params["battle_id"][0])
                    if params.get("cemetery_id"):
                        clauses.append("m.cemetery_id = ?")
                        args.append(params["cemetery_id"][0])
                    if params.get("family_id"):
                        clauses.append("m.family_id = ?")
                        args.append(params["family_id"][0])
                    if params.get("unit_code"):
                        clauses.append("m.unit_code = ?")
                        args.append(params["unit_code"][0])
                    if params.get("award_id"):
                        clauses.append(
                            """EXISTS (
                                 SELECT 1 FROM martyr_awards ma
                                 WHERE ma.martyr_id = m.id AND ma.award_id = ?
                                   AND ma.source_name IS NOT NULL AND ma.source_name != ''
                               )"""
                        )
                        args.append(params["award_id"][0])
                    if params.get("province"):
                        clauses.append("m.home_province = ?")
                        args.append(params["province"][0])
                    if params.get("q"):
                        q_like = f"%{params['q'][0].strip()}%"
                        clauses.append(
                            """(m.name LIKE ? OR COALESCE(m.alias_name,'') LIKE ?
                                OR m.hometown LIKE ? OR m.unit_raw LIKE ?
                                OR COALESCE(m.unit_code,'') LIKE ?
                                OR COALESCE(m.family_info,'') LIKE ?
                                OR COALESCE(m.sacrifice_location,'') LIKE ?
                                OR m.cemetery_raw LIKE ? OR m.story LIKE ?)"""
                        )
                        args.extend([q_like] * 9)

                    where_sql = (" WHERE " + " AND ".join(clauses)) if clauses else ""
                    rows = conn.execute(
                        f"""
                        SELECT m.*, b.name AS battle_name, b.year AS battle_year,
                               c.name AS cemetery_official_name,
                               mf.family_name AS family_official_name,
                               (SELECT GROUP_CONCAT(ma.citation_label, ' · ')
                                FROM martyr_awards ma
                                WHERE ma.martyr_id = m.id
                                  AND ma.source_name IS NOT NULL AND ma.source_name != '') AS awards_summary
                        FROM martyrs m
                        JOIN battles b ON b.id = m.battle_id
                        LEFT JOIN cemeteries c ON c.id = m.cemetery_id
                        LEFT JOIN martyr_families mf ON mf.id = m.family_id
                        {where_sql}
                        ORDER BY COALESCE(m.sacrifice_year, b.year) ASC, m.name ASC
                        """,
                        args,
                    ).fetchall()
                    return self._send_json([dict(r) for r in rows])

                if path == "/api/export/martyrs.csv":
                    rows = conn.execute(
                        """
                        SELECT m.id, m.name, m.alias_name, m.birth_year, m.sacrifice_date, m.age_at_sacrifice,
                               m.hometown, m.home_province, m.rank_role, m.unit_code, m.unit_raw,
                               m.enlistment_period, m.party_youth_status,
                               b.name AS battle_name, m.sacrifice_location,
                               mf.family_name, m.family_role, m.family_info,
                               COALESCE(c.name, m.cemetery_raw) AS cemetery_name,
                               (SELECT GROUP_CONCAT(ma.citation_label, '; ')
                                FROM martyr_awards ma
                                WHERE ma.martyr_id = m.id
                                  AND ma.source_name IS NOT NULL AND ma.source_name != '') AS awards,
                               m.commemoration_notes, m.verification_level,
                               m.source_name, m.source_url
                        FROM martyrs m
                        JOIN battles b ON b.id = m.battle_id
                        LEFT JOIN cemeteries c ON c.id = m.cemetery_id
                        LEFT JOIN martyr_families mf ON mf.id = m.family_id
                        ORDER BY COALESCE(m.sacrifice_year, b.year) ASC, m.name ASC
                        """
                    ).fetchall()
                    headers = [
                        "Mã hồ sơ",
                        "Họ và tên Liệt sĩ / Tập thể",
                        "Tên khai sinh / Bí danh",
                        "Năm sinh",
                        "Ngày hy sinh",
                        "Tuổi lúc hy sinh",
                        "Quê quán",
                        "Tỉnh/Thành quê quán",
                        "Cấp bậc / Chức vụ",
                        "Mã phiên hiệu chuẩn",
                        "Phiên hiệu đơn vị chi tiết",
                        "Nhập ngũ / Quá trình hoạt động",
                        "Đảng – Đoàn",
                        "Chiến dịch / Trận đánh",
                        "Địa điểm hy sinh",
                        "Hồ sơ Gia đình nhiều Liệt sĩ",
                        "Quan hệ trong gia đình Liệt sĩ",
                        "Thân nhân & Gia đình",
                        "Nghĩa trang / Nơi tưởng niệm",
                        "Huân chương / Danh hiệu (có nguồn)",
                        "Di tích & Tưởng niệm",
                        "Cấp xác minh",
                        "Nguồn sử liệu",
                        "Liên kết nguồn",
                    ]
                    return self._send_csv(
                        "ky_uc_viet_nam_liet_si_1954_1975.csv",
                        headers,
                        [[r[k] if r[k] is not None else "" for k in r.keys()] for r in rows],
                    )

                if path == "/api/export/database.json":
                    payload = {
                        "database": "Ký Ức Việt Nam Atlas (1954–1975)",
                        "periods": [
                            dict(r) for r in conn.execute("SELECT * FROM periods").fetchall()
                        ],
                        "awards_catalog": [
                            dict(r)
                            for r in conn.execute(
                                "SELECT * FROM awards_catalog ORDER BY rank_order"
                            ).fetchall()
                        ],
                        "cemeteries": [
                            dict(r)
                            for r in conn.execute(
                                "SELECT * FROM cemeteries ORDER BY COALESCE(total_graves,0) DESC"
                            ).fetchall()
                        ],
                        "martyr_families": [
                            dict(r)
                            for r in conn.execute(
                                "SELECT * FROM martyr_families ORDER BY total_martyrs DESC"
                            ).fetchall()
                        ],
                        "units": [
                            dict(r)
                            for r in conn.execute("SELECT * FROM units ORDER BY code").fetchall()
                        ],
                        "battles": [
                            dict(r)
                            for r in conn.execute("SELECT * FROM battles ORDER BY year").fetchall()
                        ],
                        "martyrs": [
                            dict(r)
                            for r in conn.execute(
                                "SELECT * FROM martyrs ORDER BY sacrifice_year, id"
                            ).fetchall()
                        ],
                        "martyr_awards": [
                            dict(r)
                            for r in conn.execute("SELECT * FROM martyr_awards").fetchall()
                        ],
                        "martyr_links": [
                            dict(r)
                            for r in conn.execute("SELECT * FROM martyr_links ORDER BY id").fetchall()
                        ],
                    }
                    return self._send_json(payload)

                return self._send_json({"error": f"Unknown endpoint {path}"}, status=404)
        except Exception as exc:
            return self._send_json({"error": str(exc)}, status=500)


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", "8090"))
    server = ThreadingHTTPServer(("", port), AtlasRequestHandler)
    print(f"Ký Ức Việt Nam Atlas SQLite + Web Server listening on http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
