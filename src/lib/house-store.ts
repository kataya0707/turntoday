import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addDaysIso, todayIsoKst, uid } from "@/lib/utils";
import { assigneeId, cycleOverrides } from "@/lib/assign";
import type {
  Absence,
  BoardPayload,
  Cadence,
  Chore,
  Completion,
  Meal,
  Member,
  Override,
  ServerHouse,
  ShopItem,
} from "@/lib/house-types";

export type { Absence, Cadence, Chore, Completion, Meal, Member, Override, ShopItem };
export { assigneeId, cycleOverrides };

export type HouseState = {
  onboarded: boolean;
  houseId: string | null;
  inviteCode: string | null;
  revision: number;
  takenMemberIds: string[];
  members: Member[];
  meId: string;
  chores: Chore[];
  shopping: ShopItem[];
  completions: Completion[];
  overrides: Override[];
  meals: Meal[];
  absences: Absence[];
  completeOnboarding: (names: string[]) => void;
  applyServerHouse: (house: ServerHouse) => void;
  applyPayload: (payload: BoardPayload) => void;
  setRevision: (revision: number) => void;
  setMe: (id: string) => void;
  renameMember: (id: string, name: string) => void;
  addMember: (name: string) => void;
  removeMember: (id: string) => void;
  toggleChoreActive: (id: string) => void;
  addChore: (title: string, cadence: Cadence) => void;
  removeChore: (id: string) => void;
  toggleDone: (choreId: string) => void;
  passToday: (choreId: string) => void;
  passOnDate: (choreId: string, date: string) => void;
  setMeal: (dish: string) => void;
  addShop: (name: string) => void;
  toggleShop: (id: string) => void;
  clearBought: () => void;
  setAway: (memberId: string, days: number) => void;
  clearAway: (memberId: string) => void;
  clearHouse: () => void;
};

const SAMPLE_A = "현규";
const SAMPLE_B = "민서";

export function sampleHouse(): Pick<
  HouseState,
  | "onboarded"
  | "houseId"
  | "inviteCode"
  | "revision"
  | "takenMemberIds"
  | "members"
  | "meId"
  | "chores"
  | "shopping"
  | "completions"
  | "overrides"
  | "meals"
  | "absences"
> {
  const a = uid();
  const b = uid();
  const today = todayIsoKst();
  const chores: Chore[] = [
    { id: uid(), title: "저녁 차리기", cadence: "daily", seed: 0, active: true },
    { id: uid(), title: "설거지", cadence: "daily", seed: 1, active: true },
    { id: uid(), title: "분리수거", cadence: "weekly", seed: 0, active: true },
    { id: uid(), title: "빨래", cadence: "weekly", seed: 1, active: true },
    { id: uid(), title: "쓰레기", cadence: "weekly", seed: 2, active: true },
    { id: uid(), title: "화장실", cadence: "weekly", seed: 3, active: true },
  ];
  return {
    onboarded: false,
    houseId: null,
    inviteCode: null,
    revision: 0,
    takenMemberIds: [],
    members: [
      { id: a, name: SAMPLE_A },
      { id: b, name: SAMPLE_B },
    ],
    meId: a,
    chores,
    shopping: [
      { id: uid(), name: "우유", done: false },
      { id: uid(), name: "계란", done: false },
      { id: uid(), name: "휴지", done: false },
      { id: uid(), name: "양파", done: true },
    ],
    completions: [],
    overrides: [],
    meals: [{ date: today, dish: "김치찌개" }],
    absences: [],
  };
}

export function boardPayload(s: BoardPayload): BoardPayload {
  return {
    members: s.members,
    chores: s.chores,
    shopping: s.shopping,
    completions: s.completions,
    overrides: s.overrides,
    meals: s.meals,
    absences: s.absences ?? [],
  };
}

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
}

