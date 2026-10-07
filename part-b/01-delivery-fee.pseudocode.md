# B1. Specification: delivery fee

A feature that has not been built in any of my projects: working out the delivery fee for a food order from the distance, the time of day and the size of the order. Written and hand-traced before any code.

All money is whole kobo (100 kobo = NGN 1). Times of day are Lagos time, which is always UTC plus one hour.

## Rules in one place

| Rule | Value |
|---|---|
| Furthest delivery | 15,000 metres |
| Base fee | 50,000 kobo, covers the first 2,000 metres |
| Beyond 2,000 metres | 10,000 kobo for each started 1,000 metres |
| Peak hours (12:00 to 13:59 and 18:00 to 20:59) | fee times 1.25 |
| Night hours (22:00 to 05:59) | fee times 1.5 |
| Large order (more than 10 items) | add 20,000 kobo, after the time-of-day change |
| Free delivery | order subtotal 1,500,000 kobo or more AND distance 5,000 metres or less |
| Rounding | final fee rounded up to the next 5,000 kobo |

## Pseudocode

```
FUNCTION calculateDeliveryFee
INPUTS:
  distanceMetres - whole number: road distance from the restaurant to the customer
  subtotalMinor  - whole number of kobo: the price of the food, before delivery
  itemCount      - whole number: how many items are in the order, counting quantities
  orderedAt      - a moment in time, given as a date-and-time object (not text, not a number):
                   when the order is placed
OUTPUT: an object with
  feeMinor       - whole number of kobo to charge for delivery
  currency       - the text "NGN"
  band           - the text "standard", "peak" or "night"
  freeDelivery   - true or false
SIDE EFFECTS: NONE
FAILS WHEN (each failure is RETURNED as an object holding only the error code; nothing is raised,
            and only the first failing check, in this order, is reported):
  - distanceMetres is not a whole number, or is below zero  -> error INVALID_DISTANCE
  - subtotalMinor is not a whole number, or is below zero   -> error INVALID_SUBTOTAL
  - itemCount is not a whole number, or is below one        -> error INVALID_ITEM_COUNT
  - orderedAt is not a valid moment in time                 -> error INVALID_TIME
  - distanceMetres is above 15,000                          -> error OUT_OF_RANGE
```

1. IF distanceMetres is not a whole number or is below zero
       RETURN error INVALID_DISTANCE
2. IF subtotalMinor is not a whole number or is below zero
       RETURN error INVALID_SUBTOTAL
3. IF itemCount is not a whole number or is below one
       RETURN error INVALID_ITEM_COUNT
4. IF orderedAt is not a valid moment in time
       RETURN error INVALID_TIME
5. IF distanceMetres is above 15,000
       RETURN error OUT_OF_RANGE
6. Work out the band by running timeBand with orderedAt.
7. IF subtotalMinor is 1,500,000 or more AND distanceMetres is 5,000 or less
       RETURN feeMinor zero, currency "NGN", the band, freeDelivery true
8. Set fee to 50,000.
9. IF distanceMetres is above 2,000
       set extra to distanceMetres minus 2,000
       set blocks to extra divided by 1,000, rounded up to a whole number
       add blocks times 10,000 to fee
10. IF the band is "peak"
        set fee to fee times 125 divided by 100, rounded down to a whole kobo
    OTHERWISE IF the band is "night"
        set fee to fee times 150 divided by 100, rounded down to a whole kobo
    OTHERWISE
        leave fee as it is
11. IF itemCount is above 10
        add 20,000 to fee
12. IF fee is not an exact multiple of 5,000
        raise fee to the next multiple of 5,000 above it
13. RETURN feeMinor equal to fee, currency "NGN", the band, freeDelivery false

```
FUNCTION timeBand
INPUTS:  orderedAt - a valid moment in time
OUTPUT:  the text "standard", "peak" or "night"
SIDE EFFECTS: NONE
FAILS WHEN: never, for a valid moment. It does not check its input: it is only ever run after
            step 4 of calculateDeliveryFee has refused an invalid moment.
```

1. Take the hour of the day of orderedAt in UTC (0 to 23).
2. Add one to get the Lagos hour.
3. IF the Lagos hour is 24
       set it to 0
4. IF the Lagos hour is 12 or 13
       RETURN "peak"
5. IF the Lagos hour is 18, 19 or 20
       RETURN "peak"
6. IF the Lagos hour is 22 or 23, or is 0, 1, 2, 3, 4 or 5
       RETURN "night"
7. RETURN "standard"

## Revisions made after Part C

The pseudocode above is the second version. Reverse-engineering the AI's implementation (Part C2) showed three places where the first version could be read more than one way. The first version, exactly as the AI received it, is kept in [`part-c/c1-prompt-given-to-ai.md`](../part-c/c1-prompt-given-to-ai.md).

