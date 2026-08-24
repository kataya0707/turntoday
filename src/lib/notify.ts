const FLAG = "oneul-notify";
const DAY = "oneul-notify-day";

export function notifyEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(FLAG) === "1";
}

export function setNotifyEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FLAG, on ? "1" : "0");
}

export async function requestNotify(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  const perm = await Notification.requestPermission();
  const ok = perm === "granted";
  setNotifyEnabled(ok);
  return ok;
}

export function remindIfNeeded(count: number, today: string) {
  if (count <= 0 || !notifyEnabled()) return;
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (window.localStorage.getItem(DAY) === today) return;
  try {
    new Notification("오늘차례", {
      body: `오늘 당신 차례 ${count}`,
    });
    window.localStorage.setItem(DAY, today);
  } catch {
    /* permission revoked mid-flight */
  }
}
