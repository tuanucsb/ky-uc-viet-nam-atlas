# Ký Ức Việt Nam Atlas: Design System

Source: decisions approved 2026-11-10 to 2026-11-13 in `DESIGN_REVIEW_ANTIGRAVITY.md` (decision ids in brackets).
Tokens live in `css/styles.css` and the `tailwind.config` block in `index.html`.
Use tokens only; no new raw hex values in markup.

## Purpose, audience, and tone

A Vietnamese memorial and historical archive of the campaigns and battles of the Vietnam War (1954–1975) and the martyrs (*Liệt sĩ*) who fell in them. The number of battles and records changes with the data; nothing in the UI hard-codes a count.
- **Primary audience:** Families of fallen soldiers searching for where a relative fought and died (often starting from a unit code on a wartime death notice, *Giấy báo tử*), alongside students, historians, and veterans.
- **Tone:** Quiet, archival, and respectful: a memorial and historical reference, not a war game. No weapons iconography, no radar-pulse animations, no neon glow, no emoji in navigation, headings, filter pills, or buttons, and no mood copy above an action [4A].
- **Theme:** Dark (`#111611`) is the default for evening reading; light (`#eef0ea`, `html.light-theme`) is one toggle away, honours `prefers-color-scheme` on first visit, persists in `localStorage`, and recolours both DOM surfaces and canvases.

## Honesty rules

- **No invented values [2A].** Unknown reads "Chưa rõ". No default dates, awards, sources or verification levels.
- **Verification badge in words [3A]:** L4 "Hồ sơ chính thức", L3 "Đối chiếu đơn vị", L2 "Gợi ý, chưa xác nhận", none "Chưa xác minh". The code (L4, L3) may follow in mono; it never stands alone. No percentages. On the record the badge is a button that opens the legend, followed by the source name.
- **Dates show their precision [3B]:** day "02/01/1973", month "tháng 8/1972", year "năm 1962", range "trong khoảng 28/04/1975 – 30/04/1975", unknown "Chưa rõ ngày hy sinh". Notes print on their own line. A disputed date shows "(đang đối chiếu)".
- **Wartime texts are labelled [3C]:** title from data ("Thư gửi mẹ, 19/07/1968"), "Toàn văn" or "Trích", "Bản chép lại, chưa đối chiếu bản gốc" until checked, editor notes outside the text block.
- **Awards print only with a source [3F].** Filters count sourced awards only; a filter at 0 is hidden.
- **Rounded figures say so:** "khoảng 15.000 phần mộ" [1F].

## Color tokens

| Token | Dark | Light | Contrast on `--card` | Use |
|---|---|---|---|---|
| `--surface` | `#111611` | `#eef0ea` | — | Page ground |
| `--surface-raised` (`--card`) | `#1a211a` | `#ffffff` | — | Panels, header, dialogs, tables |
| `--card-elevated` | `#243024` | `#e3e7dd` | — | Hover / active surface |
| `--text` (`--foreground`) | `#ecefe6` | `#1b2118` | ≥ 13.5:1 | Primary text |
| `--text-muted` (`--muted-foreground`) | `#a9b2a0` | `#4f5a4a` | ≥ 6.8:1 | Secondary copy, captions, "Chưa xác minh" badge |
| `--border-token` (`--border`) | `#2e3a2e` | `#c9cfc2` | — | Hairline dividers |
| `--accent` | `#f2a93b` | `#935a00` | ≥ 7.2:1 / ≥ 5.1:1 | Selection, active tab underline, focus ring, "Đối chiếu đơn vị" badge |
| `--side-a` | `#f4726a` | `#af261e` | ≥ 5.6:1 / ≥ 5.8:1 | Lực lượng Cách mạng (QĐNDVN / QGPMNVN / TNXP) |
| `--side-b` | `#629ef0` | `#1f5fbf` | ≥ 5.8:1 / ≥ 5.7:1 | Đối phương (Hoa Kỳ / QLVNCH & Đồng minh) |
| `--ok` | `#4cc38a` | `#2f7a52` | ≥ 7.4:1 / ≥ 5.2:1 | "Hồ sơ chính thức" badge (L4) |

**Map canvas palette** (`getCanvasPalette` in `js/app.js`) is its own token set: a blue-grey sea under a green-grey page is deliberate. All canvas text passes 4.5:1 against sea and land in both themes (lowest 5.56:1) [6E].

## Typography

