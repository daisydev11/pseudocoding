# A1.3 The one that handles an error: `fail`

Source: [`background-jobs/src/lib/jobs/queue.ts`](https://github.com/daisydev11/background-jobs/blob/main/src/lib/jobs/queue.ts). The worker calls it when a job's work throws. It decides between "failed, will retry" and "dead, needs a human".

Configuration: backoff base 1,000 ms, cap 60,000 ms, jitter up to 1,000 ms.

## Pseudocode

```
FUNCTION fail
INPUTS:
  job      - the job record as the worker claimed it: id, attempts (how many runs have started,
             including this one), maxAttempts
  workerId - text naming the worker that ran it
  message  - text: the error the work threw
OUTPUT: the text "failed" or the text "dead"
SIDE EFFECTS: changes the job row and the row for this attempt in the attempt log
FAILS WHEN: the database cannot be reached or the transaction fails -> the error passes through
            and neither row is changed
```

1. Note the current time.
2. Cut the message down to its first 1,000 characters.
3. IF the job's attempts have reached its maximum
       mark it as exhausted, with no delay
   OTHERWISE
       work out the delay: base 1,000 ms doubled once for each attempt after the first, capped at 60,000 ms,
       plus a random whole number of milliseconds from 0 up to 999
4. Do steps 5 and 6 as one transaction: both happen or neither does.
5. WRITE the job row, but ONLY IF it is still PROCESSING, still locked by this worker, and its attempts
   count is unchanged:
       IF exhausted
           set status DEAD, store the error, set the finished time to now, clear the lock
       OTHERWISE
           set status FAILED, store the error, set the next run time to now plus the delay, clear the lock
   IF the row no longer matches those conditions
       nothing is written to the job, and this is not treated as an error
6. WRITE the attempt-log row for this job and this attempt number: finished time now, outcome "failed",
   the error, and the delay (nothing if exhausted). This write has no condition on the worker.
7. IF exhausted
       RETURN "dead"
   OTHERWISE
       RETURN "failed"

## Hand trace

For a predictable delay the random number is fixed at 0.5 in the traces, so the jitter is 500 ms.

### Input 1, normal: second run of five fails

job: attempts 2, maxAttempts 5, PROCESSING, locked by "w1". workerId "w1". message "Provider timeout".

| Step | What happens | Values after |
|---|---|---|
| 2 | message is short | error = "Provider timeout" |
| 3 | 2 < 5; 1,000 × 2 = 2,000, plus 500 | not exhausted, delay = 2,500 |
| 5 | row matches | job: FAILED, lastError set, runAt = now + 2.5 s, lock cleared, finishedAt still empty |
| 6 | attempt 2 row | outcome "failed", nextDelayMs 2,500 |
| 7 | return | **"failed"** |

### Input 2, edge: the fifth and last run fails

job: attempts 5, maxAttempts 5, PROCESSING, locked by "w1". workerId "w1".

| Step | What happens | Values after |
|---|---|---|
| 3 | 5 ≥ 5 | exhausted, no delay |
| 5 | row matches | job: DEAD, lastError set, finishedAt = now, lock cleared, runAt unchanged |
| 6 | attempt 5 row | outcome "failed", nextDelayMs empty |
| 7 | return | **"dead"** |

### Input 3, invalid: a worker reports a failure for a job it no longer holds

The job was taken from "w1" by the stuck-job sweep and is now PROCESSING under "w2" with attempts 3. Slow worker "w1" finally calls fail with its old copy: attempts 2, workerId "w1".

| Step | What happens | Values after |
|---|---|---|
| 3 | 2 < 5 | not exhausted, delay = 2,500 |
| 5 | the row is locked by w2 and attempts is 3: conditions not met | job row unchanged: still PROCESSING under w2 |
| 6 | attempt 2 row has no worker condition | attempt 2 is overwritten: outcome "failed", nextDelayMs 2,500 |
| 7 | return | **"failed"**, although the job itself was not changed |

Predicted from the pseudocode: the job is protected, but the old attempt's log entry (which the sweep had marked "abandoned") is rewritten, and the caller is told "failed".

## Real run and comparison

The real function was run against a real Postgres database, with `Math.random` fixed at 0.5 ([harness](runs/fail-job.harness.ts), [output](runs/fail-job.run.txt)).

| Input | Trace predicted | Real output | Match |
|---|---|---|---|
| 1 | "failed"; job FAILED, lock cleared, finishedAt empty; attempt 2: failed, delay 2,500 | returned `"failed"`; `status=FAILED lockedBy=null finishedAt=empty`; `#2 outcome=failed nextDelayMs=2500` | yes |
| 2 | "dead"; job DEAD, finishedAt set, runAt unchanged; attempt 5: failed, no delay | returned `"dead"`; `status=DEAD finishedAt=set runAt=unchanged`; `#5 outcome=failed nextDelayMs=null` | yes |
| 3 | "failed"; job row untouched (PROCESSING under w2, attempts 3); attempt 2 overwritten to failed | returned `"failed"`; `status=PROCESSING attempts=3 lockedBy=w2`; `#2 by w1: outcome=failed nextDelayMs=2500` | yes |

**One number that looks like a discrepancy and is not:** input 1 prints `runAt=now+3.1s`, and the trace says now + 2.5 s. The harness took its "now" before it created the test job, so the extra 0.6 s is the harness's own setup time. The delay the function stored is exactly 2,500 ms (`nextDelayMs=2500`).

**What the trace found in my own code (input 3).** The pseudocode forced me to write "this write has no condition on the worker" for step 6, and the real run confirms the consequence:

- The job row is correctly protected. A worker that lost its job cannot change it.
- But the attempt log is not. The sweep had recorded attempt 2 as `abandoned`; the late worker overwrites that with `failed`.
- And the function returns `"failed"` to a caller whose write did nothing.

Nothing is processed twice and no job is lost, so it is not a correctness bug in the queue. It is a wrong history entry, in the table whose purpose is to be the history. The fix is to make step 6 conditional on step 5 having changed a row. Recorded here as found; not yet changed in the background-jobs repository.
