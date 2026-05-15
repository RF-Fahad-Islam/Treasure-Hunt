import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Backdrop } from "@/components/Backdrop";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Reveal } from "@/components/Reveal";
import { SuccessOverlay } from "@/components/SuccessOverlay";
import { ExpiredOverlay } from "@/components/ExpiredOverlay";
import { CountdownTimer as ClueTimer } from "@/components/timer/CountdownTimer";
import { LeaderboardOverlay } from "@/components/leaderboard/LeaderboardOverlay";
import { BroadcastBanner } from "@/components/BroadcastBanner";
import { Home, Search, Trophy } from "lucide-react";
import { PullToRefresh } from "@/components/PullToRefresh";
import { LocationGate } from "@/components/LocationGate";
import { AvatarEditModal } from "@/components/AvatarEditModal";
import { NotificationBell } from "@/components/NotificationBell";
import { PointsToast } from "@/components/PointsToast";
import { useSession, useAuthStore } from "@/store/authStore";
import { useLeaderboardRealtime } from "@/hooks/useLeaderboardRealtime";
import { useBroadcastListener } from "@/hooks/useBroadcastListener";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import {
  fetchDashboardData,
  fetchTeamMembers,
  updateMyAvatar,
  revealAnswer,
} from "@/services/team";
import type { DashboardData } from "@/services/team";
import type { Participant } from "@/types";

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

function avatarStyle(p: Participant): React.CSSProperties {
  const c = p.avatar_color || "#58cc02";
  return { background: `color-mix(in srgb, ${c} 22%, transparent)`, color: c };
}

