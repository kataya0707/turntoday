import { useEffect, useRef } from "react";
import { createHouse, getMyHouse, saveBoard } from "@/lib/house-api";
import { mergePayload, payloadsEqual } from "@/lib/merge";
import { boardPayload, useHouseStore } from "@/lib/house-store";
import { useSyncStatus } from "@/lib/sync-status";
import type { BoardPayload, ServerHouse } from "@/lib/house-types";

const POLL_MS = 3000;

export function HouseSync() {
  const skipSave = useRef(true);
  const lastSynced = useRef<BoardPayload | null>(null);
  const saving = useRef(false);

  useEffect(() => {
    let cancelled = false;
    skipSave.current = true;
    void (async () => {
      try {
        const house = await getMyHouse();
        if (cancelled) return;
        if (house) {
          useHouseStore.getState().applyServerHouse(house);
          lastSynced.current = boardPayload(house.payload);
        } else {
          const local = useHouseStore.getState();
          if (local.onboarded) {
            const created = await createHouse({
              data: {
                ...boardPayload(local),
                meId: local.meId,
              },
            });
            if (!cancelled) {
              useHouseStore.getState().applyServerHouse(created);
              lastSynced.current = boardPayload(created.payload);
            }
          }
        }
        if (!cancelled) useSyncStatus.getState().setStatus("saved");
      } catch {
        if (!cancelled) {
          useSyncStatus
            .getState()
            .setStatus(navigator.onLine ? "error" : "offline");
        }
      } finally {
        if (!cancelled) {
          window.setTimeout(() => {
            skipSave.current = false;
          }, 50);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onOff = () =>
      useSyncStatus.getState().setStatus(navigator.onLine ? "saved" : "offline");
    window.addEventListener("online", onOff);
    window.addEventListener("offline", onOff);
    return () => {
      window.removeEventListener("online", onOff);
      window.removeEventListener("offline", onOff);
    };
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    const unsub = useHouseStore.subscribe((state) => {
      if (skipSave.current || !state.houseId || !state.onboarded) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void flushSave();
      }, 450);
    });
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      void pullRemote();
    };
    const loop = () => {
      window.clearInterval(timer);
      timer = window.setInterval(tick, POLL_MS);
      tick();
    };
    loop();
    document.addEventListener("visibilitychange", loop);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", loop);
      window.removeEventListener("focus", tick);
    };
  }, []);

  async function pullRemote() {
    if (skipSave.current || !navigator.onLine) return;
    const local = useHouseStore.getState();
    if (!local.houseId || !local.onboarded) return;
    try {
      const house = await getMyHouse();
      if (!house) return;
      reconcile(house);
    } catch {
      /* next poll */
    }
  }

  async function flushSave() {
    if (skipSave.current || saving.current) return;
    const local = useHouseStore.getState();
    if (!local.houseId || !local.onboarded) return;
    if (!navigator.onLine) {
      useSyncStatus.getState().setStatus("offline");
      return;
    }
    const payload = boardPayload(local);
    if (lastSynced.current && payloadsEqual(payload, lastSynced.current)) return;
    saving.current = true;
    useSyncStatus.getState().setStatus("saving");
    try {
      const result = await saveBoard({
        data: { payload, revision: local.revision },
      });
      if (result.conflict && result.house) {
        reconcile(result.house);
        saving.current = false;
        window.setTimeout(() => {
          void flushSave();
        }, 80);
        return;
      }
      if (result.ok) {
        lastSynced.current = payload;
        useHouseStore.getState().setRevision(result.revision);
        useSyncStatus.getState().setStatus("saved");
      }
    } catch {
      useSyncStatus.getState().setStatus(navigator.onLine ? "error" : "offline");
    } finally {
      saving.current = false;
    }
  }

  function reconcile(house: ServerHouse) {
    const store = useHouseStore.getState();
    if (house.revision === store.revision) return;
    const local = boardPayload(store);
    const remote = boardPayload(house.payload);
    const base = lastSynced.current;
    const dirty = base ? !payloadsEqual(local, base) : false;
    skipSave.current = true;
    if (!dirty || !base) {
      store.applyServerHouse(house);
      lastSynced.current = remote;
    } else {
      const merged = mergePayload(base, local, remote);
      store.applyServerHouse({ ...house, payload: merged });
      lastSynced.current = remote;
    }
    window.setTimeout(() => {
      skipSave.current = false;
    }, 40);
  }

  return null;
}
