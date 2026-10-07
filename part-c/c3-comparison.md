# C3. Two implementations, same inputs

Run with `npm install && npm run compare` ([`compare.ts`](compare.ts)).

## Status

**Incomplete.** The AI implementation has been run against all eleven inputs. My own implementation (Part B2, written without AI) is not written yet, so its column says "not implemented" and there is no two-implementation comparison yet.

## Results so far: AI implementation against the hand-traced pseudocode

| # | distance | subtotal | items | orderedAt (UTC) | traced from pseudocode | AI implementation | my implementation | agree |
|---|---|---|---|---|---|---|---|---|
| 1 | 4500 | 800000 | 3 | 2026-10-07T14:00:00Z | 80000 standard | 80000 standard | not implemented | yes |
| 2 | 7200 | 600000 | 12 | 2026-10-07T18:30:00Z | 160000 peak | 160000 peak | not implemented | yes |
| 3 | 2000 | 200000 | 1 | 2026-10-07T22:00:00Z | 75000 night | 75000 night | not implemented | yes |
| 4 | 5000 | 1500000 | 12 | 2026-10-07T18:00:00Z | 0 peak free | 0 peak free | not implemented | yes |
| 5 | 3000 | 500000 | -1 | 2026-10-07T14:00:00Z | error INVALID_ITEM_COUNT | error INVALID_ITEM_COUNT | not implemented | yes |
| 6 | 15001 | 2000000 | 2 | 2026-10-07T09:00:00Z | error OUT_OF_RANGE | error OUT_OF_RANGE | not implemented | yes |
| 7 | 2001 | 0 | 10 | 2026-10-07T11:00:00Z | 75000 peak | 75000 peak | not implemented | yes |
| 8 | 0 | 0 | 11 | 2026-10-07T23:30:00Z | 95000 night | 95000 night | not implemented | yes |
| 9 | 5001 | 1500000 | 1 | 2026-10-07T20:30:00Z | 90000 standard | 90000 standard | not implemented | yes |
| 10 | 2500.5 | 100000 | 1 | 2026-10-07T14:00:00Z | error INVALID_DISTANCE | error INVALID_DISTANCE | not implemented | yes |
| 11 | 14001 | 100 | 1 | 2026-10-07T04:59:00Z | 270000 night | 270000 night | not implemented | yes |

Inputs 1 to 6 are the ones hand-traced in Part B. Inputs 7 to 11 are new.

## How the expected values for the new inputs were traced

| # | Trace |
|---|---|
| 7 | Lagos 12:00, peak. 2,001 is above 2,000: extra 1, one block, fee 60,000. × 1.25 = 75,000. 10 items is not above 10. Already a multiple of 5,000. |
| 8 | Lagos 00:30 (UTC hour 23 + 1 = 24, wraps to 0), night. Distance 0: fee 50,000. × 1.5 = 75,000. 11 items: + 20,000 = 95,000. |
| 9 | Lagos 21:30, standard. Subtotal qualifies but 5,001 is above 5,000: not free. Extra 3,001, four blocks, fee 90,000. |
| 10 | 2,500.5 is not a whole number: INVALID_DISTANCE at step 1. |
| 11 | Lagos 05:59, night. Extra 12,001, thirteen blocks, fee 180,000. × 1.5 = 270,000. |

## To complete this file

1. Write `part-b/my-implementation.ts` without AI.
2. Run `npm run compare` and paste the new table here.
3. For every row marked **NO**: trace the pseudocode for that input, say which implementation is wrong and at which step, and record it below.

### Disagreements found

_None recorded yet: the second implementation does not exist._
