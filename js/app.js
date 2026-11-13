/**
 * Ký Ức Việt Nam Atlas (1954–1975)
 * Interactive Memorial Atlas of Battles, Fallen Soldiers (Liệt sĩ) & Unit Designations (Phiên hiệu)
 * Implements DESIGN.md and DESIGN_REVIEW_ANTIGRAVITY.md (Decisions 1A, 1B, 1C & Evidence E1–E16)
 */

// ============================================================================
// RECORD FIELD FORMATTERS (Decisions 2A, 3A, 3B, 3C, 3F)
// ============================================================================

const UNKNOWN_TEXT = "Chưa rõ";

// Owner supplies this address (Decision 3E / D25). While empty, no report link is rendered.
const CONTACT_EMAIL = "";

// ISO date with its own precision ("1975-04-30", "1975-04", "1975") → Vietnamese text
function formatIsoPartial(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (d) return `${d}/${m}/${y}`;
  if (m) return `tháng ${Number(m)}/${y}`;
  return `năm ${y}`;
}

// Decision 3B: the date shows its precision; the note is returned separately.
function formatDeathDate(m) {
  const p = m.deathDatePrecision || "unknown";
  let text;
  if (p === "unknown" || !m.deathDate) {
    text = "Chưa rõ ngày hy sinh";
  } else if (p === "range") {
    text = `trong khoảng ${formatIsoPartial(m.deathDate)} – ${formatIsoPartial(m.deathDateEnd)}`;
  } else {
    text = formatIsoPartial(m.deathDate);
  }
  return {
    text,
    note: p === "unknown" ? (m.deathDateNote || "") : (m.deathDateNote || ""),
    disputed: Boolean(m.deathDateDisputed) && !m.dateVerified
  };
}

// Short "birth – death" line for lists and search rows
function formatLifeYears(m) {
  if (m.isCollective) return "Tập thể";
  const birth = m.birthYear ? String(m.birthYear) : UNKNOWN_TEXT;
  const death = m.deathDate ? m.deathDate.slice(0, 4) : UNKNOWN_TEXT;
  const deathPart = m.deathDatePrecision === "range" && m.deathDateEnd && m.deathDateEnd.slice(0, 4) !== death
    ? `${death}–${m.deathDateEnd.slice(0, 4)}`
    : death;
  return `${birth} – ${deathPart}`;
}

// 6C list rows: "Kiến Xương, Thái Bình" and "Lữ đoàn Công binh 249"; the record keeps the full text
function shortHometown(m) {
  const parts = (m.hometown || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length <= 2) return m.hometown || "";
  return parts.slice(-2).map((x) => x.replace(/^(huyện|thị xã|thành phố|TP\.|quận|tỉnh|xã|phường)\s+/i, "")).join(", ");
}

function shortUnit(m) {
  const base = (m.unit || "").replace(/\s*\(.*$/, "");
  const parts = base.split(",").map((x) => x.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : m.unit || "";
}

const LETTER_KIND_LABELS = { thu: "Thư", "nhat-ky": "Nhật ký", tho: "Thơ" };

// Decision 3C: title built from data, never generated prose
function formatLetterTitle(letter) {
  const kind = LETTER_KIND_LABELS[letter.kind] || "Văn bản";
  let title = kind;
  if (letter.kind === "thu" && letter.addressee) title += ` gửi ${letter.addressee.toLowerCase() === "mẹ" ? "mẹ" : letter.addressee}`;
  if (letter.writtenDate) title += `, ${formatIsoPartial(letter.writtenDate)}`;
  return title;
}

function ensureNormalizedDataGlobals() {
  if (!window.VIETNAM_GEO_OUTLINE) {
    // Convert [lon, lat] coastline points to [lat, lng]
    const rawMainland = [
      [108.05, 21.55], [107.05, 20.85], [106.60, 20.65], [106.15, 20.05],
      [105.85, 19.75], [105.65, 19.05], [105.75, 18.65], [105.95, 18.30],
      [106.45, 17.95], [106.65, 17.50], [107.10, 17.05], [107.60, 16.65],
      [108.20, 16.10], [108.65, 15.50], [108.90, 15.10], [109.10, 14.40],
      [109.25, 13.75], [109.30, 12.95], [109.20, 12.20], [109.15, 11.60],
      [108.60, 11.15], [107.95, 10.75], [107.10, 10.35], [106.75, 9.95],
      [106.35, 9.50],  [105.80, 9.15],  [105.15, 8.60],  [104.75, 8.62],
      [104.85, 9.25],  [105.05, 9.95],  [104.50, 10.40], [105.10, 10.90],
      [105.85, 10.95], [105.95, 11.55], [106.50, 11.85], [107.40, 12.30],
      [107.55, 13.35], [107.45, 14.15], [107.55, 14.70], [107.30, 15.40],
      [107.15, 16.10], [106.55, 16.65], [106.40, 17.05], [105.70, 17.65],
      [105.25, 18.35], [104.80, 19.15], [104.05, 19.45], [104.55, 20.35],
      [103.95, 20.75], [103.00, 21.15], [102.20, 21.65], [102.15, 22.40],
      [102.80, 22.70], [103.85, 22.80], [104.90, 23.30], [105.45, 23.35],
      [106.65, 22.85], [106.85, 22.15], [107.50, 21.65], [108.05, 21.55]
    ];
    window.VIETNAM_GEO_OUTLINE = {
      mainland: rawMainland.map(([lon, lat]) => [lat, lon]),
      dmzLine: [
        [17.0, 106.4],
        [17.0, 107.35]
      ],
      truongSonTrail: [
        [18.36, 105.72],
        [17.55, 106.10],
        [16.62, 106.58],
        [15.45, 107.30],
        [14.65, 107.80],
        [13.58, 107.71],
        [12.66, 108.03],
        [11.83, 106.99],
        [11.53, 106.89]
      ],
      militaryZones: [
        {
          id: "NORTH_PKKQ",
          fillColor: "rgba(244, 114, 106, 0.08)",
          polygon: [[22.5,102.1],[23.35,105.4],[22.8,106.8],[21.55,108.05],[20.5,106.6],[19.8,105.8],[20.6,103.8]]
        },
        {
          id: "DMZ_B5",
          fillColor: "rgba(245, 158, 11, 0.11)",
          polygon: [[17.3,105.7],[17.2,107.2],[16.15,108.1],[15.95,106.9],[16.5,105.7]]
        },
        {
          id: "TAY_NGUYEN_B3",
          fillColor: "rgba(168, 85, 247, 0.09)",
          polygon: [[15.3,107.3],[15.1,108.2],[12.2,108.55],[12.2,107.35]]
        },
        {
          id: "MIEN_DONG_B2",
          fillColor: "rgba(56, 189, 248, 0.09)",
          polygon: [[11.95,105.9],[12.1,107.6],[10.5,107.9],[10.35,106.4]]
        }
      ],
      islands: [
        {
          name: "Quần đảo Hoàng Sa (Việt Nam)",
          subLabel: "TP. Đà Nẵng · Chủ quyền Việt Nam",
          lat: 16.55,
          lng: 112.0,
          isSovereignArchipelago: true,
          boundsPolygon: [
            [17.15, 111.1],
            [17.15, 112.9],
            [15.75, 112.9],
            [15.75, 111.1]
          ],
          clusters: [
            { name: "Đảo Phú Lâm", lat: 16.83, lng: 112.33 },
            { name: "Đảo Hoàng Sa", lat: 16.53, lng: 111.60 },
            { name: "Đảo Tri Tôn", lat: 15.78, lng: 111.20 },
            { name: "Đảo Linh Côn", lat: 16.67, lng: 112.73 }
          ]
        },
        {
          name: "Quần đảo Trường Sa (Việt Nam)",
          subLabel: "Tỉnh Khánh Hòa · Chủ quyền Việt Nam",
          lat: 10.0,
          lng: 114.0,
          isSovereignArchipelago: true,
          boundsPolygon: [
            [11.6, 111.8],
            [11.6, 115.8],
            [8.4, 115.8],
            [8.4, 111.8]
          ],
          clusters: [
            { name: "Đảo Trường Sa Lớn", lat: 8.64, lng: 111.92 },
            { name: "Đảo Song Tử Tây", lat: 11.43, lng: 114.33 },
            { name: "Đảo Sinh Tồn", lat: 9.88, lng: 114.32 },
            { name: "Đảo Nam Yết", lat: 10.18, lng: 114.36 },
            { name: "Đảo Sơn Ca", lat: 10.38, lng: 114.48 },
            { name: "Đảo An Bang", lat: 7.89, lng: 112.92 }
          ]
        },
        { name: "Đảo Phú Quốc", lat: 10.22, lng: 103.96 },
        { name: "Côn Đảo", lat: 8.68, lng: 106.60 },
        { name: "Đảo Cồn Cỏ", lat: 17.16, lng: 107.34 },
        { name: "Đảo Bạch Long Vĩ", lat: 20.13, lng: 107.72 }
      ]
    };
  }

  if (!window.THEATRE_CAMERA_PRESETS) {
    window.THEATRE_CAMERA_PRESETS = {
      ALL_VN: { centerLat: 16.0, centerLng: 108.0, zoom: 1.0 },
      NORTH_PKKQ: { centerLat: 20.4, centerLng: 105.9, zoom: 2.1 },
      DMZ_B5: { centerLat: 16.7, centerLng: 107.0, zoom: 2.8 },
      KHU_5: { centerLat: 15.2, centerLng: 108.5, zoom: 2.5 },
      TAY_NGUYEN_B3: { centerLat: 13.7, centerLng: 107.8, zoom: 2.4 },
      MIEN_DONG_B2: { centerLat: 11.2, centerLng: 106.9, zoom: 2.6 },
      DBSCL_K8: { centerLat: 10.1, centerLng: 105.8, zoom: 2.5 }
    };
  }

  if (!window.CEMETERIES_LIST && Array.isArray(window.CEMETERIES_DATA)) {
    window.CEMETERIES_LIST = window.CEMETERIES_DATA;
  }
  if (!window.AWARDS_LIST && Array.isArray(window.AWARDS_CATALOG)) {
    window.AWARDS_LIST = window.AWARDS_CATALOG;
  }
  if (!window.MARTYR_FAMILIES_LIST && Array.isArray(window.MARTYR_FAMILIES_DATA)) {
    window.MARTYR_FAMILIES_LIST = window.MARTYR_FAMILIES_DATA;
  }
  if (!window.MARTYR_LINKS_LIST && Array.isArray(window.MARTYR_LINKS_DATA)) {
    window.MARTYR_LINKS_LIST = window.MARTYR_LINKS_DATA;
  }

  if (!window.UNIT_DECODER_DICTIONARY && Array.isArray(window.UNIT_AUTHORITY_DICT)) {
    window.UNIT_DECODER_DICTIONARY = window.UNIT_AUTHORITY_DICT.map((u) => ({
      code: u.code,
      name: u.canonical || u.name || u.code,
      alias: (u.aliases || []).join(", "),
      theater: u.zone || "",
      // 4B: codes are listed once, on the "Phiên hiệu trên giấy báo tử" line; the note keeps only the area
      historyNote: u.zone ? `Địa bàn chiến đấu: ${u.zone}.` : "",
      battles: u.battles || [],
      martyrIds: u.martyrIds || []
    }));
  }

  if (!window.VIETNAM_WAR_BATTLES && Array.isArray(window.BATTLES_DATA)) {
    const unitDict = window.UNIT_DECODER_DICTIONARY || [];
    const familyById = new Map(
      (window.MARTYR_FAMILIES_LIST || window.MARTYR_FAMILIES_DATA || []).map((f) => [f.id, f])
    );
    const matchUnitCode = (unitStr) => {
      for (const u of unitDict) {
        const firstToken = u.code.split("/")[0].trim();
        if (unitStr.includes(firstToken)) return u.code;
      }
      const m = unitStr.match(/\b(F\d+[A-Z]?|E\d+[A-Z]?|D\d+|C\d+|Q\d+)\b/i);
      return m ? m[1].toUpperCase() : unitDict[0]?.code || "F325";
    };

    window.VIETNAM_WAR_BATTLES = window.BATTLES_DATA.map((b) => {
      const rev = b.combatants?.rev || {};
      const opp = b.combatants?.opp || {};
      return {
        ...b,
        alias: b.altName || b.alias || "",
        periodId: b.periodId === "P4_1969_1972" ? "P4_1969_1973" : b.periodId,
        dateText: b.dateRange || b.dateText || String(b.year || ""),
        coordinates: b.coordinates || {
          lat: Array.isArray(b.coords) ? b.coords[0] : 16.5,
          lng: Array.isArray(b.coords) ? b.coords[1] : 107.0
        },
        sourceName: b.sourceName || "Cổng Thông tin Điện tử Bộ Quốc phòng & Viện Lịch sử Quân sự Việt Nam",
        sourceUrl: b.sourceUrl || "https://mod.gov.vn",
        secondarySourceName: b.secondarySourceName || "",
        secondarySourceUrl: b.secondarySourceUrl || "",
        archivalNote: b.archivalNote || b.summary || "",
        significance: b.result || b.significance || "",
        tacticalHighlights: b.phases || b.tacticalHighlights || [],
        sides: {
          vietnam: {
            faction: (rev.factions || []).join(" · ") || "Quân đội Nhân dân Việt Nam & QGPMNVN",
            commanders: rev.commanders || [],
            strength: rev.strength || "",
            casualties: rev.casualties || b.estimatedMartyrs || "",
            units: (rev.units || []).map((uStr) => ({
              unitCode: matchUnitCode(uStr),
              name: uStr,
              role: b.militaryZone || ""
            }))
          },
          us_arvn: {
            faction: (opp.factions || []).join(" · ") || "Quân đội Hoa Kỳ & Quân lực VNCH",
            commanders: opp.commanders || [],
            strength: opp.strength || "",
            casualties: opp.casualties || "",
            units: (opp.units || []).map((uStr) => ({
              unitCode: "ĐỐI PHƯƠNG",
              name: uStr,
              role: ""
            }))
          }
        },
        martyrs: (b.martyrs || []).map((m) => {
          // Decision 2A: no invented values. Unknown stays empty and the UI prints "Chưa rõ".
          const letter = m.letter || null;
          const sourcedAwards = (Array.isArray(m.awards) ? m.awards : []).filter((a) => a.sourceName);
          const fam = m.familyId ? familyById.get(m.familyId) : null;
          return {
            ...m,
            fullName: m.name || m.fullName || "",
            aliasName: m.aliasName || "",
            ageAtSacrifice:
              m.ageAtSacrifice !== null && m.ageAtSacrifice !== undefined && Number.isFinite(Number(m.ageAtSacrifice))
                ? Number(m.ageAtSacrifice)
                : null,
            deathYear: m.deathDate ? m.deathDate.slice(0, 4) : "",
            rank: m.rankRole || m.rank || "",
            role: "",
            unit: m.unitRaw || m.unit || "",
            unitCode: m.unitCode || "",
            enlistmentPeriod: m.enlistmentPeriod || "",
            partyYouthStatus: m.partyYouthStatus || "",
            sacrificeLocation: m.sacrificeLocation || "",
            familyId: m.familyId || null,
            familyRole: m.familyRole || "",
            familyInfo: m.familyInfo || "",
            familyName: fam ? fam.family_name : "",
            familyMatriarch: fam ? fam.matriarch_patriarch : "",
            commemorationNotes: m.commemorationNotes || "",
            verificationLevel: m.level || m.verificationLevel || "",
            storySummary: m.story || m.storySummary || "",
            memorialSite: m.cemetery || m.memorialSite || "",
            cemeteryId: m.cemeteryId || null,
            homeProvince: m.homeProvince || "",
            sacrificeYear: m.deathDate ? Number(m.deathDate.slice(0, 4)) : null,
            isCollective: Boolean(m.isCollective),
            awards: Array.isArray(m.awards) ? m.awards : [],
            sourcedAwards, // Decision 3F: only these are printed or counted
            award: sourcedAwards.map((a) => a.citationLabel).join(" · "),
            hasLetter: Boolean(letter),
            letter,
            letterTitle: letter ? formatLetterTitle(letter) : "",
            letterExcerpt: letter
              ? letter.text.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 3).join(" ")
              : "",
            letterFullText: letter ? letter.text : ""
          };
        })
      };
    });
  }
}

ensureNormalizedDataGlobals();

const state = {
  activeMainView: "ban-do", // 'ban-do' | 'liet-si' | 'phien-hieu'
  activePeriod: "ALL",
  searchQuery: "",
  selectedBattleId: null, // Decision 1B: Start state on first screen (no battle preselected)
  hoveredBattleId: null,
  hoveredCemeteryId: null,
  focusedCemeteryId: null,
  battleSubTab: "overview", // 'overview' | 'forces' | 'martyrs' | 'sources'
  martyrListFilter: "all", // 'all' | 'families' | 'heroes' | 'medals' | 'photos' | 'letters' | 'L4' | 'L3'
  martyrFamilyFilter: "ALL",
  martyrUnitFilter: "ALL",
  martyrCemeteryFilter: "ALL",
  martyrAwardFilter: "ALL",
  martyrProvinceFilter: "ALL",
  mapEngine: "vector", // 'vector' | 'leaflet'
  mapPinMode: "both", // 'both' | 'battles-only' | 'cemeteries' | 'letters'
  selectedUnitCode: null,
  theme: "dark"
};

let leafletMap = null;
let leafletTileLayer = null;
let leafletMarkersLayer = null;
let suppressHashSync = false;
let wheelHintTimer = null;

// Combobox keyboard active index state
const comboboxState = {
  top: { items: [], activeIndex: -1 },
  start: { items: [], activeIndex: -1 }
};

// Curated memorial stories for Start State (Decision 1B)
const CURATED_STORIES = [
  {
    battleId: "thanh-co-quang-tri-1972",
    kicker: "Mùa hè đỏ lửa · 28/06 – 16/09/1972",
    title: "Thành cổ Quảng Trị, 1972",
    summary: "81 ngày đêm bảo vệ Thành cổ bên dòng Thạch Hãn, bức thư dự cảm ngày 11/09/1972 và sự hy sinh ngày 02/01/1973 của Liệt sĩ Lê Văn Huỳnh.",
    martyrId: "ls-le-van-huynh-1972"
  },
  {
    battleId: "nga-ba-dong-loc-truong-son-1968",
    kicker: "Tọa độ lửa Trường Sơn · 24/07/1968",
    title: "Ngã ba Đồng Lộc, 1968",
    summary: "10 cô gái Thanh niên xung phong Tiểu đội 4 (Đại đội 552) hy sinh khi san lấp hố bom thông đường và bức thư gửi mẹ của Tiểu đội trưởng Võ Thị Tần.",
    martyrId: "ls-vo-thi-tan-dong-loc"
  },
  {
    battleId: "dien-bien-phu-tren-khong-1972",
    kicker: "Hà Nội – Hải Phòng · 18/12 – 29/12/1972",
    title: "Điện Biên Phủ trên không, 1972",
    summary: "12 ngày đêm bảo vệ bầu trời miền Bắc, quyết định cảm tử tiêu diệt B-52 của phi công Vũ Xuân Thiều và ký ức phố Khâm Thiên đêm 26/12/1972.",
    martyrId: "ls-vu-xuan-thieu-1972"
  }
];

// ============================================================================
// UTILITIES & ACCESSIBILITY HELPERS (E2, E3, E7, E13, E14)
// ============================================================================

function normalizeText(str) {
  if (!str) return "";
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function announce(message) {
  const el = document.getElementById("sr-announcer");
  if (!el) return;
  el.textContent = "";
  window.setTimeout(() => {
    el.textContent = message;
  }, 30);
}

// E3 Fix: Map periodId cleanly to human-readable Vietnamese label
function getPeriodInfo(periodId) {
  if (!periodId) return { label: "Giai đoạn 1954–1975", shortLabel: "1954–1975", years: "1954–1975" };
  const normalized = periodId === "P4_1969_1972" ? "P4_1969_1973" : periodId;
  const found = (window.WAR_PERIODS || []).find((p) => p.id === normalized);
  if (found) {
    return {
      label: found.label,
      shortLabel: found.shortLabel || found.years || found.label,
      years: found.years || ""
    };
  }
  return { label: "Giai đoạn 1954–1975", shortLabel: "1954–1975", years: "1954–1975" };
}

// Decision 3A: verification badge in words, no percent, no default level
const VERIFICATION_LEVELS = {
  L4: { text: "Hồ sơ chính thức", badgeClass: "badge-l4", desc: "Khớp với hồ sơ chính thức: Sổ vàng, bia mộ, bia tưởng niệm hoặc quyết định của cơ quan nhà nước." },
  L3: { text: "Đối chiếu đơn vị", badgeClass: "badge-l3", desc: "Khớp với lịch sử đơn vị hoặc bia tưởng niệm chiến trường, chưa khớp hồ sơ cá nhân chính thức." },
  L2: { text: "Gợi ý, chưa xác nhận", badgeClass: "badge-l2", desc: "Có nguồn gợi ý nhưng chưa được đối chiếu với hồ sơ chính thức." },
  NONE: { text: "Chưa xác minh", badgeClass: "badge-none", desc: "Chưa có cấp xác minh hoặc mới có thông tin một nguồn." }
};

function formatVerificationBadge(martyr) {
  const level = martyr.verificationLevel || martyr.level || "";
  const info = VERIFICATION_LEVELS[level] || VERIFICATION_LEVELS.NONE;
  const code = VERIFICATION_LEVELS[level] ? level : "";
  return {
    level: code,
    badgeClass: info.badgeClass,
    shortText: info.text,
    longText: info.text,
    code
  };
}

// Badge as a button that opens the shared legend (Decision 3A)
function renderVerificationBadgeButton(martyr) {
  const b = formatVerificationBadge(martyr);
  return `<button type="button" class="${b.badgeClass} badge-button" onclick="event.stopPropagation(); openInfoSheet('verification', this)" aria-label="${escapeHtml(b.shortText)}${b.code ? ` (${b.code})` : ""}. Xem giải thích các cấp xác minh">${escapeHtml(b.shortText)}${b.code ? ` <span class="font-mono-num opacity-75">${b.code}</span>` : ""}</button>`;
}

// One popover / phone sheet for the verification legend (3A) and award explanations (1F)
function openInfoSheet(kind, trigger, payload) {
  let sheet = document.getElementById("info-sheet");
  if (!sheet) {
    sheet = document.createElement("dialog");
    sheet.id = "info-sheet";
    sheet.setAttribute("aria-labelledby", "info-sheet-title");
    sheet.setAttribute("closedby", "any");
    sheet.addEventListener("click", (e) => {
      if (e.target === sheet) sheet.close();
    });
    sheet.addEventListener("close", () => {
      if (sheet._trigger && document.contains(sheet._trigger)) sheet._trigger.focus();
    });
    document.body.appendChild(sheet);
  }
  sheet._trigger = trigger || document.activeElement;
  let title = "";
  let body = "";
  if (kind === "verification") {
    title = "Các cấp xác minh hồ sơ";
    body = ["L4", "L3", "L2", "NONE"]
      .map((k) => {
        const v = VERIFICATION_LEVELS[k];
        return `<li class="py-2.5 border-t border-[var(--border)] first:border-t-0">
          <span class="${v.badgeClass}">${escapeHtml(v.text)}${k !== "NONE" ? ` <span class="font-mono-num opacity-75">${k}</span>` : ""}</span>
          <p class="text-sm text-[var(--muted-foreground)] mt-1.5">${escapeHtml(v.desc)}</p>
        </li>`;
      })
      .join("");
    body = `<ul>${body}</ul>`;
  } else if (kind === "award") {
    const a = (window.AWARDS_LIST || window.AWARDS_CATALOG || []).find((x) => x.id === payload);
    title = a ? a.name : "Huân chương";
    body = a
      ? `<p class="text-base">${escapeHtml(a.description || "")}</p>
         ${a.instituted_by ? `<p class="text-sm text-[var(--muted-foreground)] mt-2">Thiết lập: ${escapeHtml(a.instituted_by)}</p>` : ""}
         ${a.source_name ? `<p class="text-sm text-[var(--muted-foreground)] mt-2">Nguồn: ${a.source_url ? `<a class="underline" href="${escapeHtml(a.source_url)}" target="_blank" rel="noopener">${escapeHtml(a.source_name)}</a>` : escapeHtml(a.source_name)}</p>` : ""}`
      : `<p>${UNKNOWN_TEXT}</p>`;
  }
  sheet.innerHTML = `
    <div class="p-4 sm:p-5">
      <div class="flex items-start justify-between gap-3 mb-3">
        <h2 id="info-sheet-title" class="font-serif-archival text-lg font-semibold">${escapeHtml(title)}</h2>
        <button type="button" class="tap-target px-3 rounded-md border border-[var(--border)] text-sm" onclick="document.getElementById('info-sheet').close()">Đóng</button>
      </div>
      ${body}
    </div>`;
  if (!sheet.open) sheet.showModal();
}

// Formats archival photo credit so personal/author/family names stay outside <cite>
// while published work, archive, or press titles are wrapped in <cite> (modern-web-guidance: html)
function formatArchivalCreditHtml(credit) {
  if (!credit) return "";
  if (credit.includes(" — ")) {
    const [authorPart, ...workParts] = credit.split(" — ");
    return `${escapeHtml(authorPart)} — <cite>${escapeHtml(workParts.join(" — "))}</cite>`;
  }
  const parts = credit.split(" & ").map((part) => {
    const trimmed = part.trim();
    if (/gia đình|phóng viên|tác giả/i.test(trimmed)) {
      return escapeHtml(trimmed);
    }
    return `<cite>${escapeHtml(trimmed)}</cite>`;
  });
  return parts.join(" &amp; ");
}

function getAllMartyrsFlat() {
  const list = [];
  (window.VIETNAM_WAR_BATTLES || []).forEach((b) => {
    (b.martyrs || []).forEach((m) => {
      list.push({
        ...m,
        battleId: b.id,
        battleName: b.name,
        battleDate: b.dateText,
        battleLocation: b.locationName,
        periodId: b.periodId
      });
    });
  });
  return list;
}

function getFilteredBattles() {
  if (state.mapPinMode === "cemeteries") {
    return [];
  }
  const battles = window.VIETNAM_WAR_BATTLES || [];
  return battles.filter((b) => {
    const bPeriod = b.periodId === "P4_1969_1972" ? "P4_1969_1973" : b.periodId;
    if (state.activePeriod !== "ALL" && bPeriod !== state.activePeriod) {
      return false;
    }
    if (state.mapPinMode === "letters") {
      const hasLetter = (b.martyrs || []).some((m) => m.hasLetter);
      if (!hasLetter) return false;
    }
    const q = normalizeText(state.searchQuery.trim());
    if (q) {
      const units = [...(b.sides?.vietnam?.units || []), ...(b.sides?.us_arvn?.units || [])];
      const haystack = normalizeText([
        b.name, b.alias, b.locationName, b.summary,
        ...units.map(u => `${u.unitCode} ${u.name}`),
        ...(b.martyrs || []).map(m => `${m.fullName} ${m.aliasName || ""} ${m.hometown} ${m.unit} ${m.unitCode || ""} ${m.familyName || ""} ${m.familyMatriarch || ""} ${m.cemetery || ""} ${m.award || ""}`)
      ].join(" "));
      if (!matchesSearch(haystack, q)) return false;
    }
    return true;
  });
}

function getFilteredCemeteriesForMap() {
  if (state.mapPinMode !== "both" && state.mapPinMode !== "cemeteries") {
    return [];
  }
  const list = window.CEMETERIES_LIST || window.CEMETERIES_DATA || [];
  const q = normalizeText(state.searchQuery.trim());
  if (!q) return list;
  return list.filter((c) => {
    const hay = normalizeText(`${c.name} ${c.short_name || ""} ${c.province} ${c.district_commune || ""} ${c.summary || ""}`);
    return matchesSearch(hay, q);
  });
}

// ============================================================================
// THEME PERSISTENCE & LIGHT/DARK PALETTE (E14)
// ============================================================================

function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem("vn-atlas-theme");
  } catch (_) {}
  if (saved === "light" || saved === "dark") {
    state.theme = saved;
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    state.theme = "light";
  } else {
    state.theme = "dark";
  }
  applyTheme(state.theme, false);
}

