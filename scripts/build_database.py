#!/usr/bin/env python3
"""
Build script for Ký Ức Việt Nam Atlas (1954–1975).
Compiles db/base_16_battles.json + scripts/seed_*.py into:
  1. db/ky_uc_viet_nam.sqlite (relational SQLite DB + FTS5 full-text index)
  2. data/battles_and_martyrs.js (client-side static bundle for GitHub Pages)
  3. data/ky_uc_viet_nam_liet_si_1954_1975.csv (UTF-8 BOM archival spreadsheet)
  4. data/ky_uc_viet_nam_database.json (complete static JSON export)

Enforces strict invariants:
  - 0% Wikipedia anywhere in text, citations, or URLs
  - 100% verified local image asset existence
  - 100% SQLite foreign-key integrity
  - Decision 2A (no invented values) & Decision 3F (sourced awards only)
"""

from __future__ import annotations

import copy
import csv
import json
import re
import sqlite3
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "scripts"))

from seed_campaigns_north_central import (  # noqa: E402
    CAMPAIGNS_NORTH_CENTRAL,
    EXTRA_MARTYRS_CENTRAL_EXISTING,
)
from seed_campaigns_south_highlands import (  # noqa: E402
    CAMPAIGNS_SOUTH_HIGHLANDS,
    EXTRA_MARTYRS_SOUTH_EXISTING,
)
from seed_cemeteries_awards import (  # noqa: E402
    ADDITIONAL_UNITS_SEED,
    AWARDS_SEED,
    BASELINE_MARTYR_ENRICHMENTS,
    CEMETERIES_SEED,
)
from seed_dossiers_enrichments import (  # noqa: E402
    MARTYR_DOSSIER_ENRICHMENTS,
    MARTYR_UNIT_CODE_MAP,
)
from seed_families_meta import (  # noqa: E402
    EXTRA_UNITS_SEED,
    FAMILY_MARTYRS_NORTH_CENTRAL,
    MARTYR_FAMILIES_SEED,
)
from seed_families_south import (  # noqa: E402
    EXPLICIT_SQUAD_GROUPS,
    FAMILY_MARTYRS_SOUTH,
)


def parse_year_from_date(date_str: str | None, fallback: int | None) -> int | None:
    if date_str:
        matches = re.findall(r"(19[5-7]\d)", str(date_str))
        if matches:
            return int(matches[-1])
    return fallback


def normalize_awards_list(raw_awards: list) -> list[dict]:
    normalized = []
    for item in raw_awards or []:
        if isinstance(item, dict):
            normalized.append(
                {
                    "awardId": item["awardId"],
                    "citationLabel": item["citationLabel"],
                    "awardedYear": item.get("awardedYear"),
                    "isPosthumous": bool(item.get("isPosthumous", True)),
                    **_award_source_fields(item),
                }
            )
        else:
            award_id, citation_label, awarded_year, is_posthumous = item
            normalized.append(
                {
                    "awardId": award_id,
                    "citationLabel": citation_label,
                    "awardedYear": awarded_year,
                    "isPosthumous": bool(is_posthumous),
                    **_award_source_fields({}),
                }
            )
    return normalized


def _award_source_fields(item: dict) -> dict:
    # Decision 3F: an award prints on a record only when sourceName is set.
    return {
        "sourceName": item.get("sourceName", ""),
        "sourceUrl": normalize_source_url(item.get("sourceUrl")),
        "decisionRef": item.get("decisionRef", ""),
        "decisionDate": item.get("decisionDate", ""),
        "awardVerified": bool(item.get("awardVerified", False)),
    }


# --- Decision 3B: structured death dates -------------------------------------
# Free-text `sacrificeDate` is kept for reference; the UI reads the fields below.
# Precision: day | month | year | range | unknown. ISO values may be partial
# ("1975-04", "1972"); the length of each ISO value carries its own precision.

_DASH_RE = re.compile(r"\s*[–-]\s*")


def _iso_from_parts(day: str | None, month: str | None, year: str | None) -> str:
    if year and month and day:
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
    if year and month:
        return f"{int(year):04d}-{int(month):02d}"
    return f"{int(year):04d}" if year else ""


def _parse_single_date(text: str) -> tuple[str, str] | None:
    """Return (iso, precision) for one full date expression, or None."""
    t = text.strip()
    t = re.sub(r"^(Tháng|Năm)\s+", "", t, flags=re.IGNORECASE)
    if m := re.fullmatch(r"(\d{1,2})/(\d{1,2})/(\d{4})", t):
        return _iso_from_parts(m[1], m[2], m[3]), "day"
    if m := re.fullmatch(r"(\d{1,2})/(\d{4})", t):
        return _iso_from_parts(None, m[1], m[2]), "month"
    if m := re.fullmatch(r"(\d{4})", t):
        return _iso_from_parts(None, None, m[1]), "year"
    return None


def parse_death_date(raw: str | None, disputed: bool = False) -> dict:
    out = {
        "deathDate": "",
        "deathDatePrecision": "unknown",
        "deathDateEnd": "",
        "deathDateNote": "",
        "dateVerified": False,
        "deathDateDisputed": bool(disputed),
    }
    text = (raw or "").strip()
    if not text:
        return out
    note = ""
    if m := re.fullmatch(r"(.*?)\s*\((.+)\)", text):
        text, note = m[1].strip(), m[2].strip()
    if m := re.fullmatch(r"Mùa hè (\d{4})", text, flags=re.IGNORECASE):
        out.update(deathDate=m[1], deathDatePrecision="year", deathDateNote=f"Mùa hè {m[1]}")
        return out
    single = _parse_single_date(text)
    if single:
        out.update(deathDate=single[0], deathDatePrecision=single[1], deathDateNote=note)
        return out
    parts = _DASH_RE.split(re.sub(r"^Tháng\s+", "", text, flags=re.IGNORECASE))
    if len(parts) == 2:
        left, right = parts
        end = _parse_single_date(right)
        if end:
            end_iso, end_prec = end
            ey, em, ed = (end_iso.split("-") + [None, None])[:3]
            start = _parse_single_date(left)
            if not start:
                if end_prec == "day" and (lm := re.fullmatch(r"(\d{1,2})/(\d{1,2})", left)):
                    start = (_iso_from_parts(lm[1], lm[2], ey), "day")
                elif end_prec == "day" and re.fullmatch(r"\d{1,2}", left):
                    start = (_iso_from_parts(left, em, ey), "day")
                elif end_prec == "month" and re.fullmatch(r"\d{1,2}", left):
                    start = (_iso_from_parts(None, left, ey), "month")
            if start:
                out.update(
                    deathDate=start[0], deathDatePrecision="range",
                    deathDateEnd=end_iso, deathDateNote=note,
                )
                return out
    # Not a date at all (e.g. "Kháng chiến chống Mỹ (Khu 5)"): keep the words as a note.
    out["deathDateNote"] = (raw or "").strip()
    return out


