// C3. Runs both implementations of the delivery fee against the same inputs and
// against the result predicted by hand-tracing the pseudocode.
//   npm install && npm run compare
import { calculateDeliveryFee as ai } from "./ai-implementation.ts";
import { calculateDeliveryFee as mine } from "../part-b/my-implementation.ts";

type Case = { n: number; from: string; d: number; s: number; i: number; at: string; expected: string };
const cases: Case[] = [
  // The six inputs hand-traced in part-b before any code existed.
  { n: 1, from: "B1 trace", d: 4500, s: 800_000, i: 3, at: "2026-10-07T14:00:00Z", expected: "80000 standard" },
  { n: 2, from: "B1 trace", d: 7200, s: 600_000, i: 12, at: "2026-10-07T18:30:00Z", expected: "160000 peak" },
  { n: 3, from: "B1 trace", d: 2000, s: 200_000, i: 1, at: "2026-10-07T22:00:00Z", expected: "75000 night" },
  { n: 4, from: "B1 trace", d: 5000, s: 1_500_000, i: 12, at: "2026-10-07T18:00:00Z", expected: "0 peak free" },
  { n: 5, from: "B1 trace", d: 3000, s: 500_000, i: -1, at: "2026-10-07T14:00:00Z", expected: "error INVALID_ITEM_COUNT" },
  { n: 6, from: "B1 trace", d: 15001, s: 2_000_000, i: 2, at: "2026-10-07T09:00:00Z", expected: "error OUT_OF_RANGE" },
  // Five more, not tried before. Expected values come from tracing the pseudocode, see c3-comparison.md.
  { n: 7, from: "new", d: 2001, s: 0, i: 10, at: "2026-10-07T11:00:00Z", expected: "75000 peak" },
  { n: 8, from: "new", d: 0, s: 0, i: 11, at: "2026-10-07T23:30:00Z", expected: "95000 night" },
  { n: 9, from: "new", d: 5001, s: 1_500_000, i: 1, at: "2026-10-07T20:30:00Z", expected: "90000 standard" },
  { n: 10, from: "new", d: 2500.5, s: 100_000, i: 1, at: "2026-10-07T14:00:00Z", expected: "error INVALID_DISTANCE" },
  { n: 11, from: "new", d: 14001, s: 100, i: 1, at: "2026-10-07T04:59:00Z", expected: "270000 night" },
];

type Fn = (d: number, s: number, i: number, at: Date) => unknown;
function run(fn: Fn, c: Case): string {
  try {
    const r = fn(c.d, c.s, c.i, new Date(c.at)) as { error?: string; feeMinor?: number; band?: string; freeDelivery?: boolean };
    return r.error ? `error ${r.error}` : `${r.feeMinor} ${r.band}${r.freeDelivery ? " free" : ""}`;
  } catch (e) {
    const message = (e as Error).message;
    return message === "NOT IMPLEMENTED" ? "not implemented" : `threw ${message}`;
  }
}

console.log("| # | distance | subtotal | items | orderedAt (UTC) | traced from pseudocode | AI implementation | my implementation | agree |");
console.log("|---|---|---|---|---|---|---|---|---|");
let disagreements = 0;
for (const c of cases) {
  const a = run(ai, c);
  const m = run(mine, c);
  const all = m === "not implemented" ? a === c.expected : a === c.expected && m === c.expected;
  if (!all) disagreements++;
  console.log(`| ${c.n} | ${c.d} | ${c.s} | ${c.i} | ${c.at} | ${c.expected} | ${a} | ${m} | ${all ? "yes" : "**NO**"} |`);
}
console.log(`\n${disagreements} disagreement(s).`);