function applyTheme(theme, persist = true) {
  state.theme = theme === "light" ? "light" : "dark";
  document.documentElement.classList.toggle("light-theme", state.theme === "light");
  if (state.theme === "light") {
    document.documentElement.dataset.theme = "light";
  } else {
    delete document.documentElement.dataset.theme;
  }
  if (persist) {
    try {
      localStorage.setItem("vn-atlas-theme", state.theme);
    } catch (_) {}
  }
  if (leafletTileLayer && leafletMap) {
    const tileUrl =
      state.theme === "light"
        ? "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";
    leafletTileLayer.setUrl(tileUrl);
  }
  drawVietnamCanvasMap();
  if (state.activeMainView === "phien-hieu") {
    drawUnitLineageCanvas();
  }
}

function toggleTheme() {
  const next = state.theme === "light" ? "dark" : "light";
  applyTheme(next, true);
  announce(next === "light" ? "Đã chuyển sang giao diện Sáng" : "Đã chuyển sang giao diện Tối");
}

function getCanvasPalette() {
  const isLight = state.theme === "light";
  if (isLight) {
    return {
      seaBgTop: "#e6edf5",
      seaBgBottom: "#dbe5f0",
      gridLine: "rgba(39, 39, 42, 0.08)",
      landFill: "#f4f1ea",
      landStroke: "#71717a",
      zoneFillAlpha: 0.12,
      dmzStroke: "#b91c1c",
      dmzText: "#991b1b",
      truongSonStroke: "rgba(180, 83, 9, 0.65)",
      islandFill: "#d4d4d8",
      islandStroke: "#52525b",
      islandTitle: "#92400e",
      islandSub: "#3f3f46",
      pinDefault: "#b91c1c",
      pinLetter: "#b45309",
      pinSelected: "#92400e",
      pinRing: "rgba(180, 83, 9, 0.28)",
      labelBg: "rgba(255, 255, 255, 0.94)",
      labelBorder: "rgba(63, 63, 70, 0.35)",
      labelText: "#18181b",
      mutedText: "#52525b",
      nodeUnitFill: "#fffbeb",
      nodeUnitBorder: "#b45309",
      nodeBattleFill: "#fef2f2",
      nodeBattleBorder: "#b91c1c",
      edgeIdle: "rgba(82, 82, 91, 0.24)",
      edgeActive: "rgba(180, 83, 9, 0.85)"
    };
  }
  return {
    seaBgTop: "#090d16",
    seaBgBottom: "#0c1322",
    gridLine: "rgba(148, 163, 184, 0.08)",
    landFill: "#161f30",
    landStroke: "#475569",
    zoneFillAlpha: 0.14,
    dmzStroke: "#f4726a",
    dmzText: "#fca5a5",
    truongSonStroke: "rgba(245, 158, 11, 0.58)",
    islandFill: "#334155",
    islandStroke: "#94a3b8",
    islandTitle: "#fbbf24",
    islandSub: "#cbd5e1",
    pinDefault: "#f4726a",
    pinLetter: "#fbbf24",
    pinSelected: "#fde68a",
    pinRing: "rgba(245, 158, 11, 0.32)",
    labelBg: "rgba(15, 23, 42, 0.92)",
    labelBorder: "rgba(148, 163, 184, 0.38)",
    labelText: "#f8fafc",
    mutedText: "#94a3b8",
    nodeUnitFill: "#1e293b",
    nodeUnitBorder: "#f59e0b",
    nodeBattleFill: "#1f2437",
    nodeBattleBorder: "#f4726a",
    edgeIdle: "rgba(148, 163, 184, 0.22)",
    edgeActive: "rgba(251, 191, 36, 0.9)"
  };
}

// ============================================================================
// NAVIGATION, MENUS & URL HASH ROUTING (Decision 1A & E9)
// ============================================================================

function closeAllMenus() {
  const menus = [
    { menu: "site-menu", btn: "site-switcher-btn" },
    { menu: "view-menu", btn: "view-menu-btn" },
    { menu: "map-layers-menu", btn: "map-layers-btn" }
  ];
  menus.forEach(({ menu, btn }) => {
    const m = document.getElementById(menu);
    const b = document.getElementById(btn);
    if (m) m.classList.add("hidden");
    if (b) b.setAttribute("aria-expanded", "false");
  });
}

function toggleSiteMenu(force) {
  const m = document.getElementById("site-menu");
  const b = document.getElementById("site-switcher-btn");
  if (!m || !b) return;
  const open = typeof force === "boolean" ? force : m.classList.contains("hidden");
  closeAllMenus();
  m.classList.toggle("hidden", !open);
  b.setAttribute("aria-expanded", open ? "true" : "false");
}

function toggleViewMenu(force) {
  const m = document.getElementById("view-menu");
  const b = document.getElementById("view-menu-btn");
  if (!m || !b) return;
  const open = typeof force === "boolean" ? force : m.classList.contains("hidden");
  closeAllMenus();
  m.classList.toggle("hidden", !open);
  b.setAttribute("aria-expanded", open ? "true" : "false");
}

function toggleMapLayersMenu(force) {
  const m = document.getElementById("map-layers-menu");
  const b = document.getElementById("map-layers-btn");
  if (!m || !b) return;
  const open = typeof force === "boolean" ? force : m.classList.contains("hidden");
  closeAllMenus();
  m.classList.toggle("hidden", !open);
  b.setAttribute("aria-expanded", open ? "true" : "false");
}

function toggleMapFilters() {
  const row = document.getElementById("filter-row");
  const open = row.classList.toggle("filters-expanded");
  document.getElementById("filters-toggle").setAttribute("aria-expanded", String(open));
}

function toggleMobileSearch(force) {
  const bar = document.getElementById("app-bar");
  const btn = document.getElementById("mobile-search-btn");
  if (!bar) return;
  const open = typeof force === "boolean" ? force : !bar.classList.contains("search-open");
  bar.classList.toggle("search-open", open);
  if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) {
    const input = document.getElementById("search-input");
    if (input) input.focus();
  }
}

// Battle sub-tabs and their route slugs (Decision 1D: the open tab is part of the route)
const SUBTAB_SLUGS = { overview: "tong-quan", forces: "luc-luong", martyrs: "liet-si", sources: "nguon" };
const SLUG_SUBTABS = Object.fromEntries(Object.entries(SUBTAB_SLUGS).map(([k, v]) => [v, k]));
const BASE_DOCUMENT_TITLE = document.title;

function buildHashFromState() {
  if (state.activeMainView === "liet-si") return "#/liet-si";
  if (state.activeMainView === "phien-hieu") {
    return state.selectedUnitCode ? `#/phien-hieu/${encodeURIComponent(state.selectedUnitCode)}` : "#/phien-hieu";
  }
  if (state.focusedCemeteryId) {
    return `#/ban-do/nghia-trang/${encodeURIComponent(state.focusedCemeteryId)}${state.mapFullView ? "/ban-do" : ""}`;
  }
  if (state.selectedBattleId) {
    if (state.mapFullView) return `#/ban-do/${state.selectedBattleId}/ban-do`;
    const slug = SUBTAB_SLUGS[state.battleSubTab] || "tong-quan";
    return `#/ban-do/${state.selectedBattleId}/${slug}`;
  }
  return "#/ban-do";
}

// V3: navigation pushes a history entry so Back steps through the app.
// Pass { replace: true } for changes that should not create one (typing, filters).
function syncHashFromState(opts = {}) {
  if (suppressHashSync) return;
  const targetHash = buildHashFromState();
  if (window.location.hash === targetHash) return;
  if (opts.replace) {
    history.replaceState({ atlas: true }, "", targetHash);
  } else {
    window.__atlasNavigated = true;
    history.pushState({ atlas: true }, "", targetHash);
  }
}

let closingDialogFromRoute = false;

