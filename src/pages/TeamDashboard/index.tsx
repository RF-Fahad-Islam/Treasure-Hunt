import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Backdrop } from "@/components/Backdrop";
import { Reveal } from "@/components/Reveal";
import { SuccessOverlay } from "@/components/SuccessOverlay";
import { ExpiredOverlay } from "@/components/ExpiredOverlay";
import { PointsToast } from "@/components/PointsToast";
import { LeaderboardOverlay } from "@/components/leaderboard/LeaderboardOverlay";
import { BroadcastBanner } from "@/components/BroadcastBanner";
import { PullToRefresh } from "@/components/PullToRefresh";
import { LocationGate } from "@/components/LocationGate";
import { OSStatusBar } from "@/components/OSStatusBar";
import { TeamAvatarRoom } from "@/components/TeamAvatarRoom";
import { OtherTeamsView } from "@/components/OtherTeamsView";
import { TeamLogoEditModal } from "@/components/TeamLogoEditModal";
import { GamifiedClueCard } from "@/components/GamifiedClueCard";
import { TeamMap } from "@/components/TeamMap";
import type { MapTeam } from "@/components/TeamMap";
import { useSession } from "@/store/authStore";
import { useLeaderboardRealtime } from "@/hooks/useLeaderboardRealtime";
import { useBroadcastListener } from "@/hooks/useBroadcastListener";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import { useTeamLocationsRealtime } from "@/hooks/useTeamLocationsRealtime";
import {
  fetchDashboardData,
  fetchTeamMembers,
  updateTeamName,
  updateTeamAvatarSeed,
  fetchAllTeamsForLobby,
  revealAnswer,
} from "@/services/team";
import type { DashboardData, TeamLobbyEntry } from "@/services/team";
import type { Participant } from "@/types";
import { Home, Search, Map, Trophy } from "lucide-react";

type App = "lobby" | "clues" | "map" | "scores";

