import { useState, type FormEvent } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { inviteFromSearch } from "@/lib/utils";

function errorMessage(err: unknown) {
  if (!err) return "다시 시도해 주세요.";
  const text =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : "";
  if (/exist|already/i.test(text)) return "이미 가입된 이메일입니다. 로그인하세요.";
  if (/invalid|credential|password/i.test(text)) return "이메일 또는 비밀번호가 맞지 않습니다.";
  if (/origin/i.test(text)) return "이 화면에서 다시 열어 주세요.";
  return text || "다시 시도해 주세요.";
}

function afterAuthPath() {
  const invite = inviteFromSearch();
  return invite ? `/?invite=${encodeURIComponent(invite)}` : "/";
}

export function LoginScreen() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const next = afterAuthPath();
    try {
      if (mode === "forgot") {
        setNotice(
          "이메일로 재설정 링크를 보내지 못합니다. 로그인할 수 있으면 설정에서 바꾸고, 구글 계정은 Google 버튼으로 들어오세요.",
        );
        setBusy(false);
        return;
      }
      if (mode === "signup") {
        const { error: signError } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.trim().split("@")[0] || "사용자",
          callbackURL: next,
        });
        if (signError) throw signError;
      } else {
        const { error: signError } = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: next,
        });
        if (signError) throw signError;
      }
      window.location.assign(next);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthFrame
      title={mode === "signup" ? "집 열기" : mode === "forgot" ? "비밀번호" : "들어오기"}
      blurb={
        mode === "signup"
          ? "이메일로 가입하면 집이 생기고, 상대는 초대 링크로 들어옵니다."
          : mode === "forgot"
            ? "비밀번호를 모르면 구글로 들어오거나, 들어온 뒤 설정에서 바꿉니다."
            : "이메일로 로그인하거나, 구글로 바로 들어옵니다."
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {mode === "signup" ? (
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted">
              이름
            </span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={20}
              placeholder="현규"
            />
          </label>
        ) : null}
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted">
            이메일
          </span>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            placeholder="you@email.com"
          />
        </label>
        {mode !== "forgot" ? (
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted">
              비밀번호
            </span>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              placeholder="8자 이상"
            />
          </label>
        ) : null}
        {error ? <p className="text-sm text-muted">{error}</p> : null}
        {notice ? <p className="text-sm leading-relaxed text-muted">{notice}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy || !authEnabled}>
          {busy
            ? "잠시만요"
            : mode === "signup"
              ? "회원가입"
              : mode === "forgot"
                ? "안내 보기"
                : "로그인"}
        </Button>
      </form>

      <div className="mt-5 flex flex-col gap-3 text-sm text-muted">
        {mode === "signin" ? (
          <button
            type="button"
            className="min-h-11 text-left underline-offset-4 hover:underline"
            onClick={() => {
              setMode("forgot");
              setError("");
              setNotice("");
            }}
          >
            비밀번호를 잊었나요
          </button>
        ) : null}
        <button
          type="button"
          className="min-h-11 text-left underline-offset-4 hover:underline"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError("");
            setNotice("");
          }}
        >
          {mode === "signup" ? "이미 계정이 있나요? 로그인" : "처음인가요? 회원가입"}
        </button>
      </div>

      {mode !== "forgot" ? (
        <div className="mt-8 space-y-3">
          <p className="text-center text-xs font-medium tracking-wide text-muted">또는</p>
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                size="lg"
                className="w-full"
                variant="secondary"
                onClick={() => signIn(p.providerId, { callbackURL: afterAuthPath() })}
              >
                {p.label}로 계속
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted">로그인이 꺼져 있습니다.</p>
          )}
        </div>
      ) : null}
    </AuthFrame>
  );
}
