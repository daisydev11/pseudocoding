# Pseudocoding

Task 5 of the Product Engineering Bootcamp: reading code into pseudocode, writing pseudocode into code, and using pseudocode to direct an AI and then check what it produced.

## Status

| Part | What | State |
|---|---|---|
| A1 | Three functions from my own projects: pseudocode, hand traces, real runs | **Done** |
| A2 | Three open-source functions, first pass without AI | Not done |
| A3 | A function with a planted bug | Not done, needs a function from a partner |
| B1 | Specification for a new feature, with six hand traces | **Done** |
| B2 | My own implementation, without AI | Not done |
| C1 | The same pseudocode implemented by an AI agent | **Done** |
| C2 | Pseudocode reverse-engineered from the AI's code, and the difference table | **Done** |
| C3 | Both implementations on the same inputs | Half done: AI side run on 11 inputs, waiting for B2 |
| C4 | Recorded explanation and a non-technical listener | Not done |

## Where things are

```
part-a/
  own/01-paginate.md            most complex: cursor and offset pagination (food-market-api)
  own/02-quote-checkout.md      touches money: upgrade pricing with proration (payment-subscription-slice)
  own/03-fail-job.md            handles an error: failed vs dead (background-jobs)
  own/runs/                     the harness and the captured output of each real run
  open-source/                  A2 (template and steps)
  planted-bug/                  A3 (steps)
part-b/
  01-delivery-fee.pseudocode.md the specification and six hand traces
  my-implementation.ts          B2 (stub)
  02-trace-vs-test.md           B2 results (template)
part-c/
  c1-prompt-given-to-ai.md      exactly what the AI received
  ai-implementation.ts          what it produced, unedited
  reverse-engineered.pseudocode.md
  c2-difference-table.md
  compare.ts, c3-comparison.md
  c4-recording.md
```

Run the comparison: `npm install && npm run compare`.

## The pseudocode standard

Every block starts with a header:

```
FUNCTION name
INPUTS: each input with its type and what it means
OUTPUT: what is returned with its type
SIDE EFFECTS: anything written, sent, or changed outside the function, or NONE
FAILS WHEN: every condition under which this function cannot succeed
```

Then numbered steps: one action per step, plain English, present tense, no code syntax.

| Rule | Form |
|---|---|
| Branches are explicit | `IF …` / `OTHERWISE …` |
| Loops say what they iterate and when they stop | `FOR EACH … END FOR` |
| Every early exit is named | `RETURN error: cart is empty` |
| Every external call is marked | `CALL … (may fail, may be slow)` |
| Every state change is marked | `WRITE …` |

The test: someone who has never seen the code can predict the output for any input, including the strange ones, from the pseudocode alone.

## What has come out of it so far

**A trace found a flaw in my own job queue (A1.3).** Writing step 6 of `fail` forced the sentence "this write has no condition on the worker". The real run confirmed it: a worker that has lost its job cannot change the job row, but it does overwrite the attempt log, turning `abandoned` into `failed`, and is told `"failed"` for a write that did nothing.

**Three ambiguities in my specification, found only by reading the AI's code back (C2).**

| I wrote | It could mean | The AI chose |
|---|---|---|
| "a moment in time" | a date object, ISO text, or a timestamp | date object only; text is refused |
| "RETURN error X" | return a value, or raise an exception | return a value |
| nothing, for `timeBand` on an invalid date | anything | falls through to "standard" |

All three are fixed in the specification, with the first version kept beside it.

**The AI added nothing behavioural and omitted nothing.** Its only additions were exported type names. That is a result of handing it numbered steps, not a description.

**The gap between what I specified and what I got was in my words, not in the AI's code.** On all 11 inputs the AI's implementation matches the hand trace. Every difference in the table traces back to a phrase of mine that had two readings.

## How AI was used in this repository

Stated plainly, because parts of this task forbid it.

| Part | AI use |
|---|---|
| A1 pseudocode, traces and run harnesses | Produced with an AI agent, working from my own projects' code. The runs are real executions of that code. |
| A2 first pass | AI not permitted. Not started. |
| B1 specification and traces | Produced with an AI agent. |
| B2 implementation | AI not permitted. Not started. |
| C1 | An AI agent, given only the pseudocode, as the task requires. |
| C2 | A second AI agent, given only the code, wrote the reverse-engineered pseudocode. The difference table was written from the two documents. |
| C4 | Not started. |
