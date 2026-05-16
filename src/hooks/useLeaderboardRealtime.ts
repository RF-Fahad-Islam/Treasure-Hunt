import { useState, useEffect, useCallback } from "react";
import { insforge } from "@/lib/insforge";
import { secondsToPenaltyPoints } from "@/lib/penalty";
import type { LeaderboardEntry } from "@/services/team";

export function useLeaderboard(): LeaderboardEntry[] {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  const deriveRanks = useCallback((rows: LeaderboardEntry[]): LeaderboardEntry[] =>
    [...rows]
      .sort((a, b) => b.score - a.score || a.penalty - b.penalty)
      .map((t, i) => ({ ...t, rank: i + 1 })), []);

  const fetch = useCallback(async () => {
    const { data, error } = await insforge.database
      .from("teams")
      .select("*")
      .order("total_points", { ascending: false })
      .order("total_penalty_seconds", { ascending: true });

    if (!error && data) {
      const rows: LeaderboardEntry[] = (data as any[]).map((t) => {
        const penaltyPoints = secondsToPenaltyPoints(t.total_penalty_seconds ?? 0);
        return {
          id: t.id,
          name: t.name,
          score: Math.max(0, (t.total_points ?? 0) - penaltyPoints),
          penalty: penaltyPoints,
          rank: 0,
          completed: t.hunt_completed ?? false,
          avatarSeed: t.avatar_seed || t.name,
        };
      });
      setEntries(deriveRanks(rows));
    }
  }, [deriveRanks]);

  useEffect(() => { fetch(); }, [fetch]);

  return entries;
}