function applyRouteFromHash() {
  closeAllDropdowns();
  const rawHash = window.location.hash || "#/ban-do";
  const [pathPart] = rawHash.replace(/^#\/?/, "").split("?");
  const segments = pathPart.split("/").filter(Boolean).map((x) => decodeURIComponent(x));
  const root = segments[0] || "ban-do";
  const param = segments[1] || null;
  const third = segments[2] || null;
  const battleExists = (id) => (window.VIETNAM_WAR_BATTLES || []).some((b) => b.id === id);

  // A record route opens over whichever view is behind it (Decision 1E)
  if ((root === "liet-si" || root === "martyrs") && param) {
    if (!renderMainViewState._rendered) {
      // Fresh load on a record link: show the list behind it
      state.activeMainView = "liet-si";
      renderMainViewState();
    }
    openMartyrModal(param);
    return;
  }

  // Any other route closes an open record (E9)
  const dialog = document.getElementById("martyr-dialog");
  if (dialog && dialog.open) {
    closingDialogFromRoute = true;
    dialog.close();
    closingDialogFromRoute = false;
  }
  document.title = BASE_DOCUMENT_TITLE;

  suppressHashSync = true;
  state.mapFullView = false;
  state.focusedCemeteryId = null;

  if (root === "map" || root === "") {
    state.activeMainView = "ban-do";
    state.selectedBattleId = null;
  } else if (root === "battles" && param) {
    state.activeMainView = "ban-do";
    state.selectedBattleId = battleExists(param) ? param : null;
  } else if (root === "ban-do") {
    state.activeMainView = "ban-do";
    if (param === "nghia-trang" && third) {
      state.selectedBattleId = null;
      state.focusedCemeteryId = third;
      state.mapFullView = segments[3] === "ban-do";
    } else if (param && battleExists(param)) {
      state.selectedBattleId = param;
      if (third === "ban-do") {
        state.mapFullView = true;
      } else if (third && SLUG_SUBTABS[third]) {
        state.battleSubTab = SLUG_SUBTABS[third];
      }
    } else {
      state.selectedBattleId = null;
    }
  } else if (root === "liet-si" || root === "martyrs") {
    state.activeMainView = "liet-si";
  } else if (root === "nghia-trang" || root === "cemeteries") {
    // Decision 1F: cemeteries live on the map
    state.activeMainView = "ban-do";
    state.selectedBattleId = null;
    if (param) state.focusedCemeteryId = param;
    else state.scrollToCemeteryList = true;
  } else if (root === "letters") {
    state.activeMainView = "liet-si";
    state.martyrListFilter = "letters";
  } else if (root === "phien-hieu" || root === "lineage") {
    state.activeMainView = "phien-hieu";
    state.selectedUnitCode = param || state.selectedUnitCode;
  } else if (root === "compare") {
    state.activeMainView = "ban-do";
    state.selectedBattleId = state.selectedBattleId || "thanh-co-quang-tri-1972";
    state.battleSubTab = "sources";
  } else {
    state.activeMainView = "ban-do";
  }

  suppressHashSync = false;
  syncHashFromState({ replace: true });
  renderMainViewState();
  if (state.scrollToCemeteryList) {
    state.scrollToCemeteryList = false;
    setTimeout(() => document.getElementById("cemetery-list")?.scrollIntoView({ block: "start" }), 60);
  }
}

// Closing a record steps back to where the reader was (Decision 1E)
function onMartyrDialogClosed() {
  document.title = BASE_DOCUMENT_TITLE;
  if (closingDialogFromRoute) return;
  if (/^#\/(liet-si|martyrs)\/.+/.test(window.location.hash)) {
    if (window.__atlasNavigated) {
      history.back();
    } else {
      history.replaceState({ atlas: true }, "", "#/liet-si");
      applyRouteFromHash();
    }
  }
}

function openMartyrRecord(martyrId) {
  window.__atlasNavigated = true;
  history.pushState({ atlas: true }, "", `#/liet-si/${encodeURIComponent(martyrId)}`);
  openMartyrModal(martyrId);
}

function switchMainView(viewId, skipHash = false) {
  if (!["ban-do", "liet-si", "phien-hieu"].includes(viewId)) {
    viewId = "ban-do";
  }
  state.activeMainView = viewId;
  window.__atlasNavigated = true;

  const dialog = document.getElementById("martyr-dialog");
  if (dialog && dialog.open) {
    closingDialogFromRoute = true;
    dialog.close();
    closingDialogFromRoute = false;
  }

  if (!skipHash) {
    syncHashFromState();
  }
  renderMainViewState();

  const viewLabels = {
    "ban-do": "Bản đồ chiến dịch và tra cứu",
    "liet-si": "Danh bạ tưởng niệm Liệt sĩ",
    "phien-hieu": "Giải mã phiên hiệu đơn vị trên giấy báo tử"
  };
  announce(`Đang xem: ${viewLabels[viewId]}`);
}

function renderMainViewState() {
  renderMainViewState._rendered = true;
  const views = ["ban-do", "liet-si", "phien-hieu"];
  views.forEach((v) => {
    const section = document.getElementById(`view-${v}`);
    const tab = document.getElementById(`tab-${v}`);
    const isActive = state.activeMainView === v;
    if (section) {
      section.classList.toggle("hidden", !isActive);
      section.classList.toggle("flex", isActive);
    }
    if (tab) {
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.setAttribute("tabindex", isActive ? "0" : "-1");
      if (isActive) {
        tab.setAttribute("aria-current", "page");
      } else {
        tab.removeAttribute("aria-current");
      }
    }
  });
  document.body.dataset.view = state.activeMainView;
  // Period and region filters belong to the map only (6B)
  document.getElementById("filter-row")?.classList.toggle("hidden", state.activeMainView !== "ban-do");
  document.body.classList.toggle("battle-selected", state.activeMainView === "ban-do" && Boolean(state.selectedBattleId || state.focusedCemeteryId));
  document.body.classList.toggle("map-full-view", Boolean(state.mapFullView));

  if (state.activeMainView === "ban-do") {
    renderMapPanel();
    renderBattleStrip();
    drawVietnamCanvasMap();
    if (state.mapEngine === "leaflet" && leafletMap) {
      setTimeout(() => leafletMap.invalidateSize(), 60);
    }
  } else if (state.activeMainView === "liet-si") {
    populateMartyrFilterSelects();
    renderAllMartyrsTable();
  } else if (state.activeMainView === "phien-hieu") {
    renderUnitDecoderList();
    setTimeout(() => {
      initUnitLineageGraph();
      drawUnitLineageCanvas();
    }, 30);
  }
}

// ============================================================================
// PERIOD FILTER PILLS (E3 Fix)
// ============================================================================

function renderPeriodPills() {
  const container = document.getElementById("period-filter-pills");
  if (!container) return;
  const periods = window.WAR_PERIODS || [];
  const allBattles = window.VIETNAM_WAR_BATTLES || [];

  container.innerHTML = periods
    .map((p) => {
      const count =
        p.id === "ALL"
          ? allBattles.length
          : allBattles.filter((b) => {
              const norm = b.periodId === "P4_1969_1972" ? "P4_1969_1973" : b.periodId;
              return norm === p.id;
            }).length;
      const active = state.activePeriod === p.id;
      const shortText = p.shortLabel || p.label;
      return `
        <button
          type="button"
          onclick="selectPeriod('${p.id}')"
          aria-pressed="${active ? "true" : "false"}"
          title="${escapeHtml(p.description || p.label)}"
          class="period-pill px-3 py-1.5 rounded-md text-sm font-medium border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1.5"
        >
          <span>${escapeHtml(shortText)}</span>
          <span class="font-mono-num text-sm opacity-80">(${count})</span>
        </button>
      `;
    })
    .join("");
}

function selectPeriod(periodId) {
  state.activePeriod = periodId || "ALL";
  renderPeriodPills();
  const filtered = getFilteredBattles();
  if (state.selectedBattleId && !filtered.some((b) => b.id === state.selectedBattleId)) {
    state.selectedBattleId = null;
    syncHashFromState();
  }
  renderBattleStrip();
  renderMapPanel();
  drawVietnamCanvasMap();
  updateLeafletMarkers();
  const info = getPeriodInfo(state.activePeriod);
  announce(`Đã lọc theo ${info.label}: ${filtered.length} chiến dịch`);
}

// ============================================================================
// GROUPED COMBOBOX SEARCH (Decision 1C: Liệt sĩ, Trận đánh, Phiên hiệu)
// ============================================================================

function matchesSearch(text, query) {
  const haystack = normalizeText(text);
  const q = normalizeText(query.trim());
  const expanded = q.replace(/\bf(\d+)/g, "su doan $1")
    .replace(/\be(\d+)/g, "trung doan $1")
    .replace(/\bd(\d+)/g, "tieu doan $1")
    .replace(/\bc(\d+)/g, "dai doi $1");
  return haystack.includes(q) || haystack.includes(expanded);
}

function computeGroupedSearchResults(rawQuery) {
  const q = normalizeText(rawQuery.trim());
  if (!q) {
    return { martyrs: [], families: [], battles: [], cemeteries: [], units: [], total: 0 };
  }

  const allMartyrs = getAllMartyrsFlat();
  const matchedMartyrs = allMartyrs.filter((m) => {
    const hay = normalizeText(
      `${m.fullName} ${m.aliasName || ""} ${m.hometown} ${m.homeProvince || ""} ${m.unit} ${m.unitCode || ""} ${m.familyName || ""} ${m.familyMatriarch || ""} ${m.familyInfo || ""} ${m.sacrificeLocation || ""} ${m.commemorationNotes || ""} ${m.cemetery || ""} ${m.award || ""} ${m.rank || ""} ${m.role || ""} ${m.battleName} ${m.deathYear || ""} ${m.storySummary || ""}`
    );
    return matchesSearch(hay, q);
  });

  const allFamilies = window.MARTYR_FAMILIES_LIST || window.MARTYR_FAMILIES_DATA || [];
  const matchedFamilies = allFamilies.filter((f) => {
    const hay = normalizeText(
      `${f.family_name} ${f.matriarch_patriarch || ""} ${f.honor_titles || ""} ${f.hometown || ""} ${f.province || ""} ${f.summary || ""}`
    );
    return matchesSearch(hay, q);
  });

  const allBattles = window.VIETNAM_WAR_BATTLES || [];
  const matchedBattles = allBattles.filter((b) => {
    const unitCodes = [
      ...(b.sides?.vietnam?.units || []).map((u) => `${u.unitCode} ${u.name}`),
      ...(b.sides?.us_arvn?.units || []).map((u) => `${u.unitCode} ${u.name}`)
    ].join(" ");
    const hay = normalizeText(
      `${b.name} ${b.alias || ""} ${b.locationName} ${b.dateText} ${b.summary} ${unitCodes}`
    );
    return matchesSearch(hay, q);
  });

  const allCemeteries = window.CEMETERIES_LIST || window.CEMETERIES_DATA || [];
  const matchedCemeteries = allCemeteries.filter((c) => {
    const hay = normalizeText(
      `${c.name} ${c.short_name || ""} ${c.province} ${c.district_commune || ""} ${c.summary || ""}`
    );
    return matchesSearch(hay, q);
  });

  const allUnits = window.UNIT_DECODER_DICTIONARY || [];
  const matchedUnits = allUnits.filter((u) => {
    const hay = normalizeText(`${u.code} ${u.name} ${u.alias || ""} ${u.theater || ""} ${u.historyNote || ""}`);
    return matchesSearch(hay, q);
  });

  return {
    martyrs: matchedMartyrs.slice(0, 5),
    families: matchedFamilies.slice(0, 3),
    battles: matchedBattles.slice(0, 5),
    cemeteries: matchedCemeteries.slice(0, 3),
    units: matchedUnits.slice(0, 4),
    totalMartyrs: matchedMartyrs.length,
    totalFamilies: matchedFamilies.length,
    totalBattles: matchedBattles.length,
    totalCemeteries: matchedCemeteries.length,
    totalUnits: matchedUnits.length,
    total:
      matchedMartyrs.length +
      matchedFamilies.length +
      matchedBattles.length +
      matchedCemeteries.length +
      matchedUnits.length
  };
}

function closeAllDropdowns() {
  ["top", "start"].forEach((src) => {
    const listboxId = src === "top" ? "top-search-listbox" : "start-search-listbox";
    const inputId = src === "top" ? "search-input" : "start-search-input";
    const box = document.getElementById(listboxId);
    const input = document.getElementById(inputId);
    if (box) box.classList.add("hidden");
    if (input) {
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }
    comboboxState[src] = { items: [], activeIndex: -1 };
  });
}

function handleSearchInput(value, source = "top") {
  state.searchQuery = value || "";

  // Sync the other input if visible
  const topInput = document.getElementById("search-input");
  const startInput = document.getElementById("start-search-input");
  if (source === "top" && startInput && startInput.value !== state.searchQuery) {
    startInput.value = state.searchQuery;
  } else if (source === "start" && topInput && topInput.value !== state.searchQuery) {
    topInput.value = state.searchQuery;
  }

  const clearBtn = document.getElementById("clear-search");
  if (clearBtn) {
    clearBtn.classList.toggle("hidden", !state.searchQuery.trim());
  }

  if (state.activeMainView === "liet-si") {
    renderAllMartyrsTable();
  }

  closeAllDropdowns();
  drawVietnamCanvasMap();
  updateLeafletMarkers();
  const trimmed = state.searchQuery.trim();
  const listboxId = source === "top" ? "top-search-listbox" : "start-search-listbox";
  const inputId = source === "top" ? "search-input" : "start-search-input";
  const listbox = document.getElementById(listboxId);
  const input = document.getElementById(inputId);
  if (!listbox || !input) return;

  if (!trimmed) {
    listbox.classList.add("hidden");
    input.setAttribute("aria-expanded", "false");
    comboboxState[source] = { items: [], activeIndex: -1 };
    return;
  }

  const results = computeGroupedSearchResults(trimmed);
  const actionItems = [];
  let html = "";

  if (results.total === 0) {
    html = renderNotFoundBlock(trimmed);
  } else {
    if (results.martyrs.length > 0) {
      html += `<div class="search-group-title">Liệt sĩ &amp; Tập thể (${results.totalMartyrs})</div>`;
      results.martyrs.forEach((m) => {
        const idx = actionItems.length;
        const optId = `${source}-opt-${idx}`;
        const badge = formatVerificationBadge(m);
        actionItems.push({ type: "martyr", martyrId: m.id, battleId: m.battleId, id: optId });
        html += `
          <div
            id="${optId}"
            role="option"
            aria-selected="false"
            onclick="executeComboboxOption('${source}', ${idx})"
            class="search-option"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              ${
                m.portraitUrl
                  ? `<img src="${escapeHtml(m.portraitUrl)}" alt="${escapeHtml(m.fullName)}" width="36" height="36" fetchpriority="low" loading="lazy" class="martyr-thumb w-9 h-9" />`
                  : ""
              }
              <div class="min-w-0">
                <div class="flex flex-wrap items-baseline gap-x-2">
                  <span class="font-semibold text-[var(--foreground)]">${escapeHtml(m.fullName)}</span>
                  <span class="text-sm font-mono-num text-[var(--muted-foreground)]">${escapeHtml(formatLifeYears(m))}</span>
                </div>
                <div class="text-sm text-[var(--muted-foreground)] search-option-sub">${escapeHtml(m.hometown || UNKNOWN_TEXT)} · ${escapeHtml(m.unit || UNKNOWN_TEXT)}</div>
                <div class="flex flex-wrap items-center gap-1.5 mt-1">
                  <span class="${badge.badgeClass}">${escapeHtml(badge.shortText)}</span>
                  ${m.familyId ? `<span class="badge-family">Gia đình nhiều Liệt sĩ</span>` : ""}
                </div>
              </div>
            </div>
          </div>
        `;
      });
    }

    if (results.families && results.families.length > 0) {
      html += `<div class="search-group-title">Gia đình nhiều Liệt sĩ &amp; Bà Mẹ VNAH (${results.totalFamilies})</div>`;
      results.families.forEach((f) => {
        const idx = actionItems.length;
        const optId = `${source}-opt-${idx}`;
        actionItems.push({ type: "family", familyId: f.id, id: optId });
        html += `
          <div
            id="${optId}"
            role="option"
            aria-selected="false"
            onclick="executeComboboxOption('${source}', ${idx})"
            class="search-option"
          >
            <div class="min-w-0">
              <div class="font-semibold text-[var(--foreground)] truncate">${escapeHtml(f.family_name)}</div>
              <div class="text-sm text-[var(--muted-foreground)] truncate">${escapeHtml(f.hometown)}, ${escapeHtml(f.province)}</div>
            </div>
            <span class="text-sm font-mono-num text-amber-400 shrink-0">${Number(f.total_martyrs)} Liệt sĩ</span>
          </div>
        `;
      });
    }

    if (results.battles.length > 0) {
      html += `<div class="search-group-title">Chiến dịch &amp; Trận đánh (${results.totalBattles})</div>`;
      results.battles.forEach((b) => {
        const idx = actionItems.length;
        const optId = `${source}-opt-${idx}`;
        actionItems.push({ type: "battle", battleId: b.id, id: optId });
        html += `
          <div
            id="${optId}"
            role="option"
            aria-selected="false"
            onclick="executeComboboxOption('${source}', ${idx})"
            class="search-option"
          >
            <div class="min-w-0">
              <div class="font-semibold text-[var(--foreground)] truncate">${escapeHtml(b.name)}</div>
              <div class="text-sm text-[var(--muted-foreground)] truncate">${escapeHtml(b.dateText)} · ${escapeHtml(b.locationName)}</div>
            </div>
            <span class="text-sm font-mono-num text-amber-400 shrink-0">${(b.martyrs || []).length} hồ sơ</span>
          </div>
        `;
      });
    }

    if (results.cemeteries && results.cemeteries.length > 0) {
      html += `<div class="search-group-title">Nghĩa trang &amp; Đài tưởng niệm (${results.totalCemeteries})</div>`;
      results.cemeteries.forEach((c) => {
        const idx = actionItems.length;
        const optId = `${source}-opt-${idx}`;
        actionItems.push({ type: "cemetery", cemeteryId: c.id, id: optId });
        const gravesLabel = c.total_graves > 0 ? `${Number(c.total_graves).toLocaleString("vi-VN")} mộ` : "Mộ chung";
        html += `
          <div
            id="${optId}"
            role="option"
            aria-selected="false"
            onclick="executeComboboxOption('${source}', ${idx})"
            class="search-option"
          >
            <div class="min-w-0">
              <div class="font-semibold text-[var(--foreground)] truncate">${escapeHtml(c.name)}</div>
              <div class="text-sm text-[var(--muted-foreground)] truncate">${escapeHtml(c.province)} · ${escapeHtml(c.district_commune || "")}</div>
            </div>
            <span class="text-sm font-mono-num text-emerald-400 shrink-0">${escapeHtml(gravesLabel)}</span>
          </div>
        `;
      });
    }

    if (results.units.length > 0) {
      html += `<div class="search-group-title">Phiên hiệu Đơn vị (${results.totalUnits})</div>`;
      results.units.forEach((u) => {
        const idx = actionItems.length;
        const optId = `${source}-opt-${idx}`;
        actionItems.push({ type: "unit", unitCode: u.code, id: optId });
        html += `
          <div
            id="${optId}"
            role="option"
            aria-selected="false"
            onclick="executeComboboxOption('${source}', ${idx})"
            class="search-option"
          >
            <div class="min-w-0">
              <div class="font-semibold text-[var(--foreground)] truncate"><span class="font-mono-num text-amber-400">${escapeHtml(u.code)}</span> — ${escapeHtml(u.name)}</div>
              <div class="text-sm text-[var(--muted-foreground)] truncate">${escapeHtml(u.theater)}</div>
            </div>
            <span class="text-sm text-[var(--muted-foreground)] shrink-0">Giải mã →</span>
          </div>
        `;
      });
    }

    if (results.totalMartyrs > results.martyrs.length) {
      const allIdx = actionItems.length;
      const allOptId = `${source}-opt-${allIdx}`;
      actionItems.push({ type: "all-martyrs", query: trimmed, id: allOptId });
      html += `
        <div
          id="${allOptId}"
          role="option"
          aria-selected="false"
          onclick="executeComboboxOption('${source}', ${allIdx})"
          class="search-option border-t border-[var(--border)] bg-[var(--background)]/50 font-medium text-amber-400"
        >
          <span>Xem tất cả ${results.totalMartyrs} hồ sơ liệt sĩ</span>
          <span aria-hidden="true">→</span>
        </div>
      `;
    }
  }

  comboboxState[source] = { items: actionItems, activeIndex: -1 };
  listbox.innerHTML = html;
  listbox.classList.remove("hidden");
  input.setAttribute("aria-expanded", "true");
  announce(`${results.total} kết quả: ${results.totalMartyrs || 0} hồ sơ, ${results.totalBattles || 0} trận đánh, ${results.totalUnits || 0} phiên hiệu`);
}

// Decision 2A / 2B / 3E: the not-found block, shared by search and the Liệt sĩ list
function renderReportLink(subject, extraClass = "") {
  if (!CONTACT_EMAIL) return "";
  const body = "Điều chưa đúng hoặc còn thiếu:\n\nThông tin đúng:\n\nTôi biết điều này từ:\n\nCách liên hệ với tôi:\n";
  const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `
    <div class="report-block ${extraClass}">
      <a href="${escapeHtml(href)}" class="tap-target inline-flex items-center px-3 rounded-md border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]">Báo sai sót / Bổ sung thông tin</a>
      <p class="text-sm text-[var(--muted-foreground)] mt-2">Thông tin bạn gửi sẽ được người phụ trách đọc và đối chiếu trước khi cập nhật. Thông tin riêng của gia đình không được công bố khi chưa có sự đồng ý.</p>
    </div>`;
}

function renderOfficialRoutes() {
  return `
    <div class="text-sm text-[var(--muted-foreground)] flex flex-col gap-1.5">
      <p><strong class="text-[var(--foreground)] font-medium">Tra cứu chính thức:</strong> ứng dụng VNeID → Dịch vụ khác → Kết nối thân nhân liệt sĩ (cần tài khoản định danh mức 2).</p>
      <p><a href="http://chinhsachquandoi.gov.vn" target="_blank" rel="noopener" class="underline underline-offset-2 text-[var(--foreground)]">Cổng Chính sách Quân đội (chinhsachquandoi.gov.vn, trang http)</a></p>
    </div>`;
}

function renderNotFoundBlock(query) {
  const total = getAllMartyrsFlat().length;
  return `
    <div class="not-found-block p-4 flex flex-col gap-3">
      <p class="font-medium text-[var(--foreground)]">Chưa có hồ sơ khớp với “${escapeHtml(query)}”.</p>
      <p class="text-sm text-[var(--muted-foreground)]">Atlas mới ghi nhận ${total} hồ sơ. Không tìm thấy ở đây không có nghĩa là không có hồ sơ.</p>
      <div class="flex flex-wrap gap-2">
        <button type="button" onclick="openUnitInPhienHieu(${escapeHtml(JSON.stringify(query))})" class="tap-target inline-flex items-center px-3 rounded-md border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]">Tra theo phiên hiệu đơn vị</button>
      </div>
      ${renderOfficialRoutes()}
      ${renderReportLink(`Bổ sung thông tin: không tìm thấy “${query}”`)}
    </div>`;
}

function handleSearchKeydown(event, source = "top") {
  const boxState = comboboxState[source];
  const listboxId = source === "top" ? "top-search-listbox" : "start-search-listbox";
  const inputId = source === "top" ? "search-input" : "start-search-input";
  const listbox = document.getElementById(listboxId);
  const input = document.getElementById(inputId);

  if (event.key === "Escape") {
    closeAllDropdowns();
    return;
  }

  if (!boxState || !boxState.items.length || !listbox || listbox.classList.contains("hidden")) {
    if (event.key === "Enter" && input && input.value.trim()) {
      handleSearchInput(input.value, source);
    }
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    boxState.activeIndex = (boxState.activeIndex + 1) % boxState.items.length;
    updateComboboxActiveOption(source, input, listbox);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    boxState.activeIndex =
      boxState.activeIndex <= 0 ? boxState.items.length - 1 : boxState.activeIndex - 1;
    updateComboboxActiveOption(source, input, listbox);
  } else if (event.key === "Enter") {
    event.preventDefault();
    const targetIdx = boxState.activeIndex >= 0 ? boxState.activeIndex : 0;
    executeComboboxOption(source, targetIdx);
  }
}

function updateComboboxActiveOption(source, input, listbox) {
  const boxState = comboboxState[source];
  boxState.items.forEach((item, idx) => {
    const el = document.getElementById(item.id);
    if (el) {
      const active = idx === boxState.activeIndex;
      el.setAttribute("aria-selected", active ? "true" : "false");
      if (active) {
        el.scrollIntoView({ block: "nearest" });
        input.setAttribute("aria-activedescendant", item.id);
      }
    }
  });
}

function executeComboboxOption(source, index) {
  const boxState = comboboxState[source];
  if (!boxState || !boxState.items[index]) return;
  const item = boxState.items[index];
  closeAllDropdowns();

  if (item.type === "martyr") {
    // 1C: the map flies to the person's battle behind their record
    if (state.activeMainView === "ban-do") {
      state.selectedBattleId = item.battleId;
      state.battleSubTab = "martyrs";
      renderMainViewState();
    }
    openMartyrRecord(item.martyrId);
  } else if (item.type === "battle") {
    selectBattle(item.battleId, "overview");
  } else if (item.type === "family") {
    filterMartyrsByFamily(item.familyId);
  } else if (item.type === "cemetery") {
    openCemeteryDetail(item.cemeteryId);
  } else if (item.type === "unit") {
    openUnitInPhienHieu(item.unitCode);
  } else if (item.type === "all-martyrs") {
    state.martyrListFilter = "all";
    state.queryCarriedFrom = state.activeMainView;
    switchMainView("liet-si");
  }
}

function clearSearch() {
  state.searchQuery = "";
  const topInput = document.getElementById("search-input");
  const startInput = document.getElementById("start-search-input");
  if (topInput) topInput.value = "";
  if (startInput) startInput.value = "";
  const clearBtn = document.getElementById("clear-search");
  if (clearBtn) clearBtn.classList.add("hidden");
  closeAllDropdowns();
  if (state.activeMainView === "liet-si") {
    renderAllMartyrsTable();
  }
  drawVietnamCanvasMap();
  updateLeafletMarkers();
  announce("Đã xóa từ khóa tìm kiếm");
}

// ============================================================================
// RIGHT PANEL (#map-panel): START STATE vs. BATTLE PANEL (Decision 1B)
// ============================================================================

function selectBattle(battleId, subTab = null) {
  const battle = (window.VIETNAM_WAR_BATTLES || []).find((b) => b.id === battleId);
  if (!battle) return;

  state.selectedBattleId = battle.id;
  state.focusedCemeteryId = null;
  state.mapFullView = false;
  if (subTab) {
    state.battleSubTab = subTab;
  } else if (!state.battleSubTab) {
    state.battleSubTab = "overview";
  }

  // Ensure period filter doesn't hide the explicitly selected battle
  const bPeriod = battle.periodId === "P4_1969_1972" ? "P4_1969_1973" : battle.periodId;
  if (state.activePeriod !== "ALL" && state.activePeriod !== bPeriod) {
    state.activePeriod = "ALL";
    renderPeriodPills();
  }

  state.activeMainView = "ban-do";
  renderMainViewState();

  if (state.mapEngine === "leaflet" && leafletMap) {
    leafletMap.flyTo([battle.coordinates.lat, battle.coordinates.lng], 8, { duration: 0.7 });
    updateLeafletMarkers();
  }

  syncHashFromState();
  announce(`Đã mở chi tiết: ${battle.name} (${battle.dateText})`);
}

function closeBattlePanel() {
  state.selectedBattleId = null;
  state.focusedCemeteryId = null;
  state.mapFullView = false;
  syncHashFromState();
  renderMainViewState();
  updateLeafletMarkers();
  document.getElementById("start-search-input")?.focus({ preventScroll: true });
  announce("Đã quay lại màn hình tra cứu ban đầu");
}

function setBattleSubTab(tab, focusTab = false) {
  if (tab === "compare") tab = "sources";
  if (!SUBTAB_SLUGS[tab]) return;
  state.battleSubTab = tab;
  syncHashFromState();
  renderMapPanel();
  if (focusTab) document.getElementById(`subtab-${tab}`)?.focus();
}

function openStoryFromStart(battleId, martyrId) {
  selectBattle(battleId, "overview");
  if (martyrId) openMartyrRecord(martyrId);
}

function openUnitInPhienHieu(unitCode) {
  state.selectedUnitCode = unitCode;
  switchMainView("phien-hieu");
  const input = document.getElementById("unit-decoder-input");
  if (input) {
    input.value = unitCode;
  }
  renderUnitDecoderList();
  drawUnitLineageCanvas();
}

function renderMapPanel() {
  const panel = document.getElementById("map-panel");
  if (!panel) return;

  if (state.focusedCemeteryId) {
    const cem = (window.CEMETERIES_LIST || window.CEMETERIES_DATA || []).find((c) => c.id === state.focusedCemeteryId);
    if (cem) {
      panel.classList.remove("is-start-state");
      renderCemeteryPanel(panel, cem);
      return;
    }
    state.focusedCemeteryId = null;
  }
  panel.classList.toggle("is-start-state", !state.selectedBattleId);
  if (!state.selectedBattleId) {
    renderStartStatePanel(panel);
    return;
  }

  const battle = (window.VIETNAM_WAR_BATTLES || []).find((b) => b.id === state.selectedBattleId);
  if (!battle) {
    state.selectedBattleId = null;
    renderStartStatePanel(panel);
    return;
  }

  renderSelectedBattlePanel(panel, battle);
}

function renderStartStatePanel(panel) {
  const filteredBattles = getFilteredBattles();
  const allMartyrs = getAllMartyrsFlat();
  const totalMartyrs = allMartyrs.length;
  const quickUnits = ["F325", "F304", "E66", "F320", "F361", "C552"];

  panel.innerHTML = `
    <!-- Section 1: Tìm người thân & Tra cứu nhanh (Decision 1B & 1C) -->
    <div class="panel-section opening-search">
      <h2 class="font-serif-archival text-xl sm:text-2xl font-semibold text-[var(--foreground)] mt-1">
        Tìm người thân
      </h2>
      <p class="text-sm text-[var(--muted-foreground)] mt-1">
        Tìm theo họ tên, quê quán hoặc phiên hiệu trên giấy báo tử. Mỗi hồ sơ là một điểm bắt đầu để tìm hiểu và đối chiếu tư liệu.
      </p>

      <div class="relative mt-3">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none">
          <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
        </svg>
        <input
          id="start-search-input"
          type="search"
          role="combobox"
          aria-expanded="false"
          aria-autocomplete="list"
          aria-controls="start-search-listbox"
          aria-label="Tìm người thân theo họ tên, quê quán, phiên hiệu đơn vị hoặc trận đánh"
          value="${escapeHtml(state.searchQuery)}"
          oninput="handleSearchInput(this.value, 'start')"
          onfocus="handleSearchInput(this.value, 'start')"
          onkeydown="handleSearchKeydown(event, 'start')"
          placeholder="Ví dụ: Lê Văn Huỳnh, Thái Bình, F325"
          class="w-full h-11 pl-10 pr-4 rounded-md text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
        />
        <div id="start-search-listbox" role="listbox" aria-label="Kết quả tìm người thân" class="search-dropdown hidden custom-scroll"></div>
      </div>

      <div class="flex flex-wrap items-center gap-1.5 mt-3">
        <span class="text-sm text-[var(--muted-foreground)] mr-1">Phiên hiệu phổ biến:</span>
        ${quickUnits
          .map(
            (code) => `
          <button
            type="button"
            onclick="openUnitInPhienHieu('${code}')"
            class="px-2.5 py-1 rounded-md text-sm font-mono-num bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]"
          >
            ${code}
          </button>
        `
          )
          .join("")}
      </div>
    </div>

    <!-- Section 2: Bắt đầu từ một câu chuyện (3 Curated Memorial Stories — Decision 1B) -->
    <div class="panel-section opening-stories">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <h3 class="text-sm font-semibold text-[var(--muted-foreground)]">
          Bắt đầu từ một câu chuyện
        </h3>
        <button type="button" onclick="switchMainView('liet-si')" class="tap-target text-sm font-medium text-[var(--accent)] underline underline-offset-2">
          Xem toàn bộ ${totalMartyrs} hồ sơ
        </button>
      </div>
      <div class="flex flex-col gap-2.5">
        ${CURATED_STORIES.map((st) => {
          const martyr = allMartyrs.find((m) => m.id === st.martyrId);
          return `
          <button
            type="button"
            onclick="openStoryFromStart('${st.battleId}', '${st.martyrId}')"
            class="story-card"
          >
            <div class="flex items-start gap-3 w-full">
              ${
                martyr && martyr.portraitUrl
                  ? `<img src="${escapeHtml(martyr.portraitUrl)}" alt="${escapeHtml(martyr.fullName)}" width="56" height="56" class="martyr-thumb w-14 h-14 mt-0.5" />`
                  : ""
              }
              <div class="min-w-0 flex-1">
                <div class="text-sm font-mono-num text-amber-400">${escapeHtml(st.kicker)}</div>
                <div class="font-serif-archival text-base sm:text-lg font-semibold text-[var(--foreground)] mt-0.5">
                  ${escapeHtml(st.title)}
                </div>
                <p class="text-sm text-[var(--muted-foreground)] mt-1">
                  ${escapeHtml(st.summary)}
                </p>
              </div>
            </div>
          </button>
        `;
        }).join("")}
      </div>
    </div>

    <!-- Section 3: Tìm theo nghĩa trang (Decision 1F) -->
    <div class="panel-section opening-cemeteries" id="cemetery-list">
      <h3 class="text-sm font-semibold text-[var(--muted-foreground)] mb-1">Tìm theo nghĩa trang</h3>
      <ul class="flex flex-col">
        ${(window.CEMETERIES_LIST || window.CEMETERIES_DATA || [])
          .map(
            (c, idx) => `<li class="${idx >= 5 ? "cem-more" : ""}"><button type="button" onclick="openCemeteryDetail('${escapeHtml(c.id)}')"
              class="tap-target w-full text-left py-2 border-b border-[var(--border)] flex items-baseline justify-between gap-3">
              <span class="font-medium text-[var(--foreground)]">${escapeHtml(c.short_name || c.name)}</span>
              <span class="text-sm text-[var(--muted-foreground)] shrink-0 text-right">${escapeHtml(c.province)}${formatGravesCount(c) ? ` · ${escapeHtml(formatGravesCount(c))}` : ""}</span>
            </button></li>`
          )
          .join("")}
      </ul>
      <button type="button" class="cem-more-toggle tap-target mt-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
        onclick="this.closest('#cemetery-list').classList.add('show-all'); this.remove();">Xem cả ${(window.CEMETERIES_LIST || window.CEMETERIES_DATA || []).length} nghĩa trang</button>
    </div>

    <!-- Section 4: Danh mục chiến dịch đang hiển thị (${filteredBattles.length}) -->
    <details class="panel-section opening-catalogue">
      <summary>Khám phá ${filteredBattles.length} chiến dịch trên bản đồ</summary>
      <div class="flex items-center justify-between gap-2 mb-2 mt-3">
        <h3 class="text-sm font-semibold text-[var(--muted-foreground)]">
          Chiến dịch &amp; Trận đánh trên bản đồ (${filteredBattles.length})
        </h3>
      </div>
      <div class="flex flex-col divide-y divide-[var(--border)]">
        ${filteredBattles
          .map((b) => {
            const pInfo = getPeriodInfo(b.periodId);
            const letterCount = (b.martyrs || []).filter((m) => m.hasLetter).length;
            const photoCount = (b.martyrs || []).filter((m) => Boolean(m.portraitUrl)).length;
            return `
              <button
                type="button"
                onclick="selectBattle('${b.id}', 'overview')"
                onmouseenter="setHoveredBattle('${b.id}')"
                onmouseleave="setHoveredBattle(null)"
                class="w-full text-left py-2.5 px-2 rounded-md hover:bg-[var(--background)] flex items-start justify-between gap-3"
              >
                <div class="min-w-0">
                  <div class="font-medium text-[var(--foreground)]">${escapeHtml(b.name)}</div>
                  <div class="text-sm text-[var(--muted-foreground)]">
                    ${escapeHtml(b.dateText)} · ${escapeHtml(b.locationName)} · ${escapeHtml(pInfo.shortLabel)}
                  </div>
                </div>
                <div class="shrink-0 text-right">
                  <span class="text-sm font-mono-num text-[var(--foreground)]">${(b.martyrs || []).length} liệt sĩ</span>
                  ${
                    photoCount > 0 || letterCount > 0
                      ? `<div class="text-sm text-amber-400">${[
                          photoCount > 0 ? `${photoCount} ảnh tư liệu` : "",
                          letterCount > 0 ? `${letterCount} thư` : ""
                        ]
                          .filter(Boolean)
                          .join(" · ")}</div>`
                      : ""
                  }
                </div>
              </button>
            `;
          })
          .join("")}
      </div>
    </details>
  `;
}

// ============================================================================
// SELECTED BATTLE PANEL (Decision 1B, E2, E3, E6, E13, E15)
// ============================================================================

function renderSelectedBattlePanel(panel, b) {
  let subTab = state.battleSubTab || "overview";
  if (subTab === "compare") subTab = "sources";
  const martyrs = b.martyrs || [];
  const tabs = [
    ["overview", "Tổng quan"],
    ["forces", "Lực lượng hai bên"],
    ["martyrs", `Liệt sĩ (${martyrs.length})`],
    ["sources", "Tư liệu &amp; Nguồn"]
  ];

  // Decision 1D: header = name, dates, place, one source line, close
  panel.innerHTML = `
    <div class="panel-section battle-header">
      <div class="flex items-start justify-between gap-3">
        <h2 class="font-serif-archival text-xl sm:text-2xl font-semibold text-[var(--foreground)]">${escapeHtml(b.name)}</h2>
        <button type="button" onclick="closeBattlePanel()" aria-label="Đóng trận ${escapeHtml(b.name)}, quay lại tra cứu" class="tap-target shrink-0 px-3 rounded-md border border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Đóng</button>
      </div>
      <div class="text-sm text-[var(--muted-foreground)] mt-1"><span class="font-mono-num text-[var(--foreground)]">${escapeHtml(b.dateText)}</span> · ${escapeHtml(b.locationName)}</div>
      <div class="text-sm text-[var(--muted-foreground)] mt-1 truncate">Nguồn: ${b.sourceUrl ? `<a href="${escapeHtml(b.sourceUrl)}" target="_blank" rel="noopener" class="underline underline-offset-2">${escapeHtml(b.sourceName)}</a>` : escapeHtml(b.sourceName || UNKNOWN_TEXT)}</div>
    </div>

    <div role="tablist" aria-label="Chi tiết trận ${escapeHtml(b.name)}" class="battle-subtabs">
      ${tabs
        .map(
          ([key, label]) => `
        <button type="button" role="tab" id="subtab-${key}" aria-controls="battle-subtab-body"
          aria-selected="${subTab === key ? "true" : "false"}" tabindex="${subTab === key ? "0" : "-1"}"
          onclick="setBattleSubTab('${key}')" onkeydown="handleSubtabKeydown(event)"
          class="battle-subtab ${subTab === key ? "is-active" : ""}">${label}</button>`
        )
        .join("")}
    </div>

    <div id="battle-subtab-body" role="tabpanel" aria-labelledby="subtab-${subTab}" tabindex="0" class="flex-1 flex flex-col">
      ${renderBattleSubTabContent(b, subTab)}
    </div>
  `;
}

// ARIA tabs: arrows move through all four tabs in reading order, Home/End jump
function handleSubtabKeydown(e) {
  const order = Object.keys(SUBTAB_SLUGS);
  const i = order.indexOf(state.battleSubTab === "compare" ? "sources" : state.battleSubTab);
  let next = null;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") next = order[(i + 1) % order.length];
  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = order[(i - 1 + order.length) % order.length];
  else if (e.key === "Home") next = order[0];
  else if (e.key === "End") next = order[order.length - 1];
  if (next) {
    e.preventDefault();
    setBattleSubTab(next, true);
  }
}

function renderBattleCompareTable(b) {
  const allBattles = window.VIETNAM_WAR_BATTLES || [];
  return `
      <div tabindex="0" role="region" aria-label="Bảng so sánh ${allBattles.length} chiến dịch" class="table-wrapper mt-2">
        <table class="battle-compare">
          <thead><tr><th>Chiến dịch</th><th>Thời gian</th><th>Đơn vị chủ lực</th><th>Hồ sơ</th></tr></thead>
          <tbody>
            ${allBattles
              .map((item) => {
                const isCurrent = item.id === b.id;
                const codes = (item.sides?.vietnam?.units || []).slice(0, 2).map((u) => u.unitCode).join(", ");
                return `<tr class="${isCurrent ? "bg-[var(--background)]" : ""}">
                    <td class="font-medium">${isCurrent ? escapeHtml(item.name) : `<a href="#/ban-do/${item.id}/tong-quan" class="underline underline-offset-2">${escapeHtml(item.name)}</a>`}</td>
                    <td class="font-mono-num text-sm text-[var(--muted-foreground)]">${escapeHtml(item.dateText)}</td>
                    <td class="font-mono-num text-sm text-[var(--muted-foreground)]">${escapeHtml(codes)}</td>
                    <td class="font-mono-num text-sm text-[var(--foreground)]">${(item.martyrs || []).length}</td>
                  </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>`;
}

function renderBattleSubTabContent(b, subTab) {
  const vn = b.sides?.vietnam || {};
  const us = b.sides?.us_arvn || {};
  const martyrs = b.martyrs || [];

  if (subTab === "overview") {
    const letterMartyrs = martyrs.filter((m) => m.hasLetter);
    return `
      <div class="panel-section">
        <h3 class="text-sm font-semibold text-[var(--muted-foreground)]">
          Diễn biến &amp; Ý nghĩa lịch sử
        </h3>
        <p class="text-[15px] leading-relaxed text-[var(--foreground)] mt-2">
          ${escapeHtml(b.summary)}
        </p>
        ${
          b.significance
            ? `<p class="text-sm leading-relaxed text-[var(--muted-foreground)] mt-2">
                <strong class="text-[var(--foreground)]">Ý nghĩa chiến lược:</strong> ${escapeHtml(b.significance)}
              </p>`
            : ""
        }
        ${
          b.tacticalHighlights && b.tacticalHighlights.length
            ? `<ul class="mt-3 space-y-2 text-sm text-[var(--muted-foreground)] list-disc pl-5">
                ${b.tacticalHighlights
                  .map((item) => {
                    if (item && typeof item === "object") {
                      return `<li><strong class="text-[var(--foreground)]">${escapeHtml(
                        item.date ? `${item.date} — ` : ""
                      )}${escapeHtml(item.title || "")}:</strong> ${escapeHtml(item.desc || "")}</li>`;
                    }
                    return `<li>${escapeHtml(item)}</li>`;
                  })
                  .join("")}
              </ul>`
            : ""
        }
      </div>

      ${
        letterMartyrs.length > 0
          ? `<div class="panel-section">
          <h3 class="text-sm font-semibold text-[var(--muted-foreground)] mb-1">Thư, nhật ký &amp; thơ tại mặt trận này</h3>
          ${letterMartyrs.map((m) => `<div class="-mx-5">${renderLetterBlock(m.letter, { preview: true, martyrId: m.id })}</div><p class="text-sm text-[var(--muted-foreground)] mb-3">— ${escapeHtml(m.fullName)}</p>`).join("")}
        </div>`
          : ""
      }

      <div class="panel-section">
        <div class="flex items-center justify-between gap-2 mb-2">
          <h3 class="text-sm font-semibold text-[var(--muted-foreground)]">
            Danh sách Liệt sĩ tiêu biểu (${martyrs.length})
          </h3>
          <button
            type="button"
            onclick="setBattleSubTab('martyrs')"
            class="text-sm font-medium text-amber-400 hover:underline"
          >
            Xem chi tiết ${martyrs.length} hồ sơ →
          </button>
        </div>
        <div class="flex flex-col gap-2">
          ${martyrs
            .slice(0, 3)
            .map((m) => renderMartyrButtonItem(m, b.id))
            .join("")}
        </div>
      </div>

      <details class="panel-section">
        <summary class="tap-target flex items-center cursor-pointer text-sm font-medium text-[var(--accent)]">So sánh với chiến dịch khác…</summary>
        ${renderBattleCompareTable(b)}
      </details>
    `;
  }

  if (subTab === "forces") {
    return `
      <!-- Side A: QĐNDVN / Mặt trận DTGP -->
      <div class="panel-section">
        <div class="text-sm font-semibold text-rose-400">${escapeHtml(vn.faction || "Quân đội Nhân dân Việt Nam & QGPMNVN")}</div>
        <div class="text-sm text-[var(--muted-foreground)] mt-1">
          <strong class="text-[var(--foreground)]">Chỉ huy:</strong> ${escapeHtml((vn.commanders || []).join(", ") || "Bộ Tư lệnh Mặt trận")}
        </div>
        <div class="text-sm text-[var(--muted-foreground)] mt-1">
          <strong class="text-[var(--foreground)]">Quân số / Quy mô:</strong> ${escapeHtml(vn.strength || "Các sư đoàn và trung đoàn chủ lực")}
        </div>
        <div class="text-sm text-[var(--muted-foreground)] mt-1">
          <strong class="text-[var(--foreground)]">Tổn thất / Hy sinh ghi nhận:</strong> ${escapeHtml(vn.casualties || "Nhiều cán bộ, chiến sĩ anh dũng hy sinh")}
        </div>

        <h4 class="text-sm font-semibold text-[var(--foreground)] mt-3 mb-2">
          Phiên hiệu đơn vị tham chiến (nhấp để giải mã phiên hiệu):
        </h4>
        <div class="flex flex-col divide-y divide-[var(--border)]">
          ${(vn.units || [])
            .map(
              (u) => `
            <div class="py-2.5 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="font-medium text-[var(--foreground)]">
                  <span class="font-mono-num text-amber-400">${escapeHtml(u.unitCode)}</span> — ${escapeHtml(u.name)}
                </div>
                <div class="text-sm text-[var(--muted-foreground)]">${escapeHtml(u.role || "")}</div>
              </div>
              <button
                type="button"
                onclick="openUnitInPhienHieu('${escapeHtml(u.unitCode)}')"
                class="shrink-0 px-2.5 py-1 rounded text-sm font-medium bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]"
              >
                Phiên hiệu →
              </button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- Side B: Hoa Kỳ / VNCH / Đồng minh -->
      <div class="panel-section">
        <div class="text-sm font-semibold text-sky-400">${escapeHtml(us.faction || "Quân đội Hoa Kỳ & Quân lực VNCH")}</div>
        <div class="text-sm text-[var(--muted-foreground)] mt-1">
          <strong class="text-[var(--foreground)]">Chỉ huy:</strong> ${escapeHtml((us.commanders || []).join(", ") || "Bộ Tư lệnh MACV / Quân đoàn VNCH")}
        </div>
        <div class="text-sm text-[var(--muted-foreground)] mt-1">
          <strong class="text-[var(--foreground)]">Quân số / Trang bị:</strong> ${escapeHtml(us.strength || "Các sư đoàn bộ binh, thiết giáp và không quân yểm trợ")}
        </div>
        <div class="text-sm text-[var(--muted-foreground)] mt-1">
          <strong class="text-[var(--foreground)]">Tổn thất ghi nhận:</strong> ${escapeHtml(us.casualties || "Theo thống kê lịch sử quân sự")}
        </div>

        <h4 class="text-sm font-semibold text-[var(--foreground)] mt-3 mb-2">
          Đơn vị đối phương tham chiến:
        </h4>
        <div class="flex flex-col divide-y divide-[var(--border)]">
          ${(us.units || [])
            .map(
              (u) => `
            <div class="py-2">
              <div class="font-medium text-[var(--foreground)]">
                <span class="font-mono-num text-sky-400">${escapeHtml(u.unitCode)}</span> — ${escapeHtml(u.name)}
              </div>
              <div class="text-sm text-[var(--muted-foreground)]">${escapeHtml(u.role || "")}</div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  if (subTab === "martyrs") {
    return `
      <div class="panel-section">
        ${b.estimatedMartyrs ? `<p class="text-sm text-[var(--muted-foreground)] mb-3">Ước tính tổn thất: ${escapeHtml(b.estimatedMartyrs)}</p>` : ""}
        ${martyrs.length === 0 ? `<p class="text-[var(--muted-foreground)]">Atlas chưa ghi nhận hồ sơ liệt sĩ nào của trận này.</p><a href="#/liet-si" class="tap-target inline-flex items-center mt-2 text-sm font-medium underline">Tìm trong toàn bộ danh sách</a>` : ""}
        <div class="flex flex-col gap-2.5">
          ${martyrs.map((m) => renderMartyrButtonItem(m, b.id)).join("")}
        </div>
      </div>

      <div class="panel-section">
        <h3 class="text-sm font-semibold text-[var(--foreground)] mb-2">Không thấy người thân trong danh sách này?</h3>
        ${renderOfficialRoutes()}
      </div>
    `;
  }

  // subTab === 'sources' (Decision 1D: Tư liệu & Nguồn — every citation once)
  const srcLink = (name, url) =>
    url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="underline underline-offset-2">${escapeHtml(name)}</a>` : escapeHtml(name || UNKNOWN_TEXT);
  return `
    <div class="panel-section">
      <h3 class="text-sm font-semibold text-[var(--muted-foreground)]">Nguồn về trận đánh</h3>
      <ul class="mt-2 space-y-1.5 text-sm list-disc pl-5">
        <li>${srcLink(b.sourceName, b.sourceUrl)}</li>
        ${b.secondarySourceName ? `<li>${srcLink(b.secondarySourceName, b.secondarySourceUrl)}</li>` : ""}
      </ul>
      ${b.archivalNote && b.archivalNote !== b.summary ? `<p class="text-sm text-[var(--muted-foreground)] mt-3">${escapeHtml(b.archivalNote)}</p>` : ""}
    </div>
    <div class="panel-section">
      <h3 class="text-sm font-semibold text-[var(--muted-foreground)]">Nguồn của từng hồ sơ (${martyrs.length})</h3>
      ${martyrs.length ? `<ul class="mt-2 space-y-1.5 text-sm list-disc pl-5">
        ${martyrs.map((m) => `<li><a href="#/liet-si/${encodeURIComponent(m.id)}" class="font-medium underline underline-offset-2">${escapeHtml(m.fullName)}</a>: ${srcLink(m.sourceName, m.sourceUrl)}</li>`).join("")}
      </ul>` : `<p class="text-sm text-[var(--muted-foreground)] mt-2">Chưa có tư liệu đối chiếu</p>`}
      <button type="button" onclick="openInfoSheet('verification', this)" class="tap-target inline-flex items-center mt-3 text-sm font-medium text-[var(--accent)] underline underline-offset-2">Các cấp xác minh hồ sơ nghĩa là gì?</button>
    </div>
    <div class="panel-section">${renderReportLink(`Báo sai sót: ${b.name} (${b.id})`) || ""}</div>
  `;
}

// E6 Fix: Semantic <button type="button"> for every martyr row
function renderMartyrButtonItem(m, battleId) {
  const badge = formatVerificationBadge(m);
  const date = formatDeathDate(m);
  return `
    <button type="button" onclick="openMartyrRecord('${m.id}')" class="martyr-item">
      <div class="flex items-start gap-3 w-full">
        ${m.portraitUrl ? `<img src="${escapeHtml(m.portraitUrl)}" alt="" width="56" height="56" loading="lazy" class="martyr-thumb w-14 h-14 mt-0.5" />` : ""}
        <div class="min-w-0 flex-1 text-left">
          <div class="flex flex-wrap items-baseline justify-between gap-x-3">
            <span class="font-serif-archival text-base font-semibold text-[var(--foreground)]">${escapeHtml(m.fullName)}</span>
            <span class="text-sm font-mono-num text-[var(--muted-foreground)]">${escapeHtml(formatLifeYears(m))}</span>
          </div>
          <div class="text-sm text-[var(--muted-foreground)] mt-1">${escapeHtml(m.hometown || UNKNOWN_TEXT)} · ${escapeHtml(m.unit || UNKNOWN_TEXT)}</div>
          <div class="text-sm text-[var(--muted-foreground)] mt-1 font-mono-num">Hy sinh: ${escapeHtml(date.text)}</div>
          <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span class="${badge.badgeClass}">${escapeHtml(badge.shortText)}</span>
            ${m.familyId ? `<span class="badge-family">Gia đình nhiều Liệt sĩ</span>` : ""}
            ${m.hasLetter ? `<span class="text-sm text-[var(--accent)]">Có ${escapeHtml((LETTER_KIND_LABELS[m.letter.kind] || "văn bản").toLowerCase())}</span>` : ""}
          </div>
        </div>
      </div>
    </button>
  `;
}

// ============================================================================
// CHRONOLOGICAL 16-BATTLE STRIP AT BOTTOM OF MAP
// ============================================================================

function renderBattleStrip() {
  const strip = document.getElementById("map-battle-strip");
  if (!strip) return;
  // 6D: the strip is the map's legend: same numbers (1–N, date order) as the markers.
  const battles = sortBattlesChronologically(getFilteredBattles());
  const focusedId = strip.contains(document.activeElement) ? document.activeElement.getAttribute("data-battle-id") : null;
  // The element that set a hover/focus name is about to be replaced.
  state.hoveredBattleId = null;

  if (battles.length === 0) {
    strip.innerHTML = `<div class="text-sm text-[var(--muted-foreground)] px-2 py-1">Không có chiến dịch nào trong bộ lọc hiện tại.</div>`;
    return;
  }

  strip.innerHTML = battles
    .map((b) => {
      const isSelected = state.selectedBattleId === b.id;
      const year = getBattleYear(b);
      return `
        <button
          type="button"
          data-battle-id="${escapeHtml(b.id)}"
          onclick="selectBattle('${b.id}')"
          onmouseenter="setHoveredBattle('${b.id}')"
          onmouseleave="setHoveredBattle(null)"
          onfocus="setHoveredBattle('${b.id}')"
          onblur="setHoveredBattle(null)"
          aria-pressed="${isSelected ? "true" : "false"}"
          aria-label="${escapeHtml(getBattleAccessibleName(b))}"
          class="map-strip-btn shrink-0 px-3 py-1.5 rounded-md text-sm border transition-colors ${
            isSelected
              ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--foreground)] font-semibold"
              : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }"
        >
          <span class="map-strip-num" aria-hidden="true">${getBattleNumber(b.id)}</span>
          <span class="font-mono-num map-strip-year mr-1" aria-hidden="true">${escapeHtml(year)}</span>
          <span aria-hidden="true">${escapeHtml(getBattleShortName(b))}</span>
        </button>
      `;
    })
    .join("");

  if (focusedId) {
    const btn = strip.querySelector(`[data-battle-id="${CSS.escape(focusedId)}"]`);
    if (btn) btn.focus({ preventScroll: true });
  }
}

function setHoveredBattle(battleId) {
  state.hoveredBattleId = battleId;
  drawVietnamCanvasMap();
}

// ============================================================================
// UNIVERSAL MARTYR DOSSIER & WARTIME LETTER MODAL (<dialog id="martyr-dialog">)
// ============================================================================

// Decision 3C: a labelled wartime text (kind, extent, date, source, checked or not)
function renderLetterBlock(letter, { preview = false, martyrId = "" } = {}) {
  const lines = letter.text.split("\n");
  const shown = preview ? lines.filter((l) => l.trim()).slice(0, 3).join("\n") : letter.text;
  return `
    <section class="p-5 bg-[var(--background)]/40" aria-label="${escapeHtml(formatLetterTitle(letter))}">
      <h3 class="font-serif-archival text-lg font-semibold text-[var(--foreground)]">${escapeHtml(formatLetterTitle(letter))}</h3>
      <div class="text-sm text-[var(--muted-foreground)] mt-1">${letter.extent === "toan-van" ? "Toàn văn" : "Trích"}${letter.writtenDate ? ` · ${escapeHtml(formatIsoPartial(letter.writtenDate))}` : ""}</div>
      ${letter.textVerified ? "" : `<p class="text-sm text-[var(--accent)] mt-2">Bản chép lại, chưa đối chiếu bản gốc</p>`}
      <blockquote class="letter-text mt-3 whitespace-pre-line">${escapeHtml(shown)}</blockquote>
      ${preview ? `<a href="#/liet-si/${encodeURIComponent(martyrId)}" class="tap-target inline-flex items-center mt-2 text-sm font-medium text-[var(--accent)] underline underline-offset-2">Đọc toàn bộ</a>` : ""}
      ${!preview && letter.editorNote ? `<p class="text-sm text-[var(--muted-foreground)] mt-3">Ghi chú của ban biên tập: ${escapeHtml(letter.editorNote)}</p>` : ""}
      ${!preview ? `<p class="text-sm text-[var(--muted-foreground)] mt-2">Nguồn: ${letter.sourceName ? (letter.sourceUrl ? `<a class="underline" href="${escapeHtml(letter.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(letter.sourceName)}</a>` : escapeHtml(letter.sourceName)) : UNKNOWN_TEXT}${letter.heldAt ? `<br>Bản gốc lưu tại: ${escapeHtml(letter.heldAt)}` : ""}</p>` : ""}
    </section>`;
}

function copyText(text, btn, doneLabel) {
  const done = () => {
    if (!btn) return;
    const old = btn.textContent;
    btn.textContent = doneLabel || "Đã sao chép";
    announce(doneLabel || "Đã sao chép");
    setTimeout(() => (btn.textContent = old), 1800);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, done);
  } else {
    done();
  }
}

function getMartyrConnections(martyr, allMartyrs) {
  const byId = new Map(allMartyrs.map((x) => [x.id, x]));
  const rawLinks = window.MARTYR_LINKS_LIST || window.MARTYR_LINKS_DATA || [];
  const familyLinks = [];
  const squadLinks = [];
  const unitLinks = [];

  for (const lnk of rawLinks) {
    const aId = lnk.martyrAId || lnk.martyr_a_id;
    const bId = lnk.martyrBId || lnk.martyr_b_id;
    if (aId !== martyr.id && bId !== martyr.id) continue;
    const peerId = aId === martyr.id ? bId : aId;
    const peer = byId.get(peerId);
    if (!peer) continue;
    const relType = lnk.relationType || lnk.relation_type;
    const item = {
      peer,
      label: lnk.relationLabel || lnk.relation_label || "",
      context: lnk.sharedContext || lnk.shared_context || ""
    };
    if (relType === "family") familyLinks.push(item);
    else if (relType === "same_squad") squadLinks.push(item);
    else if (relType === "same_unit") unitLinks.push(item);
  }

  const sortByPeer = (a, b) =>
    (a.peer.deathDate || "9999").localeCompare(b.peer.deathDate || "9999") ||
    viSortCollator.compare(a.peer.fullName, b.peer.fullName);
  familyLinks.sort(sortByPeer);
  squadLinks.sort(sortByPeer);
  unitLinks.sort(sortByPeer);

  const alreadyLinked = new Set([
    martyr.id,
    ...familyLinks.map((x) => x.peer.id),
    ...squadLinks.map((x) => x.peer.id),
    ...unitLinks.map((x) => x.peer.id)
  ]);

  const sameBattlePeers = allMartyrs
    .filter((x) => x.battleId === martyr.battleId && !alreadyLinked.has(x.id))
    .sort(
      (a, b) =>
        (a.deathDate || "9999").localeCompare(b.deathDate || "9999") ||
        viSortCollator.compare(a.fullName, b.fullName)
    );

  const sameCemeteryPeers = martyr.cemeteryId
    ? allMartyrs
        .filter(
          (x) =>
            x.cemeteryId === martyr.cemeteryId &&
            x.battleId !== martyr.battleId &&
            !alreadyLinked.has(x.id)
        )
        .sort(
          (a, b) =>
            (a.deathDate || "9999").localeCompare(b.deathDate || "9999") ||
            viSortCollator.compare(a.fullName, b.fullName)
        )
    : [];

  const familyRecord = martyr.familyId
    ? (window.MARTYR_FAMILIES_LIST || window.MARTYR_FAMILIES_DATA || []).find(
        (f) => f.id === martyr.familyId
      ) || null
    : null;

  const unitRecord = martyr.unitCode
    ? (window.UNIT_DECODER_DICTIONARY || []).find((u) => u.code === martyr.unitCode) || null
    : null;

  return {
    familyRecord,
    unitRecord,
    familyLinks,
    squadLinks,
    unitLinks,
    sameBattlePeers,
    sameCemeteryPeers
  };
}

function renderComradeLinkItem(peer, subLabel = "") {
  return `
    <a href="#/liet-si/${encodeURIComponent(peer.id)}" class="comrade-link-item">
      <div class="min-w-0">
        <div class="font-serif-archival font-semibold text-[var(--foreground)]">${escapeHtml(peer.fullName)}</div>
        ${subLabel ? `<div class="text-sm text-[var(--muted-foreground)] mt-0.5">${escapeHtml(subLabel)}</div>` : ""}
      </div>
      <span class="text-sm font-mono-num text-[var(--muted-foreground)] shrink-0">${escapeHtml(formatLifeYears(peer))} →</span>
    </a>`;
}

function openMartyrModal(martyrId, battleId = null) {
  const all = getAllMartyrsFlat();
  const martyr = all.find((m) => m.id === martyrId && (!battleId || m.battleId === battleId)) ||
    all.find((m) => m.id === martyrId);

  const dialog = document.getElementById("martyr-dialog");
  const titleEl = document.getElementById("martyr-dialog-title");
  const bodyEl = document.getElementById("martyr-dialog-body");
  if (!dialog || !titleEl || !bodyEl) return;

  // 2A: unknown record id
  if (!martyr) {
    titleEl.textContent = "Không tìm thấy hồ sơ này";
    bodyEl.innerHTML = `<div class="p-5"><p class="text-[var(--muted-foreground)]">Mã hồ sơ “${escapeHtml(martyrId)}” không có trong Atlas.</p>
      <a href="#/liet-si" class="tap-target inline-flex items-center mt-3 px-3 rounded-md border border-[var(--border)] text-sm font-medium">Mở danh sách Liệt sĩ</a></div>`;
    if (!dialog.open) dialog.showModal();
    return;
  }

  const connections = getMartyrConnections(martyr, all);
  const date = formatDeathDate(martyr);
  const imageKindLabel =
    martyr.imageKind === "portrait"
      ? "Di ảnh / Chân dung tư liệu lịch sử"
      : "Ảnh hiện vật / Đài tưởng niệm chiến trường";
  const sourceLink = martyr.sourceName
    ? martyr.sourceUrl
      ? `<a href="${escapeHtml(martyr.sourceUrl)}" target="_blank" rel="noopener" class="underline underline-offset-2">${escapeHtml(martyr.sourceName)}</a>`
      : escapeHtml(martyr.sourceName)
    : UNKNOWN_TEXT;
  const secondarySourceLink = martyr.secondarySourceName
    ? martyr.secondarySourceUrl
      ? `<a href="${escapeHtml(martyr.secondarySourceUrl)}" target="_blank" rel="noopener" class="underline underline-offset-2">${escapeHtml(martyr.secondarySourceName)}</a>`
      : escapeHtml(martyr.secondarySourceName)
    : "";
  const field = (label, valueHtml) => `
    <div>
      <div class="text-sm text-[var(--muted-foreground)]">${label}</div>
      <div class="font-medium text-[var(--foreground)] mt-0.5">${valueHtml}</div>
    </div>`;
  const orUnknown = (v) => (v ? escapeHtml(v) : UNKNOWN_TEXT);
  const letter = martyr.letter;
  const recordUrl = `${location.origin}${location.pathname}#/liet-si/${encodeURIComponent(martyr.id)}`;

  const fam = connections.familyRecord;
  const showFamilyImage =
    fam &&
    fam.image_url &&
    fam.image_url !== martyr.portraitUrl &&
    fam.image_url !== martyr.secondaryImageUrl;
  const hasAnyComradeSection =
    connections.squadLinks.length > 0 ||
    connections.unitLinks.length > 0 ||
    connections.sameBattlePeers.length > 0 ||
    connections.sameCemeteryPeers.length > 0;

  titleEl.textContent = martyr.fullName;
  document.title = `${martyr.fullName} · Ký Ức Việt Nam Atlas`;

  bodyEl.innerHTML = `
    <div class="p-5 flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        ${renderVerificationBadgeButton(martyr)}
        ${fam ? `<span class="badge-family">Gia đình ${Number(fam.total_martyrs)} Liệt sĩ</span>` : ""}
        <span class="text-sm text-[var(--muted-foreground)]">Nguồn: ${sourceLink}${secondarySourceLink ? ` · ${secondarySourceLink}` : ""}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${field("Năm sinh", martyr.isCollective ? "Tập thể" : `<span class="font-mono-num">${orUnknown(martyr.birthYear)}</span>`)}
        ${field("Ngày hy sinh", `<span class="font-mono-num">${escapeHtml(date.text)}</span>${date.disputed ? ` <span class="text-sm text-[var(--accent)]">(đang đối chiếu)</span>` : ""}${!martyr.isCollective && martyr.ageAtSacrifice ? `<div class="text-sm font-normal text-[var(--muted-foreground)] mt-0.5">Hy sinh ở tuổi <span class="font-mono-num">${martyr.ageAtSacrifice}</span></div>` : ""}${date.note ? `<div class="text-sm font-normal text-[var(--muted-foreground)] mt-1">${escapeHtml(date.note)}</div>` : ""}`)}
        ${martyr.aliasName ? field("Tên khai sinh / Bí danh", escapeHtml(martyr.aliasName)) : ""}
        ${martyr.partyYouthStatus ? field("Đảng – Đoàn", escapeHtml(martyr.partyYouthStatus)) : ""}
        ${field("Quê quán", orUnknown(martyr.hometown))}
        ${field("Đơn vị &amp; chức vụ", `${orUnknown(martyr.unit)}${martyr.rank ? `<div class="text-sm font-normal text-[var(--muted-foreground)] mt-1">${escapeHtml(martyr.rank)}</div>` : ""}${martyr.unitCode ? `<div class="mt-1"><a href="#/phien-hieu/${encodeURIComponent(martyr.unitCode)}" class="tap-target inline-flex items-center text-sm font-mono-num text-[var(--accent)] underline underline-offset-2">Phiên hiệu: ${escapeHtml(martyr.unitCode)}${connections.unitRecord ? ` — ${escapeHtml(connections.unitRecord.name)}` : ""}</a></div>` : ""}`)}
        ${martyr.enlistmentPeriod ? field("Nhập ngũ / Quá trình hoạt động", escapeHtml(martyr.enlistmentPeriod)) : ""}
        ${field("Chiến dịch / mặt trận", `${escapeHtml(martyr.battleName)}${martyr.sacrificeLocation ? `<div class="text-sm font-normal text-[var(--muted-foreground)] mt-1">Nơi hy sinh: ${escapeHtml(martyr.sacrificeLocation)}</div>` : ""}`)}
        ${field("Nơi an táng / tưởng niệm", `${orUnknown(martyr.memorialSite)}${martyr.graveDetail ? `<div class="text-sm font-normal text-[var(--muted-foreground)] mt-0.5">${escapeHtml(martyr.graveDetail)}</div>` : ""}${martyr.cemeteryId ? `<div><a href="#/ban-do/nghia-trang/${encodeURIComponent(martyr.cemeteryId)}" class="tap-target inline-flex items-center text-sm text-[var(--accent)] underline underline-offset-2">Xem nghĩa trang trên bản đồ</a></div>` : ""}`)}
        ${martyr.familyInfo || martyr.familyRole ? field("Thân nhân &amp; Gia đình", `${martyr.familyRole ? `<div class="text-sm font-semibold text-[var(--accent)] mb-0.5">${escapeHtml(martyr.familyRole)}</div>` : ""}<div class="text-sm font-normal text-[var(--foreground)] leading-relaxed">${escapeHtml(martyr.familyInfo || martyr.familyName || "")}</div>`) : ""}
        ${martyr.commemorationNotes ? field("Di tích &amp; Tưởng niệm", `<span class="text-sm font-normal leading-relaxed">${escapeHtml(martyr.commemorationNotes)}</span>`) : ""}
      </div>

      <div>
        <div class="text-sm text-[var(--muted-foreground)]">${martyr.isCollective ? "Danh hiệu tập thể" : "Huân chương, huy chương &amp; danh hiệu"}</div>
        ${
          martyr.sourcedAwards.length
            ? `<ul class="flex flex-col gap-2 mt-1.5">${martyr.sourcedAwards
                .map(
                  (aw) => `<li>
                    <button type="button" class="badge-medal badge-button" onclick="openInfoSheet('award', this, '${escapeHtml(aw.awardId)}')">${escapeHtml(aw.citationLabel)}${aw.isPosthumous ? " (truy tặng)" : ""}${aw.awardedYear ? `, ${aw.awardedYear}` : ""}</button>
                    <span class="text-sm text-[var(--muted-foreground)] ml-1">Nguồn: ${aw.sourceUrl ? `<a class="underline" href="${escapeHtml(aw.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(aw.sourceName)}</a>` : escapeHtml(aw.sourceName)}${aw.decisionRef ? ` · ${escapeHtml(aw.decisionRef)}` : ""}</span>
                  </li>`
                )
                .join("")}</ul>`
            : `<div class="font-medium text-[var(--foreground)] mt-0.5">${UNKNOWN_TEXT}</div>`
        }
      </div>
    </div>

    ${
      martyr.portraitUrl
        ? `
      <div class="p-5 bg-[var(--background)]/30">
        <h3 class="text-sm font-semibold text-[var(--muted-foreground)] mb-3">${escapeHtml(imageKindLabel)}</h3>
        <div class="grid grid-cols-1 ${martyr.secondaryImageUrl ? "md:grid-cols-2" : ""} gap-4">
          <figure class="archival-figure">
            <img src="${escapeHtml(martyr.portraitUrl)}" alt="${escapeHtml(martyr.portraitCaption || martyr.fullName)}"
              width="${Number(martyr.portraitWidth) || 600}" height="${Number(martyr.portraitHeight) || 600}" fetchpriority="low" loading="lazy" />
            <figcaption>
              <div>${escapeHtml(martyr.portraitCaption || martyr.fullName)}</div>
              ${martyr.portraitCredit ? `<div class="mt-1">Nguồn ảnh: ${formatArchivalCreditHtml(martyr.portraitCredit)}</div>` : ""}
            </figcaption>
          </figure>
          ${
            martyr.secondaryImageUrl
              ? `<figure class="archival-figure">
              <img src="${escapeHtml(martyr.secondaryImageUrl)}" alt="${escapeHtml(martyr.secondaryImageCaption || martyr.fullName)}"
                width="${Number(martyr.secondaryImageWidth) || 800}" height="${Number(martyr.secondaryImageHeight) || 500}" fetchpriority="low" loading="lazy" />
              <figcaption>
                <div>${escapeHtml(martyr.secondaryImageCaption || "")}</div>
                ${martyr.secondaryImageCredit ? `<div class="mt-1">Nguồn ảnh: ${formatArchivalCreditHtml(martyr.secondaryImageCredit)}</div>` : ""}
              </figcaption>
            </figure>`
              : ""
          }
        </div>
      </div>`
        : ""
    }

    <div class="p-5">
      <h3 class="text-sm font-semibold text-[var(--muted-foreground)]">Tiểu sử &amp; sự kiện chiến đấu</h3>
      <p class="text-base leading-relaxed text-[var(--foreground)] mt-2">${orUnknown(martyr.storySummary)}</p>
    </div>

    ${letter ? renderLetterBlock(letter) : ""}

    ${
      fam
        ? `
      <div class="p-5 border-t border-[var(--border)] bg-[var(--background)]/35 flex flex-col gap-3">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div class="text-sm font-semibold text-[var(--muted-foreground)]">Hồ sơ Gia đình có nhiều Liệt sĩ &amp; Bà Mẹ Việt Nam Anh hùng</div>
            <h3 class="font-serif-archival text-lg font-semibold text-[var(--foreground)] mt-0.5">${escapeHtml(fam.family_name)}</h3>
            <div class="text-sm text-[var(--muted-foreground)] mt-0.5">${escapeHtml(fam.matriarch_patriarch)} · ${escapeHtml(fam.hometown)}</div>
          </div>
          <span class="badge-family shrink-0">Tổng số ${Number(fam.total_martyrs)} Liệt sĩ · ${Number(fam.recorded_in_atlas)} hồ sơ trong Atlas</span>
        </div>
        ${fam.honor_titles ? `<div class="text-sm font-medium text-[var(--accent)]">${escapeHtml(fam.honor_titles)}</div>` : ""}
        <p class="text-sm leading-relaxed text-[var(--foreground)]">${escapeHtml(fam.summary)}</p>
        ${
          showFamilyImage
            ? `<figure class="archival-figure">
                <img src="${escapeHtml(fam.image_url)}" alt="${escapeHtml(fam.image_caption || fam.family_name)}"
                  width="${Number(fam.image_width) || 600}" height="${Number(fam.image_height) || 400}" fetchpriority="low" loading="lazy" />
                <figcaption>
                  <div>${escapeHtml(fam.image_caption || fam.family_name)}</div>
                  ${fam.image_credit ? `<div class="mt-1">Nguồn ảnh: ${formatArchivalCreditHtml(fam.image_credit)}</div>` : ""}
                </figcaption>
              </figure>`
            : ""
        }
        ${
          connections.familyLinks.length > 0
            ? `<div class="flex flex-col gap-2">
                <div class="text-sm font-semibold text-[var(--muted-foreground)]">Thân nhân Liệt sĩ cùng gia đình trong Atlas (${connections.familyLinks.length}):</div>
                <div class="flex flex-col gap-1.5">
                  ${connections.familyLinks
                    .map(({ peer, label }) =>
                      renderComradeLinkItem(
                        peer,
                        `${label}${peer.battleName ? ` · ${peer.battleName}` : ""}`
                      )
                    )
                    .join("")}
                </div>
              </div>`
            : ""
        }
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1 text-sm text-[var(--muted-foreground)]">
          <span>Nguồn gia đình: ${fam.source_url ? `<a href="${escapeHtml(fam.source_url)}" target="_blank" rel="noopener" class="underline underline-offset-2">${escapeHtml(fam.source_name)}</a>` : escapeHtml(fam.source_name || UNKNOWN_TEXT)}</span>
          <button type="button" onclick="filterMartyrsByFamily(${escapeHtml(JSON.stringify(fam.id))})" class="tap-target inline-flex items-center px-3 rounded-md border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]">Lọc gia đình trên danh bạ →</button>
        </div>
      </div>`
        : ""
    }

    ${
      hasAnyComradeSection
        ? `
      <div class="p-5 border-t border-[var(--border)] flex flex-col gap-4">
        <h3 class="text-sm font-semibold text-[var(--muted-foreground)]">Mạng lưới Đồng đội &amp; Liệt sĩ liên kết</h3>

        ${
          connections.squadLinks.length > 0
            ? `<div class="flex flex-col gap-2">
                <div class="text-sm font-medium text-[var(--foreground)]">Cùng Tiểu đội / Kíp chiến đấu / Trận địa (${connections.squadLinks.length})</div>
                <div class="flex flex-col gap-1.5">
                  ${connections.squadLinks
                    .map(({ peer, label }) =>
                      renderComradeLinkItem(
                        peer,
                        `${label}${peer.rank ? ` · ${peer.rank}` : ""}`
                      )
                    )
                    .join("")}
                </div>
              </div>`
            : ""
        }

        ${
          connections.unitLinks.length > 0
            ? `<div class="flex flex-col gap-2">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-sm font-medium text-[var(--foreground)]">Cùng Phiên hiệu Đơn vị <span class="font-mono-num text-[var(--accent)]">${escapeHtml(martyr.unitCode)}</span> (${connections.unitLinks.length})</span>
                  <button type="button" onclick="filterMartyrsByUnit(${escapeHtml(JSON.stringify(martyr.unitCode))})" class="tap-target inline-flex items-center px-2.5 rounded text-sm text-[var(--accent)] underline underline-offset-2">Lọc phiên hiệu trên danh bạ →</button>
                </div>
                <div class="flex flex-col gap-1.5">
                  ${connections.unitLinks
                    .slice(0, 8)
                    .map(({ peer }) =>
                      renderComradeLinkItem(
                        peer,
                        `${peer.unit || ""}${peer.battleName ? ` · ${peer.battleName}` : ""}`
                      )
                    )
                    .join("")}
                </div>
              </div>`
            : ""
        }

        ${
          connections.sameBattlePeers.length > 0
            ? `<div class="flex flex-col gap-2">
                <div class="text-sm font-medium text-[var(--foreground)]">Cùng Chiến dịch / Mặt trận: ${escapeHtml(martyr.battleName)} (${connections.sameBattlePeers.length})</div>
                <div class="flex flex-col gap-1.5">
                  ${connections.sameBattlePeers
                    .slice(0, 6)
                    .map((peer) =>
                      renderComradeLinkItem(peer, `${peer.unit || ""}${peer.rank ? ` · ${peer.rank}` : ""}`)
                    )
                    .join("")}
                </div>
              </div>`
            : ""
        }

        ${
          connections.sameCemeteryPeers.length > 0
            ? `<div class="flex flex-col gap-2">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-sm font-medium text-[var(--foreground)]">Cùng Nghĩa trang an táng (${connections.sameCemeteryPeers.length})</span>
                  ${martyr.cemeteryId ? `<button type="button" onclick="filterMartyrsByCemetery(${escapeHtml(JSON.stringify(martyr.cemeteryId))})" class="tap-target inline-flex items-center px-2.5 rounded text-sm text-[var(--accent)] underline underline-offset-2">Xem toàn bộ tại nghĩa trang →</button>` : ""}
                </div>
                <div class="flex flex-col gap-1.5">
                  ${connections.sameCemeteryPeers
                    .slice(0, 5)
                    .map((peer) =>
                      renderComradeLinkItem(peer, `${peer.battleName || ""} · ${peer.unit || ""}`)
                    )
                    .join("")}
                </div>
              </div>`
            : ""
        }
      </div>`
        : ""
    }

    <div class="p-5 flex flex-col gap-3 bg-[var(--background)]/60">
      <div class="flex flex-wrap items-center gap-2">
        <a href="#/ban-do/${encodeURIComponent(martyr.battleId)}/liet-si" class="tap-target inline-flex items-center px-3 rounded-md text-sm font-medium bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]">Xem trận ${escapeHtml(martyr.battleName)} trên bản đồ</a>
        <button type="button" onclick="copyText(${escapeHtml(JSON.stringify(recordUrl))}, this, 'Đã sao chép liên kết')" class="tap-target inline-flex items-center px-3 rounded-md text-sm font-medium border border-[var(--border)] text-[var(--foreground)]">Sao chép liên kết</button>
        <button type="button" onclick="copyText(${escapeHtml(JSON.stringify(martyr.id))}, this, 'Đã sao chép mã')" class="tap-target inline-flex items-center px-3 rounded-md text-sm font-medium border border-[var(--border)] text-[var(--foreground)]">Sao chép mã hồ sơ</button>
      </div>
      <div class="text-sm font-mono-num text-[var(--muted-foreground)]">Mã hồ sơ: ${escapeHtml(martyr.id)}</div>
      ${renderReportLink(`Báo sai sót: ${martyr.fullName} (${martyr.id})`)}
    </div>
  `;

  bodyEl.scrollTop = 0;
  dialog.scrollTop = 0;
  if (!dialog.open) {
    dialog.showModal();
  }
}

// ============================================================================
// VIEW 2: LIỆT SĨ (SEARCHABLE ROLL OF HONOR & WARTIME LETTERS — Decision 1A)
// ============================================================================

const viSortCollator = new Intl.Collator("vi", { numeric: true, sensitivity: "base" });
let martyrFiltersPopulated = false;
let sortableTableBound = false;

function renderFamiliesAndSquadsDisclosures() {
  const famSummaryEl = document.getElementById("disclosure-families-summary");
  const famBodyEl = document.getElementById("families-directory-body");
  const sqSummaryEl = document.getElementById("disclosure-squads-summary");
  const sqBodyEl = document.getElementById("squads-directory-body");

  const families = window.MARTYR_FAMILIES_LIST || window.MARTYR_FAMILIES_DATA || [];
  const rawLinks = window.MARTYR_LINKS_LIST || window.MARTYR_LINKS_DATA || [];
  const units = window.UNIT_DECODER_DICTIONARY || [];
  const allMartyrs = getAllMartyrsFlat();
  const byId = new Map(allMartyrs.map((m) => [m.id, m]));
  const totalFamilyMartyrs = allMartyrs.filter((m) => Boolean(m.familyId)).length;

  if (famSummaryEl) {
    famSummaryEl.textContent = `Gia đình có nhiều Liệt sĩ & Bà Mẹ Việt Nam Anh hùng (${families.length} đại gia đình · ${totalFamilyMartyrs} hồ sơ Liệt sĩ)`;
  }

  if (famBodyEl) {
    famBodyEl.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        ${families
          .map((f) => {
            const members = (f.martyrIds || [])
              .map((mid) => byId.get(mid))
              .filter(Boolean)
              .sort(
                (a, b) =>
                  (a.deathDate || "9999").localeCompare(b.deathDate || "9999") ||
                  viSortCollator.compare(a.fullName, b.fullName)
              );
            return `
              <article class="family-card">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div class="flex items-start gap-3 min-w-0 flex-1">
                    ${f.image_url ? `<img src="${escapeHtml(f.image_url)}" alt="" width="64" height="64" loading="lazy" class="martyr-thumb w-16 h-16 shrink-0" />` : ""}
                    <div class="min-w-0">
                      <h3 class="font-serif-archival text-lg font-semibold text-[var(--foreground)]">${escapeHtml(f.family_name)}</h3>
                      <div class="text-sm text-[var(--muted-foreground)] mt-0.5">${escapeHtml(f.matriarch_patriarch)}</div>
                      <div class="text-sm text-[var(--muted-foreground)]">${escapeHtml(f.hometown)}</div>
                    </div>
                  </div>
                  <span class="badge-family shrink-0">${Number(f.total_martyrs)} Liệt sĩ · ${members.length} hồ sơ</span>
                </div>
                ${f.honor_titles ? `<div class="text-sm font-medium text-[var(--accent)]">${escapeHtml(f.honor_titles)}</div>` : ""}
                <p class="text-sm leading-relaxed text-[var(--foreground)]">${escapeHtml(f.summary)}</p>
                <div class="flex flex-col gap-1.5">
                  ${members
                    .map((m) =>
                      renderComradeLinkItem(
                        m,
                        `${m.familyRole ? `${m.familyRole} · ` : ""}${m.battleName || ""}`
                      )
                    )
                    .join("")}
                </div>
                <div class="flex flex-wrap items-center justify-between gap-2 pt-1 text-sm text-[var(--muted-foreground)]">
                  <span>Nguồn: ${f.source_url ? `<a href="${escapeHtml(f.source_url)}" target="_blank" rel="noopener" class="underline underline-offset-2">${escapeHtml(f.source_name)}</a>` : escapeHtml(f.source_name || UNKNOWN_TEXT)}</span>
                  <div class="flex flex-wrap gap-2">
                    ${f.cemetery_id ? `<a href="#/ban-do/nghia-trang/${encodeURIComponent(f.cemetery_id)}" class="tap-target inline-flex items-center px-3 rounded-md border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]">Nghĩa trang</a>` : ""}
                    <button type="button" onclick="filterMartyrsByFamily(${escapeHtml(JSON.stringify(f.id))})" class="tap-target inline-flex items-center px-3 rounded-md border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]">Lọc trên bảng →</button>
                  </div>
                </div>
              </article>`;
          })
          .join("")}
      </div>`;
  }

  // Group tactical squad links by relationLabel
  const squadMap = new Map();
  for (const lnk of rawLinks) {
    const relType = lnk.relationType || lnk.relation_type;
    if (relType !== "same_squad") continue;
    const label = lnk.relationLabel || lnk.relation_label || "Cùng tổ chiến đấu";
    const context = lnk.sharedContext || lnk.shared_context || "";
    if (!squadMap.has(label)) {
      squadMap.set(label, { label, context, memberIds: new Set() });
    }
    const grp = squadMap.get(label);
    grp.memberIds.add(lnk.martyrAId || lnk.martyr_a_id);
    grp.memberIds.add(lnk.martyrBId || lnk.martyr_b_id);
  }
  const squadGroups = [...squadMap.values()].map((g) => ({
    label: g.label,
    context: g.context,
    members: [...g.memberIds]
      .map((id) => byId.get(id))
      .filter(Boolean)
      .sort(
        (a, b) =>
          (a.deathDate || "9999").localeCompare(b.deathDate || "9999") ||
          viSortCollator.compare(a.fullName, b.fullName)
      )
  }));

  const unitsWithComrades = units
    .map((u) => ({
      unit: u,
      members: allMartyrs.filter((m) => m.unitCode === u.code)
    }))
    .filter((x) => x.members.length >= 2)
    .sort((a, b) => b.members.length - a.members.length);

  if (sqSummaryEl) {
    sqSummaryEl.textContent = `Liên kết Liệt sĩ cùng Tiểu đội, Kíp chiến đấu & Phiên hiệu Đơn vị (${squadGroups.length} tổ chiến đấu · ${unitsWithComrades.length} phiên hiệu liên kết)`;
  }

  if (sqBodyEl) {
    sqBodyEl.innerHTML = `
      <div class="flex flex-col gap-5">
        <div>
          <h3 class="text-sm font-semibold text-[var(--muted-foreground)] mb-3">Tiểu đội, Kíp xe tăng, Tàu Không số &amp; Trận địa chiến đấu cùng nhau (${squadGroups.length})</h3>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            ${squadGroups
              .map(
                (g) => `
              <article class="family-card">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <h4 class="font-serif-archival text-base font-semibold text-[var(--foreground)]">${escapeHtml(g.label)}</h4>
                  <span class="text-sm font-mono-num text-[var(--accent)] shrink-0">${g.members.length} hồ sơ</span>
                </div>
                ${g.context ? `<p class="text-sm text-[var(--muted-foreground)] leading-relaxed">${escapeHtml(g.context)}</p>` : ""}
                <div class="flex flex-col gap-1.5">
                  ${g.members
                    .map((m) => renderComradeLinkItem(m, m.rank || m.unit || ""))
                    .join("")}
                </div>
              </article>`
              )
              .join("")}
          </div>
        </div>

        <div class="pt-3 border-t border-[var(--border)]">
          <h3 class="text-sm font-semibold text-[var(--muted-foreground)] mb-2.5">Phiên hiệu đơn vị có nhiều Liệt sĩ cùng chiến đấu (${unitsWithComrades.length})</h3>
          <div class="flex flex-wrap gap-2">
            ${unitsWithComrades
              .map(
                ({ unit, members }) => `
              <button type="button" onclick="filterMartyrsByUnit(${escapeHtml(JSON.stringify(unit.code))})" class="tap-target inline-flex items-center gap-2 px-3 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] hover:border-[var(--accent)]">
                <span class="font-mono-num font-semibold text-amber-400">${escapeHtml(unit.code)}</span>
                <span>${escapeHtml(unit.name)}</span>
                <span class="font-mono-num text-[var(--muted-foreground)]">(${members.length})</span>
              </button>`
              )
              .join("")}
          </div>
        </div>
      </div>`;
  }
}

function populateMartyrFilterSelects() {
  const famSelect = document.getElementById("filter-family-select");
  const unitSelect = document.getElementById("filter-unit-select");
  const cemSelect = document.getElementById("filter-cemetery-select");
  const awardSelect = document.getElementById("filter-award-select");
  const provSelect = document.getElementById("filter-province-select");
  const families = window.MARTYR_FAMILIES_LIST || window.MARTYR_FAMILIES_DATA || [];
  const units = window.UNIT_DECODER_DICTIONARY || [];
  const cemeteries = window.CEMETERIES_LIST || window.CEMETERIES_DATA || [];
  const awards = window.AWARDS_LIST || window.AWARDS_CATALOG || [];
  const allMartyrs = getAllMartyrsFlat();

  if (!martyrFiltersPopulated) {
    if (famSelect && families.length > 0) {
      famSelect.innerHTML =
        `<option value="ALL">Tất cả Gia đình nhiều Liệt sĩ (${families.length})</option>` +
        families
          .map((f) => {
            const cnt = allMartyrs.filter((m) => m.familyId === f.id).length;
            return `<option value="${escapeHtml(f.id)}">${escapeHtml(f.family_name)} (${cnt}/${Number(f.total_martyrs)} Liệt sĩ)</option>`;
          })
          .join("");
    }
    if (unitSelect && units.length > 0) {
      unitSelect.innerHTML =
        `<option value="ALL">Tất cả Phiên hiệu đơn vị (${units.length})</option>` +
        units
          .map((u) => {
            const cnt = allMartyrs.filter((m) => m.unitCode === u.code).length;
            return `<option value="${escapeHtml(u.code)}">${escapeHtml(u.code)} — ${escapeHtml(u.name)} (${cnt} hồ sơ)</option>`;
          })
          .join("");
    }
    if (cemSelect && cemeteries.length > 0) {
      cemSelect.innerHTML =
        `<option value="ALL">Tất cả Nghĩa trang &amp; Đài tưởng niệm (${cemeteries.length})</option>` +
        cemeteries
          .map((c) => {
            const cnt = allMartyrs.filter((m) => m.cemeteryId === c.id).length;
            return `<option value="${escapeHtml(c.id)}">${escapeHtml(c.short_name || c.name)} (${cnt} hồ sơ)</option>`;
          })
          .join("");
    }
    const sourcedAwardIds = new Set(allMartyrs.flatMap((m) => m.sourcedAwards.map((aw) => aw.awardId)));
    if (awardSelect) awardSelect.hidden = sourcedAwardIds.size === 0; // 3F: nothing to filter until awards are sourced
    if (awardSelect && sourcedAwardIds.size > 0) {
      awardSelect.innerHTML =
        `<option value="ALL">Tất cả Huân chương, Huy chương &amp; Danh hiệu (${awards.length})</option>` +
        awards
          .filter((a) => sourcedAwardIds.has(a.id))
          .map((a) => {
            const cnt = allMartyrs.filter((m) =>
              m.sourcedAwards.some((aw) => aw.awardId === a.id)
            ).length;
            return `<option value="${escapeHtml(a.id)}">${escapeHtml(a.short_name || a.name)} (${cnt} hồ sơ)</option>`;
          })
          .join("");
    }
    if (provSelect) {
      const provCounts = new Map();
      allMartyrs.forEach((m) => {
        const p = (m.homeProvince || "").trim();
        if (p && p !== "Không rõ") {
          provCounts.set(p, (provCounts.get(p) || 0) + 1);
        }
      });
      const sortedProvs = [...provCounts.entries()].sort((a, b) =>
        viSortCollator.compare(a[0], b[0])
      );
      provSelect.innerHTML =
        `<option value="ALL">Tất cả tỉnh, thành quê quán (${sortedProvs.length})</option>` +
        sortedProvs
          .map(
            ([prov, cnt]) =>
              `<option value="${escapeHtml(prov)}">${escapeHtml(prov)} (${cnt} hồ sơ)</option>`
          )
          .join("");
    }
    renderFamiliesAndSquadsDisclosures();
    martyrFiltersPopulated = true;
  }

  if (famSelect) famSelect.value = state.martyrFamilyFilter || "ALL";
  if (unitSelect) unitSelect.value = state.martyrUnitFilter || "ALL";
  if (cemSelect) cemSelect.value = state.martyrCemeteryFilter || "ALL";
  if (awardSelect) awardSelect.value = state.martyrAwardFilter || "ALL";
  if (provSelect) provSelect.value = state.martyrProvinceFilter || "ALL";
}

function setMartyrListFilter(filter) {
  state.martyrListFilter = filter || "all";
  const buttons = [
    { id: "mf-all", val: "all" },
    { id: "mf-families", val: "families" },
    { id: "mf-heroes", val: "heroes" },
    { id: "mf-medals", val: "medals" },
    { id: "mf-photos", val: "photos" },
    { id: "mf-letters", val: "letters" },
    { id: "mf-l4", val: "L4" },
    { id: "mf-l3", val: "L3" }
  ];
  buttons.forEach((b) => {
    const el = document.getElementById(b.id);
    if (el) {
      el.setAttribute("aria-pressed", state.martyrListFilter === b.val ? "true" : "false");
    }
  });
  renderAllMartyrsTable();
}

const MARTYR_SORTS = {
  name: (a, b) => viSortCollator.compare(a.fullName, b.fullName),
  death: (a, b) => (a.deathDate || "9999").localeCompare(b.deathDate || "9999"),
  home: (a, b) => viSortCollator.compare(a.homeProvince || a.hometown || "", b.homeProvince || b.hometown || ""),
  unit: (a, b) => viSortCollator.compare(a.unit || "", b.unit || "")
};

function setMartyrSort(key) {
  state.martyrSort = MARTYR_SORTS[key] ? key : "";
  renderAllMartyrsTable();
}

function setMartyrFamilyFilter(familyId) {
  state.martyrFamilyFilter = familyId || "ALL";
  renderAllMartyrsTable();
}

function setMartyrUnitFilter(unitCode) {
  state.martyrUnitFilter = unitCode || "ALL";
  renderAllMartyrsTable();
}

function setMartyrCemeteryFilter(cemeteryId) {
  state.martyrCemeteryFilter = cemeteryId || "ALL";
  renderAllMartyrsTable();
}

function setMartyrAwardFilter(awardId) {
  state.martyrAwardFilter = awardId || "ALL";
  renderAllMartyrsTable();
}

function setMartyrProvinceFilter(province) {
  state.martyrProvinceFilter = province || "ALL";
  renderAllMartyrsTable();
}

function resetAllMartyrFilters() {
  state.martyrListFilter = "all";
  state.martyrFamilyFilter = "ALL";
  state.martyrUnitFilter = "ALL";
  state.martyrCemeteryFilter = "ALL";
  state.martyrAwardFilter = "ALL";
  state.martyrProvinceFilter = "ALL";
  clearSearch();
  populateMartyrFilterSelects();
  setMartyrListFilter("all");
}

function sortMartyrRowsArray(rows, cellIndex, type, direction) {
  const factor = direction === "ascending" ? 1 : -1;
  const keyed = rows.map((row) => {
    const cell = row.cells[cellIndex];
    const raw = cell ? (cell.dataset.value ?? cell.textContent.trim()) : "";
    return { row, val: type === "number" ? Number(raw) || 0 : raw };
  });
  keyed.sort((a, b) =>
    factor * (type === "number" ? a.val - b.val : viSortCollator.compare(a.val, b.val))
  );
  return keyed.map((k) => k.row);
}

function reorderTableBodyNodes(tbody, orderedRows) {
  const move = Object.hasOwn(Element.prototype, "moveBefore")
    ? (node) => tbody.moveBefore(node, null)
    : (node) => tbody.append(node);
  for (const row of orderedRows) {
    move(row);
  }
}

function initSortableMartyrsTable() {
  if (sortableTableBound) return;
  const table = document.getElementById("all-martyrs-table");
  const tbody = document.getElementById("all-martyrs-tbody");
  const statusEl = document.getElementById("martyrs-sort-status");
  if (!table || !tbody) return;

  const handleSortButton = (btn) => {
    const th = btn ? btn.closest("th") : null;
    if (!th || !table.tHead || !table.tHead.rows[0]) return;

    const direction =
      th.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending";
    for (const header of table.tHead.rows[0].cells) {
      header.removeAttribute("aria-sort");
    }
    th.setAttribute("aria-sort", direction);

    const currentRows = [...tbody.rows].filter((r) => r.cells.length > 1);
    if (currentRows.length === 0) return;

    const ordered = sortMartyrRowsArray(
      currentRows,
      th.cellIndex,
      th.dataset.type || "text",
      direction
    );
    const applyDomMove = () => reorderTableBodyNodes(tbody, ordered);
    const prefersReduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReduced && ordered.length <= 200 && typeof table.startViewTransition === "function") {
      table.startViewTransition(applyDomMove);
    } else if (
      !prefersReduced &&
      ordered.length <= 200 &&
      typeof document.startViewTransition === "function"
    ) {
      document.startViewTransition(applyDomMove);
    } else {
      applyDomMove();
    }

    if (statusEl) {
      const colLabel = btn.textContent.trim();
      const dirLabel = direction === "ascending" ? "tăng dần" : "giảm dần";
      statusEl.textContent = `Đã sắp xếp theo ${colLabel}, ${dirLabel}, ${ordered.length} hồ sơ`;
    }
  };

  table.addEventListener("command", (event) => {
    if (event.command !== "--sort") return;
    handleSortButton(event.source);
  });

  if (typeof HTMLButtonElement === "undefined" || !("commandForElement" in HTMLButtonElement.prototype)) {
    table.querySelectorAll("thead button.sort-th-btn").forEach((btn) => {
      btn.addEventListener("click", () => handleSortButton(btn));
    });
  }

  sortableTableBound = true;
}

