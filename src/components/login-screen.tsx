import { useEffect, useState, type FormEvent } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  rememberSessionToken,
  signIn,
} from "@/lib/auth/client";
import { inviteFromSearch } from "@/lib/utils";

function errorMessage(err: unknown) {
  if (!err) return "다시 시도해 주세요.";
  const rec = err as { message?: unknown; code?: unknown; status?: unknown };
  const code = typeof rec?.code === "string" ? rec.code : "";
  const text =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : typeof rec?.message === "string"
          ? rec.message
          : "";
  if (/USER_ALREADY_EXISTS|already exists|exist/i.test(`${code} ${text}`)) {
    return "이미 가입된 이메일입니다. 로그인하세요.";
  }
  if (/INVALID_EMAIL_OR_PASSWORD|invalid.+password|credential/i.test(`${code} ${text}`)) {
    return "이메일 또는 비밀번호가 맞지 않습니다.";
  }
  if (/INVALID_EMAIL|invalid email/i.test(`${code} ${text}`)) {
    return "이메일 형식을 확인해 주세요.";
  }
  if (/PASSWORD_TOO_SHORT|too short|min/i.test(`${code} ${text}`)) {
    return "비밀번호는 8자 이상이어야 합니다.";
  }
  if (/origin|forbidden|csrf/i.test(`${code} ${text}`)) {
    return "이 주소에서 다시 열어 주세요. turntoday.vercel.app 을 쓰세요.";
  }
  if (/fetch|network|failed|timeout|503|500/i.test(`${code} ${text}`)) {
    return "연결이 잠깐 끊겼습니다. 다시 눌러 주세요.";
  }
  return text || "다시 시도해 주세요.";
}

function afterAuthPath() {
  const invite = inviteFromSearch();
  return invite ? `/?invite=${encodeURIComponent(invite)}` : "/";
}

/** Grok broker Google only works on grok.me / sandbox — not vercel.app. */
function brokerSocialOk() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return (
    h === "localhost" ||
    h.endsWith(".grok.me") ||
    h.endsWith(".grok-sandbox.com")
  );
}

async function emailAuth(
  mode: "signup" | "signin",
  email: string,
  password: string,
  name: string,
) {
  const run = () =>
    mode === "signup"
      ? authClient.signUp.email({ email, password, name })
      : authClient.signIn.email({ email, password });

  let result = await run();
  if (result.error) {
    const msg = `${result.error.code ?? ""} ${result.error.message ?? ""}`;
    if (/fetch|network|failed|timeout|503|500/i.test(msg)) {
      await new Promise((r) => window.setTimeout(r, 600));
      result = await run();
    }
  }
  if (result.error) throw result.error;
  const token =
    result.data && typeof result.data === "object" && "token" in result.data
      ? (result.data as { token?: string }).token
      : undefined;
  rememberSessionToken(token);
  await authClient.getSession().catch(() => undefined);
}

export function LoginScreen() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [social, setSocial] = useState(false);

  useEffect(() => {
    setSocial(brokerSocialOk());
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const next = afterAuthPath();
    try {
      if (mode === "forgot") {
        setNotice(
          "이메일로 재설정 링크를 보내지 못합니다. 로그인할 수 있으면 설정에서 바꾸세요.",
        );
        setBusy(false);
        return;
      }
      await emailAuth(
        mode === "signup" ? "signup" : "signin",
        email.trim(),
        password,
        name.trim() || email.trim().split("@")[0] || "사용자",
      );
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
            ? "로그인할 수 있으면 설정에서 비밀번호를 바꿉니다."
            : social
              ? "이메일로 로그인하거나, 구글로 바로 들어옵니다."
              : "이메일과 비밀번호로 들어옵니다."
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
        {!authEnabled ? (
          <p className="text-sm text-muted">로그인이 꺼져 있습니다.</p>
        ) : null}
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

      {mode !== "forgot" && social && authEnabled ? (
        <div className="mt-8 space-y-3">
          <p className="text-center text-xs font-medium tracking-wide text-muted">또는</p>
          {GROK_PROVIDERS.map((p) => (
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
          ))}
        </div>
      ) : null}
    </AuthFrame>
  );
}