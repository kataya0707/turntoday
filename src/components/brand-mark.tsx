import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-end gap-0.5", className)}
      aria-hidden
    >
      <span className="h-2 w-1 rounded-sm bg-muted" />
      <span className="h-3.5 w-1 rounded-sm bg-foreground/55" />
      <span className="h-5 w-1 rounded-sm bg-foreground" />
    </span>
  );
}
