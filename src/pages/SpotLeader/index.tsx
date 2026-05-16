import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

import { secondsToPenaltyPoints } from "@/lib/penalty";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Reveal } from "@/components/Reveal";
import { SuccessOverlay } from "@/components/SuccessOverlay";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getAvatarUrl } from "@/lib/avatar";
import { useSession, useAuthStore } from "@/store/authStore";
import { fetchSpotLeaderData, approveArrival, completeMiniGame, skipMiniGame, MINI_GAME_POINTS } from "@/services/spotLeader";
import { insertNotification } from "@/services/notifications";
import { useLeaderboard } from "@/hooks/useLeaderboardRealtime";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import type { SpotLeaderData, ArrivingTeam } from "@/services/spotLeader";

export default function SpotLeaderPage() {
  const session = useSession();
  const clearSession = useAuthStore((s) => s.clearSession);
  const spotId = session?.role === "spot-leader" ? session.spotId : null;

  const [data, setData] = useState<SpotLeaderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [arrivalBusyId, setArrivalBusyId] = useState<string | null>(null);
  const [miniGameTeam, setMiniGameTeam] = useState<ArrivingTeam | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<number | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPoints, setSuccessPoints] = useState(0);
  const [successTitle, setSuccessTitle] = useState("APPROVED!");
  const [successSubtitle, setSuccessSubtitle] = useState("Team awarded successfully");
  const [showGlobalView, setShowGlobalView] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const leaderboard = useLeaderboard();
  const [confirmDef, setConfirmDef] = useState<{ title: string; message: string; destructive?: boolean } | null>(null);
  const [confirmHandler, setConfirmHandler] = useState<((data?: any) => Promise<void>) | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [, setTick] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!spotId) return;
    setLoading(true);
    setError(null);
    try {
      const d = await fetchSpotLeaderData(spotId);
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [spotId]);

  useEffect(() => { void load(); }, [load]);

  // Tick every 1min to refresh timer displays
  useEffect(() => {
    tickRef.current = setInterval(() => setTick((t) => t + 1), 60000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  const openMiniGame = (team: ArrivingTeam) => {
    setMiniGameTeam(team);
    setSelectedPoints(null);
  };

  const closeMiniGame = () => {
    setMiniGameTeam(null);
    setSelectedPoints(null);
  };

  const triggerSuccess = (teamId: string, points: number, title?: string, subtitle?: string) => {
    setSuccessId(teamId);
    setSuccessPoints(points);
    setSuccessTitle(title ?? "APPROVED!");
    setSuccessSubtitle(subtitle ?? "Team awarded successfully");
    setShowSuccess(true);
    setTimeout(() => setSuccessId(null), 2500);
  };

  const MIN_WAIT_MS = 20 * 60 * 1000;

  const canAwardMiniGame = (team: ArrivingTeam) => {
    if (!team.arrivalApprovedAt) return false;
    return Date.now() - new Date(team.arrivalApprovedAt).getTime() >= MIN_WAIT_MS;
  };

  const getRemainingWaitMinutes = (team: ArrivingTeam) => {
    if (!team.arrivalApprovedAt) return 0;
    const elapsed = Date.now() - new Date(team.arrivalApprovedAt).getTime();
    if (elapsed >= MIN_WAIT_MS) return 0;
    return Math.ceil((MIN_WAIT_MS - elapsed) / 60000);
  };

  const formatElapsed = (startedAt: string | null) => {
    if (!startedAt) return "—";
    const ms = Date.now() - new Date(startedAt).getTime();
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}m ${sec.toString().padStart(2, "0")}s`;
  };

  const getTimeStatus = (team: ArrivingTeam, timeLimit: number) => {
    if (!team.clueStartedAt) return null;
    const elapsedMin = (Date.now() - new Date(team.clueStartedAt).getTime()) / 60000;
    if (elapsedMin < timeLimit) return null;

    if (team.helpActivatedAt) return "revealed";
    if (team.timeoutAcknowledgedAt) return "continued";
    return "overdue";
  };

  const getMiniGameStatus = (team: ArrivingTeam) => {
    if (team.miniGamePlayed) return null;
    if (team.miniGameStarted) return "inProgress";
    return null;
  };

  const handleApproveArrival = async (team: ArrivingTeam) => {
    setArrivalBusyId(team.teamId);
    setError(null);
    try {
      const { pointsAwarded } = await approveArrival(team.routeId, team.teamId);
      triggerSuccess(
        team.teamId,
        pointsAwarded,
        pointsAwarded > 0 ? "ARRIVAL APPROVED!" : "ARRIVAL APPROVED (0 pts)",
        pointsAwarded > 0
          ? `Team earned ${pointsAwarded} points for arrival`
          : "Team used a hint — no arrival points awarded"
      );
      if (pointsAwarded > 0) {
        insertNotification({
          team_id: team.teamId,
          type: "points",
          title: "Arrival Approved! 📍",
          message: `Your team earned ${pointsAwarded} points for reaching the spot!`,
          points: pointsAwarded,
        }).catch(() => {});
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Arrival approval failed");
    } finally {
      setArrivalBusyId(null);
    }
  };

  const handleAwardMiniGame = async () => {
    if (!miniGameTeam || selectedPoints === null) return;
    const { routeId, teamId } = miniGameTeam;
    setDialogBusy(true);
    setError(null);
    try {
      await completeMiniGame(routeId, teamId, selectedPoints);
      triggerSuccess(teamId, selectedPoints, "MINI-GAME AWARDED!", `Team earned +${selectedPoints} bonus points`);
      insertNotification({
        team_id: teamId,
        type: "points",
        title: "Mini-Game Complete! 🎮",
        message: `Your team earned +${selectedPoints} bonus points!`,
        points: selectedPoints,
      }).catch(() => {});
      closeMiniGame();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mini-game approval failed");
    } finally {
      setDialogBusy(false);
    }
  };

  const handleSkipMiniGame = async (team?: ArrivingTeam) => {
    const t = team ?? miniGameTeam;
    if (!t) return;
    const { routeId, teamId } = t;
    setArrivalBusyId(teamId);
    setDialogBusy(true);
    setError(null);
    try {
      await skipMiniGame(routeId, teamId);
      triggerSuccess(teamId, 0, "CLUE COMPLETED!", "Team advanced to the next clue (0 bonus points)");
      insertNotification({
        team_id: teamId,
        type: "points",
        title: "Clue Completed! 🎯",
        message: "Your team advanced to the next clue!",
        points: 0,
      }).catch(() => {});
      closeMiniGame();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Skip failed");
    } finally {
      setArrivalBusyId(null);
      setDialogBusy(false);
    }
  };

  if (!spotId) {
    return (
    <div className="relative min-h-screen overflow-hidden pb-6" style={{ background: "var(--bg)", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <p className="text-5xl">🔐</p>
          <p className="mt-4 font-display text-2xl font-extrabold" style={{ color: "var(--fg-muted)" }}>
            Not logged in
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      <SuccessOverlay
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        pointsEarned={successPoints}
        title={successTitle}
        subtitle={successSubtitle}
      />

      <ConfirmDialog
        open={confirmDef !== null}
        title={confirmDef?.title ?? ""}
        message={confirmDef?.message ?? ""}
        destructive={confirmDef?.destructive}
        loading={confirmLoading}
        onConfirm={async () => {
          if (!confirmHandler) return;
          setConfirmLoading(true);
          try { await confirmHandler(); } finally { setConfirmLoading(false); setConfirmDef(null); setConfirmHandler(null); }}
        }
        onCancel={() => { setConfirmDef(null); setConfirmHandler(null); }}
      />

      <div className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-8" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-soft)" }}>
        <Logo className="h-10 w-10 sm:h-12 sm:w-12" />
        <div className="flex items-center gap-2 sm:gap-3">
          {session?.role === "spot-leader" && (
            <span className="hidden sm:inline-block rounded-full px-4 py-2 text-[13px] font-bold" style={{ background: "#F0F7FF", color: "#1CB0F6", boxShadow: "0 2px 0 rgba(28,176,246,0.15)" }}>
              📍 {session.spotName}
            </span>
          )}
          <button
            onClick={() => {
              setConfirmDef({ title: "Logout", message: "Are you sure you want to logout?" });
              setConfirmHandler(async () => { clearSession(); });
            }}
            className="rounded-full px-4 sm:px-6 py-2 sm:py-2.5 text-[12px] sm:text-[14px] font-black uppercase tracking-wide transition-all"
            style={{ color: "var(--fg-muted)", background: "var(--accent-on-surface)", boxShadow: "0 2px 0 var(--border-soft)" }}
          >
            🚪 Logout
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-20 pt-10 sm:pt-12">

        <Reveal duration={0.5}>
          <header className="mb-8 text-center">
            <h1 className="font-display text-[28px] sm:text-[32px] font-black" style={{ color: "var(--fg)" }}>
              {data?.spot.name ?? "Spot Leader"}
            </h1>
            <p className="mt-2 text-[13px] sm:text-[15px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--fg-muted)" }}>
              📍 {data?.spot.location_hint ?? ""}
            </p>
          </header>
        </Reveal>



        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-3xl px-6 py-4 text-center text-[15px] font-bold"
            style={{
              background: "rgba(255,75,75,0.08)",
              border: "2px solid rgba(255,75,75,0.2)",
              color: "#FF4B4B",
            }}
            role="alert"
          >
            ⚠️ {error}
          </motion.div>
        )}

        <Reveal delay={0.08} duration={0.55}>
          <div className="rounded-[24px] p-6 sm:p-8 mb-8"
            style={{ background: "var(--surface)", boxShadow: "0 4px 0 #1CB0F6, 0 12px 24px -8px var(--border-soft)" }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[12px] sm:text-[14px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--fg-muted)" }}>
                  🏠 Your Spot
                </p>
                <p className="mt-2 text-[16px] sm:text-[19px] font-black leading-relaxed" style={{ color: "var(--fg)" }}>
                  {data?.spot.description ?? "Loading…"}
                </p>
              </div>
              <button
                onClick={load}
                disabled={loading}
                className="w-full sm:w-auto rounded-[20px] px-6 sm:px-8 py-3 sm:py-4 text-[14px] sm:text-[15px] font-black uppercase tracking-wide transition-all"
                style={{ background: "var(--accent-on-surface)", boxShadow: "0 3px 0 var(--border-soft)", color: "var(--fg-muted)" }}
              >
                {loading ? "⟳" : "🔄 Refresh"}
              </button>
            </div>
          </div>
        </Reveal>



        {/* Mission Roadmap — All Teams */}
        <Reveal delay={0.12} duration={0.5}>
          <div className="mb-8">
            <button
              onClick={() => setShowGlobalView(!showGlobalView)}
              className="w-full rounded-[20px] p-4 text-left transition-all flex items-center justify-between gap-3"
              style={{ background: "var(--surface)", boxShadow: "0 3px 0 var(--border-soft)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-[15px] font-black" style={{ color: "var(--fg)" }}>Mission Roadmap — All Teams</p>
                  <p className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
                    {data?.allTeams.filter(t => t.fullRoute && t.fullRoute.length > 0).length ?? 0} Teams · Route Progress
                  </p>
                </div>
              </div>
              <motion.span
                animate={{ rotate: showGlobalView ? 180 : 0 }}
                className="text-xl opacity-40"
                style={{ color: "var(--fg-muted)" }}
              >
                ▼
              </motion.span>
            </button>

            <AnimatePresence>
              {showGlobalView && data?.allTeams && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-4 pt-4">
                    {data.allTeams.filter(t => t.fullRoute && t.fullRoute.length > 0).map((team, tIdx) => {
                      const route = team.fullRoute;
                      const completed = route.filter((s: any) => ["completed","revealed","solved"].includes(s.status || "")).length;
                      const leaderAvatar = team.participants?.find((p: any) => p.isLeader)?.avatarEmoji || team.participants?.[0]?.avatarEmoji || team.teamName;
                      return (
                        <motion.div
                          key={team.teamId}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: tIdx * 0.03 }}
                          className="rounded-[20px] p-4 sm:p-5"
                          style={{ background: "var(--surface)", boxShadow: "0 3px 0 var(--border-soft)" }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border-2" style={{ borderColor: team.huntCompleted ? "#FFC800" : "#58CC02" }}>
                                <img src={getAvatarUrl(leaderAvatar, 36)} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[14px] font-black truncate" style={{ color: "var(--fg)" }}>{team.teamName}</p>
                                <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
                                  {Math.max(0, team.totalPoints - secondsToPenaltyPoints(team.totalPenaltySeconds))} pts{team.huntCompleted ? " · 👑 Done" : ""}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <span className="text-[16px] font-black" style={{ color: "#58CC02" }}>{completed}/{route.length}</span>
                              <p className="text-[8px] font-black uppercase tracking-tight" style={{ color: "var(--fg-muted)" }}>Cleared</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0 overflow-x-auto pb-1 scrollbar-hide">
                            {route.map((step: any, idx: number) => {
                              const isCompleted = ["completed","revealed","solved"].includes(step.status || "");
                              const isCurrent = step.isCurrent;
                              return (
                                <div key={idx} className="flex items-center gap-0">
                                  <div className="flex flex-col items-center min-w-[72px]">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black border-[3px] transition-all shrink-0"
                                      style={{
                                        background: isCompleted ? "#58CC02" : isCurrent ? "#1CB0F6" : "var(--bg)",
                                        borderColor: isCompleted ? "#46A302" : isCurrent ? "#0f7ac0" : "#E8E8E8",
                                        color: isCompleted || isCurrent ? "white" : "var(--fg-muted)",
                                        boxShadow: isCurrent ? "0 0 0 5px rgba(28,176,246,0.15)" : "none",
                                      }}
                                    >
                                      {isCompleted ? "🏆" : isCurrent ? "🎯" : (idx + 1)}
                                    </div>
                                    <p className="mt-1 text-[8px] font-black uppercase truncate max-w-[64px] text-center leading-tight"
                                      style={{ color: isCompleted ? "#58CC02" : isCurrent ? "#1CB0F6" : "var(--fg-muted)" }}>
                                      {step.spotName}
                                    </p>
                                    <div className="mt-0.5 flex items-center gap-0.5">
                                      <span className="text-[7px]" style={{ opacity: step.arrivalApproved ? 1 : 0.2 }}>📍</span>
                                      {step.hasMiniGame && (
                                        <span className="text-[7px]" style={{ opacity: step.miniGamePlayed ? 1 : 0.2 }}>🎮</span>
                                      )}
                                    </div>
                                  </div>
                                  {idx < route.length - 1 && (
                                    <div className="w-4 h-[3px] rounded-full mx-0.5 shrink-0"
                                      style={{
                                        background: isCompleted ? "#58CC02" : isCurrent ? "#1CB0F6" : "#E8E8E8",
                                        opacity: isCompleted ? 1 : 0.35,
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    })}
                    {data.allTeams.filter(t => t.fullRoute && t.fullRoute.length > 0).length === 0 && (
                      <div className="text-center py-8">
                        <span className="text-3xl">🗺️</span>
                        <p className="mt-2 text-[14px] font-bold" style={{ color: "var(--fg-muted)" }}>No route plans assigned yet</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        <div className="flex flex-col gap-4">
          {loading && !data && (
            <div className="py-12 text-center">
              <motion.p
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-5xl"
              >
                🔍
              </motion.p>
              <p className="mt-4 text-[16px] font-bold" style={{ color: "var(--fg-muted)" }}>
                Loading teams…
              </p>
            </div>
          )}

          {data && data.arrivingTeams.length === 0 && (
            <Reveal>
              <div className="rounded-[24px] p-12 text-center"
                style={{ background: "var(--surface)", boxShadow: "0 4px 0 var(--border-soft), 0 12px 24px -8px var(--border-soft)" }}>
                <motion.p
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-6xl"
                >
                  📍
                </motion.p>
                <p className="mt-4 text-[22px] font-extrabold" style={{ color: "var(--fg-muted)" }}>
                  No teams at this spot yet
                </p>
                <p className="mt-2 text-[15px] font-semibold" style={{ color: "var(--fg-muted)" }}>
                  Teams will appear here when they reach your clue.
                </p>
              </div>
            </Reveal>
          )}

          <AnimatePresence mode="popLayout">
            {data?.arrivingTeams.map((team) => (
              <motion.div
                key={team.teamId}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                transition={{ duration: 0.35 }}
              >
                <Reveal>
                  <div
                    className="rounded-[24px] p-5 sm:p-8 transition-all"
                    style={{
                      background: successId === team.teamId
                        ? "#F0FFF0"
                        : "var(--surface)",
                      boxShadow: successId === team.teamId
                        ? "0 4px 0 #58CC02, 0 12px 24px -8px var(--border-soft)"
                        : "0 4px 0 #FFC800, 0 12px 24px -8px var(--border-soft)",
                    }}
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="text-[20px] sm:text-[26px] font-black truncate max-w-[200px] sm:max-w-none" style={{ color: "var(--fg)" }}>
                            {team.teamName}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="rounded-xl px-2 sm:px-4 py-1 sm:py-1.5 text-[9px] sm:text-[12px] font-black uppercase tracking-wide"
                              style={{
                                background:
                                  team.status === "active"
                                    ? "rgba(88,204,2,0.1)"
                                    : "rgba(255,200,0,0.1)",
                                color:
                                  team.status === "active"
                                    ? "#58CC02"
                                    : "#FFC800",
                              }}
                            >
                              {team.status === "active" ? "🟢 Active" : "🟡 Pending"}
                            </span>
                            <span
                              className="rounded-xl px-2 sm:px-3 py-1 text-[9px] sm:text-[11px] font-extrabold uppercase tracking-wide"
                              style={{
                                background: team.status === "active" ? "rgba(88,204,2,0.1)" : "rgba(156,163,175,0.1)",
                                color: team.status === "active" ? "#58CC02" : "var(--fg-muted)",
                              }}
                            >
                              {team.status === "active" ? "🟢 Hunting" : "⏳ Waiting"}
                            </span>
                          </div>
                        </div>

                        <p className="mt-3 text-[14px] sm:text-[15px] font-semibold leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                          {team.clueText.length > 120
                            ? team.clueText.slice(0, 120) + "…"
                            : team.clueText}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-[12px] sm:text-[13px] font-extrabold" style={{ color: "var(--fg-muted)" }}>
                            ⏱ {formatElapsed(team.clueStartedAt)} / {data?.clueTimeLimitMinutes ?? 40}m
                          </span>
                          {getTimeStatus(team, data?.clueTimeLimitMinutes ?? 40) === "revealed" && (
                            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
                              style={{ background: "rgba(255,75,75,0.12)", color: "#FF4B4B" }}>
                              😤 Timed out · 💡 Revealed
                            </span>
                          )}
                          {getTimeStatus(team, data?.clueTimeLimitMinutes ?? 40) === "continued" && (
                            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
                              style={{ background: "rgba(255,200,0,0.12)", color: "#E5A800" }}>
                              😤 Timed out · 🔍 Continued
                            </span>
                          )}
                          {getTimeStatus(team, data?.clueTimeLimitMinutes ?? 40) === "overdue" && (
                            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
                              style={{ background: "rgba(255,75,75,0.08)", color: "#FF4B4B" }}>
                              ⏰ Overdue
                            </span>
                          )}
                          {getMiniGameStatus(team) === "inProgress" && (
                            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
                              style={{ background: "rgba(88,204,2,0.12)", color: "#58CC02" }}>
                              🎮 In Mini-Game
                            </span>
                          )}
                        </div>

                        {team.fullRoute && team.fullRoute.length > 0 && (
                          <div className="mt-6 pt-6 border-t-[3px] border-dashed" style={{ borderColor: "var(--border-soft)" }}>
                            <p className="mb-4 text-[12px] sm:text-[13px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--fg-muted)" }}>
                              🗺 Route Journey
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {team.fullRoute.map((step: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  <span 
                                    className="rounded-full px-2.5 py-1.5 text-[10px] sm:text-[12px] font-black uppercase tracking-wide"
                                    style={{
                                      background: step.isCurrent 
                                        ? "#1CB0F6"
                                        : step.status === "completed" || step.status === "solved" 
                                          ? "#58CC02"
                                          : "var(--accent-on-surface)",
                                      color: step.isCurrent || step.status === "completed" || step.status === "solved" ? "#fff" : "var(--fg-muted)",
                                      opacity: step.status === "pending" && !step.isCurrent ? 0.6 : 1,
                                    }}
                                  >
                                    {step.isCurrent ? "📍" : step.status === "completed" || step.status === "solved" ? "✓" : (idx + 1)} {step.spotName}
                                  </span>
                                  {idx < team.fullRoute.length - 1 && (
                                    <span className="opacity-30 font-bold text-xs" style={{ color: "var(--fg-muted)" }}>→</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Step 1: Approve Arrival */}
                      {!team.arrivalApproved ? (
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          onClick={() => handleApproveArrival(team)}
                          disabled={arrivalBusyId === team.teamId || successId === team.teamId}
                          className="w-full sm:w-auto shrink-0 rounded-[20px] sm:rounded-[24px] px-8 sm:px-10 py-3.5 sm:py-6 text-[15px] sm:text-[17px] font-black uppercase tracking-wide text-white transition-all"
                          style={{
                            background:
                              successId === team.teamId
                                ? "#58CC02"
                                : "linear-gradient(135deg, #1CB0F6, #0f7ac0)",
                            boxShadow: successId === team.teamId
                              ? "0 4px 0 #3A8400"
                              : "0 4px 0 #0f4a9e",
                            opacity: arrivalBusyId === team.teamId || successId === team.teamId ? 0.7 : 1,
                            cursor: arrivalBusyId === team.teamId || successId === team.teamId ? "not-allowed" : "pointer",
                          }}
                        >
                          {arrivalBusyId === team.teamId
                            ? "⏳"
                            : successId === team.teamId
                              ? "✅ Approved!"
                              : "📍 Approve Arrival"}
                        </motion.button>
                      ) : team.miniGamePlayed ? (
                        /* Completed */
                        <span className="w-full sm:w-auto shrink-0 rounded-[20px] sm:rounded-[24px] px-8 sm:px-10 py-3.5 sm:py-6 text-[15px] sm:text-[17px] font-black uppercase tracking-wide text-center"
                          style={{ background: "#58CC02", color: "#fff", boxShadow: "0 4px 0 #3A8400" }}>
                          ✅ Done
                        </span>
                      ) : (
                        /* Step 2: Award Mini-Game */
                        <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                          <span className="text-[11px] font-extrabold uppercase tracking-wide"
                            style={{ color: "#58CC02" }}>
                            📍 Arrival Approved
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => openMiniGame(team)}
                            disabled={!canAwardMiniGame(team)}
                            className="w-full sm:w-auto shrink-0 rounded-[20px] sm:rounded-[24px] px-8 sm:px-10 py-3.5 sm:py-6 text-[15px] sm:text-[17px] font-black uppercase tracking-wide text-white transition-all"
                            style={{
                              background: canAwardMiniGame(team)
                                ? "linear-gradient(135deg, #FFC800, #E5A800)"
                                : "var(--accent-on-surface)",
                              boxShadow: canAwardMiniGame(team)
                                ? "0 4px 0 #B88600"
                                : "0 3px 0 var(--border-soft)",
                              color: canAwardMiniGame(team) ? "#fff" : "var(--fg-muted)",
                              cursor: canAwardMiniGame(team) ? "pointer" : "not-allowed",
                              opacity: canAwardMiniGame(team) ? 1 : 0.6,
                            }}
                          >
                            {canAwardMiniGame(team)
                              ? "🎮 Award Mini-Game"
                              : `⏳ Wait ${getRemainingWaitMinutes(team)} min`}
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => handleSkipMiniGame(team)}
                            disabled={arrivalBusyId === team.teamId}
                            className="w-full sm:w-auto shrink-0 rounded-[20px] sm:rounded-[24px] px-8 sm:px-10 py-3.5 sm:py-6 text-[15px] sm:text-[17px] font-black uppercase tracking-wide transition-all"
                            style={{
                              background: "#58CC02",
                              boxShadow: "0 4px 0 #3A8400",
                              color: "#fff",
                              opacity: arrivalBusyId === team.teamId ? 0.6 : 1,
                              cursor: arrivalBusyId === team.teamId ? "not-allowed" : "pointer",
                            }}
                          >
                            {arrivalBusyId === team.teamId ? "⏳" : "⏭ Skip Mini-Game"}
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </Reveal>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>



        {/* Leaderboard */}
        <Reveal delay={0.16} duration={0.5}>
          <div className="mb-8">
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="w-full rounded-[20px] p-4 text-left transition-all flex items-center justify-between gap-3"
              style={{ background: "var(--surface)", boxShadow: "0 3px 0 var(--border-soft)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-[15px] font-black" style={{ color: "var(--fg)" }}>Leaderboard</p>
                  <p className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
                    {leaderboard.length} teams
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  onClick={(e) => { e.stopPropagation(); leaderboard.refresh(); }}
                  className="rounded-xl px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide cursor-pointer transition-all active:scale-90"
                  style={{ background: "var(--border-soft)", color: "var(--fg-muted)" }}
                >
                  ⟳
                </span>
                <motion.span
                  animate={{ rotate: showLeaderboard ? 180 : 0 }}
                  className="text-xl opacity-40"
                  style={{ color: "var(--fg-muted)" }}
                >
                  ▼
                </motion.span>
              </div>
            </button>

            <AnimatePresence>
              {showLeaderboard && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden pt-4"
                >
                  <Leaderboard entries={leaderboard} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        <Reveal delay={0.2} duration={0.5}>
          <p className="mt-4 text-center text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            Treasure Hunt · University of Dhaka — CSE
          </p>
        </Reveal>
      </div>

      {/* Step 2 Dialog: Award Mini-Game Points */}
      <AnimatePresence>
        {miniGameTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md" style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: "spring", stiffness: 250, damping: 22 }}
              className="w-full max-w-md rounded-[24px] p-6 sm:p-8"
              style={{ background: "var(--surface)", boxShadow: "0 4px 0 var(--border-soft), 0 16px 32px -8px var(--border-strong)" }}
            >
              <motion.p
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.05 }}
                className="mb-2 text-center text-5xl sm:text-6xl"
              >
                🎮
              </motion.p>
              <motion.h2
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-1 text-center text-[22px] sm:text-[26px] font-extrabold"
                style={{ color: "var(--fg)" }}
              >
                {miniGameTeam.teamName}
              </motion.h2>
              <motion.p
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mb-2 text-center text-[14px] sm:text-[15px] font-semibold"
                style={{ color: "var(--fg-muted)" }}
              >
                Step 2: Award mini-game points
              </motion.p>

              {/* Arrival approved indicator */}
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.18 }}
                className="mb-6 rounded-2xl p-3 text-center"
                style={{ background: "rgba(88,204,2,0.08)", border: "1px solid rgba(88,204,2,0.2)" }}
              >
                <span className="text-[12px] font-extrabold" style={{ color: "#58CC02" }}>
                  ✅ Arrival approved
                </span>
                <span className="text-[11px] font-semibold ml-2" style={{ color: "var(--fg-muted)" }}>
                  {miniGameTeam.arrivalApprovedAt
                    ? new Date(miniGameTeam.arrivalApprovedAt).toLocaleTimeString()
                    : ""}
                </span>
              </motion.div>

              {/* Countdown if < 20 min */}
              {!canAwardMiniGame(miniGameTeam) && (
                <motion.div
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-5 rounded-2xl p-4 text-center"
                  style={{ background: "rgba(255,200,0,0.1)", border: "1px solid rgba(255,200,0,0.25)" }}
                >
                  <p className="text-[13px] font-bold" style={{ color: "#FFC800" }}>
                    ⏳ Waiting period active
                  </p>
                  <p className="text-[11px] font-semibold mt-1" style={{ color: "var(--fg-muted)" }}>
                    Please wait {getRemainingWaitMinutes(miniGameTeam)} more minute(s) before awarding mini-game points (minimum 20 min after arrival).
                  </p>
                </motion.div>
              )}

              {/* Mini-Game Points */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="mb-3 text-[12px] sm:text-[14px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "#FFC800" }}>
                  🎯 Bonus Points
                </p>
                <p className="mb-4 text-[13px] sm:text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>
                  Select points to award:
                </p>
                <div className="mb-6 flex flex-wrap justify-center sm:justify-start gap-2">
                  {MINI_GAME_POINTS.map((p) => (
                    <motion.button
                      key={p}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedPoints(p)}
                      className="rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 text-[14px] sm:text-[16px] font-extrabold transition-all"
                      style={{
                        background: selectedPoints === p ? "#FFC800" : "var(--accent-on-surface)",
                        color: selectedPoints === p ? "var(--fg)" : "var(--fg-muted)",
                        boxShadow: selectedPoints === p ? "0 3px 0 rgba(200,150,0,0.5)" : "0 2px 0 var(--border-soft)",
                        transform: selectedPoints === p ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      +{p}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Auto penalty info */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mb-6 rounded-2xl p-3"
                style={{ background: "rgba(255,75,75,0.06)", border: "1px solid rgba(255,75,75,0.15)" }}
              >
                <p className="text-[11px] font-bold text-center" style={{ color: "var(--fg-muted)" }}>
                  ⏱ Auto penalty: <strong style={{ color: "#FF4B4B" }}>1 point</strong> deducted every 4 minutes from clue start
                </p>
              </motion.div>

              <div className="flex flex-col gap-3">
                <motion.button
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={handleAwardMiniGame}
                  disabled={selectedPoints === null || dialogBusy || !canAwardMiniGame(miniGameTeam)}
                  className="w-full rounded-2xl px-8 py-3.5 sm:py-4 text-[15px] sm:text-[16px] font-extrabold uppercase tracking-wide text-white transition-all"
                  style={{
                    background: canAwardMiniGame(miniGameTeam) ? "#FFC800" : "var(--accent-on-surface)",
                    boxShadow: canAwardMiniGame(miniGameTeam) ? "0 4px 0 rgba(200,150,0,0.5)" : "0 3px 0 var(--border-soft)",
                    color: canAwardMiniGame(miniGameTeam) ? "#fff" : "var(--fg-muted)",
                    opacity: selectedPoints === null || dialogBusy || !canAwardMiniGame(miniGameTeam) ? 0.5 : 1,
                    cursor: selectedPoints === null || dialogBusy || !canAwardMiniGame(miniGameTeam) ? "not-allowed" : "pointer",
                  }}
                >
                  {dialogBusy
                    ? "⏳ Processing…"
                    : !canAwardMiniGame(miniGameTeam)
                      ? `⏳ Wait ${getRemainingWaitMinutes(miniGameTeam)} min`
                      : `🎮 Award +${selectedPoints ?? 0} pts`}
                </motion.button>

                <motion.button
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  onClick={() => handleSkipMiniGame()}
                  disabled={dialogBusy || !canAwardMiniGame(miniGameTeam)}
                  className="w-full rounded-2xl px-8 py-3.5 sm:py-4 text-[15px] sm:text-[16px] font-extrabold uppercase tracking-wide transition-all"
                  style={{
                    background: canAwardMiniGame(miniGameTeam) ? "#58CC02" : "var(--accent-on-surface)",
                    boxShadow: canAwardMiniGame(miniGameTeam) ? "0 4px 0 #3A8400" : "0 3px 0 var(--border-soft)",
                    color: canAwardMiniGame(miniGameTeam) ? "#fff" : "var(--fg-muted)",
                    opacity: dialogBusy || !canAwardMiniGame(miniGameTeam) ? 0.5 : 1,
                  }}
                >
                  {dialogBusy
                    ? "⏳ Processing…"
                    : !canAwardMiniGame(miniGameTeam)
                      ? `⏳ Wait ${getRemainingWaitMinutes(miniGameTeam)} min`
                      : "⏭ Skip · 0 bonus pts"}
                </motion.button>

                <motion.button
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={closeMiniGame}
                  disabled={dialogBusy}
                  className="w-full rounded-2xl px-8 py-3.5 sm:py-4 text-[14px] sm:text-[15px] font-extrabold uppercase tracking-wide transition-all"
                  style={{
                    background: "var(--accent-on-surface)",
                    boxShadow: "0 3px 0 var(--border-soft)",
                    color: "var(--fg-muted)",
                    opacity: dialogBusy ? 0.4 : 1,
                    cursor: dialogBusy ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
