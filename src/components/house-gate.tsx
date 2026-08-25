import type { ReactNode } from "react";
import { LoginScreen } from "@/components/login-screen";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function HouseGate({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div className="min-h-dvh bg-bg" />;
  if (!user) return <LoginScreen />;
  return <>{children}</>;
}