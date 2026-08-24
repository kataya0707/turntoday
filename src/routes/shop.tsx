import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { HouseGate } from "@/components/house-gate";
import { Onboarding } from "@/components/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHouseStore } from "@/lib/house-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop")({ component: ShopPage });

function ShopPage() {
  return (
    <HouseGate>
      <ShopInner />
    </HouseGate>
  );
}

function ShopInner() {
  const onboarded = useHouseStore((s) => s.onboarded);
  const shopping = useHouseStore((s) => s.shopping);
  const addShop = useHouseStore((s) => s.addShop);
  const toggleShop = useHouseStore((s) => s.toggleShop);
  const clearBought = useHouseStore((s) => s.clearBought);
  const [name, setName] = useState("");

  if (!onboarded) return <Onboarding />;

  const open = shopping.filter((s) => !s.done);
  const bought = shopping.filter((s) => s.done);

  return (
    <AppShell kicker="같이 보는 목록" title="장보기">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addShop(name);
          setName("");
        }}
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="뭐가 떨어졌나요"
          aria-label="살 것"
        />
        <Button type="submit">추가</Button>
      </form>

      {shopping.length === 0 ? (
        <p className="mt-10 text-sm leading-relaxed text-muted">
          떨어지기 전에 여기다 적어 두면, 마트에서 카톡을 뒤지지 않아도 됩니다.
        </p>
      ) : (
        <>
          <div className={bought.length > 0 ? "mt-6 grid gap-8 md:grid-cols-2" : "mt-6"}>
          <ul className="space-y-2">
            {open.map((item) => (
              <ShopRow
                key={item.id}
                name={item.name}
                done={false}
                onToggle={() => toggleShop(item.id)}
              />
            ))}
          </ul>
          {bought.length > 0 ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-medium text-muted">담은 것</h2>
                <Button type="button" variant="ghost" size="sm" onClick={clearBought}>
                  지우기
                </Button>
              </div>
              <ul className="space-y-2">
                {bought.map((item) => (
                  <ShopRow
                    key={item.id}
                    name={item.name}
                    done
                    onToggle={() => toggleShop(item.id)}
                  />
                ))}
              </ul>
            </div>
          ) : null}
          </div>
        </>
      )}
    </AppShell>
  );
}

function ShopRow({
  name,
  done,
  onToggle,
}: {
  name: string;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-left"
      >
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-md border border-border",
            done && "border-accent bg-accent text-accent-foreground",
          )}
        >
          {done ? <Check className="size-3.5" strokeWidth={2.4} /> : null}
        </span>
        <span className={cn("text-sm font-medium", done && "text-muted line-through")}>
          {name}
        </span>
      </button>
    </li>
  );
}