function renderAllMartyrsTable() {
  const tbody = document.getElementById("all-martyrs-tbody");
  const countBadge = document.getElementById("martyrs-count-badge");
  const table = document.getElementById("all-martyrs-table");
  if (!tbody) return;

  populateMartyrFilterSelects();
  const all = getAllMartyrsFlat();
  const q = normalizeText(state.searchQuery.trim());
  // Decision 3F: award filters count sourced awards only; a chip at 0 is hidden
  const isHero = (m) => m.sourcedAwards.some((aw) => aw.awardId === "anh-hung-llvtnd");
  const hasMedals = (m) => m.sourcedAwards.length > 0;
  const familyMartyrCount = all.filter((m) => Boolean(m.familyId)).length;

  const filterLabels = [
    { id: "mf-all", text: `Tất cả hồ sơ (${all.length})`, n: all.length },
    { id: "mf-families", text: `Gia đình nhiều Liệt sĩ (${familyMartyrCount})`, n: familyMartyrCount },
    { id: "mf-heroes", text: `Anh hùng LLVTND (${all.filter(isHero).length})`, n: all.filter(isHero).length },
    { id: "mf-medals", text: `Huân chương & giải thưởng (${all.filter(hasMedals).length})`, n: all.filter(hasMedals).length },
    { id: "mf-photos", text: `Có ảnh tư liệu (${all.filter((m) => Boolean(m.portraitUrl)).length})`, n: 1 },
    { id: "mf-letters", text: `Có thư, nhật ký, thơ (${all.filter((m) => m.hasLetter).length})`, n: 1 },
    { id: "mf-l4", text: `Hồ sơ chính thức (${all.filter((m) => m.verificationLevel === "L4").length})`, n: 1 },
    { id: "mf-l3", text: `Đối chiếu đơn vị (${all.filter((m) => m.verificationLevel === "L3").length})`, n: 1 }
  ];
  filterLabels.forEach((item) => {
    const btn = document.getElementById(item.id);
    if (!btn) return;
    btn.textContent = item.text;
    btn.hidden = item.n === 0;
  });

  let filtered = all.filter((m) => {
    if (state.martyrListFilter === "families" && !m.familyId) return false;
    if (state.martyrListFilter === "heroes" && !isHero(m)) return false;
    if (state.martyrListFilter === "medals" && !hasMedals(m)) return false;
    if (state.martyrListFilter === "photos" && !m.portraitUrl) return false;
    if (state.martyrListFilter === "letters" && !m.hasLetter) return false;
    if (state.martyrListFilter === "L4" && m.verificationLevel !== "L4") return false;
    if (state.martyrListFilter === "L3" && m.verificationLevel !== "L3") return false;
    if (state.martyrFamilyFilter !== "ALL" && m.familyId !== state.martyrFamilyFilter) return false;
    if (state.martyrUnitFilter !== "ALL" && m.unitCode !== state.martyrUnitFilter) return false;
    if (state.martyrCemeteryFilter !== "ALL" && m.cemeteryId !== state.martyrCemeteryFilter) return false;
    if (state.martyrAwardFilter !== "ALL" && !m.sourcedAwards.some((aw) => aw.awardId === state.martyrAwardFilter)) return false;
    if (state.martyrProvinceFilter !== "ALL" && m.homeProvince !== state.martyrProvinceFilter) return false;
    if (q) {
      const hay = normalizeText(
        `${m.fullName} ${m.aliasName || ""} ${m.hometown} ${m.homeProvince || ""} ${m.unit} ${m.unitCode || ""} ${m.familyName || ""} ${m.familyMatriarch || ""} ${m.familyInfo || ""} ${m.sacrificeLocation || ""} ${m.commemorationNotes || ""} ${m.cemetery || ""} ${m.award || ""} ${m.rank || ""} ${m.battleName} ${m.storySummary || ""}`
      );
      if (!matchesSearch(hay, q)) return false;
    }
    return true;
  });
  if (state.martyrSort && MARTYR_SORTS[state.martyrSort]) {
    filtered = [...filtered].sort(MARTYR_SORTS[state.martyrSort]);
  }

  if (countBadge) {
    countBadge.textContent = `${filtered.length} / ${all.length} hồ sơ`;
  }
  // Decision 2C: active search/family/unit filters are always visible here, one tap to clear
  const chip = document.getElementById("martyrs-carried-chip");
  if (chip) {
    const chips = [];
    const raw = state.searchQuery.trim();
    if (raw) {
      chips.push(
        `<button type="button" onclick="clearSearch()" aria-label="Bỏ lọc ${escapeHtml(raw)}" class="filter-chip tap-target">Từ khóa: ${escapeHtml(raw)} <span aria-hidden="true">×</span></button>`
      );
    }
    if (state.martyrFamilyFilter !== "ALL") {
      const famObj = (window.MARTYR_FAMILIES_LIST || window.MARTYR_FAMILIES_DATA || []).find(
        (f) => f.id === state.martyrFamilyFilter
      );
      const famLabel = famObj ? famObj.family_name : state.martyrFamilyFilter;
      chips.push(
        `<button type="button" onclick="setMartyrFamilyFilter('ALL')" aria-label="Bỏ lọc gia đình ${escapeHtml(famLabel)}" class="filter-chip tap-target">${escapeHtml(famLabel)} <span aria-hidden="true">×</span></button>`
      );
    }
    if (state.martyrUnitFilter !== "ALL") {
      chips.push(
        `<button type="button" onclick="setMartyrUnitFilter('ALL')" aria-label="Bỏ lọc phiên hiệu ${escapeHtml(state.martyrUnitFilter)}" class="filter-chip tap-target">Phiên hiệu: ${escapeHtml(state.martyrUnitFilter)} <span aria-hidden="true">×</span></button>`
      );
    }
    chip.innerHTML = chips.join(" ");
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row"><td colspan="6">
        ${q ? renderNotFoundBlock(state.searchQuery.trim()) : `<p class="p-4 text-[var(--muted-foreground)]">Không có hồ sơ nào khớp với bộ lọc hiện tại.</p>`}
        <div class="px-4 pb-4"><button type="button" onclick="resetAllMartyrFilters()" class="tap-target inline-flex items-center px-3 rounded-md border border-[var(--border)] text-sm font-medium">Đặt lại bộ lọc</button></div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((m) => {
      const badge = formatVerificationBadge(m);
      const sortYear = m.deathDate ? Number(m.deathDate.slice(0, 4)) : 9999;
      return `
        <tr class="martyr-row">
          <td data-value="${escapeHtml(m.fullName)}" class="cell-name">
            <div class="flex items-start gap-3">
              ${m.portraitUrl ? `<img src="${escapeHtml(m.portraitUrl)}" alt="" width="48" height="48" loading="lazy" class="martyr-thumb row-thumb w-12 h-12" />` : ""}
              <div class="min-w-0">
                <a href="#/liet-si/${encodeURIComponent(m.id)}" class="row-link font-serif-archival font-semibold text-[var(--foreground)] hover:underline">${escapeHtml(m.fullName)}</a>
                <div class="text-sm text-[var(--muted-foreground)] row-extra">${escapeHtml(m.rank || "")}${m.aliasName ? ` · ${escapeHtml(m.aliasName)}` : ""}</div>
                ${m.familyName ? `<div class="mt-1 row-extra"><span class="badge-family">${escapeHtml(m.familyName)}${m.familyRole ? ` · ${escapeHtml(m.familyRole)}` : ""}</span></div>` : ""}
                ${m.hasLetter ? `<div class="text-sm text-[var(--accent)] row-extra">Có ${escapeHtml((LETTER_KIND_LABELS[m.letter.kind] || "văn bản").toLowerCase())}</div>` : ""}
              </div>
            </div>
          </td>
          <td data-value="${sortYear}" class="cell-years font-mono-num text-sm">${escapeHtml(formatLifeYears(m))}</td>
          <td data-value="${escapeHtml(m.battleName)}" class="cell-battle">
            <a href="#/ban-do/${encodeURIComponent(m.battleId)}/liet-si" class="font-medium text-[var(--foreground)] underline-offset-2 hover:underline">${escapeHtml(m.battleName)}</a>
            <div class="text-sm text-[var(--muted-foreground)]">${escapeHtml(m.battleDate)}</div>
          </td>
          <td data-value="${escapeHtml(m.homeProvince || m.hometown)}" class="cell-home">
            <div class="home-unit"><span class="text-[var(--foreground)] full-text">${escapeHtml(m.hometown || UNKNOWN_TEXT)}</span><span class="short-text">${escapeHtml(shortHometown(m) || UNKNOWN_TEXT)}</span><span class="sep"> · </span><span class="text-sm text-[var(--muted-foreground)] full-text">${escapeHtml(m.unit || UNKNOWN_TEXT)}</span><span class="short-text">${escapeHtml(shortUnit(m) || UNKNOWN_TEXT)}</span></div>
            ${m.memorialSite ? `<div class="text-sm text-[var(--muted-foreground)] mt-0.5 row-extra">${escapeHtml(m.memorialSite)}</div>` : ""}
          </td>
          <td data-value="${escapeHtml(badge.shortText)}" class="cell-badge">
            <span class="${badge.badgeClass}">${escapeHtml(badge.shortText)}</span>
            <div class="text-sm text-[var(--muted-foreground)] mt-1 max-w-[250px] row-extra line-clamp-2">${escapeHtml(m.sourceName || UNKNOWN_TEXT)}</div>
          </td>
          <td class="cell-open">
            <a href="#/liet-si/${encodeURIComponent(m.id)}" class="tap-target inline-flex items-center px-3 rounded-md text-sm font-medium bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]" aria-label="Mở hồ sơ ${escapeHtml(m.fullName)}">Mở hồ sơ</a>
          </td>
        </tr>
      `;
    })
    .join("");

  if (state.martyrSort) return;
  // Preserve active column sort order across filter changes
  if (table && table.tHead && table.tHead.rows[0]) {
    const sortedTh = [...table.tHead.rows[0].cells].find((c) => c.hasAttribute("aria-sort"));
    if (sortedTh) {
      const dir = sortedTh.getAttribute("aria-sort");
      const ordered = sortMartyrRowsArray(
        [...tbody.rows],
        sortedTh.cellIndex,
        sortedTh.dataset.type || "text",
        dir
      );
      reorderTableBodyNodes(tbody, ordered);
    }
  }
}

// ============================================================================
// VIEW 3: NGHĨA TRANG & HUÂN CHƯƠNG (CEMETERIES & STATE HONORS CATALOG)
// ============================================================================

// Decision 1F: a cemetery is a place on the map; it opens in the map panel
function openCemeteryDetail(cemeteryId) {
  const cem = (window.CEMETERIES_LIST || window.CEMETERIES_DATA || []).find((c) => c.id === cemeteryId);
  if (!cem) return;
  state.activeMainView = "ban-do";
  state.selectedBattleId = null;
  state.mapFullView = false;
  state.focusedCemeteryId = cem.id;
  if (typeof mapCam !== "undefined") {
    mapCam.centerLat = Number(cem.lat);
    mapCam.centerLng = Number(cem.lng);
    mapCam.zoom = Math.max(mapCam.zoom || 1, 2.4);
  }
  syncHashFromState();
  renderMainViewState();
  if (state.mapEngine === "leaflet" && leafletMap) {
    leafletMap.flyTo([cem.lat, cem.lng], 9, { duration: 0.6 });
    updateLeafletMarkers();
  }
  announce(`Đã mở ${cem.name}`);
}

// Graves as the source states them: rounded figures read "khoảng" (2A, 1F)
function formatGravesCount(c) {
  const n = Number(c.total_graves) || 0;
  if (!n) return "";
  const note = (c.graves_note || "").trim();
  const formatted = n.toLocaleString("vi-VN");
  let qual = "";
  if (/^(Hơn|Trên)\b/i.test(note)) qual = "hơn ";
  else if (/^(Khoảng|Gần)\b/i.test(note) || !note.includes(formatted)) qual = "khoảng ";
  return `${qual}${formatted} phần mộ`;
}

function renderCemeteryPanel(panel, c) {
  const linked = getAllMartyrsFlat().filter((m) => m.cemeteryId === c.id);
  const meta = [c.province, c.established_year ? `xây dựng ${c.established_year}` : "", c.area_ha ? `${String(c.area_ha).replace(".", ",")} ha` : ""].filter(Boolean).join(" · ");
  panel.innerHTML = `
    <div class="panel-section battle-header">
      <div class="flex items-start justify-between gap-3">
        <h2 class="font-serif-archival text-xl sm:text-2xl font-semibold text-[var(--foreground)]">${escapeHtml(c.name)}</h2>
        <button type="button" onclick="closeBattlePanel()" aria-label="Đóng ${escapeHtml(c.name)}, quay lại tra cứu" class="tap-target shrink-0 px-3 rounded-md border border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Đóng</button>
      </div>
      <div class="text-sm text-[var(--muted-foreground)] mt-1">${escapeHtml(meta)}</div>
    </div>
    ${
      c.image_url
        ? `<figure class="archival-figure panel-section">
        <img src="${escapeHtml(c.image_url)}" alt="${escapeHtml(c.image_caption || c.name)}" width="${Number(c.image_width) || 800}" height="${Number(c.image_height) || 450}" loading="lazy" />
        <figcaption>${escapeHtml(c.image_caption || "")}${c.image_credit ? `<div class="mt-1">Nguồn ảnh: ${formatArchivalCreditHtml(c.image_credit)}</div>` : ""}</figcaption>
      </figure>`
        : ""
    }
    <div class="panel-section flex flex-col gap-3">
      ${c.district_commune ? `<p class="text-sm text-[var(--muted-foreground)]">${escapeHtml(c.district_commune)}</p>` : ""}
      ${c.graves_note ? `<p class="text-base">${escapeHtml(c.graves_note)}</p>` : ""}
      ${c.summary ? `<p class="text-base text-[var(--foreground)]">${escapeHtml(c.summary)}</p>` : ""}
      ${c.zones_info ? `<p class="text-sm text-[var(--muted-foreground)]">${escapeHtml(c.zones_info)}</p>` : ""}
    </div>
    <div class="panel-section">
      <h3 class="text-sm font-semibold text-[var(--muted-foreground)]">Hồ sơ an táng hoặc tưởng niệm tại đây (${linked.length})</h3>
      ${
        linked.length
          ? `<ul class="mt-2 flex flex-col">${linked
              .map((m) => `<li><a href="#/liet-si/${encodeURIComponent(m.id)}" class="tap-target flex items-center justify-between gap-3 py-2 border-b border-[var(--border)] last:border-b-0">
                  <span class="font-medium">${escapeHtml(m.fullName)}</span>
                  <span class="text-sm font-mono-num text-[var(--muted-foreground)] shrink-0">${escapeHtml(formatLifeYears(m))}</span></a></li>`)
              .join("")}</ul>`
          : `<p class="text-sm text-[var(--muted-foreground)] mt-2">Atlas chưa ghi nhận hồ sơ nào tại nghĩa trang này.</p>`
      }
    </div>
    <div class="panel-section text-sm text-[var(--muted-foreground)]">
      Nguồn: ${c.source_url ? `<a href="${escapeHtml(c.source_url)}" target="_blank" rel="noopener" class="underline underline-offset-2">${escapeHtml(c.source_name)}</a>` : escapeHtml(c.source_name || UNKNOWN_TEXT)}
    </div>
  `;
}

function flyToCemeteryOnMap(cemeteryId) {
  const cemeteries = window.CEMETERIES_LIST || window.CEMETERIES_DATA || [];
  const cem = cemeteries.find((c) => c.id === cemeteryId);
  if (!cem) return;
  if (state.mapPinMode !== "both" && state.mapPinMode !== "cemeteries") {
    state.mapPinMode = "both";
  }
  state.selectedBattleId = null;
  state.hoveredCemeteryId = cem.id;
  mapCam.centerLat = Number(cem.lat);
  mapCam.centerLng = Number(cem.lng);
  mapCam.zoom = 2.6;
  switchMainView("ban-do");
  if (state.mapEngine === "leaflet" && leafletMap) {
    leafletMap.flyTo([cem.lat, cem.lng], 9, { duration: 0.6 });
    updateLeafletMarkers();
  }
  announce(`Đang định vị ${cem.name} trên bản đồ`);
}

function filterMartyrsByCemetery(cemeteryId) {
  state.martyrListFilter = "all";
  state.martyrFamilyFilter = "ALL";
  state.martyrUnitFilter = "ALL";
  state.martyrCemeteryFilter = cemeteryId || "ALL";
  state.martyrAwardFilter = "ALL";
  state.martyrProvinceFilter = "ALL";
  switchMainView("liet-si");
}

function filterMartyrsByAward(awardId) {
  state.martyrListFilter = "all";
  state.martyrFamilyFilter = "ALL";
  state.martyrUnitFilter = "ALL";
  state.martyrAwardFilter = awardId || "ALL";
  state.martyrCemeteryFilter = "ALL";
  state.martyrProvinceFilter = "ALL";
  switchMainView("liet-si");
}

function filterMartyrsByFamily(familyId) {
  state.martyrListFilter = "all";
  state.martyrFamilyFilter = familyId || "ALL";
  state.martyrUnitFilter = "ALL";
  state.martyrCemeteryFilter = "ALL";
  state.martyrAwardFilter = "ALL";
  state.martyrProvinceFilter = "ALL";
  switchMainView("liet-si");
  setMartyrListFilter("all");
  document.getElementById("all-martyrs-table")?.scrollIntoView({ block: "nearest" });
}

function filterMartyrsByUnit(unitCode) {
  state.martyrListFilter = "all";
  state.martyrUnitFilter = unitCode || "ALL";
  state.martyrFamilyFilter = "ALL";
  state.martyrCemeteryFilter = "ALL";
  state.martyrAwardFilter = "ALL";
  state.martyrProvinceFilter = "ALL";
  switchMainView("liet-si");
  setMartyrListFilter("all");
  document.getElementById("all-martyrs-table")?.scrollIntoView({ block: "nearest" });
}

// ============================================================================
// VIEW 4: PHIÊN HIỆU (DEATH-NOTICE UNIT DECODER & GRAPH — Decision 1A)
// ============================================================================

function renderUnitDecoderList() {
  const container = document.getElementById("unit-decoder-results");
  const input = document.getElementById("unit-decoder-input");
  if (!container) return;

  const q = normalizeText(input ? input.value.trim() : "");
  const units = window.UNIT_DECODER_DICTIONARY || [];
  const battles = window.VIETNAM_WAR_BATTLES || [];
  const allMartyrs = getAllMartyrsFlat();

  const filtered = units.filter((u) => {
    if (!q) return true;
    const unitMartyrsText = allMartyrs
      .filter((m) => m.unitCode === u.code || (u.martyrIds || []).includes(m.id))
      .map((m) => `${m.fullName} ${m.aliasName || ""}`)
      .join(" ");
    const hay = normalizeText(
      `${u.code} ${u.name} ${u.alias || ""} ${u.theater || ""} ${u.historyNote || ""} ${unitMartyrsText}`
    );
    return hay.includes(q);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-sm text-[var(--muted-foreground)]">
        Không tìm thấy phiên hiệu khớp với từ khóa. Hãy thử các mã như <code>F325</code>, <code>F304</code>, <code>E66</code>, <code>F320</code>, <code>F361</code>, <code>Q761</code>, <code>C552</code>.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((u) => {
      const isSelected = state.selectedUnitCode === u.code;
      const linkedBattles = (u.battles || [])
        .map((bid) => battles.find((b) => b.id === bid))
        .filter(Boolean);
      const unitMartyrs = allMartyrs
        .filter((m) => m.unitCode === u.code || (u.martyrIds || []).includes(m.id))
        .sort(
          (a, b) =>
            (a.deathDate || "9999").localeCompare(b.deathDate || "9999") ||
            viSortCollator.compare(a.fullName, b.fullName)
        );

      return `
        <div class="py-3.5 px-2 ${isSelected ? "bg-[var(--background)] rounded-md" : ""}">
          <div class="flex items-start justify-between gap-2">
            <div>
              <button
                type="button"
                onclick="selectUnitInGraph(${escapeHtml(JSON.stringify(u.code))})"
                class="text-left font-semibold text-[var(--foreground)] hover:text-amber-400"
              >
                <span class="font-mono-num text-amber-400">${escapeHtml(u.code)}</span> — ${escapeHtml(u.name)}
              </button>
              <div class="text-sm text-[var(--muted-foreground)] mt-0.5">
                Phiên hiệu trên giấy báo tử: <strong class="font-mono-num text-[var(--foreground)]">${escapeHtml([...new Set([u.code, ...(u.alias ? u.alias.split(", ") : [])])].join(", "))}</strong>
              </div>
            </div>
            <span class="text-sm font-mono-num text-[var(--muted-foreground)] shrink-0">${linkedBattles.length} chiến dịch · ${unitMartyrs.length} hồ sơ</span>
          </div>
          <p class="text-sm text-[var(--muted-foreground)] mt-1.5 leading-relaxed">
            ${escapeHtml(u.historyNote || "")}
          </p>
          <div class="flex flex-wrap gap-1.5 mt-2">
            ${linkedBattles
              .map(
                (b) => `
              <button
                type="button"
                onclick="selectBattle('${b.id}', 'forces')"
                class="tap-target px-3 rounded text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]"
              >
                ${escapeHtml(b.name)} →
              </button>
            `
              )
              .join("")}
          </div>
          ${
            unitMartyrs.length > 0
              ? `
            <div class="mt-3 pt-2.5 border-t border-[var(--border)]/70">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <span class="text-sm font-medium text-[var(--muted-foreground)]">Liệt sĩ &amp; Tập thể cùng phiên hiệu (${unitMartyrs.length}):</span>
                <button type="button" onclick="filterMartyrsByUnit(${escapeHtml(JSON.stringify(u.code))})" class="tap-target inline-flex items-center px-2.5 rounded text-sm text-[var(--accent)] underline underline-offset-2">Lọc trên danh bạ Liệt sĩ →</button>
              </div>
              <div class="flex flex-wrap gap-1.5">
                ${unitMartyrs
                  .map(
                    (m) => `
                  <a href="#/liet-si/${encodeURIComponent(m.id)}" class="tap-target inline-flex items-center gap-1.5 px-3 rounded text-sm bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]">
                    <span class="font-medium">${escapeHtml(m.fullName)}</span>
                    <span class="font-mono-num text-[var(--muted-foreground)]">(${escapeHtml(formatLifeYears(m))})</span>
                  </a>`
                  )
                  .join("")}
              </div>
            </div>`
              : ""
          }
        </div>
      `;
    })
    .join("");
}

function selectUnitInGraph(unitCode) {
  state.selectedUnitCode = state.selectedUnitCode === unitCode ? null : unitCode;
  renderUnitDecoderList();
  drawUnitLineageCanvas();
}

// Interactive Unit-to-Battle Network Canvas Graph
const unitGraphCam = { zoom: 1, panX: 0, panY: 0, dragging: false, lastX: 0, lastY: 0 };
let unitGraphNodes = [];
let unitGraphEdges = [];

function initUnitLineageGraph() {
  const units = window.UNIT_DECODER_DICTIONARY || [];
  const battles = window.VIETNAM_WAR_BATTLES || [];
  unitGraphNodes = [];
  unitGraphEdges = [];

  units.forEach((u, idx) => {
    unitGraphNodes.push({
      id: `unit:${u.code}`,
      type: "unit",
      code: u.code,
      label: `${u.code} · ${u.name.replace(/^(Sư đoàn|Trung đoàn|Lữ đoàn|Tiểu đoàn|Đại đội)\s+/i, "")}`,
      x: 190,
      y: 28 + idx * 29
    });
  });

  battles.forEach((b, idx) => {
    unitGraphNodes.push({
      id: `battle:${b.id}`,
      type: "battle",
      battleId: b.id,
      label: b.name.replace(/^(Chiến dịch|Trận)\s+/i, ""),
      dateText: b.dateText,
      x: 610,
      y: 22 + idx * 22.5
    });
  });

  units.forEach((u) => {
    (u.battles || []).forEach((bid) => {
      unitGraphEdges.push({
        from: `unit:${u.code}`,
        to: `battle:${bid}`,
        unitCode: u.code,
        battleId: bid
      });
    });
  });
}

function zoomUnitGraph(factor) {
  unitGraphCam.zoom = Math.max(0.65, Math.min(2.2, unitGraphCam.zoom * factor));
  drawUnitLineageCanvas();
}

function resetUnitGraphCamera() {
  unitGraphCam.zoom = 1;
  unitGraphCam.panX = 0;
  unitGraphCam.panY = 0;
  state.selectedUnitCode = null;
  renderUnitDecoderList();
  drawUnitLineageCanvas();
}

function drawUnitLineageCanvas() {
  const canvas = document.getElementById("unit-lineage-canvas");
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);

  const pal = getCanvasPalette();
  ctx.fillStyle = pal.seaBgTop;
  ctx.fillRect(0, 0, rect.width, rect.height);

  ctx.translate(unitGraphCam.panX, unitGraphCam.panY);
  ctx.scale(unitGraphCam.zoom, unitGraphCam.zoom);

  const nodeMap = Object.fromEntries(unitGraphNodes.map((n) => [n.id, n]));

  // Draw edges
  unitGraphEdges.forEach((edge) => {
    const a = nodeMap[edge.from];
    const b = nodeMap[edge.to];
    if (!a || !b) return;
    const isHighlighted = !state.selectedUnitCode || state.selectedUnitCode === edge.unitCode;
    ctx.beginPath();
    ctx.moveTo(a.x + 125, a.y);
    ctx.bezierCurveTo(a.x + 250, a.y, b.x - 250, b.y, b.x - 135, b.y);
    ctx.strokeStyle = isHighlighted ? pal.edgeActive : pal.edgeIdle;
    ctx.lineWidth = isHighlighted && state.selectedUnitCode ? 2.2 : 1.2;
    ctx.stroke();
  });

  // Draw nodes (Minimum 12.5px font on canvas — E11)
  ctx.font = '600 13px "IBM Plex Sans", sans-serif';
  ctx.textBaseline = "middle";

  unitGraphNodes.forEach((n) => {
    const isUnit = n.type === "unit";
    const isSelected = isUnit && state.selectedUnitCode === n.code;
    const boxW = isUnit ? 250 : 270;
    const boxH = isUnit ? 24 : 20;
    const x0 = n.x - boxW / 2;
    const y0 = n.y - boxH / 2;

    ctx.fillStyle = isUnit ? pal.nodeUnitFill : pal.nodeBattleFill;
    ctx.strokeStyle = isSelected
      ? pal.islandTitle
      : isUnit
      ? pal.nodeUnitBorder
      : pal.nodeBattleBorder;
    ctx.lineWidth = isSelected ? 2.2 : 1.2;

    ctx.beginPath();
    ctx.roundRect(x0, y0, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = pal.labelText;
    const text = n.label.length > 32 ? n.label.slice(0, 31) + "…" : n.label;
    ctx.fillText(text, x0 + 10, n.y);
  });

  ctx.restore();
}

// ============================================================================
// CALM MEMORIAL VECTOR MAP & LABEL-FREE LEAFLET FALLBACK (E5, E10, E11, E14, E16)
// ============================================================================

const mapCam = {
  centerLat: 16.2,
  centerLng: 107.5,
  zoom: 1.0,
  dragging: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  moved: false
};

let renderedPinHitboxes = [];

function projectLatLng(lat, lng, width, height) {
  const scale = Math.min(width / 13.5, height / 16.5) * mapCam.zoom;
  const x = width * 0.46 + (lng - mapCam.centerLng) * scale * 0.94;
  const y = height * 0.50 - (lat - mapCam.centerLat) * scale;
  return { x, y, scale };
}

function setMapPinMode(mode) {
  const validModes = ["both", "battles-only", "cemeteries", "letters"];
  state.mapPinMode = validModes.includes(mode) ? mode : "both";
  const radioMap = [
    { id: "mpm-both", val: "both" },
    { id: "mpm-battles-only", val: "battles-only" },
    { id: "mpm-cemeteries", val: "cemeteries" },
    { id: "mpm-letters", val: "letters" }
  ];
  radioMap.forEach(({ id, val }) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const active = state.mapPinMode === val;
    btn.setAttribute("aria-checked", active ? "true" : "false");
    btn.className = active
      ? "w-full text-left px-2.5 py-2 rounded-md text-sm font-medium bg-[var(--background)] text-[var(--foreground)]"
      : "w-full text-left px-2.5 py-2 rounded-md text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]";
  });
  toggleMapLayersMenu(false);
  renderBattleStrip();
  renderMapPanel();
  drawVietnamCanvasMap();
  updateLeafletMarkers();
}

function setMapEngine(engine) {
  state.mapEngine = engine === "leaflet" ? "leaflet" : "vector";
  const vecBtn = document.getElementById("map-engine-vector");
  const leafBtn = document.getElementById("map-engine-leaflet");
  const canvas = document.getElementById("vietnam-atlas-canvas");
  const leafContainer = document.getElementById("leaflet-map-container");

  if (vecBtn && leafBtn) {
    const isVec = state.mapEngine === "vector";
    vecBtn.setAttribute("aria-checked", isVec ? "true" : "false");
    leafBtn.setAttribute("aria-checked", !isVec ? "true" : "false");
    vecBtn.className = isVec
      ? "w-full text-left px-2.5 py-2 rounded-md text-sm font-medium bg-[var(--background)] text-[var(--foreground)]"
      : "w-full text-left px-2.5 py-2 rounded-md text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]";
    leafBtn.className = !isVec
      ? "w-full text-left px-2.5 py-2 rounded-md text-sm font-medium bg-[var(--background)] text-[var(--foreground)]"
      : "w-full text-left px-2.5 py-2 rounded-md text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]";
  }

  toggleMapLayersMenu(false);

  if (state.mapEngine === "leaflet") {
    if (leafContainer) leafContainer.classList.remove("hidden");
    initLeafletMap();
    updateLeafletMarkers();
  } else {
    if (leafContainer) leafContainer.classList.add("hidden");
    if (canvas) canvas.classList.remove("hidden");
    drawVietnamCanvasMap();
  }
}

function zoomMapBy(factor) {
  if (state.mapEngine === "leaflet" && leafletMap) {
    if (factor > 1) leafletMap.zoomIn();
    else leafletMap.zoomOut();
    return;
  }
  mapCam.zoom = Math.max(0.85, Math.min(4.2, mapCam.zoom * factor));
  drawVietnamCanvasMap();
}

function flyToTheatre(presetId) {
  const presets = window.THEATRE_CAMERA_PRESETS || {};
  const p = presets[presetId] || presets.ALL_VN || { centerLat: 16.2, centerLng: 107.5, zoom: 1.0 };
  mapCam.centerLat = p.centerLat;
  mapCam.centerLng = p.centerLng;
  mapCam.zoom = p.zoom;
  drawVietnamCanvasMap();

  if (state.mapEngine === "leaflet" && leafletMap) {
    const leafZoom = Math.round(5 + Math.log2(p.zoom || 1) * 1.6);
    leafletMap.flyTo([p.centerLat, p.centerLng], leafZoom, { duration: 0.6 });
  }
}

// ----------------------------------------------------------------------------
// 6D helpers: chronological battle numbers shared by the map and the strip,
// marker sizes, merging of close markers, label boxes and the cluster list.
// 6A helpers: the 200px phone locator map.
// ----------------------------------------------------------------------------
const MAP_MERGE_DISTANCE = 28; // markers closer than this (screen px) merge into a count marker
const MAP_HIT_RADIUS = 22; // invisible 44px hit area around every marker
const MAP_LOCATOR_ZOOM = 2.0;
let battleNumberCache = { source: null, length: 0, map: new Map() };
let mapClusterPopoverState = null; // { camKey } of the open cluster list
let lastMapLayoutKey = "";
let mapCamBeforeFullView = null; // camera to restore when the phone full map closes
let lastMapLabelLayout = null; // last drawn label boxes (canvas px), for layout checks

function isPhoneMapWidth() {
  return window.matchMedia ? window.matchMedia("(max-width: 767px)").matches : window.innerWidth < 768;
}

function getBattleYear(b) {
  if (!b) return "";
  if (b.year) return String(b.year);
  const m = (b.dateText || "").match(/\b(19\d{2})\b/);
  return m ? m[1] : "";
}

function getBattleShortName(b) {
  return String((b && b.name) || "").replace(/^(Chiến dịch|Trận)\s+/i, "");
}

// Date order: year, then id (the order the data file and the strip use).
function sortBattlesChronologically(list) {
  return [...(list || [])].sort((a, b) => {
    const ya = Number(getBattleYear(a)) || 0;
    const yb = Number(getBattleYear(b)) || 0;
    if (ya !== yb) return ya - yb;
    return String(a.id).localeCompare(String(b.id));
  });
}

// Numbers 1–N over ALL battles, so a filtered map keeps the same numbers as the strip.
function getBattleNumber(battleId) {
  const all = window.VIETNAM_WAR_BATTLES || [];
  if (battleNumberCache.source !== all || battleNumberCache.length !== all.length) {
    const map = new Map();
    sortBattlesChronologically(all).forEach((b, i) => map.set(b.id, i + 1));
    battleNumberCache = { source: all, length: all.length, map };
  }
  return battleNumberCache.map.get(battleId) || 0;
}

// Map name: the short name without its subtitle (" — …") or a trailing "(…)" note.
function getBattleMapLabel(b) {
  const short = getBattleShortName(b);
  const cut = short.split(/\s+—\s+/)[0].replace(/\s*\([^)]*\)\s*$/, "").trim();
  return cut || short;
}

function getBattleAccessibleName(b) {
  const year = getBattleYear(b);
  return `Trận ${getBattleNumber(b.id)}: ${getBattleShortName(b)}${year ? `, ${year}` : ""}`;
}

function getMarkerRadius() {
  return isPhoneMapWidth() ? 16 : 14; // 32px on phones, 28px on desktop
}

function hexToRgbChannels(hex) {
  const h = String(hex).replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(full.substr(i, 2), 16) / 255);
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgbChannels(hex).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// Number colour on a marker fill: whichever of white / near-black contrasts more (>= 5:1 for every pin fill).
function pickMarkerTextColor(fillHex) {
  const light = "#ffffff";
  const dark = "#0b1120";
  return contrastRatio(fillHex, light) >= contrastRatio(fillHex, dark) ? light : dark;
}

function getBattleMarkerFill(b, pal) {
  if (state.selectedBattleId === b.id) return pal.pinSelected;
  return (b.martyrs || []).some((m) => m.hasLetter) ? pal.pinLetter : pal.pinDefault;
}

// Agglomerative merge: repeatedly join the two closest groups (centroid distance < minDist).
// points: [{ battle, x, y }] → groups: [{ x, y, members: [battle…] }]
function clusterMapPoints(points, minDist) {
  let groups = points.map((p) => ({ x: p.x, y: p.y, members: [p.battle] }));
  for (;;) {
    let best = null;
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const d = Math.hypot(groups[i].x - groups[j].x, groups[i].y - groups[j].y);
        if (d < minDist && (!best || d < best.d)) best = { i, j, d };
      }
    }
    if (!best) break;
    const a = groups[best.i];
    const b = groups[best.j];
    const n = a.members.length + b.members.length;
    const merged = {
      x: (a.x * a.members.length + b.x * b.members.length) / n,
      y: (a.y * a.members.length + b.y * b.members.length) / n,
      members: [...a.members, ...b.members]
    };
    groups = groups.filter((_, k) => k !== best.i && k !== best.j);
    groups.push(merged);
  }
  groups.forEach((g) => g.members.sort((p, q) => getBattleNumber(p.id) - getBattleNumber(q.id)));
  return groups;
}