function useCountdown(target: string | null) {
  const [display, setDisplay] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!target) return;
    const targetMs = new Date(target).getTime();
    const interval = setInterval(() => {
      const diff = targetMs - Date.now();
      if (diff <= 0) { setExpired(true); setDisplay({ d: 0, h: 0, m: 0, s: 0 }); clearInterval(interval); return; }
      setDisplay({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return { display, expired };
}

const APPS: { key: App; label: string; icon: React.ElementType }[] = [
  { key: "lobby", label: "Lobby", icon: Home },
  { key: "clues", label: "Clues", icon: Search },
  { key: "map", label: "Map", icon: Map },
  { key: "scores", label: "Scores", icon: Trophy },
];

export default function TeamDashboardPage() {
  const session = useSession();
  const teamId = session?.role === "team" ? session.teamId : null;

  const [data, setData] = useState<DashboardData | null>(null);
  const [teamMembers, setTeamMembers] = useState<Participant[]>([]);
  const [allTeamsLobby, setAllTeamsLobby] = useState<TeamLobbyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeApp, setActiveApp] = useState<App>("lobby");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPoints, setSuccessPoints] = useState(0);
  const [successRank, setSuccessRank] = useState<number | undefined>(undefined);
  const [initialPos, setInitialPos] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const [toastPoints, setToastPoints] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [showLogoEdit, setShowLogoEdit] = useState(false);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const prevCompletedRef = useRef(0);
  const prevPointsRef = useRef(0);
  const streakCountRef = useRef(0);

  useLocationTracker(teamId ?? "", initialPos);

  const leaderboard = useLeaderboardRealtime();
  const sessionRole = session?.role === "team" ? "team" : null;
  const broadcast = useBroadcastListener(sessionRole);
  const { display: countdown, expired: huntStarted } = useCountdown(data?.eventConfig?.event_start_time ?? null);
  const teamLocations = useTeamLocationsRealtime();

  const isHuntActive = data?.eventConfig?.hunt_started === true || huntStarted;

  const me = teamMembers.find(p => p.id === (session?.role === "team" ? session.participantId : null));
  const isLeader = me?.is_leader === true;
  const isDisqualified = data?.team.is_disqualified === true;

  const teamSeed = data?.team.avatar_seed || data?.team.name || "Team";

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [d, members, allTeams] = await Promise.all([
        fetchDashboardData(teamId),
        fetchTeamMembers(teamId),
        fetchAllTeamsForLobby(),
      ]);
      setData(d);
      setTeamMembers(members);
      setAllTeamsLobby(allTeams);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!data) return;
    if (data.completedClues > prevCompletedRef.current && prevCompletedRef.current > 0) {
      streakCountRef.current += 1;
      const earned = (data.team.total_points ?? 0) - prevPointsRef.current;
      setSuccessPoints(earned > 0 ? earned : (data.eventConfig?.points_per_clue ?? 100));
      const rank = leaderboard.findIndex(e => e.name === data.team.name) + 1;
      setSuccessRank(rank > 0 ? rank : undefined);
      setShowSuccess(true);
    } else if (data.completedClues === prevCompletedRef.current) {
      // no change
    } else {
      streakCountRef.current = 0;
    }
    prevCompletedRef.current = data.completedClues;
    prevPointsRef.current = data.team.total_points ?? 0;
  }, [data, leaderboard]);

  const handleTimeout = useCallback(() => {
    if (data?.currentRoute?.status === "active" || data?.currentRoute?.status === "pending") {
      setShowTimeout(true);
    }
  }, [data]);

  const handleReveal = async () => {
    if (!data?.currentRoute || !teamId) return;
    try {
      await revealAnswer(data.currentRoute.id, teamId);
      setShowTimeout(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reveal answer");
    }
  };

  const handleNewPoints = useCallback((points: number) => {
    setToastPoints(points);
    setShowToast(true);
    setSuccessPoints(points);
    const rank = leaderboard.findIndex(e => e.name === data?.team.name) + 1;
    setSuccessRank(rank > 0 ? rank : undefined);
    setShowSuccess(true);
  }, [leaderboard, data]);

  const handleTeamNameSave = async () => {
    if (!teamId || !nameInput.trim()) return;
    try {
      await updateTeamName(teamId, nameInput.trim());
      setShowNameEdit(false);
      await load();
    } catch { /* silent */ }
  };

  const handleTeamAvatarSave = async (seed: string) => {
    if (!teamId) return;
    try {
      await updateTeamAvatarSeed(teamId, seed);
      setShowLogoEdit(false);
      await load();
    } catch { /* silent */ }
  };

  const mapTeams: MapTeam[] = teamLocations
    .filter((loc: any) => loc.team_id !== teamId)
    .map((loc: any) => ({
      id: loc.team_id,
      name: allTeamsLobby.find((t) => t.teamId === loc.team_id)?.teamName ?? loc.team_id,
      latitude: loc.latitude,
      longitude: loc.longitude,
      isActive: true,
      isDisqualified: false,
      capturedAt: loc.captured_at ?? loc.created_at ?? "",
    }));

  if (!teamId) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <Backdrop />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-8">
          <p className="text-5xl">🔐</p>
          <p className="mt-4 font-display text-2xl font-extrabold" style={{ color: "var(--fg-muted)" }}>Not logged in</p>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <Backdrop />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
          <motion.p animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-5xl">🔍</motion.p>
          <p className="mt-4 font-display text-xl font-extrabold" style={{ color: "var(--fg-muted)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <LocationGate onLocationGranted={setInitialPos}>
    <div className="relative min-h-screen overflow-hidden pb-24">
      <Backdrop />

      <SuccessOverlay open={showSuccess} onClose={() => setShowSuccess(false)} pointsEarned={successPoints} newRank={successRank} />
      <ExpiredOverlay open={showTimeout} onContinue={handleReveal} autoContinueSec={5} />
      <BroadcastBanner broadcast={broadcast} />

      <LeaderboardOverlay
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        standings={leaderboard.map(e => ({
          rank: e.rank,
          team: e.name,
          score: e.score,
          you: e.name === data?.team.name,
        }))}
        yourRank={leaderboard.findIndex(e => e.name === data?.team.name) + 1}
      />

      <PointsToast open={showToast} points={toastPoints} onClose={() => setShowToast(false)} />

      {/* Disqualified overlay */}
      <AnimatePresence>
        {isDisqualified && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
              className="w-full max-w-sm rounded-[32px] border-t-[12px] p-10 text-center"
              style={{ background: "var(--surface)", borderColor: "var(--color-brand-red)" }}>
              <div className="mb-4 text-5xl">🚫</div>
              <h2 className="mb-2 text-[20px] font-extrabold" style={{ color: "var(--color-brand-red)" }}>Team Disqualified</h2>
              <p className="mb-2 text-[14px] font-semibold leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                Your team has been disqualified by the admin.
              </p>
              <p className="text-[12px] font-bold leading-relaxed" style={{ color: "var(--fg-muted)", opacity: 0.6 }}>
                You can no longer participate in the hunt.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OS Status Bar */}
      <OSStatusBar
        teamName={data?.team.name ?? ""}
        teamSeed={teamSeed}
        teamMembers={teamMembers}
        hasGps={initialPos !== null}
        teamId={teamId}
        onNewPoints={handleNewPoints}
        onTeamNameEdit={() => { setNameInput(data?.team.name ?? ""); setShowNameEdit(true); }}
        onTeamAvatarEdit={() => setShowLogoEdit(true)}
      />

      {/* Name edit modal */}
      <AnimatePresence>
        {showNameEdit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNameEdit(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-[#1A1A1A] border-4 border-[var(--border-soft)] rounded-[32px] p-6 w-full max-w-sm shadow-2xl"
              style={{ borderBottomWidth: "10px" }}>
              <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="font-display text-xl font-black text-white mb-5 text-center">Edit Team Name</h3>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full rounded-2xl border-2 px-4 py-3.5 text-[15px] font-bold outline-none mb-5 transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "var(--fg)" }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTeamNameSave(); }}
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowNameEdit(false)}
                    className="btn-press flex-1 py-3.5 rounded-2xl text-[14px] font-black border"
                    style={{ borderColor: "var(--border-soft)", color: "var(--fg-muted)" }}>Cancel</button>
                  <button onClick={handleTeamNameSave}
                    className="btn-press flex-1 py-3.5 rounded-2xl text-[14px] font-black text-white"
                    style={{ background: "var(--color-brand-green)", boxShadow: "0 4px 0 0 var(--color-brand-green-shadow)" }}>Save</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TeamLogoEditModal
        open={showLogoEdit}
        currentSeed={teamSeed}
        teamName={data?.team.name ?? ""}
        onSave={handleTeamAvatarSave}
        onClose={() => setShowLogoEdit(false)}
      />

      {/* Main content */}
      <PullToRefresh onRefresh={load}>
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-20">
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-3xl px-6 py-4 text-center text-[15px] font-bold"
            style={{ background: "rgba(255,75,75,0.1)", border: "2px solid rgba(255,75,75,0.3)", color: "var(--color-brand-red)" }}>
            ⚠️ {error}
            <button onClick={load} className="ml-3 underline font-extrabold">Retry</button>
          </motion.div>
        )}

        {data && (
          <>
            {/* ── APP: LOBBY ── */}
            {activeApp === "lobby" && (
              <div className="max-w-2xl mx-auto space-y-6">
                {!isHuntActive ? (
                  <>
                    {/* Pre-hunt countdown */}
                    <Reveal delay={0.06} duration={0.6}>
                      <motion.div
                        className="card border-t-[8px] p-10 text-center relative overflow-hidden"
                        style={{ background: "var(--surface)", borderColor: "var(--color-brand-gold)" }}
                      >
                        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
                        <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-[var(--color-brand-gold)]/10 blur-3xl pointer-events-none" />
                        <div className="relative z-10">
                          <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="mb-4 text-6xl">⏳</motion.div>
                          <h2 className="font-display text-2xl font-black text-white mb-2">Waiting for the Hunt</h2>
                          <p className="text-[#888] text-[14px] font-bold mb-6">The hunt hasn't started yet. Check back when it's time!</p>
                          {countdown && (
                            <div className="flex justify-center gap-3 sm:gap-5">
                              <TimeBlock value={countdown.d} label="Days" />
                              <TimeDot />
                              <TimeBlock value={countdown.h} label="Hours" />
                              <TimeDot />
                              <TimeBlock value={countdown.m} label="Minutes" />
                              <TimeDot />
                              <TimeBlock value={countdown.s} label="Seconds" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </Reveal>

                    {/* Team Avatar Room */}
                    <Reveal delay={0.1} duration={0.55}>
                      <TeamAvatarRoom
                        members={teamMembers}
                        teamSeed={teamSeed}
                        teamName={data.team.name}
                        currentUserId={session?.role === "team" ? session.participantId : undefined}
                      />
                    </Reveal>
                  </>
                ) : (
                  <>
                    {/* Stats cards */}
                    <Reveal delay={0.06} duration={0.5}>
                      <div className="flex gap-4">
                        <div className="flex-1 rounded-[24px] p-5 sm:p-6 bg-[#111A1C] shadow-lg">
                          <h4 className="text-[#3CD2A2] text-[11px] sm:text-[13px] font-bold tracking-[0.15em] uppercase mb-2">Points</h4>
                          <span className="text-[#58E6B1] text-3xl sm:text-4xl font-extrabold tabular-nums">+{data.team.total_points ?? 0}</span>
                        </div>
                        <div className="flex-1 rounded-[24px] p-5 sm:p-6 bg-[#251315] shadow-lg">
                          <h4 className="text-[#E07A8A] text-[11px] sm:text-[13px] font-bold tracking-[0.15em] uppercase mb-2">Penalties</h4>
                          <span className="text-[#FF9EAC] text-3xl sm:text-4xl font-extrabold tabular-nums">-{data.team.total_penalty_seconds ? (data.team.total_penalty_seconds / 60).toFixed(0) : 0}</span>
                        </div>
                      </div>
                    </Reveal>

                    {/* Team Avatar Room */}
                    <Reveal delay={0.1} duration={0.55}>
                      <TeamAvatarRoom
                        members={teamMembers}
                        teamSeed={teamSeed}
                        teamName={data.team.name}
                        currentUserId={session?.role === "team" ? session.participantId : undefined}
                      />
                    </Reveal>

                    {/* Other Teams (leader only) */}
                    {isLeader && (
                      <Reveal delay={0.14} duration={0.5}>
                        <OtherTeamsView teams={allTeamsLobby} excludeTeamId={teamId} />
                      </Reveal>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── APP: CLUES ── */}
            {activeApp === "clues" && (
              <div className="max-w-2xl mx-auto">
                <Reveal delay={0.06} duration={0.5}>
                  <GamifiedClueCard
                    clueDefinition={data.clueDefinition}
                    spot={data.spot}
                    completedClues={data.completedClues}
                    totalClues={data.totalClues}
                    streak={streakCountRef.current}
                    clueStartedAt={data.currentRoute?.clue_started_at ?? null}
                    timeLimitMinutes={data.eventConfig?.clue_time_limit_minutes ?? 40}
                    onTimeout={handleTimeout}
                    showTimeout={showTimeout}
                  />
                </Reveal>
              </div>
            )}

            {/* ── APP: MAP ── */}
            {activeApp === "map" && (
              <div className="max-w-4xl mx-auto">
                <Reveal delay={0.06} duration={0.5}>
                  <div className="rounded-[24px] overflow-hidden border border-white/10 shadow-xl" style={{ height: "60vh", minHeight: 360 }}>
                    <TeamMap
                      teams={mapTeams}
                      spots={[]}
                      height="100%"
                    />
                  </div>
                </Reveal>
              </div>
            )}

            {/* ── APP: SCORES ── */}
            {activeApp === "scores" && (
              <div className="max-w-2xl mx-auto">
                <Reveal delay={0.06} duration={0.5}>
                  <button
                    onClick={() => setShowLeaderboard(true)}
                    className="w-full rounded-[24px] p-6 sm:p-8 border border-white/10 flex items-center justify-between hover:bg-white/5 transition-colors shadow-lg"
                    style={{ background: "var(--surface)" }}
                  >
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-[16px] sm:rounded-[20px] bg-[#FFB000] flex items-center justify-center shrink-0">
                        <Trophy size={24} strokeWidth={2.5} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-[#8A8A8E] text-[11px] sm:text-[13px] font-bold tracking-[0.15em] uppercase mb-1">Live Standings</h4>
                        <div className="text-white text-lg sm:text-xl font-bold">
                          You're <span className="text-[#3CD2A2]">#{leaderboard.findIndex(e => e.name === data?.team.name) + 1}</span>
                        </div>
                      </div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#0A84FF]">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>

                  <div className="mt-6 space-y-2">
                    {leaderboard.slice(0, 20).map((entry) => (
                      <div key={entry.id}
                        className="flex items-center gap-4 rounded-2xl px-5 py-3.5 transition-colors"
                        style={{
                          background: entry.name === data?.team.name ? "rgba(88,204,2,0.08)" : "var(--border-soft)",
                          border: entry.name === data?.team.name ? "1px solid rgba(88,204,2,0.25)" : "none",
                        }}>
                        <span className="w-8 text-center text-[15px] font-black tabular-nums"
                          style={{ color: entry.rank <= 3 ? "var(--color-brand-gold)" : "var(--fg-muted)" }}>
                          #{entry.rank}
                        </span>
                        <span className="flex-1 text-[14px] font-black truncate" style={{ color: "var(--fg)" }}>{entry.name}</span>
                        <span className="text-[14px] font-extrabold tabular-nums" style={{ color: "var(--color-brand-green)" }}>{entry.score}</span>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>
            )}
          </>
        )}

        <Reveal delay={0.2} duration={0.5}>
          <p className="mt-12 text-center text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            Treasure Hunt · University of Dhaka — CSE
          </p>
        </Reveal>
      </div>
      </PullToRefresh>

      {/* Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 pt-2 px-4"
        style={{ background: "linear-gradient(0deg, rgba(10,10,14,0.95) 60%, transparent)" }}>
        <div className="inline-flex rounded-2xl p-1.5 gap-1 backdrop-blur-xl shadow-2xl border border-white/10"
          style={{ background: "rgba(20,20,28,0.9)" }}>
          {APPS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveApp(key)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wide transition-all"
              style={{
                background: activeApp === key ? "var(--surface)" : "transparent",
                color: activeApp === key ? "var(--fg)" : "var(--fg-muted)",
                boxShadow: activeApp === key ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              }}
            >
              <Icon size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
    </LocationGate>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-20 sm:w-20 sm:h-24 bg-[#1A1A1A] border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-black/40 -translate-y-1/2 z-10" />
        <span className="font-display text-3xl sm:text-4xl font-black text-white tracking-tighter drop-shadow-lg tabular-nums">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#888]">{label}</span>
    </div>
  );
}

function TimeDot() {
  return (
    <div className="flex flex-col items-center justify-center pb-7">
      <div className="w-1.5 h-1.5 rounded-full bg-[#58cc02] opacity-80 shadow-[0_0_10px_rgba(88,204,2,0.5)]" />
      <div className="w-1.5 h-1.5 rounded-full bg-[#58cc02] opacity-80 shadow-[0_0_10px_rgba(88,204,2,0.5)] mt-2" />
    </div>
  );
}
