import { useEffect, useRef } from "react";
import { insforge } from "@/lib/insforge";
import { submitLocation, heartbeatActive } from "@/services/location";

interface Position {
  lat: number;
  lng: number;
  accuracy: number | null;
}

export function useLocationTracker(teamId: string, initial: Position | null) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!teamId || !initial) return;

    let cancelled = false;

    async function captureAndPublish(position: Position) {
      try {
        await submitLocation(teamId, position.lat, position.lng, position.accuracy);
        await insforge.realtime.connect();
        await insforge.realtime.publish("team_location", "location_update", {
          teamId,
          latitude: position.lat,
          longitude: position.lng,
          accuracy: position.accuracy,
          capturedAt: new Date().toISOString(),
          isActive: true,
        });
      } catch {
        /* best-effort */
      }
    }

    async function heartbeat() {
      try {
        await heartbeatActive(teamId);
        await insforge.realtime.connect();
        await insforge.realtime.publish("team_location", "heartbeat", {
          teamId,
          capturedAt: new Date().toISOString(),
        });
      } catch {
        /* best-effort */
      }
    }

    captureAndPublish(initial);

    intervalRef.current = setInterval(() => {
      if (cancelled) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) {
            captureAndPublish({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
      );
    }, 5 * 60 * 1000);

    heartbeat();
    heartbeatRef.current = setInterval(heartbeat, 2 * 60 * 1000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [teamId, initial]);
}
