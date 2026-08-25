import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { HouseGate } from "@/components/house-gate";
import { Onboarding } from "@/components/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient, signOut } from "@/lib/auth/client";
import { deleteAccount, joinHouse, leaveHouse, peekInvite, setMyMember } from "@/lib/house-api";
import { notifyEnabled, requestNotify, setNotifyEnabled } from "@/lib/notify";
import { useHouseStore, type Cadence } from "@/lib/house-store";
import { cn, formatKoreanDate, objectParticle, todayIsoKst } from "@/lib/utils";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <HouseGate>
      <SettingsInner />
    </HouseGate>
  );
}

function SettingsInner() {
  const onboarded = useHouseStore((s) => s.onboarded);
  const members = useHouseStore((s) => s.members);
  const meId = useHouseStore((s) => s.meId);
  const chores = useHouseStore((s) => s.chores);
  const inviteCode = useHouseStore((s) => s.inviteCode);
  const takenMemberIds = useHouseStore((s) => s.takenMemberIds);
  const absences = useHouseStore((s) => s.absences);
  const applyServerHouse = useHouseStore((s) => s.applyServerHouse);
  const setMe = useHouseStore((s) => s.setMe);
  const renameMember = useHouseStore((s) => s.renameMember);
  const addMember = useHouseStore((s) => s.addMember);
  const removeMember = useHouseStore((s) => s.removeMember);
  const toggleChoreActive = useHouseStore((s) => s.toggleChoreActive);
  const addChore = useHouseStore((s) => s.addChore);
  const removeChore = useHouseStore((s) => s.removeChore);
  const setAway = useHouseStore((s) => s.setAway);
  const clearAway = useHouseStore((s) => s.clearAway);
  const clearHouse = useHouseStore((s) => s.clearHouse);

  const [newMember, setNewMember] = useState("");
  const [newChore, setNewChore] = useState("");
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [alertsOn, setAlertsOn] = useState(notifyEnabled);
  const today = todayIsoKst();

  if (!onboarded) return <Onboarding />;

  const inviteUrl =
    typeof window === "undefined" || !inviteCode
      ? ""
      : `${window.location.origin}/?invite=${inviteCode}`;

  async function copyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
      toast.success("초대 링크를 복사했습니다");
    } catch {
      toast.error("복사할 수 없습니다. 위 코드를 직접 보내 주세요.");
    }
  }

  async function shareInvite() {
    if (!inviteUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "오늘차례",
          text: "집 보드에 들어와 주세요",
          url: inviteUrl,
        });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    await copyInvite();
  }

  return (
    <AppShell kicker="같은 링크면 같은 집입니다" title="설정">
      <div className="mx-auto max-w-xl space-y-10 lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-12 lg:space-y-0">
        <div className="space-y-10">
          <section>
            <h2 className="text-xs font-medium tracking-wide text-muted">초대</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted break-keep">
              링크를 열면 빈 자리를 고르고 들어옵니다. 이미 앉은 자리는 잠깁니다.
            </p>
            <div className="mt-3 flex gap-2">
              <div className="flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-lg border border-border bg-card px-3 text-sm tracking-widest">
                {inviteCode ?? "저장 후 생깁니다"}
              </div>
              <Button type="button" variant="secondary" className="shrink-0" disabled={!inviteCode} onClick={() => void shareInvite()}>
                {copied ? "복사됨" : "공유"}
              </Button>
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setJoinError("");
                try {
                  const preview = await peekInvite({ data: { code: joinCode } });
                  const free = preview.members.find(
                    (m) => !preview.takenMemberIds.includes(m.id),
                  );
                  if (!free) {
                    setJoinError("빈 자리가 없습니다.");
                    return;
                  }
                  const house = await joinHouse({
                    data: { code: joinCode, memberId: free.id },
                  });
                  applyServerHouse(house);
                  setJoinCode("");
                  toast.success("다른 집으로 옮겼습니다");
                } catch (err) {
                  setJoinError(err instanceof Error ? err.message : "들어가지 못했습니다.");
                }
              }}
            >
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="다른 집 코드"
                maxLength={12}
              />
              <Button type="submit" variant="outline" className="shrink-0">
                옮기기
              </Button>
            </form>
            {joinError ? <p className="mt-2 text-sm text-muted">{joinError}</p> : null}
          </section>

          <section>
            <h2 className="text-xs font-medium tracking-wide text-muted">사람</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted break-keep">
              이 폰에서 나는 누구인지 고르세요. 연결된 자리는 다른 사람이 쓸 수 없습니다.
            </p>
            <ul className="mt-3 space-y-2">
              {members.map((m) => {
                const taken = takenMemberIds.includes(m.id);
                const away = absences.find(
                  (a) => a.memberId === m.id && a.end >= today,
                );
                return (
                  <li
                    key={m.id}
                    className="space-y-2 rounded-xl border border-border bg-card p-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void setMyMember({ data: m.id })
                            .then(() => setMe(m.id))
                            .catch((err) =>
                              toast.error(
                                err instanceof Error ? err.message : "자리를 바꾸지 못했습니다.",
                              ),
                            );
                        }}
                        className={cn(
                          "h-11 shrink-0 rounded-lg px-3 text-sm font-medium",
                          meId === m.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {meId === m.id ? "나" : "선택"}
                      </button>
                      <Input
                        value={m.name}
                        onChange={(e) => renameMember(m.id, e.target.value)}
                        aria-label={`${m.name} 이름`}
                        className="min-w-0 flex-1"
                      />
                      {members.length > 1 ? (
                        <ConfirmDialog
                          title={`${m.name}${objectParticle(m.name)} 뺄까요?`}
                          description="당번에서 빠지고, 연결된 계정이 있으면 그 사람은 자리를 잃습니다."
                          confirmLabel="빼기"
                          trigger={
                            <Button type="button" variant="outline" size="sm" className="shrink-0">
                              빼기
                            </Button>
                          }
                          onConfirm={() => removeMember(m.id)}
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 px-1">
                      <p className="text-xs text-muted">
                        {taken ? "계정 연결" : "빈 자리"}
                        {away
                          ? ` · ${formatKoreanDate(away.start)}–${formatKoreanDate(away.end)} 부재`
                          : ""}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAway(m.id, 1)}
                      >
                        오늘 부재
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAway(m.id, 7)}
                      >
                        일주일
                      </Button>
                      {away ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => clearAway(m.id)}
                        >
                          해제
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addMember(newMember);
                  setNewMember("");
                }}
              >
                <Input
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  placeholder="사람 추가"
                />
                <Button type="submit" variant="secondary">
                  추가
                </Button>
              </form>
          </section>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-xs font-medium tracking-wide text-muted">집안일</h2>
            <ul className="mt-3 space-y-2">
              {chores.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => toggleChoreActive(c.id)}
                    className={cn(
                      "flex min-h-11 flex-1 text-left text-sm font-medium",
                      !c.active && "text-muted line-through",
                    )}
                  >
                    {c.title}
                    <span className="ml-2 text-xs font-normal text-muted">
                      {c.cadence === "daily" ? "매일" : "주간"}
                    </span>
                  </button>
                  <ConfirmDialog
                    title={`${c.title}${objectParticle(c.title)} 삭제할까요?`}
                    description="당번표에서 사라집니다."
                    confirmLabel="삭제"
                    trigger={
                      <Button type="button" variant="ghost" size="sm">
                        삭제
                      </Button>
                    }
                    onConfirm={() => removeChore(c.id)}
                  />
                </li>
              ))}
            </ul>
            <form
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                addChore(newChore, cadence);
                setNewChore("");
              }}
            >
              <Input
                value={newChore}
                onChange={(e) => setNewChore(e.target.value)}
                placeholder="일 추가"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={cadence === "daily" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setCadence("daily")}
                >
                  매일 교대
                </Button>
                <Button
                  type="button"
                  variant={cadence === "weekly" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setCadence("weekly")}
                >
                  이번 주
                </Button>
                <Button type="submit" className="ml-auto" size="sm">
                  넣기
                </Button>
              </div>
            </form>
          </section>

          <section>
            <h2 className="text-xs font-medium tracking-wide text-muted">오늘 차례 알림</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted break-keep">
              이 폰에서 앱을 열었을 때, 오늘 남은 일이 있으면 한 번 알려 줍니다.
            </p>
            <Button
              type="button"
              variant={alertsOn ? "default" : "secondary"}
              className="mt-3"
              onClick={() => {
                if (alertsOn) {
                  setNotifyEnabled(false);
                  setAlertsOn(false);
                  return;
                }
                void requestNotify().then((ok) => {
                  setAlertsOn(ok);
                  if (!ok) toast.error("알림 권한이 없습니다.");
                });
              }}
            >
              {alertsOn ? "알림 켜짐" : "알림 켜기"}
            </Button>
          </section>

          <section>
            <h2 className="text-xs font-medium tracking-wide text-muted">비밀번호</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted break-keep">
              이메일로 가입한 계정만 바꿀 수 있습니다. 구글 계정은 그쪽에서 바꿉니다.
            </p>
            <form
              className="mt-3 space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setPwBusy(true);
                try {
                  const { error } = await authClient.changePassword({
                    currentPassword: currentPw,
                    newPassword: newPw,
                    revokeOtherSessions: true,
                  });
                  if (error) throw error;
                  setCurrentPw("");
                  setNewPw("");
                  toast.success("비밀번호를 바꿨습니다");
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "바꾸지 못했습니다. 이메일 계정인지 확인해 주세요.",
                  );
                } finally {
                  setPwBusy(false);
                }
              }}
            >
              <Input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="지금 비밀번호"
                autoComplete="current-password"
              />
              <Input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="새 비밀번호 8자 이상"
                minLength={8}
                autoComplete="new-password"
              />
              <Button type="submit" variant="secondary" className="w-full" disabled={pwBusy || newPw.length < 8}>
                {pwBusy ? "바꾸는 중" : "비밀번호 바꾸기"}
              </Button>
            </form>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-medium tracking-wide text-muted">계정</h2>
            <p className="text-sm leading-relaxed text-muted break-keep">
              이름과 집안일 기록은 집 보드에 남습니다. 탈퇴하면 이 계정의 로그인과
              집 연결이 지워집니다. 이메일은 로그인에만 쓰고, 광고에 쓰지 않습니다.
            </p>
            <ConfirmDialog
              title="집을 나갈까요?"
              description="보드는 남는 사람에게 그대로 있습니다. 다시 들어오려면 초대 링크가 필요합니다."
              confirmLabel="나가기"
              trigger={
                <Button type="button" variant="outline" className="w-full">
                  집 나가기
                </Button>
              }
              onConfirm={async () => {
                await leaveHouse();
                clearHouse();
                toast.success("집에서 나왔습니다");
              }}
            />
            <ConfirmDialog
              title="회원 탈퇴할까요?"
              description="로그인 정보와 집 연결이 삭제됩니다. 이 동작은 되돌릴 수 없습니다."
              confirmLabel="탈퇴"
              trigger={
                <Button type="button" variant="outline" className="w-full">
                  회원 탈퇴
                </Button>
              }
              onConfirm={async () => {
                await deleteAccount();
                clearHouse();
                try {
                  await signOut("/");
                } catch {
                  window.location.assign("/");
                }
              }}
            />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
