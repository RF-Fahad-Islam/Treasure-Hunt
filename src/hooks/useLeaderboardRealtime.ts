import { useState, useEffect, useRef, useCallback } from "react";
import { insforge } from "@/lib/insforge";
import type { LeaderboardEntry } from "@/services/team";

export function useLeaderboardRealtime(): LeaderboardEntry[] {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const entriesRef = useRef<LeaderboardEntry[]>([]);

  const deriveRanks = useCallback((rows: LeaderboardEntry[]): LeaderboardEntry[] =>
    [...rows]
      .sort((a, b) => b.score - a.score || a.penalty - b.penalty)
      .map((t, i) => ({ ...t, rank: i + 1 })), []);

  const handleTeamUpdate = useCallback((payload: any) => {
    const { id, name, total_points, total_penalty_seconds } = payload;
    setEntries((prev) => {
      const next = [...prev];
      const idx = next.findIndex((t) => t.id === id);
      const row: LeaderboardEntry = {
        id,
        name,
        score: total_points ?? 0,
        penalty: total_penalty_seconds ?? 0,
        rank: 0,
        completed: payload.hunt_completed ?? false,
      };
      if (idx >= 0) {
        next[idx] = row;
      } else {
        next.push(row);
      }
      return deriveRanks(next);
    });
  }, [deriveRanks]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data, error } = await insforge.database
        .from("teams")
        .select("*")
        .order("total_points", { ascending: false })
        .order("total_penalty_seconds", { ascending: true });

      if (!cancelled && !error && data) {
        const rows: LeaderboardEntry[] = (data as any[]).map((t) => ({
          id: t.id,
          name: t.name,
          score: t.total_points ?? 0,
          penalty: t.total_penalty_seconds ?? 0,
          rank: 0,
          completed: t.hunt_completed ?? false,
        }));
        const ranked = deriveRanks(rows);
        entriesRef.current = ranked;
        setEntries(ranked);
      }

      try {
        await insforge.realtime.connect();
        const sub = await insforge.realtime.subscribe("leaderboard");
        if (!cancelled && sub.ok) {
          insforge.realtime.on("team_updated", handleTeamUpdate);
        }
      } catch {
        /* best-effort */
      }
    }

    init();

    return () => {
      cancelled = true;
      insforge.realtime.off("team_updated", handleTeamUpdate);
      insforge.realtime.unsubscribe("leaderboard");
    };
  }, [handleTeamUpdate, deriveRanks]);

  return entries;
}
