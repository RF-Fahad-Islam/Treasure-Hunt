import { useEffect, useRef, useState, useCallback } from "react";
import type { MapTeam } from "@/components/TeamMap";
import { successSound } from "@/utils/feedback";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useProximityAlert(
  spotLat: number | null,
  spotLng: number | null,
  spotRadius: number | null,
  teamLocations: MapTeam[],
  arrivingTeamIds: Set<string>,
) {
  const [nearbyTeamIds, setNearbyTeamIds] = useState<string[]>([]);
  const [justArrivedTeamIds, setJustArrivedTeamIds] = useState<string[]>([]);
  const prevRef = useRef<Set<string>>(new Set());
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const compute = useCallback(() => {
    if (spotLat === null || spotLng === null) {
      setNearbyTeamIds([]);
      return;
    }
    const radius = spotRadius ?? 100;
    const near = teamLocations
      .filter(t => {
        if (!t.latitude || !t.longitude || !arrivingTeamIds.has(t.id)) return false;
        return getDistance(spotLat, spotLng, t.latitude, t.longitude) <= radius;
      })
      .map(t => t.id);

    const currentSet = new Set(near);
    const prev = prevRef.current;

    const newlyArrived = near.filter(id => !prev.has(id));

    if (newlyArrived.length > 0) {
      setJustArrivedTeamIds(newlyArrived);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = setTimeout(() => setJustArrivedTeamIds([]), 4000);

      newlyArrived.forEach(() => {
        successSound();
        if (typeof navigator.vibrate === "function") {
          navigator.vibrate([100, 80, 100, 80, 200]);
        }
        try {
          if ("Notification" in window && Notification.permission === "granted") {
            const teamName = teamLocations.find(t => t.id === newlyArrived[0])?.name ?? "A team";
            new Notification("🚨 Team Incoming!", {
              body: `${teamName} is within ${radius}m of your spot!`,
              icon: "/favicon.svg",
              tag: "proximity",
            });
          }
        } catch {}
      });
    }

    prevRef.current = currentSet;
    setNearbyTeamIds(near);
  }, [spotLat, spotLng, spotRadius, teamLocations, arrivingTeamIds]);

  useEffect(() => {
    compute();
  }, [compute]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, []);

  return { nearbyTeamIds, justArrivedTeamIds };
}
