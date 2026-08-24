import { RotateCw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { assigneeId, useHouseStore, type Chore } from "@/lib/house-store";
import {
  cn,
  dayNum,
  formatKoreanDate,
  todayIsoKst,
  weekDates,
  weekdayShortKo,
} from "@/lib/utils";

export function WeekRoster() {
  const members = useHouseStore((s) => s.members);
  const meId = useHouseStore((s) => s.meId);
  const chores = useHouseStore((s) => s.chores);
  const overrides = useHouseStore((s) => s.overrides);
  const absences = useHouseStore((s) => s.absences);
  const completions = useHouseStore((s) => s.completions);
  const passOnDate = useHouseStore((s) => s.passOnDate);

  const today = todayIsoKst();
  const week = weekDates(today);
  const active = chores.filter((c) => c.active);
  const daily = active.filter((c) => c.cadence === "daily");
  const weekly = active.filter((c) => c.cadence === "weekly");

  const mineCells = daily.reduce((n, chore) => {
    return (
      n +
      week.filter((date) => assigneeId(chore, members, date, overrides, absences) === meId)
        .length
    );
  }, 0);
  const mineWeekly = weekly.filter(
    (chore) => assigneeId(chore, members, today, overrides, absences) === meId,
  ).length;
  const mineCount = mineCells + mineWeekly;

  return (
    <AppShell
      wide
      kicker={`${formatKoreanDate(week[0])} – ${formatKoreanDate(week[6])}`}
      title={
        mineCount > 0
          ? `이번 주 당신 차례 ${mineCount}`
          : "이번 주는 다른 사람 차례"
      }
    >
      <p className="mb-6 max-w-xl text-sm leading-relaxed text-muted">
        이름을 누르면 다음 사람으로 넘어갑니다. 테두리는 오늘이고, 주간 일은
        일주일 전체가 바뀝니다.
      </p>

      {daily.length > 0 ? (
        <section>
          <h2 className="text-xs font-medium tracking-wide text-muted">
            매일 교대
          </h2>
          <div className="mt-3 rounded-xl border border-border bg-card p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1">
              {week.map((date) => (
                <div
                  key={date}
                  className={cn(
                    "flex flex-col items-center rounded-lg py-1.5",
                    date === today && "bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs",
                      date === today
                        ? "font-medium text-foreground"
                        : "text-muted",
                    )}
                  >
                    {weekdayShortKo(date)}
                  </span>
                  <span className="mt-0.5 text-xs tabular-nums text-muted">
                    {dayNum(date)}
                  </span>
                </div>
              ))}
            </div>

            <ul className="mt-3 space-y-4">
              {daily.map((chore) => (
                <li key={chore.id}>
                  <p className="mb-1.5 px-0.5 text-sm font-medium">
                    {chore.title}
                  </p>
                  <div className="grid grid-cols-7 gap-1">
                    {week.map((date) => {
                      const memberId = assigneeId(
                        chore,
                        members,
                        date,
                        overrides,
                        absences,
                      );
                      const member = members.find((m) => m.id === memberId);
                      const mine = memberId === meId;
                      const done = completions.some(
                        (c) => c.choreId === chore.id && c.date === date,
                      );
                      return (
                        <DayCell
                          key={date}
                          name={member?.name ?? "—"}
                          mine={mine}
                          isToday={date === today}
                          done={done}
                          label={`${chore.title} ${weekdayShortKo(date)} ${member?.name ?? ""} 넘기기`}
                          onPass={() => passOnDate(chore.id, date)}
                        />
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {weekly.length > 0 ? (
        <section className={daily.length > 0 ? "mt-8 lg:mt-10" : undefined}>
          <h2 className="text-xs font-medium tracking-wide text-muted">
            이번 주 담당
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {weekly.map((chore) => (
              <WeeklyRow
                key={chore.id}
                chore={chore}
                name={
                  members.find(
                    (m) =>
                      m.id === assigneeId(chore, members, today, overrides, absences),
                  )?.name ?? "—"
                }
                mine={assigneeId(chore, members, today, overrides, absences) === meId}
                doneCount={
                  completions.filter(
                    (c) => c.choreId === chore.id && week.includes(c.date),
                  ).length
                }
                onPass={() => passOnDate(chore.id, today)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {active.length === 0 ? (
        <p className="text-sm text-muted">설정에서 집안일을 켜 주세요.</p>
      ) : null}
    </AppShell>
  );
}

function DayCell({
  name,
  mine,
  isToday,
  done,
  label,
  onPass,
}: {
  name: string;
  mine: boolean;
  isToday: boolean;
  done: boolean;
  label: string;
  onPass: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPass}
      aria-label={label}
      className={cn(
        "flex min-h-11 items-center justify-center rounded-lg px-0.5 transition-[background-color,opacity,border-color] duration-[var(--motion-quick)] ease-[var(--ease-out)]",
        isToday ? "border border-accent" : "border border-transparent",
        mine ? "bg-secondary text-foreground" : "text-muted hover:bg-secondary/60",
        done && "opacity-55",
      )}
    >
      <span className={cn("max-w-full truncate text-xs font-medium", mine && "text-foreground", done && "line-through")}>
        {shortName(name)}
      </span>
    </button>
  );
}

function WeeklyRow({
  chore,
  name,
  mine,
  doneCount,
  onPass,
}: {
  chore: Chore;
  name: string;
  mine: boolean;
  doneCount: number;
  onPass: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{chore.title}</p>
        <p className="text-xs text-muted">
          {name}
          {mine ? " · 나" : ""}
          {doneCount > 0 ? ` · 완료 ${doneCount}` : ""}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`${chore.title} 다른 사람에게 넘기기`}
        onClick={onPass}
        className="shrink-0 text-muted"
      >
        <RotateCw className="size-4" />
      </Button>
    </li>
  );
}

function shortName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length <= 3) return trimmed;
  return trimmed.slice(0, 2);
}
