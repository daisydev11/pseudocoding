# A1.2 The one that touches money: `quoteCheckout`

Source: [`payment-subscription-slice/src/lib/billing/proration.ts`](https://github.com/daisydev11/payment-subscription-slice/blob/main/src/lib/billing/proration.ts). It decides what a checkout means for a user and what it costs. It calls `prorationCredit`, written out below as its own block.

Prices from configuration: monthly 500,000 kobo (NGN 5,000), yearly 5,000,000 kobo (NGN 50,000).

## Pseudocode

```
FUNCTION quoteCheckout
INPUTS:
  state       - the user's subscription now: entitled (true/false) and interval (MONTHLY, YEARLY or nothing)
  fulfilments - list of the user's paid periods; each has a reference (text), interval,
                amountMinor and creditMinor (whole kobo), periodStart and periodEnd (dates)
  interval    - the plan being bought: MONTHLY or YEARLY
  at          - the moment to price for (a date)
OUTPUT: EITHER a quote: kind (SUBSCRIBE or UPGRADE), interval, currency, listPriceMinor,
        creditMinor, amountMinor (what will be charged, whole kobo), proration (list of lines)
        OR a refusal: code (ALREADY_ON_PLAN or USE_DOWNGRADE) and a message
SIDE EFFECTS: NONE
FAILS WHEN: it never throws. The two refusals are returned as values, not raised.
```

1. Look up the list price of the requested plan in configuration.
2. IF the user is not entitled (never paid, or the paid time has run out)
       RETURN a SUBSCRIBE quote: credit zero, amount equal to the list price, no proration lines
3. IF the user's current plan is the requested plan
       RETURN refusal ALREADY_ON_PLAN
4. IF the requested plan is MONTHLY
       RETURN refusal USE_DOWNGRADE (a yearly user moves to monthly at period end, paying nothing now)
5. Work out the proration lines by running prorationCredit with the fulfilments and the moment.
6. Set the credit to zero.
7. FOR EACH proration line
       add the line's credit to the credit
   END FOR
8. RETURN an UPGRADE quote: the credit, amount equal to list price minus the credit, and the lines.

```
FUNCTION prorationCredit
INPUTS: fulfilments (as above), at (a date)
OUTPUT: list of lines; each has reference, valueMinor, spanDays, unusedDays, creditMinor (whole numbers)
SIDE EFFECTS: NONE
FAILS WHEN: never. (A period of zero days would divide by zero; periods are always a month long.)
```

1. Start an empty list of lines.
2. FOR EACH fulfilment
       IF it is not MONTHLY, or its period has already ended at the moment
           skip it
       OTHERWISE
           set value to the amount paid plus the credit used on it
           set span to the whole days from period start to period end
           IF the moment is at or before the period start
               set unused to span
           OTHERWISE
               set unused to span minus the number of complete days passed since the period start
           set the line's credit to value times unused divided by span, rounded down to a whole kobo
           add a line with the reference, value, span, unused and credit
   END FOR
3. RETURN the lines.

## Hand trace

### Input 1, normal: monthly subscriber upgrades to yearly on day 12

state: entitled, MONTHLY. One fulfilment: ref "pay_1", MONTHLY, amount 500,000, credit 0, period 1 Mar 2026 to 31 Mar 2026 (both 00:00 UTC). interval YEARLY. at 12 Mar 2026 10:00 UTC.

| Step | What happens | Values after |
|---|---|---|
| 1 | yearly list price | 5,000,000 |
| 2 | entitled | continue |
| 3 | MONTHLY is not YEARLY | continue |
| 4 | requested is YEARLY | continue |
| 5 → prorationCredit 2 | monthly and not ended: value 500,000; span 30; 11 complete days passed, unused 19; credit 500,000 × 19 / 30 = 316,666.67, rounded down | line credit 316,666 |
| 6, 7 | sum | credit = 316,666 |
| 8 | return | UPGRADE, credit 316,666, amount 5,000,000 − 316,666 = **4,683,334** |

### Input 2, edge: someone whose paid month has ended buys monthly again

state: not entitled, interval MONTHLY (expired). Same fulfilment as above. interval MONTHLY. at 5 Apr 2026.

| Step | What happens | Values after |
|---|---|---|
| 1 | monthly list price | 500,000 |
| 2 | not entitled | RETURN SUBSCRIBE, credit 0, amount **500,000**, no lines |

The check for "already on this plan" (step 3) is never reached, so an expired monthly user can buy monthly again.

### Input 3, invalid: a monthly subscriber asks for monthly again

state: entitled, MONTHLY. interval MONTHLY. at 12 Mar 2026.

| Step | What happens | Values after |
|---|---|---|
| 2 | entitled | continue |
| 3 | current plan is the requested plan | RETURN refusal **ALREADY_ON_PLAN**, "You are already on the monthly plan." |

## Real run and comparison

[Harness](runs/quote-checkout.harness.ts), [output](runs/quote-checkout.run.txt).

| Input | Trace predicted | Real output | Match |
|---|---|---|---|
| 1 | UPGRADE, credit 316,666, amount 4,683,334, one line (span 30, unused 19) | `"kind":"UPGRADE","creditMinor":316666,"amountMinor":4683334`, line `spanDays 30, unusedDays 19, creditMinor 316666` | yes |
| 2 | SUBSCRIBE, credit 0, amount 500,000, no lines | `"kind":"SUBSCRIBE","creditMinor":0,"amountMinor":500000,"proration":[]` | yes |
| 3 | refusal ALREADY_ON_PLAN | `{"ok":false,"code":"ALREADY_ON_PLAN","message":"You are already on the monthly plan."}` | yes |

**Discrepancies:** none.

**What writing it out exposed:** the order of steps 2 and 3 is a decision, not an accident. Because "not entitled" is checked first, a lapsed monthly user asking for monthly gets a quote, not "already on plan" (input 2). Swapping the two checks would lock lapsed users out of renewing.