export const useHouseStore = create<HouseState>()(
  persist(
    (set, get) => ({
      ...sampleHouse(),
      completeOnboarding: (names) => {
        const cleaned = names.map((n) => n.trim()).filter(Boolean);
        if (cleaned.length === 0) cleaned.push(SAMPLE_A);
        if (cleaned.length === 1) cleaned.push(SAMPLE_B);
        const current = get().members;
        const members = cleaned.map((name, i) => ({
          id: current[i]?.id ?? uid(),
          name,
        }));
        const seeded = sampleHouse();
        set({
          onboarded: true,
          members,
          meId: members[0]?.id ?? "",
          shopping: get().shopping.length ? get().shopping : seeded.shopping,
          meals: get().meals.length ? get().meals : seeded.meals,
          absences: get().absences,
        });
      },
      applyServerHouse: (house) =>
        set({
          onboarded: true,
          houseId: house.houseId,
          inviteCode: house.inviteCode,
          revision: house.revision,
          takenMemberIds: house.takenMemberIds,
          meId: house.memberId || house.payload.members[0]?.id || get().meId,
          members: house.payload.members,
          chores: house.payload.chores,
          shopping: house.payload.shopping,
          completions: house.payload.completions,
          overrides: house.payload.overrides,
          meals: house.payload.meals,
          absences: house.payload.absences ?? [],
        }),
      applyPayload: (payload) =>
        set({
          members: payload.members,
          chores: payload.chores,
          shopping: payload.shopping,
          completions: payload.completions,
          overrides: payload.overrides,
          meals: payload.meals,
          absences: payload.absences ?? [],
        }),
      setRevision: (revision) => set({ revision }),
      setMe: (id) => set({ meId: id }),
      renameMember: (id, name) =>
        set({
          members: get().members.map((m) =>
            m.id === id ? { ...m, name: name.trim() || m.name } : m,
          ),
        }),
      addMember: (name) => {
        const n = name.trim();
        if (!n) return;
        set({ members: [...get().members, { id: uid(), name: n }] });
      },
      removeMember: (id) => {
        const members = get().members.filter((m) => m.id !== id);
        if (members.length < 1) return;
        const meId = members.some((m) => m.id === get().meId)
          ? get().meId
          : members[0].id;
        set({
          members,
          meId,
          absences: get().absences.filter((a) => a.memberId !== id),
        });
      },
      toggleChoreActive: (id) =>
        set({
          chores: get().chores.map((c) =>
            c.id === id ? { ...c, active: !c.active } : c,
          ),
        }),
      addChore: (title, cadence) => {
        const t = title.trim();
        if (!t) return;
        set({
          chores: [
            ...get().chores,
            {
              id: uid(),
              title: t,
              cadence,
              seed: get().chores.length,
              active: true,
            },
          ],
        });
      },
      removeChore: (id) =>
        set({ chores: get().chores.filter((c) => c.id !== id) }),
      toggleDone: (choreId) => {
        const date = todayIsoKst();
        const { completions, members, chores, overrides, absences, meId } = get();
        const existing = completions.find(
          (c) => c.choreId === choreId && c.date === date,
        );
        if (existing) {
          set({
            completions: completions.filter(
              (c) => !(c.choreId === choreId && c.date === date),
            ),
          });
          return;
        }
        const chore = chores.find((c) => c.id === choreId);
        if (!chore) return;
        const memberId =
          assigneeId(chore, members, date, overrides, absences) || meId;
        set({
          completions: [...completions, { choreId, date, memberId }],
        });
      },
      passToday: (choreId) => {
        get().passOnDate(choreId, todayIsoKst());
      },
      passOnDate: (choreId, date) => {
        const { members, chores, overrides, absences } = get();
        const chore = chores.find((c) => c.id === choreId);
        if (!chore) return;
        set({
          overrides: cycleOverrides(chore, members, date, overrides, absences),
        });
      },
      setMeal: (dish) => {
        const date = todayIsoKst();
        const meals = get().meals.filter((m) => m.date !== date);
        set({ meals: [...meals, { date, dish }] });
      },
      addShop: (name) => {
        const n = name.trim();
        if (!n) return;
        set({
          shopping: [{ id: uid(), name: n, done: false }, ...get().shopping],
        });
      },
      toggleShop: (id) =>
        set({
          shopping: get().shopping.map((s) =>
            s.id === id ? { ...s, done: !s.done } : s,
          ),
        }),
      clearBought: () =>
        set({ shopping: get().shopping.filter((s) => !s.done) }),
      setAway: (memberId, days) => {
        const start = todayIsoKst();
        const end = addDaysIso(start, Math.max(1, days) - 1);
        const rest = get().absences.filter((a) => a.memberId !== memberId);
        set({
          absences: [...rest, { id: uid(), memberId, start, end }],
        });
      },
      clearAway: (memberId) =>
        set({
          absences: get().absences.filter((a) => a.memberId !== memberId),
        }),
      clearHouse: () => set(sampleHouse()),
    }),
    {
      name: "oneul-charye-v2",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? memoryStorage() : localStorage,
      ),
      skipHydration: true,
      partialize: (s) => ({
        onboarded: s.onboarded,
        houseId: s.houseId,
        inviteCode: s.inviteCode,
        revision: s.revision,
        takenMemberIds: s.takenMemberIds,
        members: s.members,
        meId: s.meId,
        chores: s.chores,
        shopping: s.shopping,
        completions: s.completions,
        overrides: s.overrides,
        meals: s.meals,
        absences: s.absences,
      }),
    },
  ),
);
