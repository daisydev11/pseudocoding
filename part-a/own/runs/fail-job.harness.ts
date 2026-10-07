import { it, vi } from "vitest";
import { db } from "@/lib/db";
import { fail, newJobId } from "@/lib/jobs/queue";

// Builds a job in the exact state described in the trace, with its attempt-log rows.
async function fixture(attempts: number, lockedBy: string, log: { attempt: number; workerId: string; outcome: string | null }[]) {
  const id = newJobId();
  const started = new Date(Date.now() - 5_000);
  const job = await db.job.create({ data: { id, userId: "trace", type: "generate_report", payload: {}, status: "PROCESSING", attempts, maxAttempts: 5, idempotencyKey: id, lockedBy, startedAt: started, runAt: started } });
  for (const l of log) await db.jobAttempt.create({ data: { jobId: id, attempt: l.attempt, workerId: l.workerId, startedAt: started, outcome: l.outcome, finishedAt: l.outcome ? started : null } });
  return job;
}
async function show(label: string, id: string, returned: string, before: Date) {
  const j = await db.job.findUniqueOrThrow({ where: { id }, include: { attemptLog: { orderBy: { attempt: "asc" } } } });
  console.log(`${label}\n  returned: ${JSON.stringify(returned)}\n  job row:  status=${j.status} attempts=${j.attempts} lockedBy=${j.lockedBy} lastError=${JSON.stringify(j.lastError)} finishedAt=${j.finishedAt ? "set" : "empty"} runAt=${j.runAt > before ? `now+${Math.round((j.runAt.getTime() - before.getTime()) / 100) / 10}s` : "unchanged (past)"}\n  attempt log: ${j.attemptLog.map((a) => `#${a.attempt} by ${a.workerId}: outcome=${a.outcome} nextDelayMs=${a.nextDelayMs}`).join(" | ")}\n`);
  await db.job.delete({ where: { id } });
}
it("trace", async () => {
  vi.spyOn(Math, "random").mockReturnValue(0.5); // fixed, so the jitter is exactly 500 ms
  let before = new Date();
  let job = await fixture(2, "w1", [{ attempt: 1, workerId: "w1", outcome: "failed" }, { attempt: 2, workerId: "w1", outcome: null }]);
  await show("Input 1 (normal: attempt 2 of 5 fails)", job.id, await fail(job, "w1", "Provider timeout"), before);

  before = new Date();
  job = await fixture(5, "w1", [{ attempt: 5, workerId: "w1", outcome: null }]);
  await show("Input 2 (edge: attempt 5 of 5 fails)", job.id, await fail(job, "w1", "Provider timeout"), before);

  before = new Date();
  // The row now belongs to w2 on attempt 3; w1 still holds its old copy from attempt 2.
  job = await fixture(3, "w2", [{ attempt: 2, workerId: "w1", outcome: "abandoned" }, { attempt: 3, workerId: "w2", outcome: null }]);
  await show("Input 3 (invalid: w1 reports a failure for a job w2 now holds)", job.id, await fail({ ...job, attempts: 2 }, "w1", "Provider timeout"), before);
  await db.$disconnect();
});
