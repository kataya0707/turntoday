import type { Absence, Chore, Member, Override } from "./house-types.ts";
import { dayIndex, isoWeek, weekDates } from "./utils.ts";

export function isAway(memberId: string, absences: Absence[], date: string) {
  return absences.some(
    (a) => a.memberId === memberId && a.start <= date && a.end >= date,
  );
}

export function presentMembers(
  members: Member[],
  absences: Absence[],
  date: string,
) {
  const present = members.filter((m) => !isAway(m.id, absences, date));
  return present.length > 0 ? present : members;
}

export function assigneeId(
  chore: Chore,
  members: Member[],
  date: string,
  overrides: Override[],
  absences: Absence[] = [],
) {
  const pool = presentMembers(members, absences, date);
  if (pool.length === 0) return "";
  const over = overrides.find((o) => o.choreId === chore.id && o.date === date);
  if (over && pool.some((m) => m.id === over.memberId)) return over.memberId;
  const n = pool.length;
  const idx =
    chore.cadence === "daily"
      ? (chore.seed + dayIndex(date)) % n
      : (chore.seed + isoWeek(date)) % n;
  return pool[((idx % n) + n) % n].id;
}

export function assignOverrides(
  chore: Chore,
  date: string,
  memberId: string,
  overrides: Override[],
): Override[] {
  const dates = chore.cadence === "weekly" ? weekDates(date) : [date];
  const dateSet = new Set(dates);
  return [
    ...overrides.filter((o) => !(o.choreId === chore.id && dateSet.has(o.date))),
    ...dates.map((d) => ({ choreId: chore.id, date: d, memberId })),
  ];
}

export function cycleOverrides(
  chore: Chore,
  members: Member[],
  date: string,
  overrides: Override[],
  absences: Absence[] = [],
): Override[] {
  const pool = presentMembers(members, absences, date);
  if (pool.length < 2) return overrides;
  const current = assigneeId(chore, members, date, overrides, absences);
  const idx = pool.findIndex((m) => m.id === current);
  const next = pool[(idx + 1) % pool.length];
  return assignOverrides(chore, date, next.id, overrides);
}