export default function TeamDashboardPage() {
  const session = useSession();
  const clearSession = useAuthStore(s => s.clearSession);
  const teamId = session?.role === "team" ? session.teamId : null;

  const [data, setData] = useState<DashboardData | null>(null);
  const [teamMembers, setTeamMembers] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lobbyTab, setLobbyTab] = useState<"lobby" | "clues">("lobby");
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPoints, setSuccessPoints] = useState(0);
  const [successRank, setSuccessRank] = useState<number | undefined>(undefined);
  const [initialPos, setInitialPos] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const [toastPoints, setToastPoints] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const prevCompletedRef = useRef(0);
  const prevPointsRef = useRef(0);

  useLocationTracker(teamId ?? "", initialPos);

  const leaderboard = useLeaderboardRealtime();
  const sessionRole = session?.role === "team" ? "team" : null;
  const broadcast = useBroadcastListener(sessionRole);
  const { display: countdown, expired: huntStarted } = useCountdown(data?.eventConfig?.event_start_time ?? null);

  const isHuntActive = data?.eventConfig?.hunt_started === true || huntStarted;

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [d, members] = await Promise.all([
        fetchDashboardData(teamId),
        fetchTeamMembers(teamId),
      ]);
      setData(d);
      setTeamMembers(members);
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
      const earned = (data.team.total_points ?? 0) - prevPointsRef.current;
      setSuccessPoints(earned > 0 ? earned : (data.eventConfig?.points_per_clue ?? 100));
      const rank = leaderboard.findIndex(e => e.name === data.team.name) + 1;
      setSuccessRank(rank > 0 ? rank : undefined);
      setShowSuccess(true);
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

  const handleAvatarSave = async (emoji: string, color: string) => {
    if (session?.role !== "team") return;
    try {
      await updateMyAvatar(session.participantId, { avatar_emoji: emoji, avatar_color: color });
      setShowAvatarEdit(false);
      await load();
    } catch { /* silent */ }
  };

  const handleNewPoints = useCallback((points: number) => {
    setToastPoints(points);
    setShowToast(true);
    setSuccessPoints(points);
    const rank = leaderboard.findIndex(e => e.name === data?.team.name) + 1;
    setSuccessRank(rank > 0 ? rank : undefined);
    setShowSuccess(true);
  }, [leaderboard, data]);

  const me = teamMembers.find(p => p.id === (session?.role === "team" ? session.participantId : null));
  const isDisqualified = data?.team.is_disqualified === true;

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
    <div className="relative min-h-screen overflow-hidden">
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

      {/* Top bar */}
      {session?.role === "team" && (
        <>
        <div className="absolute left-4 top-4 z-20">
          <NotificationBell teamId={teamId!} onNewPoints={handleNewPoints} />
        </div>
        <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:gap-3">
          {initialPos && (
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-2 text-[11px] font-bold shadow-lg" style={{ color: "#22c55e" }}>
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />GPS
            </span>
          )}
          <button onClick={() => setShowAvatarEdit(true)}
            className="flex items-center gap-2 rounded-full bg-[var(--surface)] px-4 py-2 shadow-xl hover:opacity-80 transition-opacity">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-base leading-none border border-white/10 shrink-0"
              style={me ? avatarStyle(me) : {}}>
              {me?.avatar_emoji || "🏃"}
            </span>
            <span className="text-[13px] font-black" style={{ color: "var(--fg)" }}>{session.participantName}</span>
          </button>
          <ThemeToggle />
          <button onClick={clearSession}
            className="rounded-full bg-[var(--surface)] px-3 py-2 text-[12px] font-black shadow-xl hover:opacity-80 transition-opacity"
            style={{ color: "var(--color-brand-red)" }}>Log Out</button>
        </div>
        <PointsToast open={showToast} points={toastPoints} onClose={() => setShowToast(false)} />
      </>
      )}

      <PullToRefresh onRefresh={load}>
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-20">
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
            {/* Header */}
            <Reveal duration={0.5}>
              <header className="mb-8 text-center">
                <div className="flex items-center justify-center gap-4">
                  <Logo className="h-10 w-10 drop-shadow-lg" />
                  <div>
                    <h1 className="font-display text-[28px] font-black leading-none" style={{ color: "var(--fg)" }}>
                      {data.team.name}
                    </h1>
                    <p className="mt-1 text-[12px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--fg-muted)" }}>
                      🏠 {data.team.team_code}
                    </p>
                  </div>
                </div>
              </header>
            </Reveal>

            {/* Pre-hunt: Lobby waiting */}
            {!isHuntActive ? (
              <div className="max-w-2xl mx-auto">
                <Reveal delay={0.06} duration={0.6}>
                  <motion.div
                    className="card border-t-[8px] p-10 text-center mb-8 relative overflow-hidden"
                    style={{ background: "var(--surface)", borderColor: "var(--color-brand-gold)" }}
                  >
                    <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
                    <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-[var(--color-brand-gold)]/10 blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        className="mb-4 text-6xl"
                      >
                        ⏳
                      </motion.div>
                      <h2 className="font-display text-2xl font-black text-white mb-2">Waiting for the Hunt</h2>
                      <p className="text-[#888] text-[14px] font-bold mb-6">
                        The hunt hasn't started yet. Check back when it's time!
                      </p>

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

                {/* Team roster */}
                <Reveal delay={0.1} duration={0.55}>
                  <div className="card border-t-[8px] p-8" style={{ background: "var(--surface)", borderColor: "var(--color-brand-blue)" }}>
                    <h3 className="text-[13px] font-black uppercase tracking-[0.18em] mb-6" style={{ color: "var(--fg-muted)" }}>
                      👥 Team Members ({teamMembers.length})
                    </h3>
                    <div className="space-y-3">
                      {teamMembers.map((p) => (
                        <div key={p.id} className="flex items-center gap-3.5 rounded-2xl px-4 py-3" style={{ background: "var(--border-soft)" }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-white/10"
                            style={avatarStyle(p)}>
                            {p.avatar_emoji || "🏃"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-black truncate" style={{ color: "var(--fg)" }}>
                              {p.is_leader ? "👑 " : ""}{p.name}
                            </p>
                            {p.roll && (
                              <p className="text-[11px] font-bold" style={{ color: "var(--fg-muted)" }}>Roll: {p.roll}</p>
                            )}
                          </div>
                          {p.id === (session?.role === "team" ? session.participantId : null) && (
                            <button onClick={() => setShowAvatarEdit(true)}
                              className="text-[11px] font-extrabold uppercase tracking-wide px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                              style={{ background: "var(--accent-on-surface)", color: "var(--color-brand-blue)" }}>
                              Edit
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              </div>
            ) : (
              /* Post-hunt: Toggle between Lobby and Clues */
              <>
                {/* Stats Dashboard */}
                <Reveal delay={0.06} duration={0.5}>
                  <div className="mb-8 flex flex-col gap-4 w-full">
                    <div className="flex gap-4">
                      {/* Points Card */}
                      <div className="flex-1 rounded-[24px] p-5 sm:p-6 bg-[#111A1C] shadow-lg">
                        <h4 className="text-[#3CD2A2] text-[11px] sm:text-[13px] font-bold tracking-[0.15em] uppercase mb-2">Points</h4>
                        <span className="text-[#58E6B1] text-3xl sm:text-4xl font-extrabold tabular-nums">+{data.team.total_points ?? 0}</span>
                      </div>
                      {/* Penalties Card */}
                      <div className="flex-1 rounded-[24px] p-5 sm:p-6 bg-[#251315] shadow-lg">
                        <h4 className="text-[#E07A8A] text-[11px] sm:text-[13px] font-bold tracking-[0.15em] uppercase mb-2">Penalties</h4>
                        <span className="text-[#FF9EAC] text-3xl sm:text-4xl font-extrabold tabular-nums">-{data.team.total_penalty_seconds ? (data.team.total_penalty_seconds / 60).toFixed(0) : 0}</span>
                      </div>
                    </div>

                    {/* Live Standings Card */}
                    <button onClick={() => setShowLeaderboard(true)} className="w-full text-left rounded-[24px] p-5 sm:p-6 bg-[#18181A] border border-white/5 flex items-center justify-between hover:bg-[#1f1f22] transition-colors shadow-lg group">
                      <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] rounded-[16px] sm:rounded-[20px] bg-[#FFB000] flex items-center justify-center shrink-0">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[28px] sm:h-[28px]"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                        </div>
                        <div>
                          <h4 className="text-[#8A8A8E] text-[11px] sm:text-[13px] font-bold tracking-[0.15em] uppercase mb-1">Live Standings</h4>
                          <div className="text-white text-lg sm:text-xl font-bold">
                            You're <span className="text-[#3CD2A2]">#{leaderboard.findIndex(e => e.name === data?.team.name) + 1}</span> in the hunt
                          </div>
                        </div>
                      </div>
                      <div className="text-[#0A84FF] group-hover:translate-x-1 transition-transform">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                      </div>
                    </button>
                  </div>
                </Reveal>

                {/* Tab toggle */}
                <div className="flex justify-center mb-8">
                  <div className="inline-flex rounded-2xl p-1 gap-1" style={{ background: "var(--border-soft)" }}>
                    <button onClick={() => setLobbyTab("lobby")}
                      className="px-6 py-3 rounded-xl text-[14px] font-black uppercase tracking-wide transition-all inline-flex items-center gap-2"
                      style={{
                        background: lobbyTab === "lobby" ? "var(--surface)" : "transparent",
                        color: lobbyTab === "lobby" ? "var(--fg)" : "var(--fg-muted)",
                        boxShadow: lobbyTab === "lobby" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                      }}>
                      <Home size={18} strokeWidth={2.5} /> Lobby
                    </button>
                    <button onClick={() => setLobbyTab("clues")}
                      className="px-6 py-3 rounded-xl text-[14px] font-black uppercase tracking-wide transition-all inline-flex items-center gap-2"
                      style={{
                        background: lobbyTab === "clues" ? "var(--surface)" : "transparent",
                        color: lobbyTab === "clues" ? "var(--fg)" : "var(--fg-muted)",
                        boxShadow: lobbyTab === "clues" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                      }}>
                      <Search size={18} strokeWidth={2.5} /> Clues
                    </button>
                  </div>
                </div>

                {lobbyTab === "lobby" ? (
                  /* Lobby tab */
                  <div className="grid gap-8 lg:grid-cols-3">
                    <div className="flex flex-col gap-8 lg:col-span-2">
                      {/* Removed Old Team Stats */}

                      {/* Team members */}
                      <Reveal delay={0.1} duration={0.55}>
                        <div className="card border-t-[8px] p-8" style={{ background: "var(--surface)", borderColor: "var(--color-brand-blue)" }}>
                          <h3 className="text-[13px] font-black uppercase tracking-[0.18em] mb-5 inline-flex items-center gap-2" style={{ color: "var(--fg-muted)" }}>
                            <Trophy size={16} strokeWidth={2.5} /> Team Stats
                          </h3>
                          <div className="space-y-3">
                            {teamMembers.map((p) => (
                              <div key={p.id} className="flex items-center gap-3.5 rounded-2xl px-4 py-3" style={{ background: "var(--border-soft)" }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-white/10"
                                  style={avatarStyle(p)}>
                                  {p.avatar_emoji || "🏃"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[15px] font-black truncate" style={{ color: "var(--fg)" }}>
                                    {p.is_leader ? "👑 " : ""}{p.name}
                                  </p>
                                  {p.roll && <p className="text-[11px] font-bold" style={{ color: "var(--fg-muted)" }}>Roll: {p.roll}</p>}
                                </div>
                                {p.id === (session?.role === "team" ? session.participantId : null) && (
                                  <button onClick={() => setShowAvatarEdit(true)}
                                    className="text-[11px] font-extrabold uppercase tracking-wide px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                                    style={{ background: "var(--accent-on-surface)", color: "var(--color-brand-blue)" }}>
                                    Edit
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </Reveal>
                    </div>
                    {/* Removed old Leaderboard button */}
                  </div>
                ) : (
                  /* Clues tab */
                  <div className="grid gap-8 lg:grid-cols-3">
                    <div className="flex flex-col gap-8 lg:col-span-2">
                      <Reveal delay={0.06} duration={0.5}>
                        <div className="card border-t-[8px] p-10 text-center" style={{ background: "var(--surface)", borderColor: "var(--color-brand-blue)" }}>
                          <p className="mb-2 text-[13px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--fg-muted)" }}>
                            🎯 Clue {data.completedClues + 1} of {data.totalClues}
                          </p>
                          <ClueTimer
                            startedAt={data.currentRoute?.clue_started_at ?? null}
                            timeLimitMinutes={data.eventConfig?.clue_time_limit_minutes ?? 40}
                            onTimeout={handleTimeout}
                            paused={showTimeout}
                          />
                        </div>
                      </Reveal>

                      <Reveal delay={0.1} duration={0.55}>
                        <div className="card border-t-[8px] p-10" style={{ background: "var(--surface)", borderColor: "var(--color-brand-green)" }}>
                          {data.clueDefinition && data.spot ? (
                            <>
                              <div className="mb-4 flex items-center gap-3">
                                <span className="rounded-xl px-4 py-1.5 text-[12px] font-extrabold uppercase tracking-wide"
                                  style={{ background: "rgba(28,176,246,0.12)", color: "var(--color-brand-blue)" }}>
                                  📍 {data.spot.name}
                                </span>
                                {data.clueDefinition.difficulty && (
                                  <span className="rounded-xl px-4 py-1.5 text-[12px] font-extrabold uppercase tracking-wide"
                                    style={{
                                      background: data.clueDefinition.difficulty === "hard"
                                        ? "rgba(255,75,75,0.12)" : "rgba(255,200,0,0.12)",
                                      color: data.clueDefinition.difficulty === "hard"
                                        ? "var(--color-brand-red)" : "var(--color-brand-gold)",
                                    }}>
                                    {data.clueDefinition.difficulty === "hard" ? "🔥 Hard" : data.clueDefinition.difficulty === "easy" ? "🌱 Easy" : "⭐ Medium"}
                                  </span>
                                )}
                              </div>
                              {data.clueDefinition.image_url && (
                                <img src={data.clueDefinition.image_url} alt="Clue visual"
                                  className="mb-4 w-full rounded-2xl object-cover shadow-lg" style={{ maxHeight: 300 }} />
                              )}
                              <p className="text-[26px] font-black leading-relaxed" style={{ color: "var(--fg)" }}>
                                {data.clueDefinition.clue_text}
                              </p>
                              {data.spot.location_hint && (
                                <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                  className="mt-6 rounded-[20px] px-6 py-4 text-[17px] font-black italic"
                                  style={{ background: "rgba(28,176,246,0.1)", border: "2px solid rgba(28,176,246,0.2)", color: "var(--color-brand-blue)" }}>
                                  📍 {data.spot.location_hint}
                                </motion.p>
                              )}
                            </>
                          ) : (
                            <div className="py-8 text-center">
                              <p className="text-5xl mb-4">
                                {data.totalClues === 0 ? "🕐" : data.currentRoute === null ? "🏆" : "🔍"}
                              </p>
                              <p className="text-[20px] font-bold" style={{ color: "var(--fg-muted)" }}>
                                {data.totalClues === 0 ? "No clues assigned yet." : data.currentRoute === null ? "All clues completed! Amazing!" : "Loading clue…"}
                              </p>
                            </div>
                          )}
                        </div>
                      </Reveal>

                      {/* Removed Old Progress Stats from Clues Tab */}

                      {/* Removed Old Leaderboard button from Clues tab */}
                    </div>
                  </div>
                )}
              </>
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

      <AvatarEditModal
        open={showAvatarEdit}
        currentEmoji={me?.avatar_emoji || "🏃"}
        currentColor={me?.avatar_color || "#58cc02"}
        onSave={handleAvatarSave}
        onClose={() => setShowAvatarEdit(false)}
      />
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
