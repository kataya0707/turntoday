import { createFileRoute } from "@tanstack/react-router";
import { HouseGate } from "@/components/house-gate";
import { Onboarding } from "@/components/onboarding";
import { WeekRoster } from "@/components/week-roster";
import { useHouseStore } from "@/lib/house-store";

export const Route = createFileRoute("/roster")({ component: RosterPage });

function RosterPage() {
  return (
    <HouseGate>
      <RosterInner />
    </HouseGate>
  );
}

function RosterInner() {
  const onboarded = useHouseStore((s) => s.onboarded);
  if (!onboarded) return <Onboarding />;
  return <WeekRoster />;
}
