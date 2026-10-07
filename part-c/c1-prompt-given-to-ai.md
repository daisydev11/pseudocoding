# C1. Exactly what the AI agent was given

Instruction: "Implement this exactly, one function per pseudocode block, no additional behaviour. TypeScript, a single file, no dependencies." Plus the text below and nothing else: no rules table, no traces, no description of the feature. The result is [`ai-implementation.ts`](ai-implementation.ts), unedited.

## Pseudocode

```
FUNCTION calculateDeliveryFee
INPUTS:
  distanceMetres - whole number: road distance from the restaurant to the customer
  subtotalMinor  - whole number of kobo: the price of the food, before delivery
  itemCount      - whole number: how many items are in the order, counting quantities
  orderedAt      - a moment in time: when the order is placed
OUTPUT: an object with
  feeMinor       - whole number of kobo to charge for delivery
  currency       - the text "NGN"
  band           - the text "standard", "peak" or "night"
  freeDelivery   - true or false
SIDE EFFECTS: NONE
FAILS WHEN:
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
FAILS WHEN: never, for a valid moment
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