| Where | First version | Now | Why |
|---|---|---|---|
| `orderedAt` input | "a moment in time" | "given as a date-and-time object (not text, not a number)" | It did not say what form the moment arrives in. The AI chose to accept only a date object and refuse ISO text. Another reader could have parsed text. |
| How failures are reported | "RETURN error X" | "RETURNED as an object holding only the error code; nothing is raised", and only the first failure is reported | "Return an error" can mean a returned value or a raised exception. The AI returned a value. A caller written for the other reading would break. |
| `timeBand` on an invalid moment | "FAILS WHEN: never, for a valid moment" | states that it does not check its input and why that is safe | The first version was silent on invalid input. In the AI's code an invalid date falls through to "standard". |

None of these change any result in the traces.

## Hand traces

Six inputs, including the awkward ones. Times are written in UTC as the function receives them, with the Lagos time beside them.

### Trace 1, normal afternoon order
distance 4,500 · subtotal 800,000 · 3 items · 14:00 UTC (15:00 Lagos)

| Step | What happens | Values after |
|---|---|---|
| 1 to 5 | all valid, 4,500 ≤ 15,000 | continue |
| 6 | Lagos hour 15 | band = standard |
| 7 | 800,000 < 1,500,000 | not free |
| 8 | | fee = 50,000 |
| 9 | extra 2,500; 2.5 rounded up is 3 blocks; + 30,000 | fee = 80,000 |
| 10 | standard | fee = 80,000 |
| 11 | 3 items | fee = 80,000 |
| 12 | already a multiple of 5,000 | fee = 80,000 |
| 13 | return | **feeMinor 80,000, standard, freeDelivery false** |

### Trace 2, peak hour and a large order
distance 7,200 · subtotal 600,000 · 12 items · 18:30 UTC (19:30 Lagos)

| Step | What happens | Values after |
|---|---|---|
| 6 | Lagos hour 19 | band = peak |
| 7 | subtotal too low | not free |
| 8, 9 | extra 5,200; 6 blocks; 50,000 + 60,000 | fee = 110,000 |
| 10 | 110,000 × 125 / 100 | fee = 137,500 |
| 11 | 12 items | fee = 157,500 |
| 12 | not a multiple; next one up | fee = 160,000 |
| 13 | return | **feeMinor 160,000, peak, freeDelivery false** |

### Trace 3, boundaries: exactly 2,000 metres, at night
distance 2,000 · subtotal 200,000 · 1 item · 22:00 UTC (23:00 Lagos)

| Step | What happens | Values after |
|---|---|---|
| 6 | Lagos hour 23 | band = night |
| 8, 9 | 2,000 is not above 2,000 | fee = 50,000 |
| 10 | 50,000 × 150 / 100 | fee = 75,000 |
| 11, 12 | 1 item; already a multiple | fee = 75,000 |
| 13 | return | **feeMinor 75,000, night, freeDelivery false** |

### Trace 4, free delivery on both boundaries
distance 5,000 · subtotal 1,500,000 · 12 items · 18:00 UTC (19:00 Lagos)

| Step | What happens | Values after |
|---|---|---|
| 6 | Lagos hour 19 | band = peak |
| 7 | 1,500,000 ≥ 1,500,000 and 5,000 ≤ 5,000 | RETURN **feeMinor 0, peak, freeDelivery true** |

The large-order charge is never reached: free means free.

### Trace 5, awkward: a negative quantity
distance 3,000 · subtotal 500,000 · −1 items · 14:00 UTC

| Step | What happens | Values after |
|---|---|---|
| 1, 2 | valid | continue |
| 3 | −1 is below one | RETURN **error INVALID_ITEM_COUNT** |

### Trace 6, awkward: one metre too far, with a subtotal that would otherwise be free
distance 15,001 · subtotal 2,000,000 · 2 items · 09:00 UTC (10:00 Lagos)

| Step | What happens | Values after |
|---|---|---|
| 1 to 4 | valid | continue |
| 5 | 15,001 is above 15,000 | RETURN **error OUT_OF_RANGE** |

## Summary of expected results

| # | distance | subtotal | items | orderedAt (UTC) | Expected |
|---|---|---|---|---|---|
| 1 | 4,500 | 800,000 | 3 | 2026-10-07T14:00Z | 80,000, standard |
| 2 | 7,200 | 600,000 | 12 | 2026-10-07T18:30Z | 160,000, peak |
| 3 | 2,000 | 200,000 | 1 | 2026-10-07T22:00Z | 75,000, night |
| 4 | 5,000 | 1,500,000 | 12 | 2026-10-07T18:00Z | 0, peak, free |
| 5 | 3,000 | 500,000 | −1 | 2026-10-07T14:00Z | error INVALID_ITEM_COUNT |
| 6 | 15,001 | 2,000,000 | 2 | 2026-10-07T09:00Z | error OUT_OF_RANGE |
