import { Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PickMember } from "@/components/pick-member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  assigneeId,
  presentMembers,
  useHouseStore,
  type Chore,
} from "@/lib/house-store";
import { remindIfNeeded } from "@/lib/notify";
import {
  cn,
  formatKoreanDate,
  inCurrentWeek,
  todayIsoKst,
  weekdayLongKst,
} from "@/lib/utils";

export function TodayBoard() {
  const today = todayIsoKst();
  const members = useHouseStore((s) => s.members);
  const meId = useHouseStore((s) => s.meId);
  const chores = useHouseStore((s) => s.chores);

  const completions = useHouseStore((s) => s.completions);
  const overrides = useHouseStore((s) => s.overrides);
  const absences = useHouseStore((s) => s.absences);
  const shopping = useHouseStore((s) => s.shopping);
  const meals = useHouseStore((s) => s.meals);
  const toggleDone = useHouseStore((s) => s.toggleDone);
  const assignOnDate = useHouseStore((s) => s.assignOnDate);
  const setMeal = useHouseStore((s) => s.setMeal);
  const [pickChore, setPickChore] = useState<Chore | null>(null);

  const meal = meals.find((m) => m.date === today)?.dish ?? "";
  const cookChore = chores.find((c) => c.active && c.title === "저녁 차리기");
  const cookId = cookChore
    ? assigneeId(cookChore, members, today, overrides, absences)
    : "";
  const cook = members.find((m) => m.id === cookId);

  const openShop = shopping.filter((s) => !s.done).length;
  const weekCounts = members.map((m) => ({
    ...m,
    count: completions.filter(
      (c) => c.memberId === m.id && inCurrentWeek(c.date, today),
    ).length,
  }));
  const maxCount = Math.max(1, ...weekCounts.map((m) => m.count));

  const rows = chores
    .filter((chore) => chore.active)
    .map((chore) => {
    const memberId = assigneeId(chore, members, today, overrides, absences);
    const member = members.find((m) => m.id === memberId);
    const done = completions.some(
      (c) => c.choreId === chore.id && c.date === today,
    );
    return { chore, member, memberId, done };
  });

  const mineOpen = rows.filter((r) => r.memberId === meId && !r.done);
  const allDone = rows.length > 0 && rows.every((r) => r.done);

  useEffect(() => {
    remindIfNeeded(mineOpen.length, today);
  }, [mineOpen.length, today]);

  return (
    <AppShell
      wide
      kicker={`${formatKoreanDate(today)} ${weekdayLongKst()}`}
      title={
        allDone
          ? "오늘은 다 했습니다"
          : mineOpen.length > 0
            ? `오늘 당신 차례 ${mineOpen.length}`
            : "오늘은 다른 사람 차례"
      }
    >
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-12">
        <div>
      <MealCard
        dish={meal}
        cookName={cook?.name ?? "—"}
        onSave={setMeal}
      />

      <ul className="mt-4 space-y-2">
        {rows.map((row) => (
          <ChoreRow
            key={row.chore.id}
            chore={row.chore}
            name={row.member?.name ?? "—"}
            mine={row.memberId === meId}
            done={row.done}
            onToggle={() => toggleDone(row.chore.id)}
            onPick={() => {
              const pool = presentMembers(members, absences, today);
              if (pool.length < 2) return;
              setPickChore(row.chore);
            }}
          />
        ))}
      </ul>

      <Link
        to="/shop"
        className="mt-5 flex min-h-12 items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 transition-colors duration-[var(--motion-quick)] hover:bg-secondary md:hidden"
      >
        <span className="text-sm font-medium">장보기</span>
        <span className="text-sm tabular-nums text-muted">
          {openShop === 0 ? "비었음" : `${openShop}개 남음`}
        </span>
      </Link>
        </div>

        <aside className="space-y-6">
          <Link
            to="/shop"
            className="hidden min-h-12 items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 transition-colors duration-[var(--motion-quick)] hover:bg-secondary md:flex"
          >
            <span className="text-sm font-medium">장보기</span>
            <span className="text-sm tabular-nums text-muted">
              {openShop === 0 ? "비었음" : `${openShop}개 남음`}
            </span>
          </Link>
      <section className="mt-2 rounded-xl border border-border bg-card p-4 md:mt-0">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xs font-medium tracking-wide text-muted">이번 주</h2>
          <Link to="/roster" className="text-xs font-medium text-muted hover:text-foreground">
            당번표
          </Link>
        </div>
        <ul className="mt-4 space-y-4">
          {weekCounts.map((m) => (
            <li key={m.id}>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className={cn(m.id === meId && "font-medium")}>
                  {m.name}
                  {m.id === meId ? " · 나" : ""}
                </span>
                <span className="tabular-nums text-muted">{m.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-[var(--motion-fast)] ease-[var(--ease-out)]"
                  style={{ width: `${(m.count / maxCount) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
        </aside>
      </div>
      {pickChore ? (
        <PickMember
          title={pickChore.title}
          members={presentMembers(members, absences, today)}
          selectedId={assigneeId(pickChore, members, today, overrides, absences)}
          onPick={(id) => assignOnDate(pickChore.id, today, id)}
          onClose={() => setPickChore(null)}
        />
      ) : null}
    </AppShell>
  );
}

function MealCard({
  dish,
  cookName,
  onSave,
}: {
  dish: string;
  cookName: string;
  onSave: (dish: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(dish);

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted">오늘 저녁</p>
        <p className="text-xs text-muted">{cookName} 차림</p>
      </div>
      {editing ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(value);
            setEditing(false);
          }}
        >
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="메뉴"
            autoFocus
          />
          <Button type="submit" size="sm">
            저장
          </Button>
        </form>
      ) : (
        <button
          type="button"
          className="mt-2 w-full text-left font-display text-2xl font-semibold tracking-tight"
          onClick={() => {
            setValue(dish);
            setEditing(true);
          }}
        >
          {dish || "메뉴를 적어 두세요"}
        </button>
      )}
    </section>
  );
}

function ChoreRow({
  chore,
  name,
  mine,
  done,
  onToggle,
  onPick,
}: {
  chore: Chore;
  name: string;
  mine: boolean;
  done: boolean;
  onToggle: () => void;
  onPick: () => void;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card p-2 pl-3",
        mine && !done && "bg-secondary/40",
        done && "opacity-50",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        aria-label={`${chore.title} ${done ? "취소" : "완료"}`}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-md border border-border transition-colors duration-[var(--motion-quick)]",
          done && "border-accent bg-accent text-accent-foreground",
        )}
      >
        {done ? <Check className="size-5" strokeWidth={2.4} /> : null}
      </button>
      <button
        type="button"
        onClick={onPick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-label={`${chore.title} 담당 고르기`}
      >
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", done && "line-through")}>
          {chore.title}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {name}
          {mine ? " · 나" : ""}
          {" · "}
          {chore.cadence === "daily" ? "매일 교대" : "이번 주"}
        </p>
      </div>
      <span
        className={cn(
          "hidden size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-medium sm:flex",
          mine && "bg-accent text-accent-foreground",
        )}
        aria-hidden
      >
        {name.slice(0, 1)}
      </span>
      </button>
    </li>
  );
}
