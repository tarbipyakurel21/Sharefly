# Demo script (about 2 minutes)

**Setup**: `cp .env.example .env.local` (keep `DEMO_MODE=true`), `npm run demo:reset`, `npm run dev`.
For a network-free demo use `AI_PROVIDER=mock` (title/category come from the file name; the UI never claims AI looked at the photo).
Upload file: `public/seed/demo-desk.jpg`. Switch people from the account menu (top right) → "Demo: switch person".

| Step | Who | Do | Expect |
|---|---|---|---|
| 1 | Priya | Rooms → pick a 3D apartment (or enter Length 12, Width 10, Height 8 ft) → Use this 3D room | Her room exists; reload keeps it |
| 2 | Priya | Browse: no dressing table. Wishlists → "a dressing table for my room" → Save | "Saved. Nothing matches yet…" (items already listed are not matched; only new uploads will be) |
| 3 | Hardika | Give something away → upload a photo of the dressing table (or chair) → Publish | Title and category suggested, nothing else invented; "1 person nearby is looking for something like this" |
| 4 | Hardika | Open the listing → 3D scan → add the Reality Composer `.usdz` | Scan shows; width, depth and height fill in from it (check them) |
| 5 | Priya | Bell shows 1 → Matches → open it | Card with reasons; the owner's 3D scan and size are shown |
| 6 | Priya | Choose a room to arrange it in | The scan sits in her room; fit reads "Fits your room" only because the size is confirmed |
| 7 | Priya | I'm interested | Hardika gets "Someone is interested". There is no in-app chat yet: they arrange the handover outside the app |

Reverse direction: as Dana Whitfield, save a wishlist "a tall bookshelf". It immediately finds Hardika's existing bookshelf.

Automated version of steps 1-11: `npm run test:e2e` (runs against its own database `data/e2e.db`).

## If something breaks live
- No network / AI slow: restart with `AI_PROVIDER=mock`, or just type a title; publishing never depends on AI.
- Messy state: `npm run demo:reset`.

## Real apartment path (needs `npm run import:costar` and `REFERENCE_SPACES_PROVIDER=costar`)
1. Open Rooms, under "Start from a real apartment" filter by city, bedrooms, max rent, or "Near a college".
2. Pick a floor plan. The form fills with an estimated size and the note "Estimated from a X sq ft floor plan, adjust to your room".
3. Edit the numbers if you know them, then create the room. The room page shows the community, floor plan and "Data: CoStar".
4. With Matterport credentials configured, choose a usable measured room; otherwise the editable estimate remains available.
