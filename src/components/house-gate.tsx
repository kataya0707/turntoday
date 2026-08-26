import { useEffect, useState, type ReactNode } from "react";
import { LoginScreen } from "@/components/login-screen";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function HouseGate({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (!isPending) return;
    const t = window.setTimeout(() => setGaveUp(true), 8000);
    return () => window.clearTimeout(t);
  }, [isPending]);

  if (user) return <>{children}</>;
  if (isPending && !gaveUp) {
    return <div className="flex min-h-dvh items-center justify-center bg-bg text-sm text-muted">잠시만요</div>;
  }
  return <LoginScreen />;
}