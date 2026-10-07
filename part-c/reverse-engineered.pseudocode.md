# C2. Pseudocode written from the AI's code

All money amounts are whole numbers in minor units of NGN. The file contains two functions. Neither makes external calls or writes any state.

---

## calculateDeliveryFee

```
FUNCTION calculateDeliveryFee
INPUTS:
  distanceMetres - number - delivery distance in metres
  subtotalMinor  - number - order subtotal in minor currency units
  itemCount      - number - how many items are in the order
  orderedAt      - Date   - the moment the order was placed
OUTPUT: one of two plain objects (never both shapes at once)
  - a fee result: feeMinor (number), currency (always the text "NGN"),
    band ("standard", "peak" or "night"), freeDelivery (true or false)
  - an error result: a single field "error" holding one of the codes
    INVALID_DISTANCE, INVALID_SUBTOTAL, INVALID_ITEM_COUNT, INVALID_TIME, OUT_OF_RANGE
SIDE EFFECTS: NONE
FAILS WHEN: (every failure is a RETURNED error object; nothing is thrown by the function's own checks)
  - distanceMetres is not a number type, is NaN, is Infinity or -Infinity,
    has a fractional part, or is below 0                     -> INVALID_DISTANCE
  - subtotalMinor fails the same test                        -> INVALID_SUBTOTAL
  - itemCount is not a number type, is NaN, is infinite,
    has a fractional part, or is below 1                     -> INVALID_ITEM_COUNT
  - orderedAt is not a Date object, or is a Date holding
    an invalid time                                          -> INVALID_TIME
  - distanceMetres is above 15000 (15000 itself is allowed)  -> OUT_OF_RANGE
  Only the FIRST failing check is reported, in the order listed above.
```

1. IF distanceMetres is not a whole number (this is true for any non-number type including numeric text, for NaN, for Infinity, and for fractions) OR distanceMetres is below 0
   1. RETURN the error object with code INVALID_DISTANCE
2. IF subtotalMinor is not a whole number (same test) OR subtotalMinor is below 0
   1. RETURN the error object with code INVALID_SUBTOTAL
3. IF itemCount is not a whole number (same test) OR itemCount is below 1
   1. RETURN the error object with code INVALID_ITEM_COUNT
4. IF orderedAt is not a Date object OR its internal timestamp is NaN
   1. RETURN the error object with code INVALID_TIME
5. IF distanceMetres is above 15000
   1. RETURN the error object with code OUT_OF_RANGE
6. Work out the time band by running timeBand on orderedAt.
7. IF subtotalMinor is at or above 1500000 AND distanceMetres is at or below 5000
   1. RETURN a fee result with feeMinor 0, currency "NGN", the band from step 6, freeDelivery true
8. Set the running fee to 50000.
9. IF distanceMetres is above 2000 (exactly 2000 adds nothing)
   1. Subtract 2000 from distanceMetres to get the extra distance.
   2. Divide the extra distance by 1000 and round UP to a whole number of blocks (1 extra metre counts as a full block).
   3. Add 10000 for each block to the running fee.
10. IF the band is "peak"
    1. Multiply the running fee by 125, divide by 100, and round DOWN to a whole number.
    2. Replace the running fee with that value.
11. OTHERWISE IF the band is "night"
    1. Multiply the running fee by 150, divide by 100, and round DOWN to a whole number.
    2. Replace the running fee with that value.
12. OTHERWISE (band is "standard")
    1. Leave the running fee unchanged.
13. IF itemCount is above 10 (exactly 10 adds nothing; 11 or more adds the same flat amount)
    1. Add 20000 to the running fee. This happens AFTER the band multiplier, so it is not multiplied.
14. IF the running fee is not an exact multiple of 5000
    1. Round the running fee UP to the next multiple of 5000.
15. OTHERWISE
    1. Leave the running fee unchanged.
16. RETURN a fee result with feeMinor set to the running fee, currency "NGN", the band from step 6, freeDelivery false

Notes on what those steps can actually produce:

- Before step 10 the running fee is always a multiple of 10000 between 50000 (distance 0 to 2000) and 180000 (distance 14001 to 15000). Because of this, the divisions in steps 10 and 11 always come out whole and the round-down never changes anything.
- Step 14 only ever changes a "peak" fee: 125% of an odd number of ten-thousands ends in 2500 or 7500, and is pushed up by 2500. Standard and night fees are already multiples of 5000.
- The largest possible fee is 290000 (distance 14001 to 15000, night, more than 10 items).

---

## timeBand

```
FUNCTION timeBand
INPUTS:
  orderedAt - Date - the moment the order was placed
OUTPUT: text - one of "standard", "peak", "night"
SIDE EFFECTS: NONE
FAILS WHEN:
  - the function itself performs NO validation and never returns an error object
  - orderedAt is missing, null, or any value that has no way to report its UTC hour
    (a number, text, a plain object): the attempt in step 1 THROWS a type error
    to the caller
  - orderedAt is a Date holding an invalid time: this does NOT fail; it returns "standard"
  (When reached through calculateDeliveryFee none of these can happen, because step 4
   there has already rejected them. They matter because timeBand is exported and can be
   called directly.)
```

1. Read the hour of the day (0 to 23) from orderedAt in UTC. Minutes, seconds and the date are ignored.
2. Add 1 to that hour and call the result the Lagos hour (a fixed one-hour offset; no time-zone data is consulted).
3. IF the Lagos hour is exactly 24
   1. Set the Lagos hour to 0.
