import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createHouse, joinHouse, peekInvite } from "@/lib/house-api";
import { boardPayload, useHouseStore } from "@/lib/house-store";
import { cn, inviteFromSearch } from "@/lib/utils";
import type { InvitePreview } from "@/lib/house-types";

export function Onboarding() {
  const members = useHouseStore((s) => s.members);
  const completeOnboarding = useHouseStore((s) => s.completeOnboarding);
  const applyServerHouse = useHouseStore((s) => s.applyServerHouse);
  const [names, setNames] = useState<string[]>([
    members[0]?.name ?? "현규",
    members[1]?.name ?? "민서",
  ]);
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [seatId, setSeatId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fromUrl = inviteFromSearch();
    if (fromUrl) setCode(fromUrl);
  }, []);

  useEffect(() => {
    if (!code) return;
    void peekInvite({ data: { code } })
      .then((house) => {
        setPreview(house);
        const free = house.members.find((m) => !house.takenMemberIds.includes(m.id));
        setSeatId(free?.id ?? "");
      })
      .catch(() => {
        setPreview(null);
      });
  }, [code]);

  function setNameAt(index: number, value: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  return (
    <AuthFrame
      title="오늘차례"
      blurb="새 집을 열거나, 초대 링크로 빈 자리에 앉습니다. 같은 보드가 여러 기기에 저장됩니다."
    >
      {preview ? (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!seatId) {
              setError("빈 자리를 고르세요.");
              return;
            }
            setBusy(true);
            setError("");
            try {
              const house = await joinHouse({ data: { code, memberId: seatId } });
              applyServerHouse(house);
              toast.success("집에 들어왔습니다");
            } catch (err) {
              setError(err instanceof Error ? err.message : "들어가지 못했습니다.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="text-xs font-medium tracking-wide text-muted">
            초대 {preview.inviteCode}
          </p>
          <ul className="space-y-2">
            {preview.members.map((m) => {
              const taken = preview.takenMemberIds.includes(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={taken}
                    onClick={() => setSeatId(m.id)}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-between rounded-lg border px-3 text-sm",
                      seatId === m.id
                        ? "border-accent bg-secondary"
                        : "border-border bg-card",
                      taken && "opacity-50",
                    )}
                  >
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs text-muted">
                      {taken ? "쓰는 중" : "빈 자리"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Button type="submit" size="lg" className="w-full" disabled={busy || !seatId}>
            {busy ? "들어가는 중" : "이 자리로 들어가기"}
          </Button>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            completeOnboarding(names);
            try {
              const local = useHouseStore.getState();
              const house = await createHouse({
                data: { ...boardPayload(local), meId: local.meId },
              });
              applyServerHouse(house);
            } catch (err) {
              setError(err instanceof Error ? err.message : "집을 만들지 못했습니다.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">나</span>
            <Input
              value={names[0] ?? ""}
              onChange={(e) => setNameAt(0, e.target.value)}
              maxLength={12}
              autoComplete="name"
            />
          </label>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">같이 사는 사람</p>
            <ul className="space-y-2">
              {names.slice(1).map((name, i) => {
                const index = i + 1;
                return (
                  <li key={index} className="flex gap-2">
                    <Input
                      value={name}
                      onChange={(e) => setNameAt(index, e.target.value)}
                      maxLength={12}
                      placeholder="이름"
                      aria-label={`같이 사는 사람 ${index}`}
                    />
                    {names.length > 2 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setNames((prev) => prev.filter((_, j) => j !== index))
                        }
                      >
                        빼기
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <Button
                type="button"
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => setNames((prev) => [...prev, ""])}
              >
                사람 추가
              </Button>
          </div>
          <Button type="submit" size="lg" className="mt-2 w-full" disabled={busy}>
            {busy ? "만드는 중" : "새 집 열기"}
          </Button>
        </form>
      )}

      <form
        className="mt-10 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const house = await peekInvite({ data: { code } });
            setPreview(house);
            const free = house.members.find((m) => !house.takenMemberIds.includes(m.id));
            setSeatId(free?.id ?? "");
          } catch (err) {
            setPreview(null);
            setError(err instanceof Error ? err.message : "들어가지 못했습니다.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="text-xs font-medium tracking-wide text-muted">이미 집이 있나요</p>
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="초대 코드"
            maxLength={12}
            aria-label="초대 코드"
          />
          <Button type="submit" variant="secondary" disabled={busy}>
            찾기
          </Button>
        </div>
      </form>
      {error ? <p className="mt-4 text-sm text-muted">{error}</p> : null}
    </AuthFrame>
  );
}