// The selected marker stays its own marker; a neighbour group under it is nudged out to the merge distance.
function nudgeGroupsFromSelected(groups, sel, minDist) {
  if (!sel) return;
  groups.forEach((g) => {
    const dx = g.x - sel.x;
    const dy = g.y - sel.y;
    const d = Math.hypot(dx, dy);
    if (d >= minDist) return;
    const ux = d > 0.5 ? dx / d : -0.7071;
    const uy = d > 0.5 ? dy / d : 0.7071;
    g.x = sel.x + ux * (minDist + 2);
    g.y = sel.y + uy * (minDist + 2);
  });
}

function mapBoxesOverlap(a, b, pad = 3) {
  return !(a.x + a.w + pad <= b.x || a.x >= b.x + b.w + pad || a.y + a.h + pad <= b.y || a.y >= b.y + b.h + pad);
}

// Boxes (canvas px) of the visible DOM controls drawn over the map ([data-map-control]).
function getMapControlBoxes(canvas) {
  const wrap = document.getElementById("map-canvas-wrap");
  if (!wrap || !canvas) return [];
  const cr = canvas.getBoundingClientRect();
  return [...wrap.querySelectorAll("[data-map-control]")]
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => ({ x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height }));
}

// A selected battle or an open cemetery panel both put the map in "something selected" mode.
function getMapFocusedCemetery() {
  if (state.selectedBattleId || !state.focusedCemeteryId) return null;
  const list = window.CEMETERIES_LIST || window.CEMETERIES_DATA || [];
  return list.find((c) => c.id === state.focusedCemeteryId) || null;
}