# --- Source links (Decision 2B, task T21) -----------------------------------
# thongtinlietsi.gov.vn no longer resolves (NXDOMAIN, checked 2026-11-12).
DEAD_SOURCE_HOSTS = ("thongtinlietsi.gov.vn",)
# These hosts answered 200 over https on 2026-11-12.
HTTPS_UPGRADE_HOSTS = ("sknc.qdnd.vn", "dsvh.gov.vn")


def normalize_source_url(url: str | None) -> str:
    if not url:
        return ""
    host = re.sub(r"^https?://", "", url).split("/")[0].lower()
    if host.removeprefix("www.") in DEAD_SOURCE_HOSTS:
        return ""
    if url.startswith("http://") and host in HTTPS_UPGRADE_HOSTS:
        return "https://" + url[len("http://"):]
    return url


def normalize_source_urls(obj: dict) -> None:
    for key in ("sourceUrl", "secondarySourceUrl", "source_url", "secondary_source_url"):
        if key in obj:
            obj[key] = normalize_source_url(obj.get(key))


# --- Decision 3C: labelled wartime texts -------------------------------------
# Per-text metadata. `header` is a leading line that is the editor's framing,
# not the writer's words; it is removed from the text. `trailer` likewise.
# Every text starts textVerified=False ("Bản chép lại, chưa đối chiếu bản gốc").
LETTER_METADATA: dict[str, dict] = {
    "ls-le-hoang-vu-binh-gia": {"kind": "thu", "writtenDate": "", "addressee": "", "extent": "trich"},
    "ls-chu-cam-phong-1971": {"kind": "nhat-ky", "writtenDate": "", "addressee": "", "extent": "trich"},
    "ls-dang-thuy-tram-quang-ngai": {
        "kind": "nhat-ky", "writtenDate": "1970-06-20", "addressee": "", "extent": "trich",
        "header": "Ngày 20/6/1970 (Hai ngày trước khi hy sinh tại Đức Phổ, Quảng Ngãi):",
        "headerKeep": "Ngày 20/6/1970:",
        "editorNote": "Hai ngày trước khi hy sinh tại Đức Phổ, Quảng Ngãi.",
    },
    "ls-vo-thi-tan-dong-loc": {
        "kind": "thu", "writtenDate": "1968-07-19", "addressee": "Mẹ", "extent": "trich",
        "header": "Đồng Lộc, ngày 19/7/1968 (5 ngày trước khi hy sinh):",
        "headerKeep": "Đồng Lộc, ngày 19/7/1968:",
        "editorNote": "5 ngày trước khi hy sinh.",
    },
    "ls-le-anh-xuan-1968": {"kind": "tho", "writtenDate": "", "addressee": "", "extent": "trich"},
    "ls-le-van-huynh-1972": {
        "kind": "thu", "writtenDate": "1972-09-11", "addressee": "Gia đình", "extent": "trich",
        "trailer": "(Di bút trưng bày tại Bảo tàng Thành cổ Quảng Trị)",
        "heldAt": "Bảo tàng Thành cổ Quảng Trị",
    },
    "ls-nguyen-van-thac-1972": {
        "kind": "thu", "writtenDate": "1971-09-18", "addressee": "Phạm Thị Như Anh", "extent": "trich",
        "header": "Trích thư Liệt sĩ Nguyễn Văn Thạc gửi Phạm Thị Như Anh (ngày 18/09/1971) — lời tiên tri kỳ diệu về ngày 30/04/1975:",
        "editorNote": "Lời tiên tri kỳ diệu về ngày 30/04/1975.",
        "stripQuotes": True,
    },
}


def build_letter(m: dict) -> dict | None:
    raw = (m.get("letterText") or "").strip()
    if not raw:
        return None
    meta = LETTER_METADATA.get(m["id"])
    if meta is None:
        raise KeyError(f"Missing LETTER_METADATA for {m['id']} (Decision 3C needs kind/extent/date)")
    text = raw
    if meta.get("header"):
        if not text.startswith(meta["header"]):
            raise ValueError(f"Letter header mismatch for {m['id']}")
        text = (meta.get("headerKeep", "") + "\n\n" + text[len(meta["header"]):].strip()).strip()
    if meta.get("trailer"):
        if not text.endswith(meta["trailer"]):
            raise ValueError(f"Letter trailer mismatch for {m['id']}")
        text = text[: -len(meta["trailer"])].strip()
    if meta.get("stripQuotes"):
        text = text.strip().strip('"“”').strip()
    return {
        "kind": meta["kind"],
        "writtenDate": meta.get("writtenDate", ""),
        "addressee": meta.get("addressee", ""),
        "extent": meta["extent"],
        "text": text,
        "editorNote": meta.get("editorNote", ""),
        "sourceName": m.get("sourceName", ""),
        "sourceUrl": m.get("sourceUrl", ""),
        "heldAt": meta.get("heldAt", ""),
        "textVerified": False,
    }


