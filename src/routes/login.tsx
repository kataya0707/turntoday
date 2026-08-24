import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AuthFrame } from "@/components/auth-frame";
import { LoginScreen } from "@/components/login-screen";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <AuthFrame title="오늘차례" blurb="이메일과 비밀번호로 들어옵니다.">
        <div className="space-y-3">
          <div className="h-11 rounded-lg bg-secondary" />
          <div className="h-11 rounded-lg bg-secondary" />
          <div className="h-12 rounded-xl bg-secondary" />
        </div>
      </AuthFrame>
    );
  }
  if (user) return <Navigate to="/" />;
  return <LoginScreen />;
}