function hasMapSelection() {
  return state.activeMainView === "ban-do" && !!(state.selectedBattleId || getMapFocusedCemetery());
}

function isMapLocatorMode() {
  return (
    hasMapSelection() &&
    state.mapFullView !== true &&
    isPhoneMapWidth()
  );
}

// 6A: toggles the phone locator / "battle selected" layout classes before the canvas is measured.
function syncMapLayoutMode() {
  const col = document.getElementById("map-col");
  const canvas = document.getElementById("vietnam-atlas-canvas");
  const locator = isMapLocatorMode();
  const hasSelection = hasMapSelection();
  if (col) {
    col.classList.toggle("map-has-selection", hasSelection);
    col.classList.toggle("map-locator", locator);
  }
  if (canvas) {
    if (locator) {
      canvas.setAttribute("tabindex", "-1");
      canvas.setAttribute("aria-hidden", "true");
    } else {
      canvas.setAttribute("tabindex", "0");
      canvas.removeAttribute("aria-hidden");
    }
  }
  if (locator) closeMapClusterPopover(false);
  const fullView = state.mapFullView === true && hasSelection;
  const key = `${hasSelection}|${locator}|${fullView}|${state.selectedBattleId || state.focusedCemeteryId || ""}`;
  if (key !== lastMapLayoutKey) {
    lastMapLayoutKey = key;
    // "Mở bản đồ" (6A): the full map opens on the selected battle / cemetery.
    if (!fullView && mapCamBeforeFullView) {
      Object.assign(mapCam, mapCamBeforeFullView);
      mapCamBeforeFullView = null;
    }
    if (fullView) {
      if (!mapCamBeforeFullView) {
        mapCamBeforeFullView = { centerLat: mapCam.centerLat, centerLng: mapCam.centerLng, zoom: mapCam.zoom };
      }
      const b = state.selectedBattleId ? (window.VIETNAM_WAR_BATTLES || []).find((x) => x.id === state.selectedBattleId) : null;
      const c = b ? null : getMapFocusedCemetery();
      if (b || c) {
        mapCam.centerLat = b ? b.coordinates.lat : Number(c.lat);
        mapCam.centerLng = b ? b.coordinates.lng : Number(c.lng);
        mapCam.zoom = Math.max(mapCam.zoom, 1.4);
      }
    }
    if (leafletMap && state.mapEngine === "leaflet") {
      setTimeout(() => leafletMap.invalidateSize(), 60);
    }
  }
  return locator;
}

