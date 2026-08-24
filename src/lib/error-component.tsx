import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-foreground">
      <span className="text-accent" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-lg font-semibold tracking-tight">
        화면을 불러오지 못했습니다
      </h1>
      <p className="max-w-md text-sm leading-relaxed break-words text-muted">
        {error.message || "잠시 후 다시 열어 주세요."}
      </p>
    </main>
  );
}
