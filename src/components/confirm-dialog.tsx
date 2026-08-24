import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!busy) setOpen(next);
      }}
    >
      <AlertDialog.Trigger asChild>
        <span className="inline-flex">{trigger}</span>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-bg/70" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100%-2rem),28rem)] max-h-[min(32rem,calc(100dvh-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-5">
          <AlertDialog.Title className="font-display text-lg font-semibold tracking-tight">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-muted">
            {description}
          </AlertDialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="secondary" disabled={busy}>
                취소
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void Promise.resolve(onConfirm())
                  .then(() => setOpen(false))
                  .finally(() => setBusy(false));
              }}
            >
              {busy ? "잠시만요" : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