function openFullMapFromLocator() {
  if (state.selectedBattleId) {
    location.hash = "#/ban-do/" + state.selectedBattleId + "/ban-do";
  } else if (state.focusedCemeteryId) {
    location.hash = "#/ban-do/nghia-trang/" + encodeURIComponent(state.focusedCemeteryId) + "/ban-do";
  }
}

function closeMapClusterPopover(restoreFocus = false) {
  const pop = document.getElementById("map-cluster-popover");
  const wasOpen = !!(pop && !pop.hidden);
  if (pop) {
    pop.hidden = true;
    pop.innerHTML = "";
  }
  mapClusterPopoverState = null;
  if (wasOpen && restoreFocus) {
    const target =
      state.mapEngine === "leaflet" && leafletMap
        ? document.getElementById("leaflet-map-container")
        : document.getElementById("vietnam-atlas-canvas");
    target?.focus({ preventScroll: true });
  }
}

// 6D: the list behind a count marker, anchored next to it (x, y in map-wrap px).
function openMapClusterPopover(members, x, y) {
  const wrap = document.getElementById("map-canvas-wrap");
  if (!wrap || !members || !members.length) return;
  let pop = document.getElementById("map-cluster-popover");
  if (!pop) {
    pop = document.createElement("div");
    pop.id = "map-cluster-popover";
    pop.className = "map-cluster-popover";
    pop.setAttribute("role", "dialog");
    pop.hidden = true;
    pop.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeMapClusterPopover(true);
      }
    });
    pop.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-battle-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-battle-id");
      closeMapClusterPopover(false);
      selectBattle(id, "overview");
    });
    wrap.appendChild(pop);
  }
  const titleId = "map-cluster-popover-title";
  pop.setAttribute("aria-labelledby", titleId);
  pop.innerHTML = `
    <p id="${titleId}" class="map-cluster-popover-title">${members.length} trận ở gần nhau</p>
    <ul class="map-cluster-popover-list">
      ${members
        .map(
          (b) => `<li><button type="button" data-battle-id="${escapeHtml(b.id)}" aria-label="${escapeHtml(getBattleAccessibleName(b))}">
            <span class="map-strip-num" aria-hidden="true">${getBattleNumber(b.id)}</span>
            <span class="map-cluster-popover-name">${escapeHtml(getBattleShortName(b))}</span>
            <span class="map-cluster-popover-year font-mono-num">${escapeHtml(getBattleYear(b))}</span>
          </button></li>`
        )
        .join("")}
    </ul>`;
  pop.hidden = false;
  const W = wrap.clientWidth;
  const H = wrap.clientHeight;
  pop.style.maxHeight = `${Math.max(120, H - 16)}px`;
  const pw = pop.offsetWidth;
  const ph = pop.offsetHeight;
  let left = x + 24;
  if (left + pw > W - 8) left = x - 24 - pw;
  left = Math.max(8, Math.min(left, W - pw - 8));
  const top = Math.max(8, Math.min(y - ph / 2, H - ph - 8));
  pop.style.left = `${Math.round(left)}px`;
  pop.style.top = `${Math.round(top)}px`;
  mapClusterPopoverState = {
    camKey: state.mapEngine === "leaflet" ? "leaflet" : `${mapCam.centerLat}|${mapCam.centerLng}|${mapCam.zoom}|${W}|${H}`
  };
  pop.querySelector("button")?.focus({ preventScroll: true });
}

function drawVietnamCanvasMap() {
  const canvas = document.getElementById("vietnam-atlas-canvas");
  if (!canvas) return;
  const locator = syncMapLayoutMode();
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const selectedBattle = state.selectedBattleId
    ? (window.VIETNAM_WAR_BATTLES || []).find((b) => b.id === state.selectedBattleId) || null
    : null;

  // Close the cluster list once the camera or the map size has moved under it.
  if (mapClusterPopoverState && mapClusterPopoverState.camKey !== "leaflet") {
    const key = `${mapCam.centerLat}|${mapCam.centerLng}|${mapCam.zoom}|${Math.round(rect.width)}|${Math.round(rect.height)}`;
    if (key !== mapClusterPopoverState.camKey) closeMapClusterPopover(false);
  }

  // 6A: the locator frames the selected battle with its own camera; the full map's camera is restored after.
  const savedCam = { centerLat: mapCam.centerLat, centerLng: mapCam.centerLng, zoom: mapCam.zoom };
  const focusedCemetery = getMapFocusedCemetery();
  if (locator && (selectedBattle || focusedCemetery)) {
    mapCam.centerLat = selectedBattle ? selectedBattle.coordinates.lat : Number(focusedCemetery.lat);
    mapCam.centerLng = selectedBattle ? selectedBattle.coordinates.lng : Number(focusedCemetery.lng);
    mapCam.zoom = MAP_LOCATOR_ZOOM;
  }
  try {
    drawVietnamCanvasMapFrame(canvas, rect, locator, selectedBattle, focusedCemetery);
  } finally {
    mapCam.centerLat = savedCam.centerLat;
    mapCam.centerLng = savedCam.centerLng;
    mapCam.zoom = savedCam.zoom;
  }
}