4. IF the Lagos hour is 12 or 13
   1. RETURN "peak"
5. IF the Lagos hour is 18, 19 or 20
   1. RETURN "peak"
6. IF the Lagos hour is 22 or 23, OR is at or above 0 and at or below 5
   1. RETURN "night"
7. RETURN "standard"

Resulting bands by Lagos clock time (each range includes its start and runs to the last instant before the next):

| Lagos time | UTC time | Band |
|---|---|---|
| 00:00 to 05:59 | 23:00 to 04:59 | night |
| 06:00 to 11:59 | 05:00 to 10:59 | standard |
| 12:00 to 13:59 | 11:00 to 12:59 | peak |
| 14:00 to 17:59 | 13:00 to 16:59 | standard |
| 18:00 to 20:59 | 17:00 to 19:59 | peak |
| 21:00 to 21:59 | 20:00 to 20:59 | standard |
| 22:00 to 23:59 | 21:00 to 22:59 | night |

---

## Things the code does that a reader might not expect

1. **Only one error is ever reported, and range is checked last.** A distance of 20000 with a subtotal of -1 returns INVALID_SUBTOTAL, not OUT_OF_RANGE. A distance of 20000 with an invalid date returns INVALID_TIME.
2. **Errors are returned, not thrown.** `calculateDeliveryFee(-5, 1000, 1, validDate)` returns an object with `error: "INVALID_DISTANCE"`. A caller that reads `feeMinor` without first checking for `error` gets nothing (undefined) rather than a crash.
3. **Numeric text is rejected, not converted.** Distance `"3000"` returns INVALID_DISTANCE. The same applies to `null`, `undefined`, `true`, and to subtotal and item count.
4. **Fractions are rejected outright, never rounded.** Distance 2500.5 returns INVALID_DISTANCE; item count 2.5 returns INVALID_ITEM_COUNT. But 2500.0 is accepted because it is a whole number.
5. **NaN and Infinity are rejected by the whole-number test.** Distance Infinity returns INVALID_DISTANCE (not OUT_OF_RANGE). Subtotal NaN returns INVALID_SUBTOTAL.
6. **Huge whole numbers are accepted with no upper limit on subtotal or item count.** Subtotal 1e300 (far beyond exact-integer precision) is valid and, with distance 5000 or less, gives free delivery. Item count 9007199254740993 is valid and just adds the flat 20000. A huge whole distance such as 1e300 passes validation and then returns OUT_OF_RANGE.
7. **Zero distance and zero subtotal are valid; zero items is not.** Distance 0, subtotal 0, 1 item at a standard hour returns fee 50000. Item count 0 returns INVALID_ITEM_COUNT. Negative zero is also accepted as distance or subtotal.
8. **Boundaries are inclusive on the "good" side.** Distance 15000 is in range, 15001 is OUT_OF_RANGE. Distance 2000 costs 50000, 2001 costs 60000 (a full block for one metre), 3000 still 60000, 3001 costs 70000.
9. **Free delivery needs both conditions and uses at-or-above / at-or-below.** Subtotal 1500000 at distance 5000 is free; subtotal 1499999 at distance 5000 is charged (80000 standard); subtotal 1500000 at distance 5001 is charged (90000 standard).
10. **Free delivery overrides everything else.** Subtotal 1500000, distance 1000, 50 items, 02:00 Lagos time returns fee 0 with band "night" and no item surcharge. The band is still reported.
11. **The item surcharge is added after the peak/night multiplier, so it is never multiplied.** Distance 0, night, 11 items gives 75000 + 20000 = 95000, not 105000.
12. **The item surcharge is flat.** 11 items and 500 items both add 20000; 10 items adds nothing.
13. **Final rounding is always upward and only bites at peak.** Distance 0, peak, 1 item: 62500 becomes 65000. Distance 2500, peak: 75000 stays 75000. Distance 3500, peak: 87500 becomes 90000. So the effective peak uplift is sometimes more than 25%.
14. **The "round down" in the multiplier step never has any effect**, because the fee at that point is always a multiple of 10000.
15. **21:00 to 21:59 Lagos time is "standard"**, a one-hour gap between evening peak (ends 20:59) and night (starts 22:00). An order at 20:30 UTC (21:30 Lagos) is standard.
16. **Only the hour matters.** 13:59:59 Lagos is peak; 14:00:00 Lagos is standard. 05:59 Lagos is night; 06:00 is standard.
17. **Lagos time is computed as UTC plus exactly one hour**, regardless of the time zone of the machine or of how the Date was created. An order at 23:30 UTC is treated as 00:30 Lagos and is "night".
18. **A Date object from a different JavaScript context (for example another browser frame) fails the "is a Date" test** and returns INVALID_TIME even though it holds a valid time. A timestamp number such as 1760000000000 or ISO text such as "2026-10-07T12:00:00Z" also returns INVALID_TIME.
19. **timeBand called directly behaves differently from the main function on bad input.** `timeBand(new Date("nonsense"))` returns "standard" (the hour is NaN, which matches no rule). `timeBand(null)` or `timeBand("2026-10-07")` throws a type error instead of returning an error object.
20. **Currency is hard-coded.** Every successful result says "NGN"; there is no input that changes it.
