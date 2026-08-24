import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyPayload, mergePayload, prunePayload } from "./merge.ts";

describe("mergePayload", () => {
  it("keeps both shopping adds from two devices", () => {
    const base = emptyPayload();
    const local = {
      ...emptyPayload(),
      shopping: [{ id: "1", name: "우유", done: false }],
    };
    const remote = {
      ...emptyPayload(),
      shopping: [{ id: "2", name: "계란", done: false }],
    };
    const merged = mergePayload(base, local, remote);
    assert.equal(merged.shopping.length, 2);
    assert.deepEqual(
      new Set(merged.shopping.map((s) => s.name)),
      new Set(["우유", "계란"]),
    );
  });

  it("does not revive a completion the other person removed", () => {
    const item = { choreId: "cook", date: "2026-08-24", memberId: "a" };
    const base = { ...emptyPayload(), completions: [item] };
    const local = { ...emptyPayload(), completions: [item] };
    const remote = emptyPayload();
    const merged = mergePayload(base, local, remote);
    assert.equal(merged.completions.length, 0);
  });

  it("keeps a local rename when remote did not touch that member", () => {
    const member = { id: "a", name: "현규" };
    const base = { ...emptyPayload(), members: [member] };
    const local = { ...emptyPayload(), members: [{ id: "a", name: "현규조" }] };
    const remote = { ...emptyPayload(), members: [member] };
    const merged = mergePayload(base, local, remote);
    assert.equal(merged.members[0]?.name, "현규조");
  });
});

describe("prunePayload", () => {
  it("drops records older than 60 days", () => {
    const payload = {
      ...emptyPayload(),
      completions: [
        { choreId: "x", date: "2026-01-01", memberId: "a" },
        { choreId: "x", date: "2026-08-20", memberId: "a" },
      ],
    };
    const pruned = prunePayload(payload, "2026-08-24");
    assert.equal(pruned.completions.length, 1);
    assert.equal(pruned.completions[0]?.date, "2026-08-20");
  });
});
