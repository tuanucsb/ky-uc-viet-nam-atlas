# Ký Ức Việt Nam Atlas: Design Review & Antigravity Task List

Reviewed: 2026-11-10, `/plan-design-review` on the PRD (`PRD_Ban_Do_Ky_Uc_Tran_Danh_Liet_Si.md`) plus the live build (`index.html`, `css/styles.css`, `js/app.js`, `data/battles_and_martyrs.js`) at `http://localhost:8080`.
Compared against: `/Users/tuandinh/Scifi/world-tank-atlas/DESIGN.md`, `/Users/tuandinh/Scifi/scifi-ai-atlas/DESIGN.md`.
Re-reviewed: 2026-11-12, against the first implementation pass now served at `http://127.0.0.1:8765` (`python3 server.py`), tested at 1024, 820, 375 and 320px wide. See "Re-review of the implemented first pass" below; where that section and the 2026-11-10 evidence table disagree, the re-review is current.

**For Antigravity:** work the Implementation Tasks section top to bottom. Each task names the decision it comes from, the files, and how to verify it. Do not apply anything listed under Unresolved Decisions.

## Pre-review audit

- On 2026-11-10: not a git repo; no `DESIGN.md`, `CLAUDE.md`, `TODOS.md` or earlier design reviews in the folder. By 2026-11-12 the other agent had created a repo (commit `62fcb1e`) and a `DESIGN.md`; still no `CLAUDE.md`. `TODOS.md` is created by this review.
- UI scope: 6 top-level views (Bản đồ Chiến sự, Diễn biến Chiến trường, Danh bạ Liệt sĩ, Thư & Nhật ký, Đồ thị Đơn vị, Đối sánh Chiến dịch) plus the martyr `<dialog>`.
- Tokens and components are copied from World Tank Atlas (same `--n/--acc/--sa/--sb/--ok` ramps, Plex + Barlow type, `.cf-btn`, `.battle-compare`, `.sim-notch`); layout follows the Sci-Fi Atlas 7/5 map + inspector grid.

### Evidence from the live build (2026-11-10, the build before the first pass)

Line numbers in this table point at the old `app.js` and no longer match. Status of each row on 2026-11-12 is in the re-review section.

| # | Finding | Where |
|---|---|---|
| E1 | Lê Văn Huỳnh shows "1949 – 02/01/1973" while the same card and modal say his letter was written "11/09/1972 (trước khi hy sinh)"; PRD §5.4 gives 11/09/1972; the linked battle ended 16/09/1972 | `data/battles_and_martyrs.js:1000`, inspector, letters view, dialog |
| E2 | All 41 martyr records render "L4 (100%)"; most `sourceUrl`s point to the battle's Wikipedia article, not to a Sổ vàng, memorial wall or agency record (PRD §4.2 definition of L4) | `app.js:1077`, `app.js:1729`, data file |
| E3 | Raw period id `P4_1969_1972`-style chip shown in the inspector header | `app.js:1136` |
| E4 | 375px phone: page lays out 624px wide (horizontal scroll), map stays 680px tall, toolbar wraps to 5 rows, 30 of 49 visible targets are under 44px | `index.html:149-237` |
| E5 | Mouse wheel over the map always zooms (`preventDefault`), trapping page scroll; no touch/pointer handlers, so no pan on phones | `app.js:582-641` |
| E6 | Martyr cards are `<div onclick>` / `<article onclick>`: no keyboard or screen-reader path to the core feature | `app.js:1073`, `app.js:1162`, `app.js:1215`, `app.js:1724` |
| E7 | `#sr-announcer` live region exists but nothing writes to it | `index.html:175` |
| E8 | Battle theater canvas: martyr labels overlap ("Lê Văn Huỳnh" over "Hán Duy Long"), unit labels cut mid-word ("Trung đoàn 95 & Trung đo"); force bar text from both sides runs together | `app.js:1491-1690` |
| E9 | Martyr dialog stays open across route changes | `app.js:2124`, `app.js:309` |
| E10 | Leaflet mode uses CARTO Voyager tiles; base tiles carry their own labels for Hoàng Sa / Trường Sa (PRD guardrail 2 requires vetted tiles) | `app.js:526` |
| E11 | Map view type sizes: 220 of 223 text nodes are 11–12px; only 3 are 14px or larger. Canvas labels are 9.5–11.5px. Tank Atlas floor is 14px | computed styles, `app.js:683-1998` |
| E12 | `--sa-400` (side A red) on card measures 4.44:1, under 4.5:1 for small text. Muted text 7.5:1 and amber 8.2:1 pass | computed |
| E13 | Wikipedia box has no loading state (blank until fetch resolves); the API extract is injected with `innerHTML` | `app.js:1092-1122` |
| E14 | Theme toggle ignores `prefers-color-scheme` and is not remembered; canvases stay dark in light theme | `app.js:226`, `css/styles.css:43` |
| E15 | Inspector is a stack of nested bordered cards (amber card containing cards, red card, blue card, phases card containing cards, wiki card, result card) | `app.js:1133-1236` |
| E16 | 31 lines put emoji in headings, labels and buttons (🕯️ 📜 🎖️ 📍 🗓️ 🏆 ⏱️ 🌐 📚); labels use uppercase + tracking and Title Case | `app.js`, `index.html` |

## Step 0: Design scope

- **Initial rating: 4/10.** The PRD says what data to show but never how the product should feel or behave: no states, no mobile, no accessibility, no tone. The build filled the gaps by copying a tank wargame atlas, so a memorial reads like a game ("sa bàn chiến thuật" simulator, head-to-head "duel" view, amber everywhere, "L4 100%" on every name).
- **A 10 for this plan:** its own DESIGN.md with a memorial tone; map-first with one obvious next step; martyr search up front for families (PRD persona 1); every number with a visible source and honest verification levels; states specified per feature; an intentional phone layout; keyboard and screen-reader access to every martyr record.
- **Focus:** all 7 passes (D1).
- **Mockups:** not generated. The gstack designer has no image API key (`export GEMINI_API_KEY=…` or `design setup --provider gemini` enables it). Review is text-only.

## What already exists (reuse, don't rebuild)

- Token ramps and light-theme inversion in `css/styles.css:8-44` (World Tank Atlas system), including `--side-a` / `--side-b` / `--ok`.
- `.battle-compare` responsive table with caption and side-colored headers (`css/styles.css:240-299`).
- `.letter-parchment` serif letter block with light-theme variant (`css/styles.css:327-345`).
- Native `<dialog closedby="any">` with backdrop and scroll containment (`index.html:442`, `css/styles.css:304-325`).
- Hash router with deep links `#/battles/<id>` (`app.js:281-332`).
- `normalizeVi()` accent-insensitive search (`app.js:191`).
- Map empty state with real suggestions and a clear-filters action (`app.js:427-446`).
- Roving tabindex on the view tabs and `/` to focus search (`app.js:253-275`).
- `prefers-reduced-motion` handling (`app.js:149`, `css/styles.css:402`).

## Outside voice (independent Claude subagent; Codex not installed, recorded unavailable)

```
DESIGN OUTSIDE VOICES — LITMUS SCORECARD:
  Check                                    Claude  Codex  Consensus
  1. Brand unmistakable in first screen?   NO      n/a    NO  [single-model]
  2. One strong visual anchor?             NO      n/a    NO  [single-model]
  3. Scannable by headlines only?          NO      n/a    NO  [single-model]
  4. Each section has one job?             NO      n/a    NO  [single-model]
  5. Cards actually necessary?             NO      n/a    NO  [single-model]
  6. Motion improves hierarchy?            NO      n/a    NO  [single-model]
  7. Premium without decorative shadows?   NO      n/a    NO  [single-model]
  Hard rejections triggered: #7 stacked cards (inspector, battle page, dialog);
  #6 carousel with no narrative purpose (18-card mixed martyr strip);
  #5 repeated statement ("41 hồ sơ … L4" at index.html:94,165,244,247,305,315,327)
```

Subagent findings verified in code before use: force bar hard-coded 50/50 (`app.js:1360-1361`); pulsing "radar" rings on selected, hovered and letter pins (`app.js:853-862`); martyr strip appends other battles' featured martyrs (`app.js:1055`); dialog's last action is "▶ Xem Sa bàn" (`app.js:2186`); data confidence is 1.0 on 36 records and 0.95–0.99 on 5, yet cards hard-code "100%".

## Approved design decisions

### Pass 1: Information architecture (3/10 → 9/10)

