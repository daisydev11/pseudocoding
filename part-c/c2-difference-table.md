# C2. Difference table

Left: the pseudocode the AI was given ([`c1-prompt-given-to-ai.md`](c1-prompt-given-to-ai.md)).
Right: pseudocode written from the AI's code, without the original in view ([`reverse-engineered.pseudocode.md`](reverse-engineered.pseudocode.md)).

## Side by side

| Step | Specified | What the code does | Same? |
|---|---|---|---|
| Inputs | four inputs; `orderedAt` is "a moment in time" | four positional numbers and a JavaScript `Date` | **differs**, row 1 below |
| 1 to 3 | not a whole number, or below zero / below one → error | same test. Numeric text, NaN and Infinity all count as "not a whole number" | same |
| 4 | not a valid moment → INVALID_TIME | not a `Date` object, or a `Date` holding an invalid time → INVALID_TIME | **differs**, row 1 |
| 5 | above 15,000 → OUT_OF_RANGE | same; 15,000 allowed | same |
| Errors | "RETURN error X" | returns an object `{ error: code }`; never throws | **differs**, row 2 |
| 6 | band from timeBand | same | same |
| 7 | subtotal ≥ 1,500,000 AND distance ≤ 5,000 → fee 0, free | same, both boundaries inclusive | same |
| 8, 9 | 50,000; above 2,000 add 10,000 per started 1,000 | same, rounds blocks up | same |
| 10 | peak × 125 / 100, night × 150 / 100, rounded down | same | same, see row 5 |
| 11 | more than 10 items → add 20,000 | same, after the multiplier | same |
| 12 | round up to next 5,000 | same | same |
| 13 | return fee, "NGN", band, free false | same | same |
| timeBand 1 to 7 | UTC hour + 1, wrap 24 to 0; 12, 13 peak; 18 to 20 peak; 22, 23, 0 to 5 night; else standard | same | same |
| timeBand, invalid input | not specified | no check; an invalid date returns "standard"; a non-date throws a type error | **differs**, row 3 |
| Extras | none specified | four exported type names; `timeBand` is exported | **differs**, row 4 |

## Every difference, classified

| # | Difference | Class | Verdict |
|---|---|---|---|
| 1 | "A moment in time" became "only a `Date` object". ISO text such as `"2026-10-07T12:00:00Z"` and timestamps are refused with INVALID_TIME. | **Ambiguity in my pseudocode** | Mine to fix. I never said what form the moment arrives in. Fixed in the specification: "given as a date-and-time object (not text, not a number)". |
| 2 | "RETURN error X" became a returned object `{ error: "X" }`, not a raised exception. | **Ambiguity in my pseudocode** | Mine to fix. "Return an error" reads both ways, and the two readings need different calling code. Fixed: "RETURNED as an object holding only the error code; nothing is raised". |
| 3 | `timeBand` given an invalid date returns "standard". | **Ambiguity in my pseudocode** (I was silent) | Harmless through `calculateDeliveryFee`, which refuses invalid dates first. Wrong if someone calls `timeBand` directly. Fixed in the specification by stating the precondition. |
| 4 | Exported type names (`Band`, `DeliveryFee`, `DeliveryFeeError`, `DeliveryFeeErrorCode`) and an exported `timeBand`. | **Added by the AI** | Welcome. They add no behaviour, and the types are how a TypeScript caller tells the two results apart. |
| 5 | Nothing was left out. All 13 steps and all 7 `timeBand` steps are present, in order. | **Omitted by the AI** | None found. |

## What reading the code back taught me about my own specification

These are not differences between the two. They are things that were in my pseudocode all along and that I only saw when it came back as code:

- **A rounding step that can never do anything.** Step 10 says "rounded down to a whole kobo". Before step 10 the fee is always a multiple of 10,000, so × 125 / 100 is always whole. The instruction is harmless and dead.
- **Peak is sometimes more than 25%.** 50,000 at peak is 62,500, and step 12 rounds it up to 65,000: an effective 30%. Only peak fees are ever changed by the final rounding.
- **21:00 to 21:59 is "standard".** Evening peak ends at 20:59 and night starts at 22:00. That hour between them is what my rules table says, but I had not noticed it as a consequence until the reverse-engineered pseudocode printed the bands as a timetable.
- **Range is checked last.** A distance of 20,000 with a subtotal of −1 reports INVALID_SUBTOTAL, not OUT_OF_RANGE. That is the order I wrote; a caller sees one problem at a time.

## How C1 and C2 were done

The AI implementation was produced by an AI coding agent that was given only the pseudocode. The reverse-engineered pseudocode was produced from the code by a separate agent that was given only the code file, so the original pseudocode was not in view. The classification and verdicts in this table were then written by comparing the two.