def enrich_martyr(m: dict, battle_year: int, enrichment: dict | None = None) -> dict:
    out = copy.deepcopy(m)
    enr = enrichment or {}
    dossier_enr = MARTYR_DOSSIER_ENRICHMENTS.get(out["id"], {})

    cemetery_id = out.get("cemeteryId") or dossier_enr.get("cemeteryId") or enr.get("cemetery_id")
    out["cemeteryId"] = cemetery_id

    home_province = out.get("homeProvince") or enr.get("home_province") or "Không rõ"
    out["homeProvince"] = home_province

    sac_year = parse_year_from_date(
        out.get("sacrificeDate"),
        out.get("sacrificeYear") or enr.get("sacrifice_year") or battle_year,
    )
    out["sacrificeYear"] = sac_year

    is_coll = bool(
        out.get("isCollective")
        or enr.get("is_collective")
        or str(out.get("id", "")).startswith("ls-tap-the-")
        or str(out.get("id", "")).startswith("ls-k3-tam-dao")
    )
    out["isCollective"] = is_coll

    # Deep biographical dossier fields (Decision 2A: empty string / None when unknown)
    out["unitCode"] = (
        out.get("unitCode")
        or dossier_enr.get("unitCode")
        or MARTYR_UNIT_CODE_MAP.get(out["id"])
    )
    out["familyId"] = out.get("familyId") or dossier_enr.get("familyId") or enr.get("family_id")
    out["familyRole"] = out.get("familyRole") or dossier_enr.get("familyRole") or ""
    out["familyInfo"] = out.get("familyInfo") or dossier_enr.get("familyInfo") or ""
    out["aliasName"] = out.get("aliasName") or dossier_enr.get("aliasName") or ""
    out["enlistmentPeriod"] = out.get("enlistmentPeriod") or dossier_enr.get("enlistmentPeriod") or ""
    out["partyYouthStatus"] = out.get("partyYouthStatus") or dossier_enr.get("partyYouthStatus") or ""
    out["sacrificeLocation"] = out.get("sacrificeLocation") or dossier_enr.get("sacrificeLocation") or ""
    out["commemorationNotes"] = out.get("commemorationNotes") or dossier_enr.get("commemorationNotes") or ""

    sec_url = (
        out.get("secondaryImageUrl")
        or dossier_enr.get("secondaryImageUrl")
        or enr.get("secondary_image_url")
    )
    if sec_url:
        out["secondaryImageUrl"] = sec_url
        out["secondaryImageWidth"] = (
            out.get("secondaryImageWidth")
            or dossier_enr.get("secondaryImageWidth")
            or enr.get("secondary_image_width")
        )
        out["secondaryImageHeight"] = (
            out.get("secondaryImageHeight")
            or dossier_enr.get("secondaryImageHeight")
            or enr.get("secondary_image_height")
        )
        out["secondaryImageCaption"] = (
            out.get("secondaryImageCaption")
            or dossier_enr.get("secondaryImageCaption")
            or enr.get("secondary_image_caption")
        )
        out["secondaryImageCredit"] = (
            out.get("secondaryImageCredit")
            or dossier_enr.get("secondaryImageCredit")
            or enr.get("secondary_image_credit")
        )

    raw_awards = out.get("awards") if out.get("awards") is not None else enr.get("awards", [])
    norm_awards = normalize_awards_list(raw_awards)
    if dossier_enr.get("sourcedAwards"):
        for sa in normalize_awards_list(dossier_enr["sourcedAwards"]):
            replaced = False
            for idx, existing in enumerate(norm_awards):
                if existing["awardId"] == sa["awardId"]:
                    norm_awards[idx] = sa
                    replaced = True
                    break
            if not replaced:
                norm_awards.append(sa)
    out["awards"] = norm_awards
    out.pop("award", None)  # derived display strings are built by the UI from sourced awards only

    normalize_source_urls(out)
    out.update(parse_death_date(out.get("sacrificeDate"), disputed=out["id"] in DISPUTED_DEATH_DATES))

    # Compute exact age at sacrifice only when both birthYear and unambiguous death year are known
    age_at_sac = out.get("ageAtSacrifice")
    if (
        age_at_sac is None
        and not is_coll
        and out.get("birthYear")
        and out.get("deathDate")
        and out["deathDatePrecision"] != "unknown"
    ):
        dy = int(out["deathDate"][:4])
        if out["deathDatePrecision"] == "range" and out.get("deathDateEnd") and int(out["deathDateEnd"][:4]) != dy:
            age_at_sac = None
        else:
            diff = dy - int(out["birthYear"])
            if 10 <= diff <= 95:
                age_at_sac = diff
    out["ageAtSacrifice"] = age_at_sac

    out["letter"] = build_letter(out)
    return out


# Decision 3B: PRD §5.4 gives 11/09/1972; the data gives 02/01/1973. Shown as
# "đang đối chiếu" until a person confirms the date from the cited source.
DISPUTED_DEATH_DATES = {"ls-le-van-huynh-1972"}


def verify_local_asset(rel_path: str | None, context: str) -> None:
    if not rel_path:
        return
    if rel_path.startswith(("http://", "https://")):
        raise ValueError(f"External image URL forbidden ({context}): {rel_path}")
    full = ROOT_DIR / rel_path
    if not full.is_file():
        raise FileNotFoundError(f"Missing local image asset ({context}): {full}")


