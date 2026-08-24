import { create } from "zustand";

export type SyncFlag = "idle" | "saving" | "saved" | "offline" | "error";

export const useSyncStatus = create<{
  status: SyncFlag;
  setStatus: (status: SyncFlag) => void;
}>((set) => ({
  status: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "idle",
  setStatus: (status) => set({ status }),
}));
