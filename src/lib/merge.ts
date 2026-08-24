import type {
  Absence,
  BoardPayload,
  Chore,
  Completion,
  Meal,
  Member,
  Override,
  ShopItem,
} from "./house-types.ts";
import { addDaysIso } from "./utils.ts";

function mapBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, T>();
  for (const item of items) map.set(key(item), item);
  return map;
}

function mergeKeyed<T>(
  base: T[],
  local: T[],
  remote: T[],
  key: (item: T) => string,
  same: (a: T, b: T) => boolean,
): T[] {
  const b = mapBy(base, key);
  const l = mapBy(local, key);
  const r = mapBy(remote, key);
  const ids = new Set([...b.keys(), ...l.keys(), ...r.keys()]);
  const out: T[] = [];
  for (const id of ids) {
    const bv = b.get(id);
    const lv = l.get(id);
    const rv = r.get(id);
    if (lv && rv) {
      if (!bv) {
        out.push(lv);
        continue;
      }
      const localChanged = !same(lv, bv);
      const remoteChanged = !same(rv, bv);
      out.push(localChanged ? lv : rv);
    } else if (lv && !rv) {
      if (!bv || !same(lv, bv)) out.push(lv);
    } else if (!lv && rv) {
      if (!bv || !same(rv, bv)) out.push(rv);
    }
  }
  return out;
}

const sameMember = (a: Member, b: Member) => a.name === b.name;
const sameChore = (a: Chore, b: Chore) =>
  a.title === b.title && a.cadence === b.cadence && a.seed === b.seed && a.active === b.active;
const sameShop = (a: ShopItem, b: ShopItem) => a.name === b.name && a.done === b.done;
const sameMeal = (a: Meal, b: Meal) => a.dish === b.dish;
const sameAbsence = (a: Absence, b: Absence) =>
  a.memberId === b.memberId && a.start === b.start && a.end === b.end;
const sameOverride = (a: Override, b: Override) => a.memberId === b.memberId;
const sameCompletion = (_a: Completion, _b: Completion) => true;

export function mergePayload(
  base: BoardPayload,
  local: BoardPayload,
  remote: BoardPayload,
): BoardPayload {
  return {
    members: mergeKeyed(base.members, local.members, remote.members, (m) => m.id, sameMember),
    chores: mergeKeyed(base.chores, local.chores, remote.chores, (c) => c.id, sameChore),
    shopping: mergeKeyed(base.shopping, local.shopping, remote.shopping, (s) => s.id, sameShop),
    completions: mergeKeyed(
      base.completions,
      local.completions,
      remote.completions,
      (c) => `${c.choreId}:${c.date}`,
      sameCompletion,
    ),
    overrides: mergeKeyed(
      base.overrides,
      local.overrides,
      remote.overrides,
      (o) => `${o.choreId}:${o.date}`,
      sameOverride,
    ),
    meals: mergeKeyed(base.meals, local.meals, remote.meals, (m) => m.date, sameMeal),
    absences: mergeKeyed(
      base.absences,
      local.absences,
      remote.absences,
      (a) => a.id,
      sameAbsence,
    ),
  };
}

export function emptyPayload(): BoardPayload {
  return {
    members: [],
    chores: [],
    shopping: [],
    completions: [],
    overrides: [],
    meals: [],
    absences: [],
  };
}

export function prunePayload(payload: BoardPayload, today: string): BoardPayload {
  const cutoff = addDaysIso(today, -60);
  return {
    ...payload,
    completions: payload.completions.filter((c) => c.date >= cutoff),
    overrides: payload.overrides.filter((o) => o.date >= cutoff),
    meals: payload.meals.filter((m) => m.date >= cutoff),
    absences: payload.absences.filter((a) => a.end >= cutoff),
  };
}

export function payloadsEqual(a: BoardPayload, b: BoardPayload) {
  return JSON.stringify(a) === JSON.stringify(b);
}
