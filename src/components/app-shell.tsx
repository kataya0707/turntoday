import { Link } from "@tanstack/react-router";
import { CalendarDays, House, Settings, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { SyncMark } from "@/components/sync-mark";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "오늘", icon: House },
  { to: "/shop", label: "장보기", icon: ShoppingBag },
  { to: "/roster", label: "당번", icon: CalendarDays },
  { to: "/settings", label: "설정", icon: Settings },
] as const;

export function AppShell({
  children,
  title,
  kicker,
  wide,
}: {
  children: ReactNode;
  title?: string;
  kicker?: string;
  wide?: boolean;
}) {
  const { user, isPending } = useCurrentUserState();
  return (
    <div className="min-h-dvh bg-bg">
      <aside className="pad-safe-top hidden w-60 flex-col border-r border-border bg-card md:fixed md:inset-y-0 md:left-0 md:z-20 md:flex">
        <div className="flex items-center gap-3 px-5 pb-8 pt-2">
          <BrandMark />
          <div>
            <p className="text-xs font-medium tracking-wide text-muted">오늘차례</p>
            <p className="font-display text-base font-semibold tracking-tight">집 보드</p>
          </div>
        </div>
        <nav aria-label="주요 메뉴" className="flex-1 px-3">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="flex min-h-11 items-center gap-3 rounded-lg border-l-2 border-transparent px-3 text-sm text-muted transition-[background-color,color,border-color] duration-[var(--motion-quick)] ease-[var(--ease-out)] data-[status=active]:border-accent data-[status=active]:bg-secondary data-[status=active]:text-foreground"
                    activeOptions={{ exact: item.to === "/" }}
                  >
                    <Icon className="size-5" strokeWidth={1.8} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-border px-4 py-4">
          {isPending ? (
            <div className="h-8 w-full rounded-full bg-secondary" />
          ) : user ? (
            <div className="overflow-hidden">
              <UserButton />
            </div>
          ) : null}
        </div>
      </aside>

      <div className="md:pl-60">
        <header className="pad-safe-top pad-safe-x sticky top-0 z-20 border-b border-border/80 bg-bg/90 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-5xl px-4 pb-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3 md:hidden">
              <div className="flex items-center gap-2">
                <BrandMark />
                <p className="text-xs font-medium tracking-wide text-muted">오늘차례</p>
              </div>
              {isPending ? (
                <div className="h-8 w-24 shrink-0 rounded-full bg-secondary" />
              ) : user ? (
                <div className="max-w-[60%] overflow-hidden">
                  <UserButton />
                </div>
              ) : null}
            </div>
            {kicker ? (
              <div className="mt-3 flex items-baseline justify-between gap-3 md:mt-4">
                <p className="text-sm text-muted">{kicker}</p>
                <SyncMark />
              </div>
            ) : (
              <div className="mt-3 flex justify-end md:mt-4">
                <SyncMark />
              </div>
            )}
            {title ? (
              <h1 className="mt-1 font-display text-2xl font-semibold leading-snug tracking-tight sm:text-3xl lg:text-4xl">
                {title}
              </h1>
            ) : null}
          </div>
        </header>

        <main
          className={cn(
            "mx-auto w-full px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-8 lg:pt-8",
            wide ? "max-w-6xl" : "max-w-5xl",
          )}
        >
          {children}
        </main>
      </div>

      <nav
        className="pad-safe-bottom pad-safe-x fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 pt-1.5 backdrop-blur-sm md:hidden"
        aria-label="주요 메뉴"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex min-h-12 flex-col items-center justify-center gap-0.5 text-muted transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)] data-[status=active]:text-foreground"
                  activeOptions={{ exact: item.to === "/" }}
                >
                  <Icon className="size-5" strokeWidth={1.8} />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