function drawVietnamCanvasMapFrame(canvas, rect, locator, selectedBattle, focusedCemetery) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  const pal = getCanvasPalette();
  const geo = window.VIETNAM_GEO_OUTLINE || {};
  const markerR = getMarkerRadius();
  const strokeOnPin = state.theme === "light" ? "#ffffff" : "#090d16";
  const inFrame = (pt, m = 0) => pt.x >= -m && pt.x <= W + m && pt.y >= -m && pt.y <= H + m;
  const clampBox = (b) => ({
    x: Math.max(6, Math.min(b.x, W - b.w - 6)),
    y: Math.max(6, Math.min(b.y, H - b.h - 6)),
    w: b.w,
    h: b.h
  });

  // Collision list (6D): sovereignty labels go in FIRST, then the DOM controls, then everything else.
  const placedBoxes = [];
  const controlBoxes = getMapControlBoxes(canvas);
  const hitsPlaced = (box) => placedBoxes.some((o) => mapBoxesOverlap(box, o));

  // A. Marker positions (needed before the sovereignty labels so those can step around markers).
  const battles = locator ? (selectedBattle ? [selectedBattle] : []) : sortBattlesChronologically(getFilteredBattles());
  const battlePoints = battles.map((b) => ({ battle: b, ...projectLatLng(b.coordinates.lat, b.coordinates.lng, W, H) }));
  const selectedPoint = battlePoints.find((p) => p.battle.id === state.selectedBattleId) || null;
  const groups = clusterMapPoints(
    battlePoints.filter((p) => p !== selectedPoint && inFrame(p, markerR + 4)),
    MAP_MERGE_DISTANCE
  );
  nudgeGroupsFromSelected(groups, selectedPoint, MAP_MERGE_DISTANCE);
  if (selectedPoint) groups.push({ x: selectedPoint.x, y: selectedPoint.y, members: [selectedPoint.battle], isSelected: true });
  groups.forEach((g) => (g.key = g.members.map((b) => b.id).join(",")));
  const markerBoxes = groups.map((g) => ({ x: g.x - markerR - 2, y: g.y - markerR - 2, w: 2 * markerR + 4, h: 2 * markerR + 4 }));

  // B. Reserve the sovereignty labels (one label each, one or two lines, never shortened).
  const sovereignLabels = [];
  (geo.islands || [])
    .filter((isl) => isl.isSovereignArchipelago)
    .forEach((isl) => {
      const corners = (isl.boundsPolygon && isl.boundsPolygon.length ? isl.boundsPolygon : [[isl.lat, isl.lng]]).map(
        ([lat, lng]) => projectLatLng(lat, lng, W, H)
      );
      const bx0 = Math.min(...corners.map((c) => c.x));
      const bx1 = Math.max(...corners.map((c) => c.x));
      const by0 = Math.min(...corners.map((c) => c.y));
      const by1 = Math.max(...corners.map((c) => c.y));
      if (bx1 < 0 || bx0 > W || by1 < 0 || by0 > H) return; // archipelago out of frame
      const anchor = projectLatLng(isl.lat, isl.lng, W, H);
      // Drawn when the archipelago itself is in frame: its centre or one of its islands.
      const dots = (isl.clusters || []).map((c) => projectLatLng(c.lat, c.lng, W, H));
      if (!inFrame(anchor) && dots.filter((d) => inFrame(d)).length < 2) return;
      const titleFont = '600 13px "IBM Plex Sans", sans-serif';
      const subFont = '500 12.5px "IBM Plex Sans", sans-serif';
      ctx.font = titleFont;
      const fullW = ctx.measureText(isl.name).width;
      let lines;
      if (fullW + 20 <= W - 12 && W >= 500) {
        lines = [{ text: isl.name, font: titleFont, color: pal.islandTitle }];
        if (isl.subLabel && !locator) lines.push({ text: isl.subLabel, font: subFont, color: pal.islandSub });
      } else {
        const base = isl.name.replace(/\s*\(Việt Nam\)\s*$/, "");
        lines = [
          { text: base, font: titleFont, color: pal.islandTitle },
          { text: "(Việt Nam)", font: titleFont, color: pal.islandTitle }
        ];
      }
      const textW = Math.max(
        ...lines.map((l) => {
          ctx.font = l.font;
          return ctx.measureText(l.text).width;
        })
      );
      const w = Math.ceil(textW + 16);
      const h = lines.length * 17 + 8;
      const cx = (bx0 + bx1) / 2;
      const cy = (by0 + by1) / 2;
      const candidates = [
        { x: anchor.x - w / 2, y: by0 - h - 4 },
        { x: cx - w / 2, y: cy - h / 2 },
        { x: anchor.x - w / 2, y: by1 + 4 },
        { x: bx1 + 6, y: cy - h / 2 },
        { x: bx0 - 6 - w, y: cy - h / 2 },
        { x: bx0 - 6 - w, y: by0 - h - 4 },
        { x: bx0 - 6 - w, y: by1 + 4 },
        // last resort: scan the whole frame height, nearest to the archipelago first
        ...Array.from({ length: Math.max(0, Math.floor((H - h - 12) / 8)) + 1 }, (_, i) => 6 + i * 8)
          .sort((a, b) => Math.abs(a + h / 2 - cy) - Math.abs(b + h / 2 - cy))
          .flatMap((y) => [
            { x: anchor.x - w / 2, y },
            { x: bx0 - 6 - w, y },
            { x: W - w - 6, y },
            { x: 6, y }
          ])
      ].map((c) => clampBox({ x: c.x, y: c.y, w, h }));
      const hard = (b) =>
        controlBoxes.some((o) => mapBoxesOverlap(b, o, 4)) || sovereignLabels.some((s) => mapBoxesOverlap(b, s.box, 4));
      // On the locator, keep the selected marker's row free for its name.
      const nameBand = locator && (selectedPoint || focusedCemetery) ? [{ x: 0, y: H / 2 - 22, w: W, h: 44 }] : [];
      const soft = (b) => [...markerBoxes, ...nameBand].some((o) => mapBoxesOverlap(b, o, 0));
      // Stay next to the archipelago: step around markers only within ~130px of it.
      // Distance from a box to the part of the archipelago that is in frame.
      const ax = Math.max(0, Math.min(cx, W));
      const ay = Math.max(0, Math.min(cy, H));
      const dist = (b) => Math.hypot(b.x + b.w / 2 - ax, b.y + b.h / 2 - ay);
      const nearest = (list) => list.reduce((best, b) => (!best || dist(b) < dist(best) ? b : best), null);
      const near = (b) => Math.abs(b.y + b.h / 2 - cy) <= 130 && Math.abs(b.x + b.w / 2 - cx) <= 200;
      const box =
        candidates.find((b) => !hard(b) && !soft(b) && near(b)) ||
        nearest(candidates.filter((b) => !hard(b) && !soft(b) && dist(b) <= 160)) ||
        nearest(candidates.filter((b) => !hard(b))) ||
        candidates[0];
      sovereignLabels.push({ isl, box, lines });
    });
  sovereignLabels.forEach((s) => placedBoxes.push(s.box));
  controlBoxes.forEach((b) => placedBoxes.push(b));

  // 1. Calm Sea Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, pal.seaBgTop);
  bgGrad.addColorStop(1, pal.seaBgBottom);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Subtle Latitude/Longitude Reference Grid
  ctx.strokeStyle = pal.gridLine;
  ctx.lineWidth = 1;
  for (let lat = 8; lat <= 24; lat += 2) {
    const p1 = projectLatLng(lat, 102, W, H);
    const p2 = projectLatLng(lat, 116, W, H);
    ctx.beginPath();
    ctx.moveTo(0, p1.y);
    ctx.lineTo(W, p2.y);
    ctx.stroke();
  }
  for (let lng = 102; lng <= 116; lng += 2) {
    const p1 = projectLatLng(24, lng, W, H);
    const p2 = projectLatLng(8, lng, W, H);
    ctx.beginPath();
    ctx.moveTo(p1.x, 0);
    ctx.lineTo(p2.x, H);
    ctx.stroke();
  }

  // 3. Mainland Vietnam Polygon
  const mainland = geo.mainland || [];
  if (mainland.length > 2) {
    ctx.beginPath();
    mainland.forEach(([lat, lng], idx) => {
      const pt = projectLatLng(lat, lng, W, H);
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.fillStyle = pal.landFill;
    ctx.fill();
    ctx.strokeStyle = pal.landStroke;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // 4. Military Zones (Subtle Historical Regions)
  (geo.militaryZones || []).forEach((zone) => {
    if (!zone.polygon || zone.polygon.length < 3) return;
    ctx.beginPath();
    zone.polygon.forEach(([lat, lng], i) => {
      const pt = projectLatLng(lat, lng, W, H);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.fillStyle = zone.fillColor || "rgba(148, 163, 184, 0.08)";
    ctx.fill();
  });

  // 5. Đường Trường Sơn (Ho Chi Minh Trail)
  const trail = geo.truongSonTrail || [];
  if (trail.length > 1) {
    ctx.save();
    ctx.beginPath();
    trail.forEach(([lat, lng], idx) => {
      const pt = projectLatLng(lat, lng, W, H);
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = pal.truongSonStroke;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  }

  // 6. Vĩ tuyến 17 (DMZ Bến Hải)
  const dmz = geo.dmzLine || [];
  if (dmz.length === 2) {
    const pA = projectLatLng(dmz[0][0], dmz[0][1], W, H);
    const pB = projectLatLng(dmz[1][0], dmz[1][1], W, H);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = pal.dmzStroke;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.font = '600 12.5px "IBM Plex Mono", monospace';
    ctx.fillStyle = pal.dmzText;
    const dmzText = "Vĩ tuyến 17 · Sông Bến Hải";
    const dmzBox = { x: pB.x + 8, y: pB.y - 10, w: ctx.measureText(dmzText).width, h: 18 };
    if (!locator && W >= 500 && !hitsPlaced(dmzBox)) {
      placedBoxes.push(dmzBox);
      ctx.fillText(dmzText, pB.x + 8, pB.y + 4);
    }
    ctx.restore();
  }

  // 7. Islands. Sovereign archipelagos: dashed area + island dots here, their labels last (step 10).
  (geo.islands || []).forEach((isl) => {
    const pt = projectLatLng(isl.lat, isl.lng, W, H);
    if (isl.isSovereignArchipelago && Array.isArray(isl.clusters)) {
      ctx.save();
      if (isl.boundsPolygon) {
        ctx.beginPath();
        isl.boundsPolygon.forEach(([lat, lng], idx) => {
          const bpt = projectLatLng(lat, lng, W, H);
          if (idx === 0) ctx.moveTo(bpt.x, bpt.y);
          else ctx.lineTo(bpt.x, bpt.y);
        });
        ctx.closePath();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = pal.islandStroke;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }
      isl.clusters.forEach((c) => {
        const cpt = projectLatLng(c.lat, c.lng, W, H);
        ctx.beginPath();
        ctx.arc(cpt.x, cpt.y, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = pal.islandTitle;
        ctx.fill();
      });
      ctx.restore();
    } else {
      if (!inFrame(pt)) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = pal.islandFill;
      ctx.fill();
      if (!locator) {
        // Island names step aside from (or give way to) the sovereignty labels and controls.
        ctx.font = '500 12.5px "IBM Plex Sans", sans-serif';
        const tw = ctx.measureText(isl.name).width;
        const options = [
          { x: pt.x + 6, y: pt.y - 9, w: tw, h: 17 },
          { x: pt.x - 6 - tw, y: pt.y - 9, w: tw, h: 17 },
          { x: pt.x - tw / 2, y: pt.y + 6, w: tw, h: 17 }
        ];
        const spot = options.find(
          (b) =>
            b.x >= 4 && b.x + b.w <= W - 4 && b.y >= 4 && b.y + b.h <= H - 4 &&
            !hitsPlaced(b) && !markerBoxes.some((o) => mapBoxesOverlap(b, o, 0))
        );
        if (spot) {
          placedBoxes.push(spot);
          ctx.fillStyle = pal.mutedText;
          ctx.textBaseline = "middle";
          ctx.fillText(isl.name, spot.x, spot.y + spot.h / 2);
        }
      }
      ctx.restore();
    }
  });

  // 8. National Cemetery Diamond Markers (on the locator: only the open cemetery)
  let cemeteriesOnMap = locator ? (focusedCemetery ? [focusedCemetery] : []) : getFilteredCemeteriesForMap();
  if (!locator && focusedCemetery && !cemeteriesOnMap.includes(focusedCemetery)) cemeteriesOnMap = [...cemeteriesOnMap, focusedCemetery];
  renderedPinHitboxes = [];
  const cemFill = state.theme === "light" ? "#047857" : "#34d399";
  cemeteriesOnMap.forEach((c) => {
    const pt = projectLatLng(Number(c.lat), Number(c.lng), W, H);
    const isHov = state.hoveredCemeteryId === c.id || (focusedCemetery && focusedCemetery.id === c.id);
    const d = isHov ? 7.2 : 5.6;
    renderedPinHitboxes.push({ id: c.id, kind: "cemetery", x: pt.x, y: pt.y, r: 15, cemetery: c });

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y - d);
    ctx.lineTo(pt.x + d, pt.y);
    ctx.lineTo(pt.x, pt.y + d);
    ctx.lineTo(pt.x - d, pt.y);
    ctx.closePath();
    ctx.fillStyle = cemFill;
    ctx.fill();
    ctx.lineWidth = isHov ? 2.2 : 1.4;
    ctx.strokeStyle = strokeOnPin;
    ctx.stroke();
    ctx.restore();
  });

  // 9. Numbered battle markers and count markers (6D). Selected / hovered drawn on top.
  const hoveredInGroup = (g) => g.members.some((b) => b.id === state.hoveredBattleId);
  const drawOrder = [...groups].sort((a, b) => {
    const rank = (g) => (g.isSelected ? 2 : hoveredInGroup(g) || g.key === state.hoveredClusterKey ? 1 : 0);
    return rank(a) - rank(b);
  });
  const numFont = `600 ${markerR >= 16 ? 14 : 13}px "IBM Plex Mono", monospace`;
  drawOrder.forEach((g) => {
    const isCluster = g.members.length > 1;
    const isHot = g.isSelected || hoveredInGroup(g) || state.hoveredClusterKey === g.key;
    if (isCluster) {
      renderedPinHitboxes.push({ id: g.key, kind: "cluster", x: g.x, y: g.y, r: MAP_HIT_RADIUS, members: g.members });
    } else {
      renderedPinHitboxes.push({ id: g.members[0].id, kind: "battle", x: g.x, y: g.y, r: MAP_HIT_RADIUS, battle: g.members[0] });
    }

    if (isHot || isCluster) {
      ctx.beginPath();
      ctx.arc(g.x, g.y, markerR + (isHot ? 6 : 4), 0, Math.PI * 2);
      ctx.fillStyle = pal.pinRing;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(g.x, g.y, markerR, 0, Math.PI * 2);
    let fill;
    let textColor;
    if (isCluster) {
      ctx.fillStyle = pal.labelBg;
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = pal.pinDefault;
      ctx.stroke();
      textColor = pal.labelText;
    } else {
      fill = getBattleMarkerFill(g.members[0], pal);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = g.isSelected ? 2.6 : 1.6;
      ctx.strokeStyle = g.isSelected ? pal.islandTitle : strokeOnPin;
      ctx.stroke();
      textColor = pickMarkerTextColor(fill);
    }
    ctx.font = numFont;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(isCluster ? g.members.length : getBattleNumber(g.members[0].id)), g.x, g.y + 0.5);
  });
  ctx.textAlign = "left";

  // Markers are obstacles for names drawn after them.
  groups.forEach((g) => placedBoxes.push({ x: g.x - markerR, y: g.y - markerR, w: 2 * markerR, h: 2 * markerR }));

  // 9b. Cemetery labels (Nghĩa trang layer, or the hovered cemetery)
  // The open cemetery (cemetery panel) keeps its name, like a selected battle.
  if (focusedCemetery || (!locator && (state.mapPinMode === "cemeteries" || state.hoveredCemeteryId))) {
    ctx.font = '600 12.5px "IBM Plex Sans", sans-serif';
    const ordered = focusedCemetery
      ? [focusedCemetery, ...cemeteriesOnMap.filter((c) => c !== focusedCemetery)]
      : cemeteriesOnMap;
    ordered.forEach((c) => {
      const isFocused = !!focusedCemetery && focusedCemetery.id === c.id;
      const isHov = state.hoveredCemeteryId === c.id || isFocused;
      if (locator && !isFocused) return;
      if (state.mapPinMode !== "cemeteries" && !isHov) return;
      const pt = projectLatLng(Number(c.lat), Number(c.lng), W, H);
      if (pt.x < 10 || pt.x > W - 10 || pt.y < 10 || pt.y > H - 10) return;
      if (W < 500 && !isHov) return;
      const shortName = c.short_name || c.name;
      const boxW = ctx.measureText(shortName).width + 14;
      const boxH = 22;
      const reserved = [...sovereignLabels.map((s) => s.box), ...controlBoxes];
      const box = [
        { x: pt.x + 10, y: pt.y - boxH / 2 },
        { x: pt.x - 10 - boxW, y: pt.y - boxH / 2 },
        { x: pt.x - boxW / 2, y: pt.y - 12 - boxH },
        { x: pt.x - boxW / 2, y: pt.y + 12 }
      ]
        .map((o) => clampBox({ x: o.x, y: o.y, w: boxW, h: boxH }))
        .find(
          (o) =>
            !mapBoxesOverlap(o, { x: pt.x - 8, y: pt.y - 8, w: 16, h: 16 }, 1) &&
            (isHov ? !reserved.some((r) => mapBoxesOverlap(o, r)) : !hitsPlaced(o))
        );
      if (!box) return;
      placedBoxes.push(box);
      ctx.fillStyle = pal.labelBg;
      ctx.strokeStyle = cemFill;
      ctx.lineWidth = isHov ? 1.8 : 1;
      ctx.beginPath();
      ctx.roundRect(box.x, box.y, box.w, box.h, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = pal.labelText;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(shortName, box.x + 7, box.y + box.h / 2);
    });
  }

  // 9c. One battle name at a time (6D): the selected battle's, plus the hovered / focused one on desktop.
  const namedIds = [];
  const drawnNames = [];
  if (state.selectedBattleId) namedIds.push(state.selectedBattleId);
  if (!locator && state.hoveredBattleId && state.hoveredBattleId !== state.selectedBattleId) namedIds.push(state.hoveredBattleId);
  ctx.font = '600 12.5px "IBM Plex Sans", sans-serif';
  namedIds.forEach((id) => {
    const g = groups.find((gr) => gr.members.some((b) => b.id === id));
    if (!g || !inFrame(g)) return;
    const b = g.members.find((m) => m.id === id);
    const isSelected = id === state.selectedBattleId;
    const shortName = getBattleMapLabel(b);
    // Long names wrap (2 lines, then 3 narrower lines if that is what it takes to find a free spot).
    const wrapName = (maxW, maxLines) => {
      const lines = [];
      let rest = shortName;
      while (rest && lines.length < maxLines) {
        if (ctx.measureText(rest).width <= maxW) {
          lines.push(rest);
          rest = "";
          break;
        }
        const words = rest.split(" ");
        let line = words.shift();
        while (words.length && ctx.measureText(line + " " + words[0]).width <= maxW) line += " " + words.shift();
        if (lines.length === maxLines - 1 && words.length) {
          line = rest;
          while (ctx.measureText(line + "…").width > maxW && line.length > 1) line = line.slice(0, -1).trimEnd();
          line += "…";
          rest = "";
        } else {
          rest = words.join(" ");
        }
        lines.push(line);
      }
      return lines;
    };
    const gap = markerR + 6;
    const own = { x: g.x - markerR, y: g.y - markerR, w: 2 * markerR, h: 2 * markerR };
    // Never over a sovereignty label or a control: if every spot touches one, the name is not drawn.
    const reserved = [...sovereignLabels.map((s) => s.box), ...controlBoxes];
    let box = null;
    let fallback = null;
    let nameLines = [];
    for (const [maxW, maxLines] of [
      [Math.max(140, Math.min(300, W * 0.62)), 2],
      [Math.max(120, Math.min(220, W * 0.46)), 3]
    ]) {
      const lines = wrapName(maxW, maxLines);
      const boxW = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 14;
      const boxH = lines.length * 16 + 8;
      const candidates = [
        { x: g.x + gap, y: g.y - boxH / 2 },
        { x: g.x - gap - boxW, y: g.y - boxH / 2 },
        { x: g.x - boxW / 2, y: g.y - gap - boxH },
        { x: g.x - boxW / 2, y: g.y + gap },
        { x: g.x + gap - 4, y: g.y - gap - boxH + 6 },
        { x: g.x + gap - 4, y: g.y + gap - 6 },
        { x: g.x + markerR - boxW, y: g.y - gap - boxH },
        { x: g.x + markerR - boxW, y: g.y + gap },
        { x: g.x - markerR, y: g.y - gap - boxH },
        { x: g.x - markerR, y: g.y + gap }
      ].map((c) => clampBox({ x: c.x, y: c.y, w: boxW, h: boxH }));
      const free = candidates.find((c) => !placedBoxes.some((o) => mapBoxesOverlap(c, o)));
      if (free) {
        box = free;
        nameLines = lines;
        break;
      }
      if (!fallback) {
        const fb = candidates.find((c) => !mapBoxesOverlap(c, own, 2) && !reserved.some((o) => mapBoxesOverlap(c, o)));
        if (fb) fallback = { box: fb, lines };
      }
    }
    if (!box && fallback) {
      box = fallback.box;
      nameLines = fallback.lines;
    }
    if (!box) return;
    placedBoxes.push(box);
    drawnNames.push({ id, text: nameLines.join(" / "), ...box });
    ctx.fillStyle = pal.labelBg;
    ctx.strokeStyle = pal.islandTitle;
    ctx.lineWidth = isSelected ? 1.8 : 1.2;
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.w, box.h, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = pal.labelText;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    nameLines.forEach((l, i) => ctx.fillText(l, box.x + 7, box.y + 12 + i * 16));
  });

  lastMapLabelLayout = {
    W,
    H,
    locator,
    sovereign: sovereignLabels.map((s) => ({ name: s.isl.name, text: s.lines.map((l) => l.text), ...s.box })),
    controls: controlBoxes,
    battleNames: drawnNames,
    markers: groups.map((g) => ({ x: g.x, y: g.y, n: g.members.length > 1 ? `x${g.members.length}` : getBattleNumber(g.members[0].id) }))
  };

  // 10. Sovereignty labels LAST, above every marker and line (6D, PRD guardrail 2).
  sovereignLabels.forEach(({ box, lines }) => {
    ctx.save();
    ctx.fillStyle = pal.labelBg;
    ctx.strokeStyle = pal.islandTitle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.w, box.h, 5);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((l, i) => {
      ctx.font = l.font;
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, box.x + box.w / 2, box.y + 4 + 17 * i + 8.5);
    });
    ctx.restore();
  });

  ctx.restore();
}

// E10 Fix: Vetted Label-Free Leaflet Basemap (dark_nolabels / light_nolabels ONLY)
function initLeafletMap() {
  if (leafletMap || !window.L) return;
  const container = document.getElementById("leaflet-map-container");
  if (!container) return;

  leafletMap = L.map(container, {
    center: [16.2, 107.5],
    zoom: 6,
    scrollWheelZoom: false,
    zoomControl: false // the map's own +, −, Toàn (bottom-left) drive Leaflet too
  });

  const tileUrl =
    state.theme === "light"
      ? "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";

  leafletTileLayer = L.tileLayer(tileUrl, {
    attribution: "&copy; OpenStreetMap &copy; CARTO (No-Labels Base)",
    subdomains: "abcd",
    maxZoom: 18
  }).addTo(leafletMap);

  // 6D: sovereignty labels sit above markers AND name tooltips (tooltipPane is 650).
  leafletMap.createPane("sovereignPane");
  leafletMap.getPane("sovereignPane").style.zIndex = 700;
  leafletMap.getPane("sovereignPane").style.pointerEvents = "none";

  leafletMarkersLayer = L.layerGroup().addTo(leafletMap);
  // 6D: merged markers depend on screen distance, so regroup after every zoom.
  leafletMap.on("zoomstart movestart", () => closeMapClusterPopover(false));
  leafletMap.on("zoomend", () => updateLeafletMarkers());
  updateLeafletMarkers();
}

function updateLeafletMarkers() {
  if (!leafletMap || !leafletMarkersLayer || !window.L) return;
  leafletMarkersLayer.clearLayers();
  const pal = getCanvasPalette();
  const containerEl = leafletMap.getContainer();
  const narrow = (containerEl && containerEl.clientWidth < 500) || isPhoneMapWidth();

  // Vietnamese sovereign archipelago labels (E10, 6D): one label each, never shortened, above every marker.
  const geo = window.VIETNAM_GEO_OUTLINE || {};
  (geo.islands || [])
    .filter((isl) => isl.isSovereignArchipelago)
    .forEach((isl) => {
      const text = narrow
        ? `${escapeHtml(isl.name.replace(/\s*\(Việt Nam\)\s*$/, ""))}<br>(Việt Nam)`
        : escapeHtml(isl.name);
      const icon = L.divIcon({
        className: "vn-sov-leaflet-icon",
        html: `<div class="vn-sov-leaflet-label" style="background:${pal.labelBg};border-color:${pal.islandTitle};color:${pal.islandTitle};">${text}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
      L.marker([isl.lat, isl.lng], {
        icon,
        interactive: false,
        keyboard: false,
        pane: leafletMap.getPane("sovereignPane") ? "sovereignPane" : "markerPane"
      }).addTo(leafletMarkersLayer);
    });

  // Add cemetery pins
  const cemeteriesOnMap = getFilteredCemeteriesForMap();
  cemeteriesOnMap.forEach((c) => {
    const marker = L.circleMarker([Number(c.lat), Number(c.lng)], {
      radius: 6,
      fillColor: "#34d399",
      color: "#090d16",
      weight: 2,
      fillOpacity: 0.92
    });
    marker.bindTooltip(`${c.name} (${c.province})`, { direction: "top" });
    marker.on("click", () => openCemeteryDetail(c.id));
    marker.addTo(leafletMarkersLayer);
  });

  // Numbered battle markers; markers closer than 28px merge into a count marker (6D).
  const size = getMarkerRadius() * 2;
  const battles = sortBattlesChronologically(getFilteredBattles());
  const points = battles.map((b) => {
    const p = leafletMap.latLngToContainerPoint([b.coordinates.lat, b.coordinates.lng]);
    return { battle: b, x: p.x, y: p.y };
  });
  const selectedPoint = points.find((p) => p.battle.id === state.selectedBattleId) || null;
  const groups = clusterMapPoints(points.filter((p) => p !== selectedPoint), MAP_MERGE_DISTANCE);
  nudgeGroupsFromSelected(groups, selectedPoint, MAP_MERGE_DISTANCE);
  if (selectedPoint) groups.push({ x: selectedPoint.x, y: selectedPoint.y, members: [selectedPoint.battle], isSelected: true });

  const setA11y = (marker, label) => {
    marker.on("add", () => {
      const el = marker.getElement();
      if (!el) return;
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", label);
      el.removeAttribute("title");
    });
  };

  let selectedMarker = null;
  groups.forEach((g) => {
    const isCluster = g.members.length > 1;
    const latlng = leafletMap.containerPointToLatLng([g.x, g.y]);
    if (isCluster) {
      const label = `${g.members.length} trận ở gần nhau: ${g.members.map((b) => `${getBattleNumber(b.id)}`).join(", ")}. Mở danh sách`;
      const icon = L.divIcon({
        className: "map-num-marker-icon",
        html: `<span class="map-num-marker is-cluster" style="width:${size}px;height:${size}px;background:${pal.labelBg};color:${pal.labelText};border-color:${pal.pinDefault};box-shadow:0 0 0 4px ${pal.pinRing};">${g.members.length}</span>`,
        iconSize: [MAP_HIT_RADIUS * 2, MAP_HIT_RADIUS * 2],
        iconAnchor: [MAP_HIT_RADIUS, MAP_HIT_RADIUS]
      });
      const marker = L.marker(latlng, { icon, keyboard: true, riseOnHover: true });
      setA11y(marker, label);
      marker.on("click", () => {
        const p = leafletMap.latLngToContainerPoint(latlng);
        openMapClusterPopover(g.members, p.x, p.y);
      });
      marker.addTo(leafletMarkersLayer);
      return;
    }
    const b = g.members[0];
    const fill = getBattleMarkerFill(b, pal);
    const isSelected = state.selectedBattleId === b.id;
    const icon = L.divIcon({
      className: "map-num-marker-icon",
      html: `<span class="map-num-marker" style="width:${size}px;height:${size}px;background:${fill};color:${pickMarkerTextColor(fill)};border-color:${isSelected ? pal.islandTitle : state.theme === "light" ? "#ffffff" : "#090d16"};${isSelected ? `box-shadow:0 0 0 6px ${pal.pinRing};` : ""}">${getBattleNumber(b.id)}</span>`,
      iconSize: [MAP_HIT_RADIUS * 2, MAP_HIT_RADIUS * 2],
      iconAnchor: [MAP_HIT_RADIUS, MAP_HIT_RADIUS]
    });
    const marker = L.marker(isSelected ? [b.coordinates.lat, b.coordinates.lng] : latlng, {
      icon,
      keyboard: true,
      riseOnHover: true,
      zIndexOffset: isSelected ? 1000 : 0
    });
    setA11y(marker, getBattleAccessibleName(b));
    // One name at a time: the selected battle keeps its name; others show it on hover / focus only.
    marker.bindTooltip(escapeHtml(getBattleMapLabel(b)), {
      direction: "right",
      offset: [size / 2 + 4, 0],
      permanent: isSelected,
      className: "map-name-tooltip"
    });
    if (!isSelected) {
      marker.on("add", () => {
        const el = marker.getElement();
        if (!el) return;
        el.addEventListener("focus", () => marker.openTooltip());
        el.addEventListener("blur", () => marker.closeTooltip());
      });
    }
    marker.on("click", () => selectBattle(b.id));
    marker.addTo(leafletMarkersLayer);
    if (isSelected) selectedMarker = marker;
  });

  // The selected name never touches a sovereignty label: try the left side, else leave it to the panel.
  if (selectedMarker && containerEl) {
    const sovRects = [...containerEl.querySelectorAll(".vn-sov-leaflet-label")].map((e) => e.getBoundingClientRect());
    const touches = () => {
      const el = selectedMarker.getTooltip() && selectedMarker.getTooltip().getElement();
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return sovRects.some((s) => !(r.right + 3 <= s.left || r.left >= s.right + 3 || r.bottom + 3 <= s.top || r.top >= s.bottom + 3));
    };
    if (touches()) {
      const b = (window.VIETNAM_WAR_BATTLES || []).find((x) => x.id === state.selectedBattleId);
      selectedMarker.unbindTooltip();
      selectedMarker.bindTooltip(escapeHtml(getBattleMapLabel(b)), {
        direction: "left",
        offset: [-(size / 2 + 4), 0],
        permanent: true,
        className: "map-name-tooltip"
      });
      selectedMarker.openTooltip();
      if (touches()) selectedMarker.closeTooltip();
    }
  }
}

// ============================================================================
// INTERACTION BINDINGS: POINTER EVENTS, CTRL+WHEEL & KEYBOARD (E5)
// ============================================================================

function bindMapCanvasInteractions() {
  const canvas = document.getElementById("vietnam-atlas-canvas");
  if (!canvas) return;

  // Nearest marker whose 44px hit area contains the point (6D).
  const hitTest = (mx, my) => {
    let best = null;
    let bestD = Infinity;
    for (let i = renderedPinHitboxes.length - 1; i >= 0; i--) {
      const p = renderedPinHitboxes[i];
      const d = Math.hypot(mx - p.x, my - p.y);
      if (d <= p.r && d < bestD) {
        best = p;
        bestD = d;
      }
    }
    return best;
  };

  // E5 Fix: Pointer Events for both mouse drag and single-finger touch pan
  canvas.addEventListener("pointerdown", (e) => {
    closeMapClusterPopover(false);
    mapCam.dragging = true;
    mapCam.pointerId = e.pointerId;
    mapCam.startX = e.clientX;
    mapCam.startY = e.clientY;
    mapCam.moved = false;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) {}
  });

  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (mapCam.dragging && e.pointerId === mapCam.pointerId) {
      const dx = e.clientX - mapCam.startX;
      const dy = e.clientY - mapCam.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        mapCam.moved = true;
      }
      const scale = Math.min(rect.width / 13.5, rect.height / 16.5) * mapCam.zoom;
      mapCam.centerLng -= dx / (scale * 0.94);
      mapCam.centerLat += dy / scale;
      mapCam.startX = e.clientX;
      mapCam.startY = e.clientY;
      drawVietnamCanvasMap();
      return;
    }

    // Hover names are a desktop affordance (6D): touch goes straight to select on tap.
    if (e.pointerType && e.pointerType !== "mouse") return;
    const hit = hitTest(mx, my);
    const hitBattle = hit && hit.kind === "battle" ? hit.id : null;
    const hitCem = hit && hit.kind === "cemetery" ? hit.id : null;
    const hitCluster = hit && hit.kind === "cluster" ? hit.id : null;
    if (
      hitBattle !== state.hoveredBattleId ||
      hitCem !== state.hoveredCemeteryId ||
      hitCluster !== (state.hoveredClusterKey || null)
    ) {
      state.hoveredBattleId = hitBattle;
      state.hoveredCemeteryId = hitCem;
      state.hoveredClusterKey = hitCluster;
      canvas.style.cursor = hit ? "pointer" : "grab";
      drawVietnamCanvasMap();
    }
  });

  canvas.addEventListener("pointerleave", (e) => {
    if (mapCam.dragging || (e.pointerType && e.pointerType !== "mouse")) return;
    if (state.hoveredBattleId || state.hoveredCemeteryId || state.hoveredClusterKey) {
      state.hoveredBattleId = null;
      state.hoveredCemeteryId = null;
      state.hoveredClusterKey = null;
      drawVietnamCanvasMap();
    }
  });

  const endPointer = (e) => {
    if (!mapCam.dragging) return;
    const wasMoved = mapCam.moved;
    mapCam.dragging = false;
    mapCam.pointerId = null;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (!wasMoved && e.type === "pointerup") {
      const rect = canvas.getBoundingClientRect();
      const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (!hit) return;
      if (hit.kind === "cemetery") {
        openCemeteryDetail(hit.id);
      } else if (hit.kind === "cluster") {
        openMapClusterPopover(hit.members, hit.x, hit.y);
      } else {
        selectBattle(hit.id);
      }
    }
  };

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  // E5 Fix: Plain mouse wheel scrolls the page; Ctrl/Cmd + wheel zooms the map
  canvas.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.18 : 0.85;
        zoomMapBy(factor);
      } else {
        const hint = document.getElementById("map-wheel-hint");
        if (hint) {
          hint.classList.remove("hidden");
          clearTimeout(wheelHintTimer);
          wheelHintTimer = setTimeout(() => {
            hint.classList.add("hidden");
          }, 1600);
        }
      }
    },
    { passive: false }
  );

  // Keyboard navigation on map canvas: arrows walk the battles in number order (1–N).
  canvas.addEventListener("keydown", (e) => {
    const battles = sortBattlesChronologically(getFilteredBattles());
    if (!battles.length) return;
    const idx = battles.findIndex((b) => b.id === state.selectedBattleId);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = battles[(idx + 1) % battles.length];
      if (next) selectBattle(next.id);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = battles[idx <= 0 ? battles.length - 1 : idx - 1];
      if (prev) selectBattle(prev.id);
    } else if (e.key === "Escape" && state.selectedBattleId) {
      e.preventDefault();
      closeBattlePanel();
    }
  });

  // Close the cluster list on an outside press.
  document.addEventListener("pointerdown", (e) => {
    const pop = document.getElementById("map-cluster-popover");
    if (!pop || pop.hidden || pop.contains(e.target)) return;
    if (e.target.closest && e.target.closest(".map-num-marker-icon")) return;
    closeMapClusterPopover(false);
  });

  // Marker numbers use IBM Plex Mono: redraw once the web fonts are in.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => drawVietnamCanvasMap());
  }
}

function bindUnitLineageCanvasInteractions() {
  const canvas = document.getElementById("unit-lineage-canvas");
  if (!canvas) return;

  canvas.addEventListener("pointerdown", (e) => {
    unitGraphCam.dragging = true;
    unitGraphCam.lastX = e.clientX;
    unitGraphCam.lastY = e.clientY;
    unitGraphCam.moved = false;
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!unitGraphCam.dragging) return;
    const dx = e.clientX - unitGraphCam.lastX;
    const dy = e.clientY - unitGraphCam.lastY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) unitGraphCam.moved = true;
    unitGraphCam.panX += dx;
    unitGraphCam.panY += dy;
    unitGraphCam.lastX = e.clientX;
    unitGraphCam.lastY = e.clientY;
    drawUnitLineageCanvas();
  });

  canvas.addEventListener("pointerup", (e) => {
    const moved = unitGraphCam.moved;
    unitGraphCam.dragging = false;
    if (moved) return;

    const rect = canvas.getBoundingClientRect();
    const gx = (e.clientX - rect.left - unitGraphCam.panX) / unitGraphCam.zoom;
    const gy = (e.clientY - rect.top - unitGraphCam.panY) / unitGraphCam.zoom;

    for (const n of unitGraphNodes) {
      const boxW = n.type === "unit" ? 250 : 270;
      const boxH = 28;
      if (
        gx >= n.x - boxW / 2 &&
        gx <= n.x + boxW / 2 &&
        gy >= n.y - boxH / 2 &&
        gy <= n.y + boxH / 2
      ) {
        if (n.type === "unit") {
          selectUnitInGraph(n.code);
        } else if (n.type === "battle") {
          selectBattle(n.battleId, "forces");
        }
        break;
      }
    }
  });
}

// ============================================================================
// INITIALIZATION ON DOM READY
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderPeriodPills();
  populateMartyrFilterSelects();
  initSortableMartyrsTable();
  initUnitLineageGraph();
  bindMapCanvasInteractions();
  bindUnitLineageCanvasInteractions();

  const unitInput = document.getElementById("unit-decoder-input");
  if (unitInput) {
    unitInput.addEventListener("input", () => renderUnitDecoderList());
  }

  // Global keyboard shortcut `/` to focus search and click-outside to close dropdowns
  document.addEventListener("keydown", (e) => {
    if (e.target.closest?.('#view-tabs [role="tab"]') && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      const tabs = [...document.querySelectorAll('#view-tabs [role="tab"]')];
      const i = tabs.indexOf(e.target);
      const next = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      e.preventDefault();
      tabs[next].click();
      tabs[next].focus();
      return;
    }
    if (
      e.key === "/" &&
      document.activeElement &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
    ) {
      e.preventDefault();
      const input = document.getElementById("search-input");
      if (input) input.focus();
    } else if (e.key === "Escape") {
      closeAllMenus();
      closeAllDropdowns();
    }
  });

  document.addEventListener("click", (e) => {
    const topSearch = document.getElementById("app-search");
    const startSearch = document.getElementById("start-search-input");
    const startListbox = document.getElementById("start-search-listbox");
    if (
      topSearch &&
      !topSearch.contains(e.target) &&
      (!startSearch || !startSearch.contains(e.target)) &&
      (!startListbox || !startListbox.contains(e.target))
    ) {
      closeAllDropdowns();
    }

    const siteBtn = document.getElementById("site-switcher-btn");
    const siteMenu = document.getElementById("site-menu");
    if (siteMenu && !siteMenu.classList.contains("hidden")) {
      if (!siteMenu.contains(e.target) && (!siteBtn || !siteBtn.contains(e.target))) {
        toggleSiteMenu(false);
      }
    }

    const layersBtn = document.getElementById("map-layers-btn");
    const layersMenu = document.getElementById("map-layers-menu");
    if (layersMenu && !layersMenu.classList.contains("hidden")) {
      if (!layersMenu.contains(e.target) && (!layersBtn || !layersBtn.contains(e.target))) {
        toggleMapLayersMenu(false);
      }
    }
  });

  window.addEventListener("resize", () => {
    drawVietnamCanvasMap();
    if (state.activeMainView === "phien-hieu") {
      drawUnitLineageCanvas();
    }
  });

  window.addEventListener("hashchange", () => {
    applyRouteFromHash();
  });

  document.getElementById("martyr-dialog")?.addEventListener("close", onMartyrDialogClosed);

  applyRouteFromHash();
});