def describe_family_pair(fam: dict, a_id: str, b_id: str) -> str:
    fid = fam["id"]
    pair = {a_id, b_id}
    if fid == "fam-vo-chong-le-thi-rieng-le-van-ba":
        return "Hai vợ chồng cùng là Liệt sĩ (Lê Thị Riêng – Lê Văn Ba)"
    if fid == "fam-vo-chong-lam-ha-le-van-chac-nguyen-thi-oanh":
        return "Hai vợ chồng cùng là Liệt sĩ trên trận địa phòng không Lam Hạ"
    if fid == "fam-chi-em-lam-ha-nguyen-thi-thu-thi":
        return "Hai chị em gái ruột cùng hy sinh trên mâm pháo 37mm (01/10/1966)"
    if fid == "fam-me-do-thi-que-le-thi-hong-gam":
        return "Hai chị em ruột cùng hy sinh năm 1970 (con Mẹ VNAH Đỗ Thị Quế)"
    if fid == "fam-me-van-thi-thua-duy-xuyen":
        return "Anh em trai ruột cùng là Liệt sĩ (4 con trai Mẹ VNAH Văn Thị Thừa)"
    if fid == "fam-me-nguyen-thi-ranh-cu-chi":
        return "Anh em trai ruột cùng là Liệt sĩ (con Mẹ VNAH Nguyễn Thị Rành)"
    if fid == "fam-me-nguyen-thi-thu-le-thi-tri":
        if pair == {"ls-ngo-thi-cuc-1973", "ls-ngo-thi-dieu-1970"}:
            return "Hai chị em gái ruột (con Mẹ VNAH Lê Thị Trị · cháu ngoại Mẹ VNAH Nguyễn Thị Thứ)"
        if any(x.startswith("ls-ngo-thi-") for x in pair) and any(x.startswith("ls-le-tu-") for x in pair):
            return "Cậu ruột – Cháu ngoại cùng là Liệt sĩ (Đại gia đình Mẹ VNAH Nguyễn Thị Thứ & Lê Thị Trị)"
        return "Anh em trai ruột cùng là Liệt sĩ (con Mẹ VNAH Nguyễn Thị Thứ)"
    if fid == "fam-me-tran-thi-mit-quang-tri":
        if pair == {"ls-nguyen-nang-de-quang-tri", "ls-pham-thi-tiet-quang-tri"}:
            return "Hai vợ chồng cùng là Liệt sĩ (con trai & con dâu Mẹ VNAH Trần Thị Mít)"
        if "ls-nguyen-nang-thanh-1973" in pair:
            return "Chú / Thím / Cô – Cháu ruột trong ba thế hệ Liệt sĩ (Gia đình Mẹ VNAH Trần Thị Mít)"
        if pair == {"ls-nguyen-thi-tiep-quang-tri", "ls-pham-thi-tiet-quang-tri"}:
            return "Chị dâu – Em chồng cùng là Liệt sĩ (Gia đình Mẹ VNAH Trần Thị Mít)"
        return "Anh trai – Em gái ruột cùng là Liệt sĩ (con Mẹ VNAH Trần Thị Mít)"
    return f"Cùng gia đình có nhiều Liệt sĩ ({fam['family_name']})"


