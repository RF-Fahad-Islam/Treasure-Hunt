import { insforge } from "@/lib/insforge";
import type { TeamLocation } from "@/types";

export async function submitLocation(
  teamId: string,
  latitude: number,
  longitude: number,
  accuracy: number | null,
): Promise<void> {
  await insforge.database.from("team_locations").insert([
    {
      team_id: teamId,
      latitude,
      longitude,
      accuracy,
      captured_at: new Date().toISOString(),
    },
  ]);
}

export async function fetchLatestLocations(): Promise<
  (TeamLocation & { team_name: string })[]
> {
  const { data } = await insforge.database
    .from("team_locations")
    .select("*, teams!inner(name)")
    .order("captured_at", { ascending: false });

  if (!data) return [];
  const seen = new Set<string>();
  const latest: (TeamLocation & { team_name: string })[] = [];
  for (const row of data as any[]) {
    if (!seen.has(row.team_id)) {
      seen.add(row.team_id);
      latest.push({
        id: row.id,
        team_id: row.team_id,
        latitude: row.latitude,
        longitude: row.longitude,
        accuracy: row.accuracy,
        captured_at: row.captured_at,
        created_at: row.created_at,
        team_name: row.teams?.name ?? "Unknown",
      });
    }
  }
  return latest;
}

export async function fetchTeamPath(
  teamId: string,
): Promise<TeamLocation[]> {
  const { data } = await insforge.database
    .from("team_locations")
    .select("*")
    .eq("team_id", teamId)
    .order("captured_at", { ascending: true });
  return (data as TeamLocation[]) ?? [];
}

export async function disqualifyTeam(teamId: string): Promise<void> {
  await insforge.database
    .from("teams")
    .update({ is_disqualified: true })
    .eq("id", teamId);
}

export async function reinstateTeam(teamId: string): Promise<void> {
  await insforge.database
    .from("teams")
    .update({ is_disqualified: false })
    .eq("id", teamId);
}

export async function heartbeatActive(teamId: string): Promise<void> {
  await insforge.database
    .from("teams")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", teamId);
}

export function isActive(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false;
  const tenMin = 10 * 60 * 1000;
  return Date.now() - new Date(lastActiveAt).getTime() < tenMin;
}
