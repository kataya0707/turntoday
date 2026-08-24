import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

const PREVIEW = [
  { title: "저녁 차리기", who: "오늘 차례", done: false },
  { title: "설거지", who: "다음", done: true },
  { title: "쓰레기", who: "이번 주", done: false },
] as const;

export function AuthFrame({
  children,
  kicker,
  title,
  blurb,
}: {
  children: ReactNode;
  kicker?: string;
  title: string;
  blurb: string;
}) {
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-card px-12 py-12 lg:flex xl:px-16">
        <div className="flex items-center gap-3">
          <BrandMark />
          <p className="text-sm font-medium tracking-wide">오늘차례</p>
        </div>
        <div>
          <h2 className="font-display text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl">
            오늘 집 일은
            <br />
            누구 차례인지
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-muted">
            당번, 장보기, 공평 기록. 두 폰이 같은 보드를 봅니다.
          </p>
          <ul className="mt-10 max-w-sm space-y-2">
            {PREVIEW.map((row) => (
              <li
                key={row.title}
                className="flex items-center justify-between rounded-xl border border-border bg-bg/50 px-4 py-3"
              >
                <span
                  className={
                    row.done
                      ? "text-sm text-muted line-through"
                      : "text-sm font-medium"
                  }
                >
                  {row.title}
                </span>
                <span className="text-xs text-muted">{row.who}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-muted">웹에서 열고, 홈 화면에 두면 앱입니다.</p>
      </section>
      <section className="flex min-h-dvh items-center justify-center px-4 py-12 sm:px-8">
        <div className="rise-in w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <p className="text-sm font-medium tracking-wide">
              {kicker ?? "오늘차례"}
            </p>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{blurb}</p>
          <div className="mt-8 sm:mt-10">{children}</div>
        </div>
      </section>
    </div>
  );
}
