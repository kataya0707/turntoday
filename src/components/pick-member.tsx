import { Button } from "@/components/ui/button";
import type { Member } from "@/lib/house-types";
import { cn } from "@/lib/utils";

export function PickMember({
  title,
  members,
  selectedId,
  onPick,
  onClose,
}: {
  title: string;
  members: Member[];
  selectedId: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pick-member-title"
        className="w-full max-w-md rounded-t-xl border border-border bg-card p-5 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="pick-member-title"
          className="font-display text-lg font-semibold tracking-tight"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted">담당할 사람을 고르세요.</p>
        <ul className="mt-4 space-y-2">
          {members.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(m.id);
                  onClose();
                }}
                className={cn(
                  "flex min-h-12 w-full items-center justify-between rounded-lg border px-4 text-sm font-medium",
                  selectedId === m.id
                    ? "border-accent bg-secondary"
                    : "border-border bg-bg",
                )}
              >
                <span>{m.name}</span>
                {selectedId === m.id ? (
                  <span className="text-xs text-muted">지금</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="secondary"
          className="mt-4 w-full"
          onClick={onClose}
        >
          닫기
        </Button>
      </div>
    </div>
  );
}