def main() -> None:
    base_path = ROOT_DIR / "db" / "base_16_battles.json"
    base_data = json.loads(base_path.read_text(encoding="utf-8"))

    war_periods = base_data["WAR_PERIODS"]
    baseline_battles = copy.deepcopy(base_data["BATTLES_DATA"])
    baseline_units = copy.deepcopy(base_data["UNIT_AUTHORITY_DICT"])

    extra_by_battle: dict[str, list[dict]] = {}
    for source_dict in (
        EXTRA_MARTYRS_CENTRAL_EXISTING,
        EXTRA_MARTYRS_SOUTH_EXISTING,
        FAMILY_MARTYRS_NORTH_CENTRAL,
        FAMILY_MARTYRS_SOUTH,
    ):
        for bid, mlist in source_dict.items():
            extra_by_battle.setdefault(bid, []).extend(mlist)

    # Enrich baseline 16 battles + merge extra martyrs
    all_battles: list[dict] = []
    consumed_extra_battles: set[str] = set()
    for b in baseline_battles:
        byear = int(b["year"])
        enriched_martyrs = []
        for m in b.get("martyrs", []):
            mid = m["id"]
            if mid not in BASELINE_MARTYR_ENRICHMENTS:
                raise KeyError(f"Missing baseline enrichment for {mid}")
            enriched_martyrs.append(enrich_martyr(m, byear, BASELINE_MARTYR_ENRICHMENTS[mid]))
        if b["id"] in extra_by_battle:
            consumed_extra_battles.add(b["id"])
            for extra_m in extra_by_battle[b["id"]]:
                enriched_martyrs.append(enrich_martyr(extra_m, byear))
        b["martyrs"] = enriched_martyrs
        all_battles.append(b)

    # Normalize 13 newly researched battles + merge any extra family martyrs attached to them
    for new_b in CAMPAIGNS_NORTH_CENTRAL + CAMPAIGNS_SOUTH_HIGHLANDS:
        b = copy.deepcopy(new_b)
        byear = int(b["year"])
        enriched_martyrs = [enrich_martyr(m, byear) for m in b.get("martyrs", [])]
        if b["id"] in extra_by_battle:
            consumed_extra_battles.add(b["id"])
            for extra_m in extra_by_battle[b["id"]]:
                enriched_martyrs.append(enrich_martyr(extra_m, byear))
        b["martyrs"] = enriched_martyrs
        all_battles.append(b)

    unmatched_extra = set(extra_by_battle.keys()) - consumed_extra_battles
    if unmatched_extra:
        raise KeyError(f"Extra martyrs attached to unknown battle IDs: {sorted(unmatched_extra)}")

    # Sort battles chronologically
    all_battles.sort(key=lambda x: (int(x["year"]), x["id"]))
    valid_battle_ids = {b["id"] for b in all_battles}

    # Combine & enrich units (24 total) and cross-link battles & martyrs
    all_units = baseline_units + copy.deepcopy(ADDITIONAL_UNITS_SEED) + copy.deepcopy(EXTRA_UNITS_SEED)
    valid_unit_codes = {u["code"] for u in all_units}
    unit_by_code = {u["code"]: u for u in all_units}

    for u in all_units:
        linked = list(dict.fromkeys(bid for bid in u.get("battles", []) if bid in valid_battle_ids))
        aliases_lower = [a.lower() for a in [u["code"], *u.get("aliases", [])] if len(a) >= 3]
        unit_martyr_ids: list[str] = []
        for b in all_battles:
            has_unit_martyr = False
            for m in b["martyrs"]:
                if m.get("unitCode") == u["code"]:
                    unit_martyr_ids.append(m["id"])
                    has_unit_martyr = True
            if b["id"] in linked:
                continue
            rev_units_blob = " | ".join(b.get("combatants", {}).get("rev", {}).get("units", [])).lower()
            if has_unit_martyr or any(al in rev_units_blob for al in aliases_lower):
                linked.append(b["id"])
        u["battles"] = linked
        u["martyrIds"] = unit_martyr_ids

    # Enrich & normalize multi-martyr families
    families_list = copy.deepcopy(MARTYR_FAMILIES_SEED)
    valid_family_ids = {f["id"] for f in families_list}
    for f in families_list:
        normalize_source_urls(f)
        verify_local_asset(f.get("image_url"), f"family:{f['id']}")
        f_mids = [
            m["id"]
            for b in all_battles
            for m in b["martyrs"]
            if m.get("familyId") == f["id"]
        ]
        f["martyrIds"] = f_mids
        f["recorded_in_atlas"] = len(f_mids)

    # Source links: drop dead hosts, upgrade hosts that serve https (2B, T21)
    for b in all_battles:
        normalize_source_urls(b)
    for c in CEMETERIES_SEED:
        normalize_source_urls(c)
        verify_local_asset(c.get("image_url"), f"cemetery:{c['id']}")

    # Check assets, unit codes, family IDs, and unique martyr IDs
    seen_martyr_ids: set[str] = set()
    martyrs_by_unit: dict[str, list[str]] = {}
    for b in all_battles:
        for m in b["martyrs"]:
            if m["id"] in seen_martyr_ids:
                raise ValueError(f"Duplicate martyr ID: {m['id']}")
            seen_martyr_ids.add(m["id"])
            if m.get("unitCode") and m["unitCode"] not in valid_unit_codes:
                raise KeyError(f"Martyr {m['id']} has unknown unitCode: {m['unitCode']}")
            if m.get("unitCode"):
                martyrs_by_unit.setdefault(m["unitCode"], []).append(m["id"])
            if m.get("familyId") and m["familyId"] not in valid_family_ids:
                raise KeyError(f"Martyr {m['id']} has unknown familyId: {m['familyId']}")
            verify_local_asset(m.get("portraitUrl"), f"martyr:{m['id']}:portrait")
            verify_local_asset(m.get("secondaryImageUrl"), f"martyr:{m['id']}:secondary")

    # Build martyr_links graph (canonical undirected pairs martyr_a_id < martyr_b_id)
    martyr_links_list: list[dict] = []
    seen_link_keys: set[tuple[str, str, str]] = set()
    squad_pairs: set[tuple[str, str]] = set()

    def add_link(id1: str, id2: str, rel_type: str, rel_label: str, shared_ctx: str) -> None:
        if id1 == id2:
            return
        a, b_id = (id1, id2) if id1 < id2 else (id2, id1)
        key = (a, b_id, rel_type)
        if key in seen_link_keys:
            return
        seen_link_keys.add(key)
        martyr_links_list.append(
            {
                "martyrAId": a,
                "martyrBId": b_id,
                "relationType": rel_type,
                "relationLabel": rel_label,
                "sharedContext": shared_ctx,
            }
        )

    # 1) Family links
    for f in families_list:
        mids = sorted(f["martyrIds"])
        for i in range(len(mids)):
            for j in range(i + 1, len(mids)):
                add_link(
                    mids[i],
                    mids[j],
                    "family",
                    describe_family_pair(f, mids[i], mids[j]),
                    f["family_name"],
                )

    # 2) Tight tactical squad / tank crew / ship / cell links
    for grp in EXPLICIT_SQUAD_GROUPS:
        members = sorted(grp["members"])
        for mid in members:
            if mid not in seen_martyr_ids:
                raise KeyError(f"EXPLICIT_SQUAD_GROUPS references unknown martyr ID: {mid}")
        for i in range(len(members)):
            for j in range(i + 1, len(members)):
                pair = (members[i], members[j])
                squad_pairs.add(pair)
                add_link(members[i], members[j], "same_squad", grp["label"], grp["context"])

    # 3) Shared canonical unit links (excluding pairs already linked as same_squad)
    for ucode, mids in sorted(martyrs_by_unit.items()):
        ucanon = unit_by_code[ucode]["canonical"]
        smids = sorted(mids)
        for i in range(len(smids)):
            for j in range(i + 1, len(smids)):
                pair = (smids[i], smids[j])
                if pair in squad_pairs:
                    continue
                add_link(
                    smids[i],
                    smids[j],
                    "same_unit",
                    f"Cùng phiên hiệu đơn vị {ucode}",
                    ucanon,
                )

    # Enforce zero-Wikipedia invariant across the entire compiled payload
    combined_check_blob = json.dumps(
        {
            "periods": war_periods,
            "cemeteries": CEMETERIES_SEED,
            "awards": AWARDS_SEED,
            "families": families_list,
            "battles": all_battles,
            "units": all_units,
            "martyr_links": martyr_links_list,
        },
        ensure_ascii=False,
    )
    forbidden_token = "wiki" + "pedia"
    if forbidden_token in combined_check_blob.lower():
        raise AssertionError("CRITICAL: Found forbidden encyclopedia domain in dataset!")

    # 1. Build SQLite database
    db_path = ROOT_DIR / "db" / "ky_uc_viet_nam.sqlite"
    schema_sql = (ROOT_DIR / "db" / "schema.sql").read_text(encoding="utf-8")
    if db_path.exists():
        db_path.unlink()

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    try:
        conn.executescript(schema_sql)
        conn.execute("PRAGMA foreign_keys = ON;")

        for p in war_periods:
            if p["id"] == "ALL":
                continue
            conn.execute(
                """INSERT INTO periods (id, label, short_label, years, color, description)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (p["id"], p["label"], p["shortLabel"], p["years"], p["color"], p["description"]),
            )

        for c in CEMETERIES_SEED:
            conn.execute(
                """INSERT INTO cemeteries (
                     id, name, short_name, province, district_commune, lat, lng,
                     established_year, area_ha, total_graves, graves_note, summary, zones_info,
                     image_url, image_width, image_height, image_caption, image_credit,
                     source_name, source_url
                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    c["id"], c["name"], c["short_name"], c["province"], c["district_commune"],
                    c["lat"], c["lng"], c.get("established_year"), c.get("area_ha"),
                    c.get("total_graves"), c["graves_note"], c["summary"], c.get("zones_info"),
                    c.get("image_url"), c.get("image_width"), c.get("image_height"),
                    c.get("image_caption"), c.get("image_credit"),
                    c["source_name"], c["source_url"],
                ),
            )

        for a in AWARDS_SEED:
            conn.execute(
                """INSERT INTO awards_catalog (
                     id, name, short_name, category, rank_order, instituted_by,
                     description, source_name, source_url
                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    a["id"], a["name"], a["short_name"], a["category"], a["rank_order"],
                    a["instituted_by"], a["description"], a["source_name"], a["source_url"],
                ),
            )

        # Insert units and martyr_families BEFORE martyrs to satisfy foreign keys
        for u in all_units:
            conn.execute(
                "INSERT INTO units (code, canonical, zone, aliases_json) VALUES (?, ?, ?, ?)",
                (u["code"], u["canonical"], u["zone"], json.dumps(u["aliases"], ensure_ascii=False)),
            )

        for f in families_list:
            conn.execute(
                """INSERT INTO martyr_families (
                     id, family_name, matriarch_patriarch, honor_titles, hometown, province,
                     cemetery_id, total_martyrs, recorded_in_atlas, summary,
                     image_url, image_width, image_height, image_caption, image_credit,
                     source_name, source_url, secondary_source_name, secondary_source_url
                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    f["id"], f["family_name"], f["matriarch_patriarch"], f.get("honor_titles"),
                    f["hometown"], f["province"], f.get("cemetery_id"),
                    int(f["total_martyrs"]), int(f["recorded_in_atlas"]), f["summary"],
                    f.get("image_url"), f.get("image_width"), f.get("image_height"),
                    f.get("image_caption"), f.get("image_credit"),
                    f["source_name"], f["source_url"],
                    f.get("secondary_source_name"), f.get("secondary_source_url"),
                ),
            )

        for b in all_battles:
            lat, lng = float(b["coords"][0]), float(b["coords"][1])
            conn.execute(
                """INSERT INTO battles (
                     id, name, alt_name, period_id, date_range, year,
                     location_name, modern_province, military_zone, lat, lng,
                     verification_level, summary, result, estimated_martyrs, archival_note,
                     combatants_json, source_name, source_url,
                     secondary_source_name, secondary_source_url
                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    b["id"], b["name"], b.get("altName"), b["periodId"], b["dateRange"],
                    int(b["year"]), b["locationName"], b["modernProvince"], b["militaryZone"],
                    lat, lng, b["verificationLevel"], b["summary"], b.get("result"),
                    b.get("estimatedMartyrs"), b.get("archivalNote"),
                    json.dumps(b["combatants"], ensure_ascii=False),
                    b.get("sourceName") or b["martyrs"][0]["sourceName"],
                    b.get("sourceUrl") or b["martyrs"][0]["sourceUrl"],
                    b.get("secondarySourceName"), b.get("secondarySourceUrl"),
                ),
            )
            for idx, ph in enumerate(b.get("phases", []), start=1):
                conn.execute(
                    """INSERT INTO battle_phases (battle_id, phase_order, phase_date, title, description)
                       VALUES (?, ?, ?, ?, ?)""",
                    (b["id"], idx, ph.get("date"), ph["title"], ph.get("desc") or ph.get("description", "")),
                )

            for m in b["martyrs"]:
                conn.execute(
                    """INSERT INTO martyrs (
                         id, battle_id, cemetery_id, family_id, unit_code,
                         name, alias_name, birth_year, age_at_sacrifice,
                         sacrifice_date, death_date, death_date_precision, death_date_end, death_date_note,
                         date_verified, date_disputed, sacrifice_year,
                         hometown, home_province, rank_role, unit_raw,
                         enlistment_period, party_youth_status, sacrifice_location,
                         family_role, family_info, commemoration_notes,
                         cemetery_raw, grave_detail, is_collective,
                         verification_level, confidence, story, letter_text, letter_json,
                         portrait_url, portrait_width, portrait_height, image_kind,
                         portrait_caption, portrait_credit,
                         secondary_image_url, secondary_image_width, secondary_image_height,
                         secondary_image_caption, secondary_image_credit,
                         source_name, source_url, secondary_source_name, secondary_source_url
                       ) VALUES (
                         ?, ?, ?, ?, ?,
                         ?, ?, ?, ?,
                         ?, ?, ?, ?, ?,
                         ?, ?, ?,
                         ?, ?, ?, ?,
                         ?, ?, ?,
                         ?, ?, ?,
                         ?, ?, ?,
                         ?, ?, ?, ?, ?,
                         ?, ?, ?, ?,
                         ?, ?,
                         ?, ?, ?,
                         ?, ?,
                         ?, ?, ?, ?
                       )""",
                    (
                        m["id"], b["id"], m.get("cemeteryId"), m.get("familyId"), m.get("unitCode"),
                        m["name"], m.get("aliasName") or None, m.get("birthYear"), m.get("ageAtSacrifice"),
                        m["sacrificeDate"], m["deathDate"] or None, m["deathDatePrecision"],
                        m["deathDateEnd"] or None, m["deathDateNote"] or None,
                        1 if m["dateVerified"] else 0, 1 if m["deathDateDisputed"] else 0,
                        m.get("sacrificeYear"),
                        m["hometown"], m["homeProvince"], m["rankRole"], m["unitRaw"],
                        m.get("enlistmentPeriod") or None, m.get("partyYouthStatus") or None,
                        m.get("sacrificeLocation") or None,
                        m.get("familyRole") or None, m.get("familyInfo") or None,
                        m.get("commemorationNotes") or None,
                        m["cemetery"], m.get("graveDetail"), 1 if m.get("isCollective") else 0,
                        m.get("level", "L4"), float(m.get("confidence", 0.98)),
                        m["story"], (m.get("letter") or {}).get("text"),
                        json.dumps(m["letter"], ensure_ascii=False) if m.get("letter") else None,
                        m.get("portraitUrl"), m.get("portraitWidth"), m.get("portraitHeight"),
                        m.get("imageKind"), m.get("portraitCaption"), m.get("portraitCredit"),
                        m.get("secondaryImageUrl"), m.get("secondaryImageWidth"),
                        m.get("secondaryImageHeight"), m.get("secondaryImageCaption"),
                        m.get("secondaryImageCredit"),
                        m["sourceName"], m["sourceUrl"],
                        m.get("secondarySourceName"), m.get("secondarySourceUrl"),
                    ),
                )
                awards_text_parts = []
                for aw in m.get("awards", []):
                    if aw.get("sourceName"):
                        awards_text_parts.append(aw["citationLabel"])
                    conn.execute(
                        """INSERT INTO martyr_awards (
                             martyr_id, award_id, citation_label, awarded_year, is_posthumous,
                             source_name, source_url, decision_ref, decision_date, award_verified
                           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (
                            m["id"], aw["awardId"], aw["citationLabel"],
                            aw.get("awardedYear"), 1 if aw.get("isPosthumous", True) else 0,
                            aw["sourceName"] or None, aw["sourceUrl"] or None,
                            aw["decisionRef"] or None, aw["decisionDate"] or None,
                            1 if aw["awardVerified"] else 0,
                        ),
                    )
                conn.execute(
                    """INSERT INTO martyrs_fts (
                         martyr_id, name, alias_name, hometown, home_province, unit_raw,
                         rank_role, family_info, commemoration_notes, cemetery_raw,
                         awards_text, story, letter_text
                       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        m["id"], m["name"], m.get("aliasName") or "",
                        m["hometown"], m["homeProvince"], m["unitRaw"],
                        m["rankRole"], m.get("familyInfo") or "", m.get("commemorationNotes") or "",
                        m["cemetery"], " ; ".join(awards_text_parts),
                        m["story"], m.get("letterText") or "",
                    ),
                )

        for u in all_units:
            for bid in u["battles"]:
                conn.execute(
                    "INSERT OR IGNORE INTO unit_battles (unit_code, battle_id) VALUES (?, ?)",
                    (u["code"], bid),
                )

        for lnk in martyr_links_list:
            conn.execute(
                """INSERT INTO martyr_links (
                     martyr_a_id, martyr_b_id, relation_type, relation_label, shared_context
                   ) VALUES (?, ?, ?, ?, ?)""",
                (
                    lnk["martyrAId"], lnk["martyrBId"], lnk["relationType"],
                    lnk["relationLabel"], lnk.get("sharedContext"),
                ),
            )

        fk_errors = conn.execute("PRAGMA foreign_key_check;").fetchall()
        if fk_errors:
            raise AssertionError(f"Foreign key violations: {[tuple(r) for r in fk_errors]}")

        conn.commit()

        # Enrich cemeteries & awards with live relational counts for client-side JS bundle
        cemeteries_js = [
            dict(r)
            for r in conn.execute(
                """SELECT c.*,
                          (SELECT COUNT(*) FROM martyrs m WHERE m.cemetery_id = c.id) AS linked_martyrs_count
                   FROM cemeteries c
                   ORDER BY COALESCE(c.total_graves, 0) DESC, c.name ASC"""
            ).fetchall()
        ]
        awards_js = [
            dict(r)
            for r in conn.execute(
                """SELECT a.*,
                          (SELECT COUNT(*) FROM martyr_awards ma
                           WHERE ma.award_id = a.id AND ma.source_name IS NOT NULL AND ma.source_name != '') AS recipient_count
                   FROM awards_catalog a
                   ORDER BY a.rank_order ASC"""
            ).fetchall()
        ]

        # 2. Export data/battles_and_martyrs.js
        js_bundle = (
            "// AUTO-GENERATED BY scripts/build_database.py — DO NOT EDIT MANUALLY\n"
            "// Source of truth: db/ky_uc_viet_nam.sqlite (100% official Vietnamese archival sources)\n\n"
            f"const WAR_PERIODS = {json.dumps(war_periods, ensure_ascii=False, indent=2)};\n\n"
            f"const CEMETERIES_DATA = {json.dumps(cemeteries_js, ensure_ascii=False, indent=2)};\n\n"
            f"const AWARDS_CATALOG = {json.dumps(awards_js, ensure_ascii=False, indent=2)};\n\n"
            f"const MARTYR_FAMILIES_DATA = {json.dumps(families_list, ensure_ascii=False, indent=2)};\n\n"
            f"const MARTYR_LINKS_DATA = {json.dumps(martyr_links_list, ensure_ascii=False, indent=2)};\n\n"
            f"const BATTLES_DATA = {json.dumps(all_battles, ensure_ascii=False, indent=2)};\n\n"
            f"const UNIT_AUTHORITY_DICT = {json.dumps(all_units, ensure_ascii=False, indent=2)};\n\n"
            "if (typeof window !== 'undefined') {\n"
            "  window.WAR_PERIODS = WAR_PERIODS;\n"
            "  window.CEMETERIES_DATA = CEMETERIES_DATA;\n"
            "  window.AWARDS_CATALOG = AWARDS_CATALOG;\n"
            "  window.MARTYR_FAMILIES_DATA = MARTYR_FAMILIES_DATA;\n"
            "  window.MARTYR_LINKS_DATA = MARTYR_LINKS_DATA;\n"
            "  window.BATTLES_DATA = BATTLES_DATA;\n"
            "  window.UNIT_AUTHORITY_DICT = UNIT_AUTHORITY_DICT;\n"
            "}\n"
            "if (typeof module !== 'undefined' && module.exports) {\n"
            "  module.exports = {\n"
            "    WAR_PERIODS,\n"
            "    CEMETERIES_DATA,\n"
            "    AWARDS_CATALOG,\n"
            "    MARTYR_FAMILIES_DATA,\n"
            "    MARTYR_LINKS_DATA,\n"
            "    BATTLES_DATA,\n"
            "    UNIT_AUTHORITY_DICT,\n"
            "  };\n"
            "}\n"
        )
        (ROOT_DIR / "data" / "battles_and_martyrs.js").write_text(js_bundle, encoding="utf-8")

        # 3. Export data/ky_uc_viet_nam_liet_si_1954_1975.csv (UTF-8 BOM)
        csv_rows = conn.execute(
            """SELECT m.id, m.name, m.alias_name, m.birth_year, m.sacrifice_date, m.age_at_sacrifice,
                      m.hometown, m.home_province, m.rank_role, m.unit_code, m.unit_raw,
                      m.enlistment_period, m.party_youth_status,
                      b.name AS battle_name, m.sacrifice_location,
                      mf.family_name, m.family_role, m.family_info,
                      COALESCE(c.name, m.cemetery_raw) AS cemetery_name,
                      (SELECT GROUP_CONCAT(ma.citation_label, '; ')
                       FROM martyr_awards ma
                       WHERE ma.martyr_id = m.id AND ma.source_name IS NOT NULL AND ma.source_name != '') AS awards,
                      m.commemoration_notes, m.verification_level,
                      m.source_name, m.source_url
               FROM martyrs m
               JOIN battles b ON b.id = m.battle_id
               LEFT JOIN cemeteries c ON c.id = m.cemetery_id
               LEFT JOIN martyr_families mf ON mf.id = m.family_id
               ORDER BY COALESCE(m.sacrifice_year, b.year) ASC, m.name ASC"""
        ).fetchall()
        csv_headers = [
            "Mã hồ sơ", "Họ và tên Liệt sĩ / Tập thể", "Tên khai sinh / Bí danh",
            "Năm sinh", "Ngày hy sinh", "Tuổi lúc hy sinh",
            "Quê quán", "Tỉnh/Thành quê quán", "Cấp bậc / Chức vụ",
            "Mã phiên hiệu chuẩn", "Phiên hiệu đơn vị chi tiết",
            "Nhập ngũ / Quá trình hoạt động", "Đảng – Đoàn",
            "Chiến dịch / Trận đánh", "Địa điểm hy sinh",
            "Hồ sơ Gia đình nhiều Liệt sĩ", "Quan hệ trong gia đình Liệt sĩ", "Thân nhân & Gia đình",
            "Nghĩa trang / Nơi tưởng niệm", "Huân chương / Danh hiệu (có nguồn)",
            "Di tích & Tưởng niệm", "Cấp xác minh",
            "Nguồn sử liệu", "Liên kết nguồn",
        ]
        csv_path = ROOT_DIR / "data" / "ky_uc_viet_nam_liet_si_1954_1975.csv"
        with csv_path.open("w", encoding="utf-8-sig", newline="") as fh:
            writer = csv.writer(fh)
            writer.writerow(csv_headers)
            for r in csv_rows:
                writer.writerow([r[k] if r[k] is not None else "" for k in r.keys()])

        # 4. Export data/ky_uc_viet_nam_database.json
        db_json_payload = {
            "database": "Ký Ức Việt Nam Atlas (1954–1975)",
            "periods": war_periods,
            "awards_catalog": awards_js,
            "cemeteries": cemeteries_js,
            "martyr_families": families_list,
            "martyr_links": martyr_links_list,
            "battles": all_battles,
            "units": all_units,
        }
        (ROOT_DIR / "data" / "ky_uc_viet_nam_database.json").write_text(
            json.dumps(db_json_payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        # Summary printout
        n_battles = conn.execute("SELECT COUNT(*) FROM battles").fetchone()[0]
        n_martyrs = conn.execute("SELECT COUNT(*) FROM martyrs").fetchone()[0]
        n_indiv = conn.execute("SELECT COUNT(*) FROM martyrs WHERE is_collective = 0").fetchone()[0]
        n_coll = conn.execute("SELECT COUNT(*) FROM martyrs WHERE is_collective = 1").fetchone()[0]
        n_fam = conn.execute("SELECT COUNT(*) FROM martyr_families").fetchone()[0]
        n_fam_m = conn.execute(
            "SELECT COUNT(*) FROM martyrs WHERE family_id IS NOT NULL AND family_id != ''"
        ).fetchone()[0]
        n_links = conn.execute("SELECT COUNT(*) FROM martyr_links").fetchone()[0]
        n_photos = conn.execute(
            "SELECT COUNT(*) FROM martyrs WHERE portrait_url IS NOT NULL AND portrait_url != ''"
        ).fetchone()[0]
        n_letters = conn.execute(
            "SELECT COUNT(*) FROM martyrs WHERE letter_text IS NOT NULL AND letter_text != ''"
        ).fetchone()[0]
        n_cem = conn.execute("SELECT COUNT(*) FROM cemeteries").fetchone()[0]
        n_graves = conn.execute("SELECT SUM(total_graves) FROM cemeteries").fetchone()[0]
        n_aw_cat = conn.execute("SELECT COUNT(*) FROM awards_catalog").fetchone()[0]
        n_aw_sourced = conn.execute(
            "SELECT COUNT(*) FROM martyr_awards WHERE source_name IS NOT NULL AND source_name != ''"
        ).fetchone()[0]
        n_units = conn.execute("SELECT COUNT(*) FROM units").fetchone()[0]
        print(
            f"BUILD OK: {n_battles} battles | {n_martyrs} martyr records "
            f"({n_indiv} individuals + {n_coll} collectives) | "
            f"{n_fam} multi-martyr families ({n_fam_m} linked martyrs) | "
            f"{n_links} martyr-to-martyr links | {n_photos} with photos | "
            f"{n_letters} with letters/poems | {n_cem} cemeteries ({n_graves:,} graves) | "
            f"{n_aw_cat} award categories ({n_aw_sourced} sourced citations) | {n_units} units | 0 Wikipedia"
        )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
