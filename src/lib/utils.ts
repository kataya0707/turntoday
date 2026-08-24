import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return twMerge(inputs.filter(Boolean).join(" "));
}

export function uid() {
  return crypto.randomUUID();
}

export function todayIsoKst() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function weekdayLongKst() {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    weekday: "long",
  }).format(new Date());
}

export function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function toIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isoWeek(iso: string) {
  const date = parseIsoDate(iso);
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function dayIndex(iso: string) {
  return Math.floor(parseIsoDate(iso).getTime() / 86400000);
}

export function formatKoreanDate(iso: string) {
  const d = parseIsoDate(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function startOfWeekIso(iso: string) {
  const d = parseIsoDate(iso);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - (day - 1));
  return toIso(d);
}

export function inCurrentWeek(date: string, today: string) {
  return startOfWeekIso(date) === startOfWeekIso(today);
}

const WEEKDAY_SHORT = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function weekDates(iso: string) {
  const start = parseIsoDate(startOfWeekIso(iso));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toIso(d);
  });
}

export function weekdayShortKo(iso: string) {
  return WEEKDAY_SHORT[parseIsoDate(iso).getDay()];
}

export function dayNum(iso: string) {
  return String(parseIsoDate(iso).getDate());
}

export function addDaysIso(iso: string, days: number) {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

export function inviteFromSearch(search?: string) {
  const query =
    search ?? (typeof window === "undefined" ? "" : window.location.search);
  const raw = new URLSearchParams(
    query.startsWith("?") ? query.slice(1) : query,
  ).get("invite");
  const code = (raw ?? "").trim().toUpperCase();
  return code.length >= 4 && code.length <= 12 ? code : "";
}

