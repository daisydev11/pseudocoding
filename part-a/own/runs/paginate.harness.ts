import { it } from "vitest";
import { paginate } from "@/lib/list";
const rows = [["r1", "Amala Spot"], ["r2", "Buka Hut"], ["r3", "Chop House"], ["r4", "Dodo Place"], ["r5", "Egusi Pot"]].map(([id, name]) => ({ id, name }));
const calls: string[] = [];
// An in-memory stand-in for the database with the same contract Prisma gives paginate.
const source = {
  where: {},
  count: async () => (calls.push("count"), rows.length),
  exists: async (id: string) => (calls.push("exists"), rows.some((r) => r.id === id)),
  findMany: async (a: { take: number; skip?: number; cursor?: { id: string } }) => {
    calls.push("findMany");
    const start = (a.cursor ? rows.findIndex((r) => r.id === a.cursor!.id) : 0) + (a.skip ?? 0);
    return rows.slice(start, start + a.take);
  },
};
const run = async (label: string, q: object) => {
  calls.length = 0;
  let out: unknown;
  try {
    const r = await paginate({ filters: {}, sort: "name", order: "asc", ...q } as never, source);
    out = { data: r.data.map((d) => d.id), meta: r.meta };
  } catch (e) {
    const err = e as { status: number; code: string };
    out = { threw: `${err.status} ${err.code}` };
  }
  console.log(`${label}\n  input:  ${JSON.stringify(q)}\n  output: ${JSON.stringify(out)}\n  database calls: ${calls.join(", ") || "none"}\n`);
};
it("trace", async () => {
  await run("Input 1 (normal)", { limit: 2 });
  await run("Input 2 (edge: last page by cursor)", { limit: 2, cursor: "r4" });
  await run("Input 3 (invalid cursor)", { limit: 2, cursor: "nope" });
  await run("Input 4 (edge: offset past the end)", { limit: 2, offset: 100 });
});
