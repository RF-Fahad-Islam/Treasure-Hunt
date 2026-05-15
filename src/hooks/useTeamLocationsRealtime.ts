import { useState, useEffect, useRef, useCallback } from "react";
import { insforge } from "@/lib/insforge";
import { fetchLatestLocations, isActive } from "@/services/location";
import type { MapTeam } from "@/components/TeamMap";

export function useTeamLocationsRealtime(): MapTeam[] {
  const [teams, setTeams] = useState<MapTeam[]>([]);
  const teamsRef = useRef<MapTeam[]>([]);

  const hydrate = useCallback((arr: MapTeam[]) => {
    teamsRef.current = arr;
    setTeams(arr);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const latest = await fetchLatestLocations();
      if (cancelled) return;
      const mapped: MapTeam[] = latest.map((l) => ({
        id: l.team_id,
        name: l.team_name,
        latitude: l.latitude,
        longitude: l.longitude,
        isActive: isActive(l.captured_at),
        isDisqualified: false,
        capturedAt: l.captured_at,
      }));
      hydrate(mapped);

      try {
        await insforge.realtime.connect();
        const sub = await insforge.realtime.subscribe("team_location");
        if (!cancelled && sub.ok) {
          const onLocationUpdate = (payload: any) => {
            if (cancelled) return;
            setTeams((prev) => {
              const next = [...prev];
              const idx = next.findIndex((t) => t.id === payload.teamId);
              const entry: MapTeam = {
                id: payload.teamId,
                name: payload.teamName ?? next[idx]?.name ?? "Unknown",
                latitude: payload.latitude,
                longitude: payload.longitude,
                isActive: true,
                isDisqualified: next[idx]?.isDisqualified ?? false,
                capturedAt: payload.capturedAt ?? new Date().toISOString(),
              };
              if (idx >= 0) {
                next[idx] = entry;
              } else {
                next.push(entry);
              }
              return next;
            });
          };

          const onHeartbeat = (payload: any) => {
            if (cancelled) return;
            setTeams((prev) => {
              const idx = prev.findIndex((t) => t.id === payload.teamId);
              if (idx === -1) return prev;
              const next = [...prev];
              next[idx] = { ...next[idx], isActive: true, capturedAt: payload.capturedAt ?? new Date().toISOString() };
              return next;
            });
          };

          insforge.realtime.on("location_update", onLocationUpdate);
          insforge.realtime.on("heartbeat", onHeartbeat);

          // Expose to cleanup
          (window as any)._onLocationUpdate = onLocationUpdate;
          (window as any)._onHeartbeat = onHeartbeat;
        }
      } catch {
        /* best-effort */
      }
    }

    init();

    const staleInterval = setInterval(() => {
      setTeams((prev) =>
        prev.map((t) => ({
          ...t,
          isActive: isActive(t.capturedAt),
        })),
      );
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(staleInterval);
      if ((window as any)._onLocationUpdate) {
        insforge.realtime.off("location_update", (window as any)._onLocationUpdate);
      }
      if ((window as any)._onHeartbeat) {
        insforge.realtime.off("heartbeat", (window as any)._onHeartbeat);
      }
      insforge.realtime.unsubscribe("team_location");
    };
  }, [hydrate]);

  return teams;
}
