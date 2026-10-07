import { it } from "vitest";
import { quoteCheckout } from "@/lib/billing/proration";
const f = [{ reference: "pay_1", interval: "MONTHLY" as const, amountMinor: 500_000, creditMinor: 0, periodStart: new Date("2026-03-01T00:00:00Z"), periodEnd: new Date("2026-03-31T00:00:00Z"), createdAt: new Date("2026-03-01T00:00:00Z") }];
const state = (entitled: boolean, interval: "MONTHLY" | "YEARLY" | null) => ({ entitled, interval, status: "active", periodStart: null, periodEnd: null, cancelAtPeriodEnd: false, cancellationReason: null, pendingInterval: null }) as never;
it("trace", () => {
  const show = (label: string, out: unknown) => console.log(`${label}\n  output: ${JSON.stringify(out)}\n`);
  show("Input 1 (normal: monthly -> yearly on day 12)", quoteCheckout(state(true, "MONTHLY"), f, "YEARLY", new Date("2026-03-12T10:00:00Z")));
  show("Input 2 (edge: expired monthly buys monthly)", quoteCheckout(state(false, "MONTHLY"), f, "MONTHLY", new Date("2026-04-05T00:00:00Z")));
  show("Input 3 (invalid: already monthly, asks monthly)", quoteCheckout(state(true, "MONTHLY"), f, "MONTHLY", new Date("2026-03-12T10:00:00Z")));
});
