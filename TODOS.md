# TODOS

Deferred work from the design review in `DESIGN_REVIEW_ANTIGRAVITY.md` (2026-11-12). Each item was deferred by an explicit decision in that review.

## 1. Moderated contribution form

- **What:** A form where families submit a correction or a missing record, held for a person to review before anything is published.
- **Why:** PRD phase 2. Families are the people most likely to hold the missing facts.
- **Pros:** Lower effort for families than email; structured fields make checking faster.
- **Cons:** Needs a backend that accepts writes (today `server.py` is GET-only), moderation, spam handling and a privacy policy (PRD guardrail 4).
- **Context:** Decision 3E (D12) ships a `mailto:` link this round. The form replaces it later.
- **Depends on:** An owner-supplied `CONTACT_EMAIL` and someone named to moderate.

## 2. Human verification pass over every record

- **What:** A person checks each record's death date, wartime text and each award against a cited source, and sets `dateVerified`, `textVerified`, `awardVerified`; also finds a working source for the 4 records that cited `thongtinlietsi.gov.vn` (the domain no longer exists, checked 2026-11-12) and https addresses for diadaocuchi.com.vn and chinhsachquandoi.gov.vn (both refuse https today; sknc.qdnd.vn and dsvh.gov.vn are switched in task T21).
- **Why:** All 93 records came from seed scripts; 79 are marked L4 and no field records who checked what. Unsourced awards stay hidden until sourced (3F).
- **Pros:** The site can then say "đã đối chiếu" truthfully; awards reappear with their sources.
- **Cons:** Slow, manual, needs access to archives and museum records.
- **Context:** Decisions 3B (D10), 3C, 3F (D18), 2B (D21). Lê Văn Huỳnh's date and the 7 texts are done this round (task T19); this item covers everything else.
- **Depends on:** T1, T4, T5 (the fields must exist first).

## 3. Page the Liệt sĩ list

- **What:** Render the first 30 rows, then a "Xem thêm 30 hồ sơ" button (not infinite scroll).
- **Why:** With 6C's short rows, 93 records are about 9,000px on a phone; a few hundred records would pass 30,000px again.
- **Pros:** Short page regardless of dataset size.
- **Cons:** Changes how people scan by scrolling; needs a placement decision relative to filters and sort.
- **Context:** Decision D19. Trigger: about 150 records, or a phone page past 15,000px.
- **Depends on:** T14 (stacked rows).
