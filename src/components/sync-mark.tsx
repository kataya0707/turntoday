import { useSyncStatus } from "@/lib/sync-status";

const LABEL = {
  idle: "",
  saving: "저장 중",
  saved: "저장됨",
  offline: "오프라인",
  error: "동기화 실패",
} as const;

export function SyncMark() {
  const status = useSyncStatus((s) => s.status);
  const text = LABEL[status];
  if (!text) return null;
  return (
    <p className="shrink-0 text-xs text-muted" aria-live="polite">
      {text}
    </p>
  );
}
