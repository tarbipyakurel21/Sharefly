# Demo script (about 2 minutes)

**Setup**: `cp .env.example .env.local` (keep `DEMO_MODE=true`), `npm run demo:reset`, `npm run dev`.
For a network-free demo use `AI_PROVIDER=mock` (title/category come from the file name; the UI never claims AI looked at the photo).
Upload file: `public/seed/demo-desk.jpg`. Switch people from the account menu (top right) → "Demo: switch person".

| Step | Who | Do | Expect |
|---|---|---|---|
| 1 | Maya Chen | Wishlists → type "a desk for my bedroom, under $30, within 5 miles" → Save | "Saved. Nothing matches yet…" and chips: desk, Up to $30, Within 5 mi |
| 2 | Maya | Rooms → Length 12, Width 10, Height 8 (feet) → Create my room | 3D room appears; reload keeps it |
| 3 | Jordan Rivera | Give something away → choose `demo-desk.jpg` | Title "Desk", category Desk, short description. No condition, brand or size invented |
| 4 | Jordan | Publish (nothing else filled in) | "Thank you! It's up." and "1 person nearby is looking for something like this" |
| 5 | Maya | Bell shows 1 → Matches | Card for Desk, reasons: Matches "desk", Free, within your budget, Just listed |
| 6 | Maya | Open it → Preview in my room | Desk in her room, dashed/transparent, "Typical desk size. Actual size not confirmed.", fit "Can't confirm fit yet" |
| 7 | Maya | Drag, rotate (R), nudge arrows, Remove → Undo | Cannot leave the walls; overlap warning appears when pieces collide; "Saved" |
| 8 | Maya | Request measurements; then Request pickup help (drop-off: Princeton University Campus) | Notification to Jordan; open RideBoard request |
| 9 | Jordan | Open the desk → add Width 4, Depth 2, Height 2'6" → Save size | Maya is notified; her desk becomes confirmed, fit reads "Fits your room" |
| 10 | Sam Okafor | RideBoard → I can help → Send offer | Request moves to "A driver offered" |
| 11 | Maya | RideBoard → Accept Sam → Mark as picked up | "Driver confirmed" then "Picked up". Jordan can then Mark as given away |

Reverse direction: as Dana Whitfield, save a wishlist "a tall bookshelf". It immediately finds Jordan's existing bookshelf.

Automated version of steps 1-11: `npm run test:e2e` (runs against its own database `data/e2e.db`).

## If something breaks live
- No network / AI slow: restart with `AI_PROVIDER=mock`, or just type a title; publishing never depends on AI.
- Messy state: `npm run demo:reset`.

## Real apartment path (needs `npm run import:costar` and `REFERENCE_SPACES_PROVIDER=costar`)
1. Open Rooms, under "Start from a real apartment" filter by city, bedrooms, max rent, or "Near a college".
2. Pick a floor plan. The form fills with an estimated size and the note "Estimated from a X sq ft floor plan, adjust to your room".
3. Edit the numbers if you know them, then create the room. The room page shows the community, floor plan and "Data: CoStar".
