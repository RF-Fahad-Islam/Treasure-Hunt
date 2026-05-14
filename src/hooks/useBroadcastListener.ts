import { useState, useEffect, useCallback, useRef } from "react";
import { insforge } from "@/lib/insforge";

export interface Broadcast {
  id: string;
  message: string;
  audience: "all" | "spot-leaders" | "teams";
  sender: string;
  timestamp: string;
}

export function useBroadcastListener(role: "spot-leader" | "team" | null): Broadcast | null {
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const handlerRef = useRef<((payload: any) => void) | null>(null);

  const handleBroadcast = useCallback(
    (payload: any) => {
      const msg = payload as Broadcast;
      if (
        msg.audience === "all" ||
        (msg.audience === "teams" && role === "team") ||
        (msg.audience === "spot-leaders" && role === "spot-leader")
      ) {
        setBroadcast(msg);
      }
    },
    [role],
  );

  useEffect(() => {
    if (!role) return;
    handlerRef.current = handleBroadcast;

    let cancelled = false;

    async function init() {
      try {
        await insforge.realtime.connect();
        const sub = await insforge.realtime.subscribe("broadcast");
        if (!cancelled && sub.ok) {
          insforge.realtime.on("new_broadcast", handleBroadcast);
        }
      } catch {
        /* best-effort */
      }
    }

    init();

    return () => {
      cancelled = true;
      if (handlerRef.current) {
        insforge.realtime.off("new_broadcast", handlerRef.current);
      }
    };
  }, [handleBroadcast, role]);

  return broadcast;
}
