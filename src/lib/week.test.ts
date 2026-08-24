import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assigneeId, assignOverrides, cycleOverrides } from "./assign.ts";
import type { Chore, Member } from "./house-types.ts";
import { dayNum, weekdayShortKo, weekDates } from "./utils.ts";

describe("weekDates", () => {
  it("returns Monday through Sunday for a Monday", () => {
    assert.deepEqual(weekDates("2026-08-24"), [
      "2026-08-24",
      "2026-08-25",
      "2026-08-26",
      "2026-08-27",
      "2026-08-28",
      "2026-08-29",
      "2026-08-30",
    ]);
  });

  it("snaps mid-week dates back to that Monday", () => {
    assert.equal(weekDates("2026-08-26")[0], "2026-08-24");
    assert.equal(weekDates("2026-08-30")[6], "2026-08-30");
  });
});

describe("weekday labels", () => {
  it("uses short Korean weekdays and day numbers", () => {
    assert.equal(weekdayShortKo("2026-08-24"), "월");
    assert.equal(weekdayShortKo("2026-08-30"), "일");
    assert.equal(dayNum("2026-08-24"), "24");
  });
});

describe("cycleOverrides", () => {
  const members: Member[] = [
    { id: "a", name: "현규" },
    { id: "b", name: "민서" },
  ];
  const daily: Chore = {
    id: "cook",
    title: "저녁 차리기",
    cadence: "daily",
    seed: 0,
    active: true,
  };
  const weekly: Chore = {
    id: "trash",
    title: "쓰레기",
    cadence: "weekly",
    seed: 0,
    active: true,
  };

  it("moves a daily chore only on the tapped date", () => {
    const date = "2026-08-26";
    const first = assigneeId(daily, members, date, []);
    const next = cycleOverrides(daily, members, date, []);
    assert.equal(next.length, 1);
    assert.equal(next[0].date, date);
    assert.notEqual(next[0].memberId, first);
    assert.equal(
      assigneeId(daily, members, "2026-08-25", next),
      assigneeId(daily, members, "2026-08-25", []),
    );
  });

  it("moves a weekly chore across the whole week", () => {
    const date = "2026-08-26";
    const first = assigneeId(weekly, members, date, []);
    const next = cycleOverrides(weekly, members, date, []);
    assert.equal(next.length, 7);
    assert.ok(next.every((o) => o.memberId !== first));
    assert.equal(new Set(next.map((o) => o.date)).size, 7);
  });

  it("skips a member who is away", () => {
    const away = [{ id: "x", memberId: "a", start: "2026-08-24", end: "2026-08-26" }];
    const id = assigneeId(daily, members, "2026-08-24", [], away);
    assert.equal(id, "b");
  });
});

describe("assignOverrides", () => {
  const members: Member[] = [
    { id: "a", name: "현규" },
    { id: "b", name: "민서" },
    { id: "c", name: "유나" },
  ];
  const daily: Chore = {
    id: "cook",
    title: "저녁 차리기",
    cadence: "daily",
    seed: 0,
    active: true,
  };

  it("sets a daily cell to the chosen person", () => {
    const date = "2026-08-26";
    const next = assignOverrides(daily, date, "c", []);
    assert.equal(assigneeId(daily, members, date, next), "c");
    assert.equal(next.length, 1);
    assert.equal(next[0].date, date);
  });
});