- **UI & body:** `IBM Plex Sans` 400/500/600/700.
- **Memorial titles, martyr names & wartime texts:** `IBM Plex Serif` 400/600. Wartime texts sit behind a left hairline, no decorative quote marks, no italics for long text [3C].
- **Wordmark:** `Barlow Condensed` 600.
- **Dates, coordinates, unit codes & counts:** `IBM Plex Mono` (`font-variant-numeric: tabular-nums`).
- **Scale & floor:** 14 / 16 / 18 / 22 / 28px. Body and search text 16px (`line-height: 1.6`). Nothing in the DOM renders below 14px. Canvas labels never drop below 12.5px.
- **Casing:** Sentence case for all UI labels, tabs, buttons, and headings. No uppercase + letter-spacing labels.

## Information architecture & layout

1. **Three top-level views [1A, 1F]:** `Bản đồ`, `Liệt sĩ`, `Phiên hiệu`. Cemeteries are places on the map; awards belong to the person's record.
2. **Header [6B]:**
   - 1024px and up: one row (wordmark, tabs, search, theme), sticky, 64px.
   - 768–1023px: one row of at most 64px; search behind a 44px icon.
   - Under 768px: only the 48px tabs row is pinned, with a 44px search icon at its end; the wordmark row scrolls away. The start state hides the icon so "Tìm người thân" is the only search on screen.
3. **Period & region filters** sit directly above the map, inside the map card; collapsed behind "Giai đoạn & vùng chiến trường" on phones.
4. **First screen (`#/ban-do`) [1B]:** map plus a start state: "Tìm người thân" search, unit chips, three stories, "Tìm theo nghĩa trang" (all cemeteries; first 5 on phones), then the battle catalogue.
5. **Map [6D]:** numbered markers 1–N in date order, matching the numbered battle strip; one battle name at a time (selected or hovered); close markers merge into a count marker; "Quần đảo Hoàng Sa (Việt Nam)" and "Quần đảo Trường Sa (Việt Nam)" drawn last in reserved areas that no control or label covers; zoom controls bottom-left, "Lớp bản đồ" top-right.
6. **Battle panel [1D, 1G]:** header = name, dates · place, one source line, "Đóng". Four tabs: `Tổng quan`, `Lực lượng hai bên`, `Liệt sĩ (n)`, `Tư liệu & Nguồn`; ARIA tabs with arrow keys; the open tab is in the route (`#/ban-do/<id>/tong-quan|luc-luong|liet-si|nguon`). Panel 500px wide from 1024px so the tabs fit one line; under 768px the tabs are a 2×2 grid of 44px tabs, sticky under the tabs row (136px pinned at most).
7. **Cemetery panel [1F]:** same frame as a battle, at `#/ban-do/nghia-trang/<id>`: photo with credit, address, graves as the source states them, description, records buried there, source.
8. **Phone and tablet with a battle open [6A]:** a locator map above the details (200px under 768px, 320px at 768–1023px); one "Mở bản đồ" button to the full map at `#/ban-do/<id>/ban-do`.
9. **Record [1E]:** `#/liet-si/<id>`. Dialog from 768px, full screen below. Back closes it; reload reopens it; `document.title` is the person's name; "Sao chép liên kết" and "Sao chép mã hồ sơ"; last action "Xem trận … trên bản đồ".
10. **Search combobox [1C]:** grouped (`Liệt sĩ`, `Trận đánh`, `Nghĩa trang`, `Phiên hiệu`), up to 5 per group; person rows show name, years, hometown · unit and the badge in words. Unit shorthand (`F325`, `E66`, `D`, `C`) works in the dropdown and the list.
11. **Not found [2A, 2B]:** "Chưa có hồ sơ khớp với “…”", the live record count with "Không tìm thấy ở đây không có nghĩa là không có hồ sơ", "Tra theo phiên hiệu đơn vị", the official routes (VNeID steps; chinhsachquandoi.gov.vn marked "trang http"), and the report link.
12. **Liệt sĩ list [6C, 2C]:** desktop table; under 768px the same table lays out as name-first rows (name + years / hometown · unit / badge), the whole row a link. A search carried from another view shows as a removable "Đang lọc: … ×" chip.
13. **Report an error [3E]:** a `mailto:` link built from `CONTACT_EMAIL` in `js/app.js`; not rendered while that constant is empty.

## Shared components

- **Info sheet:** one `<dialog id="info-sheet">`, a popover on desktop and a bottom sheet on phones, used for the verification legend [3A] and award explanations [1F].
- **Targets:** 44px minimum (`.tap-target`) for every control; a skip link "Bỏ qua tới nội dung chính" is the first focusable element [6E].
