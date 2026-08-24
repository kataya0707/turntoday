import { createFileRoute } from "@tanstack/react-router";
import { HouseGate } from "@/components/house-gate";
import { Onboarding } from "@/components/onboarding";
import { TodayBoard } from "@/components/today-board";
import { useHouseStore } from "@/lib/house-store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <HouseGate>
      <HomeInner />
    </HouseGate>
  );
}

function HomeInner() {
  const onboarded = useHouseStore((s) => s.onboarded);
  if (!onboarded) return <Onboarding />;
  return <TodayBoard />;
}