- **1A. Three top-level views (D3, approved A).** Replace the 6 tabs with **Bản đồ** (map + battle panel; battle phases and forces live inside the panel), **Liệt sĩ** (searchable roll of honor; letters become a filter and live inside each martyr record) and **Phiên hiệu** (death-notice unit decoder + unit graph). "Đối sánh" becomes a "So sánh với…" link inside the battle panel. The battle theater page stops being a top-level tab. Routes: `#/ban-do`, `#/ban-do/<battleId>`, `#/liet-si`, `#/phien-hieu`; keep the old `#/map`, `#/battles/<id>`, `#/martyrs`, `#/letters`, `#/lineage`, `#/compare` as redirects.
- **1B. First screen is a start state (D4, approved A).** On load nothing is preselected (`state.selectedBattleId` starts `null`). The panel shows, in order: a large "Tìm người thân" search (same search as the top bar), then 3 suggested stories (Thành cổ Quảng Trị, Ngã ba Đồng Lộc, Điện Biên Phủ trên không), each one line plus one sentence. The map-mode buttons (`mpm-*`) and basemap buttons (`map-engine-*`) fold into one "Lớp bản đồ" control in the map's top-right corner; the separate toolbar row is removed. A battle panel replaces the start state only when a battle is chosen; closing it returns to the start state.
- **1C. Search returns a grouped results list (D5, approved A).** Typing in the top-bar search (or the start-state search) opens a results list under the field, grouped **Liệt sĩ** (name, birth–death years, hometown, unit), **Trận đánh** (name, dates, place) and **Phiên hiệu** (unit code, parent unit). Matching uses `normalizeVi()` on name, hometown, unit, cemetery and battle name. Arrow keys move, Enter opens, Esc closes (ARIA combobox + listbox). Choosing a person opens their record and flies the map to their battle; choosing a battle opens its panel; choosing a unit opens Phiên hiệu on that unit. Map pins still dim to matches while a query is active. At most 5 rows per group, then "Xem tất cả N kết quả", which opens the Liệt sĩ view with the query applied.
- **1D. Battle panel = fixed header + the PRD's 4 tabs (D6, approved A).** Header (always visible): battle name, dates, place, one source line, close button. Tabs: **Tổng quan** (2–3 sentence summary, outcome, phases timeline, "So sánh với…" link), **Lực lượng hai bên** (the existing `.battle-compare` table plus command, each figure with its source), **Liệt sĩ (n)** (toll line, then the roll for this battle only), **Tư liệu & Nguồn** (citations and external links taken from the battle's own source fields; no fetched extract). ARIA tabs pattern with arrow keys. The open tab is kept in the route: `#/ban-do/<battleId>/<tab>`. Panel height follows the viewport (`100dvh` minus the top bar), not a fixed 810px. When a battle is reached from a person result, the panel opens on Liệt sĩ.

```
BATTLE PANEL (45% width)
+----------------------------------------------+
| Trận Thành cổ Quảng Trị                  [×] |
| 28/06 – 16/09/1972 · Thị xã Quảng Trị        |
| Nguồn: <tên nguồn chính của trận>            |
| [Tổng quan] [Lực lượng hai bên] [Liệt sĩ (3)] [Tư liệu & Nguồn] |
+----------------------------------------------+
| (one tab's content, scrolls inside the panel)|
+----------------------------------------------+
```

- **1E. Each martyr record has its own route (D7, approved A).** `#/liet-si/<martyrId>` opens the record: the existing `<dialog>` on desktop, over whichever view is behind it; a full page under 768px. Back closes it, a reload reopens it, and closing returns focus to the element that opened it. Any route change closes an open dialog (fixes E9). The header has "Sao chép liên kết". The last action is "Xem trận <tên> trên bản đồ" (opens `#/ban-do/<battleId>/liet-si`), replacing "▶ Xem Sa bàn Trận…" (`app.js:2186`). `document.title` becomes "<Họ tên> · Ký Ức Việt Nam Atlas".

- **1F. Three tabs stay; cemeteries move onto the map, awards onto the record (D17, approved A).** Reverses the fourth view the rebuilt app added (V10).
  - Remove the "Nghĩa trang & Huân chương" tab and `#view-nghia-trang` as a destination. `#/nghia-trang` redirects to `#/ban-do`, scrolled to the cemetery list below. Nothing in `CEMETERIES_DATA` or `AWARDS_CATALOG` is deleted.
  - **Cemetery = a place on the map.** Selecting a cemetery marker (the layer already exists) opens the right panel in the same frame as a battle, at `#/ban-do/nghia-trang/<cemeteryId>`. No sub-tabs. Content, top to bottom: name; province · year built · area; photograph with its credit; address; number of graves as the source states it ("khoảng 15.000 phần mộ" when the source figure is rounded); the description; "Hồ sơ an táng tại đây (n)" as a list of record links; sources; a close button back to the start state. Reuse the card content already written in `renderCemeteriesAndAwardsView`.
  - **Start state gains "Tìm theo nghĩa trang"** after the stories: one line per site (name · tỉnh · số phần mộ), each opening the cemetery panel. Phones show the first 5 plus "Xem cả 15 nghĩa trang" (a 44px button).
  - **Awards belong to the person.** Each printed award on a record (only sourced ones, 3F) is a button that opens a short explanation from `AWARDS_CATALOG`, using the same popover / phone sheet as the 3A badge legend. The 8-group catalogue page goes; its text stays as data.
  - The Liệt sĩ list keeps its cemetery filter unchanged.
  - The "86.997+ phần mộ" total is not shown anywhere: it adds rounded figures and prints the sum as an exact count (2A, no invented values).

- **1G. The four battle sub-tabs always fit (D20, approved A; was U7).**
  - Under 768px the tab list is a 2×2 grid: two rows of two tabs, each half the panel width and 44px tall, labels unchanged ("Tổng quan", "Lực lượng hai bên", "Liệt sĩ (n)", "Tư liệu & Nguồn"). The selected tab has the `--accent` underline and `aria-selected="true"`; arrow keys move left/right through all four in reading order, Home/End jump to the ends.
  - At 1024px and up the battle panel is 500px wide (402px today) and the map takes the rest; the four tabs sit on one line. 768–1023px uses the one-line row at full width (it fits at 786px today).
  - The grid is the sticky element under the pinned view tabs on phones, so the pinned total inside a battle is 48 + 88 = 136px (6B is updated to match).

**Pass 1 re-rate: 9/10.** Navigation, first screen, search, panel, sub-tabs, record and cemeteries all have a defined shape. Not 10: no mockups were rendered (needs an image API key).

```
FIRST SCREEN (1440×900)
+------------------------------------------------------------------------------+
| Ký Ức Việt Nam Atlas   [Bản đồ] [Liệt sĩ] [Phiên hiệu]   [Tìm tên, đơn vị…] (◐)|
| Giai đoạn: [Tất cả] [1954–60] [1961–65] [1965–68] [1969–73] [1973–75]          |
+---------------------------------------------+--------------------------------+
|                               [Lớp bản đồ ▾]| Tìm người thân                 |
|            MAP (first, largest)             | [Họ tên, quê, phiên hiệu…   ]  |
|      DMZ, Trường Sơn, Hoàng Sa, Trường Sa   |                                |
|      numbered battle markers (29 today)     | Bắt đầu từ một câu chuyện      |
|                                             | · Thành cổ Quảng Trị, 1972     |
| [+][−][Toàn]                                | · Ngã ba Đồng Lộc, 1968        |
|  [battle strip: 1–N, in date order]         | · Điện Biên Phủ trên không     |
|                                             | Tìm theo nghĩa trang (1F)      |
+---------------------------------------------+--------------------------------+
```

### Pass 2: Interaction states (2/10 → 9/10)

- **2A. Full state table (D8, approved A).** Every feature below ships all of its states. Copy is Vietnamese, sentence case, no emoji.

| Feature | Loading | Empty / not found | Error | Partial |
|---|---|---|---|---|
| Search (top bar + start state) | none needed (data is local); if the SQLite API is used, the list shows "Đang tìm…" after 300ms | The not-found block below | "Không tải được dữ liệu tra cứu. Thử lại" with a retry button | Fewer than 5 rows in a group: show them, no filler |
| Map | Skeleton outline of Vietnam plus "Đang tải bản đồ…" in the live region | Filters leave 0 battles: "Không có trận đánh nào trong giai đoạn và vùng đã chọn" plus "Bỏ bộ lọc" | Leaflet tiles fail: fall back to the vector map and say so once ("Không tải được nền bản đồ, đang dùng bản đồ vẽ") | Some markers hidden by a filter: the battle strip dims them, never removes them |
| Battle panel: Tổng quan | Text skeleton, 3 lines | Missing summary: "Chưa có tóm tắt cho trận này" | n/a | Missing outcome or phases: omit that block, no placeholder card |
| Battle panel: Lực lượng hai bên | Table skeleton | A side with no figures: "Chưa rõ" in the cell, never 0 and never a 50/50 bar | n/a | A figure with no source: show it with "chưa có nguồn" beside it |
| Battle panel: Liệt sĩ (n) | Row skeleton | n = 0: "Atlas chưa ghi nhận hồ sơ liệt sĩ nào của trận này" plus "Tìm trong toàn bộ danh sách" | n/a | Toll estimate missing: omit the toll line |
| Battle panel: Tư liệu & Nguồn | "Đang tải tư liệu…" | No external source: "Chưa có tư liệu đối chiếu" | Link or fetch fails: keep the citation text, drop only the broken extract | n/a |
| Liệt sĩ list | Row skeleton | Query or filter gives 0: the not-found block below, plus "Đặt lại bộ lọc" | as Search | n/a |
| Martyr record | Skeleton of the header (name, years) | Unknown `#/liet-si/<id>`: "Không tìm thấy hồ sơ này" plus a link to the Liệt sĩ list | Portrait fails to load: neutral placeholder with initials, no broken-image icon | Any unknown field (birth year, death date, hometown, unit, cemetery, award) reads "Chưa rõ" |
| Phiên hiệu decoder | n/a | Unknown code: "Chưa có phiên hiệu này trong từ điển" plus 3 example codes | n/a | Unit with no linked battle: say so, do not hide the unit |
| Unit graph (canvas) | "Đang vẽ sơ đồ…" | n/a | Canvas unsupported: the same data as a list | n/a |

  **Not-found block (search and Liệt sĩ list).** Families will mostly not find their relative in a sample this small (93 records on 2026-11-12), so this is the most-seen state. It must say, in this order: (1) "Chưa có hồ sơ khớp với “<từ khóa>”." (2) "Atlas mới ghi nhận <N> hồ sơ. Không tìm thấy ở đây không có nghĩa là không có hồ sơ." (`<N>` is the live record count from `getAllMartyrsFlat().length`, never a typed number.) (3) actions: "Tra theo phiên hiệu đơn vị" (opens Phiên hiệu with the query); the official routes (2B); "Bổ sung thông tin" (3E).

