import type { ReactNode } from "react";

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
      <section className="hidden flex-col justify-between border-r border-border bg-card px-12 py-12 lg:flex xl:px-16">
        <p className="text-sm font-medium tracking-wide text-muted">오늘차례</p>
        <div>
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            오늘 집 일은
            <br />
            누구 차례인지
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-muted">
            당번, 장보기, 공평 기록. 두 폰이 같은 보드를 봅니다.
          </p>
        </div>
        <p className="text-sm text-muted">웹에서 열고, 홈 화면에 두면 앱입니다.</p>
      </section>
      <section className="flex min-h-dvh items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <p className="text-sm font-medium text-muted lg:hidden">
            {kicker ?? "집 운영 보드"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{blurb}</p>
          <div className="mt-8 sm:mt-10">{children}</div>
        </div>
      </section>
    </div>
  );
}