- **2B. Official lookup routes in the not-found block (D21, approved A; was U5).** Checked on 2026-11-12: `thongtinlietsi.gov.vn` no longer exists (NXDOMAIN on Google and Cloudflare DNS, `www.` too), although the build links it from the site menu (`index.html`) and the battle panel (`renderSelectedBattlePanel`), and 4 records cite it as their source. `chinhsachquandoi.gov.vn` answers over http only; its https connection is refused. The current official route reported by the press is the "Kết nối thân nhân liệt sĩ" feature in the VNeID app.
  - The block shows, as plain text: "Tra cứu chính thức: ứng dụng VNeID → Dịch vụ khác → Kết nối thân nhân liệt sĩ (cần tài khoản định danh mức 2)." No link, because the feature has no web address.
  - Then a link: "Cổng Chính sách Quân đội (chinhsachquandoi.gov.vn, trang http)", `rel="noopener"`, opening in a new tab. The words "trang http" warn that the browser may flag it.
  - Every `thongtinlietsi.gov.vn` link is removed: the site menu, the battle panel, and as `sourceUrl` on the 4 records (their `sourceName` stays; those records go on the human-check list for a working source).
  - The same two routes replace the old pair in the site menu.

- **2C. A carried search is always visible (D23, approved A; was U2).** The query stays shared between views (1C's "Xem tất cả N kết quả" depends on it), and wherever it filters a view that is not where it was typed, that view shows a chip directly above its count: "Đang lọc: <query> ×", 44px tall, `aria-label="Bỏ lọc <query>"`. Tapping it clears the query in every view and the count returns to all records ("93 / 93 hồ sơ"). The same chip appears for any other filter carried in from another view.

  **No invented values.** Unknown is "Chưa rõ". The build invents five (function names, because line numbers moved twice during this review):
  1. A death date of "1954–1975" when none is recorded (`openMartyrModal`: `martyr.sacrificeDate || martyr.deathYear || "1954–1975"`).
  2. An award of "Tổ quốc ghi công" when none is recorded (`openMartyrModal`: `martyr.award || "Tổ quốc ghi công"`).
  3. A source name of "Cổng Thông tin Liệt sĩ & Lịch sử QĐNDVN" when none is recorded (`openMartyrModal`).
  4. A verification line derived from the level ("Hồ sơ xác minh cấp Quốc gia / Bảo tàng", in the record-normalising code near the top of `js/app.js`).
  5. A default of L3 / 90% for records with no level (`formatVerificationBadge`).

  All five go. A missing value prints "Chưa rõ" or the row is omitted.

**Pass 2 re-rate: 9/10.** Every listed state has its copy and actions, the official routes are checked (2B) and carried filters are visible (2C). Not 10: the report link stays hidden until the owner supplies `CONTACT_EMAIL` (D25).

### Pass 3: Trust and content honesty (3/10 → 9/10)

- **3A. Verification badge in words, with its source, no percent (D9, approved A).**
  - Badge text: L4 "Hồ sơ chính thức", L3 "Đối chiếu đơn vị", L2 "Gợi ý, chưa xác nhận", L1/L0 or missing "Chưa xác minh". The code (L4, L3) may follow in mono as a secondary label; it never stands alone.
  - On the record, the badge is followed by the source name as a link ("Nguồn: Báo Quân đội nhân dân"). In list rows and search results the badge shows the words only.
  - No percent anywhere. Remove `confidence` from the UI (`formatVerificationBadge`; the dialog's "Cấp L4 (100%)" line in `openMartyrModal`; the search rows; the table column). The field can stay in the data.
  - No default. A record with no `level` reads "Chưa xác minh" in the neutral muted style, not `badge-l3`. Remove the `|| "L3"` and `0.9` fallbacks in `formatVerificationBadge` and in the record-normalising code.
  - The badge is a button. It opens a small legend (popover on desktop, sheet on phone) listing the four levels with one line each, taken from PRD §verification. Legend is reachable by keyboard and closes with Esc.
  - Color is not the only signal: L4 uses `--ok`, L3 `--accent`, unverified `--text-muted`, and each has its words.

- **3B. Death dates are structured, show their precision, and the one disputed date gets a human check (D10, approved A).**
  - Data shape per martyr, replacing the free-text `sacrificeDate`: `deathDate` (ISO, as much as is known: `1973-01-02`, `1972-08`, or empty), `deathDatePrecision` (`day` | `month` | `range` | `unknown`), `deathDateEnd` (ISO, only for `range`), `deathDateNote` (free text, optional), `dateVerified` (boolean, default false). Same split in `db/schema.sql` and `server.py`.
  - Display by precision: `day` "02/01/1973"; `month` "tháng 8/1972"; `range` "trong khoảng 28–30/04/1975"; `unknown` "Chưa rõ ngày hy sinh". The note prints on its own line under the date in muted text, never inside the date.
  - Fields that carry prose today move their bracketed text into `deathDateNote`: "Mùng 2 Tết Mậu Thân", "Viết thư dự cảm ngày 11/09/1972", "Hy sinh lúc 10h00 sáng 30/04/1975", "Chiến dịch Bắc Tây Ninh 02–05/1967" (7 of 93 values have brackets on the current build).
  - Three values are not dates at all: "Kháng chiến chống Mỹ (Khu 5)" and "Kháng chiến chống Mỹ (Quảng Ngãi)" (twice). They become `deathDatePrecision: "unknown"` with the text kept in `deathDateNote`, and display as "Chưa rõ ngày hy sinh".
  - Range dates that equal the battle's span (14 of 93 records on the current build, e.g. "28–30/04/1975", "10–17/03/1975") are stored as `range` and read "trong khoảng…". They are not presented as a known day.
  - **Lê Văn Huỳnh.** PRD §5.4 (line 228) and the PRD wireframe (line 274) say he died 11/09/1972. The dataset says he died 02/01/1973 and wrote the letter on 11/09/1972. A person opens the cited source, confirms, and corrects the wrong document. Until `dateVerified` is true his record shows "đang đối chiếu" beside the date. This review does not settle the date.
  - The same human pass over every other record (92 on the current build) is listed under TODOS, not in this round.

- **3C. Every letter or diary text is labeled: kind, extent, source, checked or not (D11, approved A).**
  - Data shape per text, replacing the bare `letterText` string: `kind` (`thu` | `nhat-ky` | `tho`; the rebuilt data adds poems), `writtenDate` (same precision rules as 3B), `addressee` (optional), `extent` (`toan-van` | `trich`), `text` (the writer's words only), `editorNote` (optional), `sourceName`, `sourceUrl` (optional), `heldAt` (where the original is kept, e.g. "Bảo tàng Thành cổ Quảng Trị"), `textVerified` (boolean, default false).
  - Title is built from the data, not generated: "Thư gửi gia đình, 11/09/1972" or "Nhật ký, 20/06/1970". Drop the blanket "Di bút & Thư thời chiến — <tên>" (`app.js:220`). Đặng Thùy Trâm's entry is a diary and is titled as one.
  - Layout, top to bottom: title; a label line "Toàn văn" or "Trích" plus the date; the text in `IBM Plex Serif` with a left hairline (no decorative quote marks, no italics for long text); then "Nguồn: <sourceName>" and "Bản gốc lưu tại: <heldAt>".
  - Editor's words never sit inside the text block. "Lời tiên tri kỳ diệu về ngày 30/04/1975" (Nguyễn Văn Thạc) and "(5 ngày trước khi hy sinh)" (Đồng Lộc) move to `editorNote`, shown under the text in muted sans as "Ghi chú của ban biên tập: …".
  - `textVerified: false` shows "Bản chép lại, chưa đối chiếu bản gốc" above the text. A person compares each text (7 on the current build) with its published or museum original and sets the flag. Any text that turns out to be a paraphrase is either replaced with the original wording or relabeled "Thuật lại" and taken out of the letter block.
  - The letter block in the battle panel's Liệt sĩ tab shows at most 3 lines plus "Đọc toàn bộ" linking to the record; the full text lives only on the record.

- **3E. "Báo sai sót / Bổ sung thông tin" by email this round; the form is deferred (D12, approved A).**
  - Where: at the foot of every martyr record, at the foot of the battle panel's Tư liệu & Nguồn tab, and as the third action in the not-found block (2A). Not in the app bar; the bar stays at three tabs plus search.
  - What it does: a `mailto:` link with the subject pre-filled ("Báo sai sót: <họ tên> (<martyrId>)" or "Bổ sung thông tin: không tìm thấy “<từ khóa>”") and a short body template (what is wrong, what is correct, how you know, how to reach you).
  - The address is one constant, `CONTACT_EMAIL`, in `js/app.js`. **The owner supplies it.** While it is empty the link is not rendered at all (no dead link, no placeholder address). This review does not invent an address.
  - Under the link, one line in muted text: "Thông tin bạn gửi sẽ được người phụ trách đọc và đối chiếu trước khi cập nhật. Thông tin riêng của gia đình không được công bố khi chưa có sự đồng ý." (PRD guardrail 4.)
  - Beside the email link on the record: "Sao chép mã hồ sơ" copies the id, for people who use a webmail tab or Zalo instead of a mail app.
  - The moderated contribution form from PRD phase 2 goes to TODOS.
  - **Address (D25, was U4):** the owner chose to supply an address for this round. It had not been given when this review closed, so `CONTACT_EMAIL` ships empty and the link stays hidden until the owner fills it in (one line in `js/app.js`). Nobody else picks an address.

- **3F. A state award prints on a record only when it has a source (D18, approved A).**
  - Data per award entry, added to the existing `awardId`, `citationLabel`, `awardedYear`, `isPosthumous`: `sourceName`, `sourceUrl` (optional), `decisionRef` (optional, the số quyết định), `decisionDate` (optional, same precision rules as 3B), `awardVerified` (boolean, default false). Same fields in `db/schema.sql`, `scripts/build_database.py` and `server.py`.
  - The record prints an award only if `sourceName` is set. Line: "<tên danh hiệu / huân chương> (truy tặng), <năm>" then "Nguồn: <sourceName>" as a link. A `null` year is left out, never printed as "null" or guessed.
  - Unsourced awards stay in the data, are hidden from the record, list rows, search results and filters, and go on the human-check list (TODOS) with the dates and letters.
  - The Liệt sĩ filter chips count printable awards only ("Anh hùng LLVTND (n)", "Huân chương & Giải thưởng (n)"). A chip whose count is 0 is not shown.
  - A collective record labels its awards "Danh hiệu tập thể" so a unit's title is not read as one person's.
  - Today all 184 award entries lack a source, so every record will show no awards until a person attaches sources. That is the intended state, not a bug.

**Family journey storyboard (the main persona, PRD persona 1), as the approved decisions now specify it:**

```
  STEP | USER DOES                                  | USER FEELS               | PLAN SPECIFIES
  -----|--------------------------------------------|--------------------------|------------------------------------------------
  1    | Opens the site on a phone                  | Unsure, hopeful          | One "Tìm người thân" field, nothing preselected (1B, 6B)
  2    | Types a name, or "E66" from a death notice | Anxious                  | Shorthand matching; grouped rows with years (1C, V7)
  3a   | Finds a record                             | Moved; wants to trust it | Badge in words + source (3A); date with its precision (3B); sourced awards only (3F)
  3b   | Finds nothing                              | Let down                 | Small-sample line, unit lookup, official portal, report link (2A, 3E)
  4    | Reads a letter                             | Grief, closeness         | Kind, extent, source, "chưa đối chiếu" label; editor notes kept apart (3C)
  5    | Sends it to family                         | Wants to share           | Own URL, "Sao chép liên kết", Back works (1E, V3)
  6    | Spots a mistake                            | Worried it will stand    | "Báo sai sót" with the record id (3E)
  7    | Asks where they are buried                 | Wants to visit           | Cemetery panel on the map with the records buried there (1F)
```

Time horizons: in 5 seconds, one quiet field and a map of the whole country; in 5 minutes, find, read, share; over 5 years, a record that shows its sources, says what is unchecked, and can be corrected.

**Pass 3 re-rate: 9/10** once 3A–3F ship and the two human checks (Lê Văn Huỳnh's date, the seven letter, diary and poem texts) are done; award sources are a TODO. Without the human checks it stays at 7/10: the screen is honest about what is unchecked, but the checking has not happened.

### Pass 4: AI slop risk (3/10 → 9/10)

Classifier: hybrid. The map, search and filters are OPERATE (find a person or battle); the record, letters and cemetery panel are READ. App UI rules apply to the first, Read rules to the second.

| Check | Current build (2026-11-12) | After the approved decisions |
|---|---|---|
| Hard rejection 7, app UI made of stacked cards | Mostly fixed by the first pass (hairlines). The Nghĩa trang page is a grid of 15 photo cards then 8 award cards | Page removed (1F) |
| Hard rejection 5, same statement repeated | The battle's source citation appears three times (header, Tổng quan, 4th tab) | Once in Tư liệu & Nguồn, plus one line in the header (1D) |
| Hard rejection 6, carousel with no purpose | Gone with the old martyr strip | — |
| Litmus 1, product unmistakable in first screen | YES: wordmark, "Tìm người thân", map of Vietnam | YES |
| Litmus 2, one strong visual anchor | YES on desktop (the map); on phones the search card | YES |
| Litmus 3, scannable by headlines | Partly: the battle header runs 349px before the tabs | YES once the header is trimmed (1D) |
| Litmus 4, each section has one job | NO for the battle header and the Nghĩa trang page | YES (1D, 1F) |
| Litmus 5, cards necessary | Not on the Nghĩa trang page | n/a after 1F |
| Litmus 6 and 7, motion and shadows | Not assessed in this review | — |
| `kicker-above-heading` | "Ký ức được gìn giữ, câu chuyện được tiếp nối" sits above "Tìm người thân" (`renderStartStatePanel`, class `opening-kicker`): mood copy above the one action | Removed (4A) |
| Same statement twice | Phiên hiệu prints "Phiên hiệu trên giấy báo tử: …" and "Các phiên hiệu tương đương trên giấy báo tử: …" with the same codes | One line (4B) |
| Emoji, uppercase tracked labels, radar pulse | Gone | — |

- **4A. Remove the start-screen tagline (D22, approved A; was U1).** Delete the `opening-kicker` line in `renderStartStatePanel` and its CSS. The start card opens on "Tìm người thân", then its one-sentence explanation, then the field.
- **4B. One line of unit codes (D24, approved A; was U3).** In the Phiên hiệu view each unit shows a single "Phiên hiệu trên giấy báo tử:" line listing every code once, in `IBM Plex Mono`. Codes that differ from the main ones join the same line; there is no second line.

**Pass 4 re-rate: 9/10.** Not 10: motion and decorative shadows were not assessed; check them in the post-build `/design-review`.

### Pass 5: Design system alignment (2/10 → 9/10)

On 2026-11-10 there was no `DESIGN.md` (2/10). The other agent wrote one; its tokens, type families, tone rules and contrast table are sound and stay. It now disagrees with the approved decisions in these places, each of which is updated under the decision already approved (no new choice involved):

| `DESIGN.md` says | Approved decision | Change |
|---|---|---|
| "16 major campaigns", "16 numbered battle markers", "16-battle bar" | Count changes with the data | Say "the battles in the dataset"; no hard-coded count |
| App bar "56px sticky" with 3 tabs (the build has 4) | 1A, 1F, 6B | Three tabs. Under 768px only the 48px tabs row is pinned, with a 44px search icon; tablet bar one row of at most 64px |
| Body `15.5px`, and 16px in its own update | First-pass suggestion adopted | Body 16px everywhere; 14px floor for supporting labels |
| "`280px` compact map above the panel" | 6A | 200px locator map, one "Mở bản đồ" button; 320px at 768–1023px |
| 4th sub-tab "So sánh & Nguồn" | 1D | "Tư liệu & Nguồn"; comparison is a "So sánh với…" link in Tổng quan |
| Battle markers and labels | 6D | Numbered markers 1–N matching the strip; one name at a time; sovereignty labels in a reserved area |
| `--ok` "Cấp xác minh L4 (Đa nguồn / Di tích / Bảo tàng)" | 3A | Badge words: "Hồ sơ chính thức", "Đối chiếu đơn vị", "Gợi ý, chưa xác nhận", "Chưa xác minh" |
| "Source: `/plan-design-review` (2026-11-10)" | — | "Source: `DESIGN_REVIEW_ANTIGRAVITY.md` (decisions approved 2026-11-10 to 2026-11-12)" |

Observation, no change: the map canvas uses its own palette (`getCanvasPalette`: navy `#090d16` sea and Tailwind amber `#fbbf24` titles in dark, `#e6edf5` sea and `#92400e` titles in light) rather than the `DESIGN.md` ground and accent. A blue sea under a green-grey page is a reasonable cartographic choice and all canvas text passes contrast (6E), so `DESIGN.md` records the canvas palette as its own token set instead of forcing the page tokens onto it (part of T18).

New components introduced by the decisions, kept to the existing vocabulary: one popover / phone-sheet component shared by the badge legend (3A) and the award explanation (1F); a count marker for merged map markers (6D), drawn as a battle marker carrying a number; the cemetery panel reuses the battle panel frame (1F).

**Pass 5 re-rate: 9/10** once `DESIGN.md` is updated (T18).

### Pass 6: Responsive and accessibility (4/10 → 9/10)

- **6A. Phone, battle selected: a 200px locator map on top, details below (D13, approved A).** Applies under 768px.
  - Order: app bar, locator map (200px tall, full width), battle header, tabs, tab content. Replaces the build's panel-first order (`#map-panel:not(.is-start-state) { order: -1 }` in `css/styles.css`) and the "280px" figure in `DESIGN.md`.
  - The locator map centres on the selected battle, draws its marker in `--accent` with its name, and dims the other markers. No battle strip, no layer control, no zoom buttons at this size. Hoàng Sa and Trường Sa labels stay drawn if they fall inside the frame; the frame is never cropped to exclude them when zoomed out (guardrail 2).
  - The locator map is one button ("Mở bản đồ", `aria-label="Mở bản đồ đầy đủ"`). Tapping it opens the full map at `#/ban-do/<battleId>/ban-do` with all controls; Back returns to the details. Dragging on the 200px map scrolls the page, it does not pan the map.
  - It scrolls away with the page; it is not sticky. The panel's sub-tab row becomes sticky under the pinned view tabs once the map has scrolled off (see 6B).
  - Start state under 768px is unchanged: search card, then the full 340px map, then stories.
  - 768–1023px: same order, map 320px tall instead of the fixed 640px the build uses at 820px (N13).

- **6B. Phone: only the tabs row stays pinned; one search field per screen (D14, approved A).** Applies under 768px.
  - `#app-bar` is no longer sticky as a whole. Row 1 (wordmark, theme toggle) scrolls away. Row 2, the three view tabs, is `position: sticky; top: 0`, 48px tall, full width, with a 44×44px search icon button at its right end (`aria-label="Tìm kiếm"`).
  - The search icon opens the existing combobox as a full-width row under the tabs, focuses the input, and shows a "Đóng" button. Esc or Đóng closes it and returns focus to the icon.
  - Start state (`#/ban-do`, no battle): the header search row and the search icon are hidden; the "Tìm người thân" field is the only search on the screen. Both inputs keep sharing one state so the query carries over.
  - The filters disclosure ("Giai đoạn & vùng chiến trường") moves out of the bar to sit directly above the map on `#/ban-do`. It does not appear on Liệt sĩ or Phiên hiệu, which have their own filters.
  - With a battle selected, the panel's sub-tab grid (1G) is sticky at `top: 48px`, so at most 136px is pinned (21% of a 640px-tall phone, down from 31%).
  - Target: pinned height is 48px on the start state and 136px inside a battle at 320px and 375px. At 768–1023px the bar may stay sticky but must be one row of at most 64px (it is 261px at 820px today).
  - This keeps the first pass's decision that all three tabs are always visible on phones.

- **6C. Liệt sĩ list: stacked name-first rows under 768px, table at 768px and up (D15, approved A).**
  - Phone row, about 88px tall, the whole row one link to `#/liet-si/<martyrId>`:
    ```
    Lê Văn Huỳnh                         1949–1973
    Kiến Xương, Thái Bình · Lữ đoàn Công binh 249
    Hồ sơ chính thức                             ›
    ```
    Line 1: name in `IBM Plex Serif` 600 18px, years in mono, right-aligned. A long name wraps under the years, it never pushes them off the row. Line 2: hometown · unit, 16px muted, wraps to 2 lines at most then ellipsis (the full text is on the record). Line 3: the 3A badge in words. Rows are separated by hairlines, not cards.
  - Unknown years read "Chưa rõ" (2A). A collective record (tập thể) shows its unit name on line 1 and "Tập thể" in place of years.
  - Sorting on phones: one "Sắp xếp" `<select>` above the list (Họ tên, Năm hy sinh, Quê quán, Đơn vị). The existing filters stay; "Đặt lại bộ lọc" becomes a 44px button.
  - Built as one list with a CSS switch, not two DOM trees: under 768px `thead` is visually hidden and each `tr` lays out as the block above, so the table semantics and caption remain for screen readers.
  - Target: each row is at most 96px tall at 375px, so 93 records are under 9,500px (41,989px today, rows 256–423px); no horizontal scroller inside the list (the table is 670px wide in a 351px scroller today). (Rescaled on 2026-11-12 from the approved "41 records under 4,200px" when the dataset grew to 93. Paging the list is not decided here; see TODOS.)
  - Desktop table: keep. Drop the "%" from the verification column (3A) and make the name cell the link.

- **6D. Numbered markers, one battle name at a time, sovereignty labels in a reserved area (D16, approved A).** Applies to both map engines (`drawVietnamCanvasMap`, `initLeafletMap`) at every width.
  - Each battle marker carries its number, 1–N in date order (N = 29 today). The battle strip under the map shows the same number before each name, so the strip is the map's legend. Marker: 28px circle on desktop, 32px on phones, number in `IBM Plex Mono` 600 at 13px or larger, with an invisible 44px hit area.
  - Always-on battle name boxes are removed. One name shows at a time: the selected battle's (kept while selected), or the hovered / keyboard-focused marker's on desktop. On phones the first tap on a marker shows its name and selects it; there is no hover step.
  - Markers closer than 28px to each other merge into one marker showing a count ("5"). Tapping it opens a short list of those battles (number, name, year) anchored to the marker; choosing one selects it. Zooming in splits the group. Today a dozen markers overlap around Sài Gòn.
  - **Sovereignty labels.** "Quần đảo Hoàng Sa (Việt Nam)" and "Quần đảo Trường Sa (Việt Nam)" are each one label on one or two lines, drawn last, above every marker and line. Their boxes go into the collision list first, so a battle name or island name ("Đảo Cồn Cỏ") that would touch them is moved or not drawn. They are never shortened, and never split into a name and a detached "Việt Nam".
  - **Controls move off the labels.** Zoom (`+`, `−`, "Toàn cảnh") moves to the bottom-left corner of the map; "Lớp bản đồ" stays top-right, which is clear of both archipelagos. No control overlaps either label at 320, 375, 820, 1024 or 1440px.
  - The marker number is part of the accessible name ("Trận 12: Thành cổ Quảng Trị, 1972"). The strip stays the keyboard route to every battle.
  - On the 200px locator map (6A) only the selected battle's marker and name are drawn, plus both sovereignty labels when they are in frame.

- **6E. Accessibility checks run on 2026-11-12 (was U6).**
  - **Map canvas contrast, both themes, computed from `getCanvasPalette`:** every text colour passes 4.5:1 against both the sea gradient and the land fill. Lowest: light-theme island titles `#92400e` at 5.56:1 on the sea; dark-theme muted text `#94a3b8` at 6.43:1 on land. Battle and cemetery label text on its label box is 17:1 in both themes. Canvas text is 12.5px, at the `DESIGN.md` canvas floor. 6D's marker numbers must meet 4.5:1 against the marker fill; check when T15 lands.
  - **Page structure:** `lang="vi"`; header, nav, main and aside landmarks; every visible input, select and icon button has a name; every image has `alt`; the record dialog is labelled by its title and moves focus to "Đóng"; the live region is polite. Two gaps: (1) no skip link, so a keyboard user tabs through the whole header (30+ controls at 1024px) on every view; (2) the battle sub-tabs have `aria-controls` empty, so they are not tied to their panel. The fix for (2) is part of the ARIA tabs pattern approved in 1D. The fix for (1) is a "Bỏ qua tới nội dung chính" link as the first focusable element, visible on focus, jumping to `<main>`: WCAG 2.4.1 (level A) requires a way to bypass repeated blocks, so it is listed as a requirement, not a design choice.
  - **Not done here:** a pass with a real screen reader (VoiceOver on iOS and macOS). It goes into the post-build `/design-review` (T23), because it tests the shipped build, not the plan.

**Pass 6 re-rate: 9/10** once 6A–6E ship and are confirmed at 320, 375, 820 and 1024px. Not 10 until the screen-reader pass in T23 is done.

### Pass 7: Unresolved design decisions

All seven items raised in this pass were settled on 2026-11-12/13:

| Item | Settled by | Outcome |
|---|---|---|
| U1 Tagline above "Tìm người thân" | D22 → 4A | Removed |
| U2 Query carried into Liệt sĩ with no cue | D23 → 2C | Removable "Đang lọc: … ×" chip |
| U3 Phiên hiệu repeats codes | D24 → 4B | One line |
| U4 `CONTACT_EMAIL` | D25 → 3E | Owner supplies it; ships empty and hidden until then |
| U5 Portal links, http-only sources | Checked → D21 → 2B | Dead portal removed; VNeID steps plus the working http link; https where the host supports it (T21) |
| U6 Contrast and screen reader | Checked → 6E | Contrast passes; skip link and `aria-controls` added; screen-reader pass in T23 |
| U7 Sub-tabs do not fit | D20 → 1G | 2×2 grid on phones, 500px desktop panel |

No design decision is open. One input is: the `CONTACT_EMAIL` address.

## Re-review of the implemented first pass (2026-11-12)

Another agent implemented a first pass and wrote `DESIGN.md` before passes 2–7 were decided. The user asked for that pass to be reviewed and its suggestions folded in.

**The build changed again while this review was running.** Commit `62fcb1e` (`js/app.js` saved 10:24, data 10:29 on 2026-11-12) took the app from 16 to 29 battles, 41 to 93 records, 5 to 7 wartime texts, and added a fourth top-level view, "Nghĩa trang & Huân chương". Everything in this section was measured again on that build, in the built-in browser at 320×568, 375×667, 820×1180 and 1024×768, at `http://127.0.0.1:8765`. Numbers are computed layout, not estimates. The E1–E16 evidence near the top of this document describes the build before the first pass and is kept as history only.

Tasks cite function names, not line numbers, because line numbers moved twice during the review.

### Adopted from the first pass (now part of this design)

These came from the implementing agent and are accepted as design decisions:

- **The view tabs stay visible on phones**, 44px tall, with no hamburger. (The fourth tab added later breaks this; see V10 and decision 1F.)
- **Search comes before the map at 1023px and below** on the start state ("Tìm người thân" card first, map second, stories third).
- **Period and region filters collapse on phones** behind one labeled disclosure, "Giai đoạn & vùng chiến trường".
- **Unit shorthand in search.** `F325` matches "Sư đoàn 325", `E66` "Trung đoàn 66", `D` "Tiểu đoàn", `C` "Đại đội". Death notices use these codes, so this is the right default. It now works in the Liệt sĩ list as well as the dropdown.
- **16px body and search text, 14px supporting labels, 44px minimum targets.** Supersedes the 15.5px body in `DESIGN.md` §Typography.
- **Search-result descriptions wrap** and are never truncated, so identity details are not cut. (The row still needs structure; see V7.)
- **Quick unit chips** under the start search (F325, F304, E66, F320, F361, C552) and "Xem toàn bộ <N> hồ sơ".
- **Period pills carry counts** ("Tất cả (29)").
- **Tone rules in `DESIGN.md`:** no weapons iconography, no radar pulse, no emoji in chrome, sentence case.

### What matches the approved decisions

| Decision | Result in the current build |
|---|---|
| 1A routes and legacy redirects | Done for `#/ban-do`, `#/liet-si`, `#/phien-hieu`; old routes redirect. A fourth view was added outside the decision (V10) |
| 1B start state, nothing preselected, folded "Lớp bản đồ" | Done |
| 1C grouped combobox | Done: arrows move `aria-activedescendant`, Enter opens, groups of 5 |
| 1C same query, same answer in the list (was V6) | Fixed. "E66" gives 5 rows in the list, "F325" 2, "trung doan 66" 5, "su doan 325" 2, "Thái Bình" 9 |
| 1E focus returns to the opener | Done: closing the record returns focus to the search field or to the list row's button |
| E3, E5, E6, E7, E9, E10, E11, E12, E14, E15, E16 | Fixed: no raw period ids, pointer-event pan with Ctrl/⌘+wheel zoom, no clickable `<div>`s, live region written to, dialog closes on route change, the app's own Hoàng Sa / Trường Sa labels in both map engines, all DOM text 14px or larger, theme remembered, hairlines in place of nested cards, emoji and uppercase labels gone |
| E2 (all records "L4 100%") | Partly: 79 L4 / 14 L3; no Wikipedia sources (cauchuyenlichsu.vn 45, nhandan.vn 29, qdnd.vn 25, others). The percent is still shown, and see N14 |
| E4 (phone layout) | Partly: no page-level horizontal scroll at 320, 375, 820 or 1024. Phone problems below |

### Where the build departs from an approved decision (fix to match)

| # | Approved | Built | Measured on the current build |
|---|---|---|---|
| V1 | 1E: `#/liet-si/<martyrId>`; Back closes; reload reopens; full page under 768px; "Sao chép liên kết"; record name in `document.title` | Record is a dialog with no URL. `executeComboboxOption` and the list rows call `openMartyrModal` directly | Hash stays `#/ban-do/<battleId>` or `#/liet-si`; title unchanged; at 320px the dialog is a 282×519 floating box; no copy-link |
| V2 | 1D: open tab kept in the route `#/ban-do/<battleId>/<tab>` | Tab is never written to the hash | Clicking a sub-tab leaves the hash unchanged |
| V3 | 1A/1E: Back steps through the app | `syncHashFromState` uses `history.replaceState` everywhere | `history.length` grows by 0 across battle, tab and view changes; Back leaves the site |
| V4 | 1D: 4th tab "Tư liệu & Nguồn"; comparison is a "So sánh với…" link in Tổng quan | 4th tab is "So sánh & Nguồn" (`renderSelectedBattlePanel`, `renderBattleSubTabContent`) | Sources also appear in the header and in Tổng quan: the same citation three times |
| V5 | 1D: header = name, dates, place, one source line | Header also carries back link, period, international name, coordinates and two full source titles | 349px of header before the tabs at 1024px; 357px at 375px (more than half a phone screen) |
| V7 | 1C: person row = name, birth–death years, hometown, unit | One run-on description | Rows 86–146px tall at 1024px, 141–270px at 320px; two results fill a phone screen |
| V8 | 2A: not-found hands off | "Không tìm thấy kết quả khớp với “…”" plus example searches only | No link out, no "this is a small sample" line, no report link |
| V9 | 1D: tabs fit the panel | Sub-tab row scrolls sideways | The 4 tabs need 487px. The row is 402px wide at 1024px and 349px at 375px, so the 4th tab is cut off on desktop too. Fits only at 820px |
| V10 | 1A: three top-level views | Four: Bản đồ, Liệt sĩ, **Nghĩa trang & Huân chương**, Phiên hiệu | The new tab is 205px wide. The row needs 428px; it has 351px at 375px and 296px at 320px, so "Phiên hiệu" is off-screen with no cue. Decision 1F |

### New findings in the current build

| # | Finding | Measured |
|---|---|---|
| N1 | Sticky header is too tall | 200px at 375px and 320px (30% of a 667px screen, 35% of 568px); 261px at 820px; 174px in three rows at 1024px. See 6B |
| N2 | Phone, battle selected: the panel is placed before the map | At 375px the panel is 2,349px tall and the map starts at 2,578px. See 6A |
| N3 | Two search fields on one phone screen | Header search at 102px and "Tìm người thân" at 402px, mirroring each other. See 6B |
| N4 | Liệt sĩ list is a 6-column table on phones | 670px table in a 351px scroller; rows 256–423px tall; 93 records make the page 41,989px long at 375px and 30,680px at 820px. 139 controls in the view are under 44px. See 6C |
| N5 | Controls and battle labels cover the sovereignty labels | At 375px the `+` button sits on "Quần đảo Hoàng Sa" (reads "Quần đảo Hoàng") and "Toàn" clips "Quần đảo Trường Sa". At 1024px a battle label box ("Tọa độ lửa Đường 20…") prints over "Quần đảo Hoàng Sa (Việt Nam)" and the zoom buttons sit on the Trường Sa label. PRD guardrail 2 says these labels are always legible. Decision 6D |
| N6 | 29 battle labels do not fit the map | At 1024px the label boxes stack down the coast and hide the coastline, the islands' names and each other. At 375px there are no labels at all: 29 unnumbered dots, a dozen of them overlapping around Sài Gòn. Decision 6D |
| N7 | Targets under 44px | Battle strip buttons 34px (all 29); filter chips in Liệt sĩ 36px; selects 40px; top search 40px at 1024px; dialog "Xem trên Bản đồ chiến dịch" 38px; Nghĩa trang view 70 of 121 controls; Phiên hiệu 18 |
| N8 | Query sticks across views | "E66" typed on Bản đồ silently filters Liệt sĩ to "5 / 93 hồ sơ" on arrival, with nothing saying a filter is on |
| N9 | Phiên hiệu repeats itself | "Phiên hiệu trên giấy báo tử: …" and "Các phiên hiệu tương đương trên giấy báo tử: …" list the same codes back to back |
| N10 | Wartime texts mix quotation and commentary | 7 `letterText` entries, none with its own source, kind or date field. `README.md` calls them "nguyên văn" (verbatim); nothing records that anyone compared them with an original. See 3C |
| N11 | Death date field carries prose | Of 93 `sacrificeDate` values: 66 full dates, 14 ranges, 7 with a bracketed note, 3 that are not dates ("Kháng chiến chống Mỹ (Khu 5)"). A collective row prints "— – 28/08/1959 – 1960". See 3B |
| N12 | `DESIGN.md` is out of date | Says 16 battles, 3 views, body 15.5px and also 16px, "56px sticky app bar", "280px compact map above the panel", 4th sub-tab "So sánh & Nguồn". See Pass 5 |
| N13 | Tablet | At 820px the header is 261px, the map a fixed 640px, and with a battle selected the panel starts at 990px, below the fold. See 6A, 6B |
| N14 | Verification levels are asserted, not recorded | 79 of 93 records are L4 and 52 carry confidence 0.99 or 1.0. All 93 come from `scripts/seed_*.py`. `README.md` says every record was "đối chiếu trực tiếp". No field says who checked what, or when. L4 in the PRD means an official record was matched; the build cannot show that it was. See 3A and Pass 3 note |
| N15 | Awards are on every record and carry no source | All 93 records have an `awards` array; 78 are tagged Anh hùng LLVTND. Entries have `awardId`, `citationLabel`, `awardedYear` (often `null`), `isPosthumous`; none has a decision number, date or source. The filter chip "Huân chương & Giải thưởng (93)" filters nothing. A state honour printed on a named person's record with no citation is the same class of problem as an invented date (2A). Decision 3F |
| N16 | The new view is long and mostly not about people | `#/nghia-trang` is 9,879px at 1024px and 20,464px at 375px: 15 cemetery cards (9 photographs), then 8 award groups. It reports "86.997+ phần mộ", a sum of rounded figures printed as an exact count |
| N17 | Six sources are `http://` only | sknc.qdnd.vn 6, diadaocuchi.com.vn 5, thongtinlietsi.gov.vn 4, chinhsachquandoi.gov.vn 3, dsvh.gov.vn 1. From the GitHub Pages (https) build these open with a browser warning or not at all. A person checks each for an https address |

### Still open from the first review

- E1: Lê Văn Huỳnh. Data says he died 02/01/1973 and wrote the letter 11/09/1972; PRD §5.4 and the PRD wireframe say he died 11/09/1972. One of the two is wrong (decision 3B).
- E2: confidence percent on every badge (decision 3A).
- E8, E13: the battle theater canvas and Wikipedia box were removed with the old views; closed.
- No way to report an error or add information (decision 3E): 0 `mailto:` links in the build.

## NOT in scope

- **Moderated contribution form** (PRD phase 2). Deferred by D12; the email link covers this round. In `TODOS.md`.
- **Human verification of all 93 records** (dates, wartime texts, award sources). Data work, not design; the design already shows what is unchecked (3A, 3B, 3C, 3F). In `TODOS.md`. Only Lê Văn Huỳnh's date and the 7 texts are checked this round (T19).
- **Paging the Liệt sĩ list.** Deferred by D19 until about 150 records. In `TODOS.md`.
- **Mockups.** The gstack designer has no image API key; the review is text-only.
- **Phiên hiệu unit graph redesign.** Only its targets (T17) and the one-line unit codes (4B, T22) are touched.
- **Map tile vetting beyond today's no-label tiles.** E10 is fixed; no further tile work.

## TODOS (written to `TODOS.md`)

1. Moderated contribution form (from 3E / D12).
2. Human verification pass over every record's date, wartime text and award sources, plus a working source for the 4 records that cited the dead `thongtinlietsi.gov.vn` and https addresses for diadaocuchi.com.vn and chinhsachquandoi.gov.vn (from 3B, 3C, 3F, 2B, N17 / D10, D18, D21).
3. Page the Liệt sĩ list once it passes about 150 records or a 15,000px phone page (from 6C / D19).

## Implementation Tasks

Synthesized from this review's findings. Each task derives from a specific decision or finding above. Function names are cited instead of line numbers, because `js/app.js` changed twice during the review. Effort assumes the human ÷ CC ratio for features (~30x) on UI work and ~20x on fixes; data tasks include a re-run of `scripts/build_database.py`. Every decision is settled; the only open input is the owner's `CONTACT_EMAIL` address (leave it empty).

**Order:** data first (T1–T5), then routes and navigation (T6–T10), then layout (T11–T15), then polish and docs (T16–T19). Re-measure at 320, 375, 820 and 1024px after each group.

- [ ] **T1 (P1, human: ~6h / CC: ~30min)** — data + record — Structured death dates
  - Surfaced by: 3B, N11, E1
  - Files: `scripts/seed_*.py`, `scripts/build_database.py`, `db/schema.sql`, `server.py`, `data/battles_and_martyrs.js` (generated), `js/app.js` (`openMartyrModal`, `renderAllMartyrsTable`, `computeGroupedSearchResults`)
  - Do: replace `sacrificeDate` with `deathDate`, `deathDatePrecision`, `deathDateEnd`, `deathDateNote`, `dateVerified`; move bracketed prose into the note; map the 3 non-dates to `unknown`; 14 ranges to `range`; Lê Văn Huỳnh shows "đang đối chiếu" until `dateVerified`.
  - Verify: no rendered date contains "(" ; "Kháng chiến chống Mỹ (Khu 5)" reads "Chưa rõ ngày hy sinh" with the note under it; a range reads "trong khoảng…"; the collective row no longer prints "— – 28/08/1959 – 1960".
- [ ] **T2 (P1, human: ~4h / CC: ~20min)** — record, list, search — Verification badge in words, no percent, legend
  - Surfaced by: 3A, E2, N14
  - Files: `js/app.js` (`formatVerificationBadge`, `openMartyrModal`, `computeGroupedSearchResults`, `renderAllMartyrsTable`), `css/styles.css`
  - Do: four badge texts; source name beside the badge on the record; remove every percent and the `|| "L3"` / `0.9` fallbacks; badge opens the shared popover / sheet legend (Esc closes, keyboard reachable).
  - Verify: search "E66" and open a record: no "%" anywhere on screen; a record with `level` removed reads "Chưa xác minh" in muted style.
- [ ] **T3 (P1, human: ~2h / CC: ~10min)** — record — Remove the five invented values
  - Surfaced by: 2A "No invented values"
  - Files: `js/app.js` (`openMartyrModal`, record-normalising code near the top, `formatVerificationBadge`)
  - Do: drop the "1954–1975", "Tổ quốc ghi công", default source name, level-derived award line and L3/90% defaults; unknown prints "Chưa rõ" or the row is omitted.
  - Verify: blank `birthYear`, `award`, `sourceName` on one record in the browser console, reopen: each reads "Chưa rõ" or is absent.
- [ ] **T4 (P1, human: ~4h / CC: ~20min)** — data + record + filters — Awards print only with a source
  - Surfaced by: 3F, N15
  - Files: `scripts/seed_cemeteries_awards.py`, `scripts/build_database.py`, `db/schema.sql`, `server.py`, `js/app.js` (`openMartyrModal`, Liệt sĩ filter chips, `renderAllMartyrsTable`)
  - Do: add `sourceName`, `sourceUrl`, `decisionRef`, `decisionDate`, `awardVerified`; print only sourced awards; chips count printable awards and hide at 0; "Danh hiệu tập thể" on collectives; never print a null year.
  - Verify: with today's data no record shows an award and the two award chips are hidden; add a `sourceName` to one award in the console: it prints with "Nguồn:" and the chip shows "(1)".
- [ ] **T5 (P1, human: ~4h / CC: ~20min)** — data + record — Label every wartime text
  - Surfaced by: 3C, N10
  - Files: seed scripts, `scripts/build_database.py`, `db/schema.sql`, `js/app.js` (`openMartyrModal`, battle panel Liệt sĩ tab)
  - Do: replace `letterText` with the 3C object (`kind` incl. `tho`, `writtenDate`, `addressee`, `extent`, `text`, `editorNote`, `sourceName`, `sourceUrl`, `heldAt`, `textVerified`); title built from data; editor notes outside the text block; "Bản chép lại, chưa đối chiếu bản gốc" while unverified; 3-line preview plus "Đọc toàn bộ" in the panel.
  - Verify: Nguyễn Văn Thạc's text no longer contains "lời tiên tri"; it appears as "Ghi chú của ban biên tập: …" under the text; Đặng Thùy Trâm's title starts "Nhật ký".
- [ ] **T6 (P1, human: ~3h / CC: ~15min)** — search + list — Not-found block with the live count
  - Surfaced by: 2A, V8
  - Files: `js/app.js` (`handleSearchInput`, `computeGroupedSearchResults`, `renderAllMartyrsTable`)
  - Do: the three-part block; "<N>" from `getAllMartyrsFlat().length`; "Tra theo phiên hiệu đơn vị" action; the 2B official routes (VNeID steps as text, the chinhsachquandoi.gov.vn link marked "trang http"); report link from T7. Remove every `thongtinlietsi.gov.vn` link: site menu in `index.html`, `renderSelectedBattlePanel`, and the 4 records' `sourceUrl` in the seed scripts.
  - Verify: search "Nguyễn Văn Khôngcó" in the top bar and in the Liệt sĩ list: both show "Atlas mới ghi nhận 93 hồ sơ…" and the VNeID line; with 94 records the number changes without a code edit; `grep -r thongtinlietsi index.html js data scripts` finds nothing.
- [ ] **T7 (P1, human: ~2h / CC: ~10min)** — record, panel, not-found — "Báo sai sót / Bổ sung thông tin" email link
  - Surfaced by: 3E
  - Files: `js/app.js` (new `CONTACT_EMAIL` constant, `openMartyrModal`, Tư liệu & Nguồn tab, not-found block)
  - Do: `mailto:` with pre-filled subject and body; privacy line; "Sao chép mã hồ sơ"; render nothing while `CONTACT_EMAIL` is empty. Leave it empty: the owner fills it in (D25).
  - Verify: with the constant empty, `document.querySelectorAll('a[href^=mailto]').length` is 0; set it in the console and reopen a record: the link's subject contains the record id.
- [ ] **T8 (P1, human: ~6h / CC: ~30min)** — routing + record — Each record has its own route
  - Surfaced by: 1E, V1
  - Files: `js/app.js` (`applyRouteFromHash`, `syncHashFromState`, `executeComboboxOption`, `openMartyrModal`, list row handlers), `css/styles.css`
  - Do: `#/liet-si/<martyrId>`; dialog at 768px and up, full page below; Back closes; reload reopens; `document.title` = "<Họ tên> · Ký Ức Việt Nam Atlas"; "Sao chép liên kết"; last action "Xem trận <tên> trên bản đồ" to `#/ban-do/<battleId>/liet-si`; focus returns to the opener (already works, keep it).
  - Verify: open Lê Xuân Phôi from search: hash is `#/liet-si/ls-le-xuan-phoi-ia-drang`; reload reopens it; Back closes it; at 375px it is a full page, not a 337px box.
- [ ] **T9 (P1, human: ~3h / CC: ~15min)** — routing — Back steps through the app; sub-tab in the route
  - Surfaced by: V2, V3, 1D
  - Files: `js/app.js` (`syncHashFromState`, `renderBattleSubTabContent`, `applyRouteFromHash`)
  - Do: `pushState` for view, battle, record and sub-tab changes; `replaceState` only while typing a query or moving a filter; write `#/ban-do/<battleId>/<tab>`.
  - Verify: select a battle, open "Liệt sĩ", open a record: `history.length` grows by 3; Back three times returns to the start state; a copied `…/luc-luong` link opens that tab.
- [ ] **T10 (P1, human: ~1.5d / CC: ~1h)** — navigation + map panel — Fold the fourth view into the map and the record
  - Surfaced by: 1F, V10, N16
  - Files: `index.html` (`#view-tabs`, `#view-nghia-trang`), `js/app.js` (`switchMainView`, `applyRouteFromHash`, `renderCemeteriesAndAwardsView`, `renderStartStatePanel`, map cemetery layer, `openMartyrModal`), `css/styles.css`
  - Do: three tabs; `#/nghia-trang` redirects; cemetery panel at `#/ban-do/nghia-trang/<cemeteryId>`; "Tìm theo nghĩa trang" list on the start state; award explanation via the shared popover; no "86.997+" total.
  - Verify: at 320px all three tabs are visible with no horizontal scroll in the tab row (`scrollWidth === clientWidth`); tap Đồi 82 on the map: the panel lists its 4 records; the old URL lands on `#/ban-do`.
- [ ] **T11 (P1, human: ~4h / CC: ~20min)** — battle panel — Header and fourth sub-tab per 1D
  - Surfaced by: 1D, V4, V5
  - Files: `js/app.js` (`renderSelectedBattlePanel`, `renderBattleSubTabContent`)
  - Do: header = name, dates, place, one source line, close; 4th tab "Tư liệu & Nguồn" with citations and links from the battle's own source fields; comparison becomes "So sánh với…" in Tổng quan; each citation appears once. Sub-tabs per 1G: 2×2 grid of 44px tabs under 768px, panel 500px wide at 1024px and up; fill `aria-controls` on each tab.
  - Verify: header before the tabs is at most 160px at 1024px and 200px at 375px (349px and 357px today); the battle's source title appears once in the panel text; the tab list's `scrollWidth === clientWidth` at 320, 375 and 1024px (487px in 349px and 402px today); every tab's `aria-controls` names an existing panel.
- [ ] **T12 (P1, human: ~4h / CC: ~20min)** — layout — Phone and tablet order with the locator map
  - Surfaced by: 6A, N2, N13
  - Files: `css/styles.css` (`#map-panel:not(.is-start-state)` order rule), `js/app.js` (`drawVietnamCanvasMap`, `initLeafletMap`, a `#/ban-do/<battleId>/ban-do` route)
  - Do: under 768px a 200px locator above the header; one "Mở bản đồ" button; drag scrolls the page; 320px map at 768–1023px; start state unchanged.
  - Verify: at 375px with a battle selected, the locator map starts within 120px of the page top and the battle name within 360px (today the map starts at 2,578px, below a 2,349px panel); at 820px the panel starts above 700px (990px today).
- [ ] **T13 (P1, human: ~4h / CC: ~20min)** — header — Only the tabs row pinned on phones; one search field per screen
  - Surfaced by: 6B, N1, N3
  - Files: `index.html` (`#app-bar`), `css/styles.css`, `js/app.js` (`toggleMobileSearch`, `toggleMapFilters`)
  - Do: 48px sticky tabs row with a 44px search icon; search opens as a full-width row with "Đóng"; hidden header search on the start state; filters disclosure above the map on `#/ban-do` only; sub-tab row sticky at `top: 48px`; tablet bar one row of at most 64px.
  - Verify: pinned height 48px on the start state and 136px inside a battle at 320 and 375px (200px today); 64px or less at 820px (261px today); only one search input visible on the start state at 375px.
- [ ] **T14 (P1, human: ~4h / CC: ~20min)** — Liệt sĩ list — Stacked name-first rows under 768px
  - Surfaced by: 6C, N4
  - Files: `css/styles.css`, `js/app.js` (`renderAllMartyrsTable`), `index.html` (sort `<select>`)
  - Do: CSS switch on the same table; three lines per row; whole row links to `#/liet-si/<id>`; "Sắp xếp" select; "Đặt lại bộ lọc" 44px; desktop table kept without "%".
  - Verify: at 375px rows are at most 96px tall and 93 records are under 9,500px (41,989px today); the table does not scroll sideways (670px in 351px today).
- [ ] **T15 (P1, human: ~1d / CC: ~40min)** — map — Numbered markers; sovereignty labels always legible
  - Surfaced by: 6D, N5, N6, PRD guardrail 2
  - Files: `js/app.js` (`drawVietnamCanvasMap` label placement and `placedBoxes`, `initLeafletMap`, battle strip render, `bindMapCanvasInteractions`), `css/styles.css`
  - Do: numbers 1–N in date order on markers and in the strip; one name at a time; markers closer than 28px merge into a count marker with a list; sovereignty labels drawn last in reserved boxes added to the collision list first; zoom controls to bottom-left; accessible names include the number.
  - Verify: screenshots at 320, 375, 820, 1024 and 1440px in both themes show "Quần đảo Hoàng Sa (Việt Nam)" and "Quần đảo Trường Sa (Việt Nam)" whole and uncovered; no two battle name boxes are drawn at once unless one is selected.
- [ ] **T16 (P2, human: ~2h / CC: ~10min)** — search — Structured person rows
  - Surfaced by: 1C, V7
  - Files: `js/app.js` (`computeGroupedSearchResults`, `handleSearchInput`), `css/styles.css`
  - Do: name; birth–death years; hometown · unit; badge words. Wraps, never truncates.
  - Verify: at 320px "E66" person rows are at most 110px tall (141–270px today); three results fit above the fold.
- [ ] **T17 (P2, human: ~2h / CC: ~10min)** — all views — Targets of at least 44px
  - Surfaced by: N7 and the adopted 44px rule
  - Files: `css/styles.css`, `index.html`
  - Do: battle strip buttons, Liệt sĩ chips and selects, top search at desktop, dialog actions, Phiên hiệu chips.
  - Verify: in each view at 375px, `[...document.querySelectorAll('button,a,select,input')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height<44).length` is 0 (139 in Liệt sĩ, 18 in Phiên hiệu today).
- [ ] **T18 (P2, human: ~1h / CC: ~5min)** — docs — Bring `DESIGN.md` in line with the approved decisions
  - Surfaced by: Pass 5, N12
  - Files: `DESIGN.md`
  - Do: every row of the Pass 5 table.
  - Verify: `DESIGN.md` names three views, 16px body, the 200px locator, 48px pinned tabs, "Tư liệu & Nguồn", numbered markers and the four badge texts, and no fixed battle count.
- [ ] **T19 (P1, human only: ~1d)** — content — The human checks this round depends on
  - Surfaced by: 3B (E1), 3C, 2A, N17
  - Files: `scripts/seed_*.py`, PRD (`PRD_Ban_Do_Ky_Uc_Tran_Danh_Liet_Si.md` lines 228 and 274 if the PRD is the one that is wrong), `README.md`
  - Do: a person confirms Lê Văn Huỳnh's death date from the cited source and corrects whichever document is wrong; compares the 7 texts with their originals and sets `textVerified`; re-checks the 2B routes (VNeID wording, chinhsachquandoi.gov.vn) just before release; rewords `README.md`'s "đối chiếu trực tiếp" and "nguyên văn" to match what has actually been checked.
  - Verify: each changed record has `dateVerified` / `textVerified` true with the checker's note; `README.md` makes no verification claim the data does not record.
- [ ] **T20 (P2, human: ~1h / CC: ~5min)** — Liệt sĩ list — Show a carried search as a removable chip
  - Surfaced by: 2C (D23), N8
  - Files: `js/app.js` (`renderAllMartyrsTable`, `handleSearchInput`, `switchMainView`), `css/styles.css`
  - Do: when the shared query filters a view it was not typed in, show "Đang lọc: <query> ×" (44px, `aria-label="Bỏ lọc <query>"`) above the count; tapping it clears the query everywhere.
  - Verify: type "E66" on Bản đồ, open Liệt sĩ: the chip shows beside "5 / 93 hồ sơ"; tap ×: "93 / 93 hồ sơ" and the top search is empty.
- [ ] **T21 (P2, human: ~30min / CC: ~5min)** — data — Use https where the source host supports it
  - Surfaced by: 2B, N17
  - Files: `scripts/seed_*.py`, then `scripts/build_database.py`
  - Do: switch `sknc.qdnd.vn` (2 URLs) and `dsvh.gov.vn` (1 URL) to https; both answered 200 over https on 2026-11-12. Leave `diadaocuchi.com.vn` and `chinhsachquandoi.gov.vn` on http (https refused); they are on TODO 2.
  - Verify: `grep -o 'http://[^"]*' data/battles_and_martyrs.js` lists only diadaocuchi.com.vn and chinhsachquandoi.gov.vn.
- [ ] **T22 (P2, human: ~30min / CC: ~5min)** — start screen + Phiên hiệu — Remove the tagline; one line of unit codes
  - Surfaced by: 4A (D22), 4B (D24), N9
  - Files: `js/app.js` (`renderStartStatePanel`; `renderUnitDecoderList` and the `historyNote` it builds from `UNIT_AUTHORITY_DICT`), `css/styles.css` (`.opening-kicker`)
  - Do: delete the `opening-kicker` line and its CSS; merge the two code lines into one "Phiên hiệu trên giấy báo tử:" line with each code once.
  - Verify: `grep -c opening-kicker js/app.js css/styles.css` is 0; on `#/phien-hieu` no unit shows the text "Các phiên hiệu tương đương".
- [ ] **T23 (P2, human: ~2h / CC: ~10min)** — all views — Skip link, then the post-build checks
  - Surfaced by: 6E
  - Files: `index.html`, `css/styles.css`
  - Do: add "Bỏ qua tới nội dung chính" as the first focusable element, visible on focus, targeting `<main>`. After T1–T22 land, run `/design-review` on the live build: a VoiceOver pass on iOS and macOS through search → record → share → report, plus a look at motion and shadows (Pass 4) and the 6D marker-number contrast.
  - Verify: the first Tab on any view focuses the skip link and Enter moves focus into `<main>`; the `/design-review` report lists no P1 findings.

## Design Review Completion Summary

```
  +====================================================================+
  |         DESIGN PLAN REVIEW — COMPLETION SUMMARY                    |
  +====================================================================+
  | System Audit         | DESIGN.md written by the other agent, stale |
  |                      | vs approved decisions; UI scope: 4 views +  |
  |                      | record dialog; build changed mid-review     |
  | Step 0               | 4/10; all 7 passes                          |
  | Pass 1  (Info Arch)  | 3/10 → 9/10 after fixes                     |
  | Pass 2  (States)     | 2/10 → 9/10 after fixes                     |
  | Pass 3  (Journey)    | 3/10 → 9/10 after fixes (7/10 until T19)    |
  | Pass 4  (AI Slop)    | 3/10 → 9/10 after fixes                     |
  | Pass 5  (Design Sys) | 2/10 → 9/10 after fixes (T18)               |
  | Pass 6  (Responsive) | 4/10 → 9/10 after fixes                     |
  | Pass 7  (Decisions)  | 7 resolved, 0 deferred                      |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (6 items)                           |
  | What already exists  | written                                     |
  | TODOS.md updates     | 3 items added                               |
  | Approved Mockups     | 0 generated, 0 approved (no image API key)  |
  | Decisions made       | 21 added to plan                            |
  | Decisions deferred   | 0                                           |
  | Overall design score | 2/10 → 9/10                                 |
  +====================================================================+
```

Decisions made (21): 1A, 1B, 1C, 1D, 1E, 1F, 1G, 2A, 2B, 2C, 3A, 3B, 3C, 3E, 3F, 4A, 4B, 6A, 6B, 6C, 6D. Not counted: D1 and D2 (scope, outside voice), D19 (paging TODO), D25 (the owner supplies the contact address). 6E records checks, not a choice.

Every rated pass is 9/10 once the 23 tasks ship. Two things remain outside the design: the owner's `CONTACT_EMAIL` address (the report link stays hidden until it is set), and the human checks in T19, without which Pass 3 stays at 7/10.

### Unresolved Decisions

None. Inputs still owed: the `CONTACT_EMAIL` address (owner), and the human checks in T19 and TODO 2.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Outside Review | native Claude subagent (Codex not installed) | Independent 2nd opinion | 1 | unavailable (Codex); native completed | 3 hard rejections, 7 litmus NO; findings verified in code |
| Eng Review | `/autoplan` | Architecture & tests (required) | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 2 | clean | score: 2/10 → 9/10, 21 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **OUTSIDE COVERAGE:** Codex, design phase, unavailable (CLI not installed). A native Claude subagent ran in its place; that does not count as outside coverage.
- **VERDICT:** Design review CLEAR (plan). Eng review required before implementation.

NO UNRESOLVED DECISIONS
