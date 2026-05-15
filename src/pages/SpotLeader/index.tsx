import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Backdrop } from "@/components/Backdrop";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Reveal } from "@/components/Reveal";
import { SuccessOverlay } from "@/components/SuccessOverlay";
import { BroadcastBanner } from "@/components/BroadcastBanner";
import { TeamMap } from "@/components/TeamMap";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useBroadcastListener } from "@/hooks/useBroadcastListener";
import { useTeamLocationsRealtime } from "@/hooks/useTeamLocationsRealtime";
import { useProximityAlert } from "@/hooks/useProximityAlert";
import { useSession, useAuthStore } from "@/store/authStore";
import { fetchSpotLeaderData, approveTeam, MINI_GAME_POINTS } from "@/services/spotLeader";
import { insertNotification } from "@/services/notifications";
import type { SpotLeaderData, ArrivingTeam } from "@/services/spotLeader";

export default function SpotLeaderPage() {
  const session = useSession();
  const clearSession = useAuthStore((s) => s.clearSession);
  const spotId = session?.role === "spot-leader" ? session.spotId : null;

  const [data, setData] = useState<SpotLeaderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [miniGameTeam, setMiniGameTeam] = useState<ArrivingTeam | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<number | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [penaltyMinutes, setPenaltyMinutes] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPoints, setSuccessPoints] = useState(0);
  const sessionRole = session?.role === "spot-leader" ? "spot-leader" : null;
  const broadcast = useBroadcastListener(sessionRole);
  const teamLocations = useTeamLocationsRealtime();

  // Compute arriving team IDs from data
  const arrivingIds = new Set(data?.arrivingTeams.map(t => t.teamId) || []);

  const { nearbyTeamIds, justArrivedTeamIds } = useProximityAlert(
    data?.spot?.latitude ?? null,
    data?.spot?.longitude ?? null,
    data?.spot?.radius_meters ?? null,
    teamLocations,
    arrivingIds,
  );

  const [confirmDef, setConfirmDef] = useState<{ title: string; message: string; destructive?: boolean } | null>(null);
  const [confirmHandler, setConfirmHandler] = useState<(() => Promise<void>) | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

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

  const openMiniGame = (team: ArrivingTeam) => {
    setMiniGameTeam(team);
    setSelectedPoints(null);
    setPenaltyMinutes(0);
  };

  const closeMiniGame = () => {
    setMiniGameTeam(null);
    setSelectedPoints(null);
    setPenaltyMinutes(0);
  };

  const triggerSuccess = (teamId: string, points: number) => {
    setSuccessId(teamId);
    setSuccessPoints(points);
    setShowSuccess(true);
    setTimeout(() => setSuccessId(null), 2500);
  };

  const handleApproveWithMiniGame = async () => {
    if (!miniGameTeam || selectedPoints === null) return;
    const { routeId, teamId } = miniGameTeam;
    setDialogBusy(true);
    setError(null);
    try {
      await approveTeam(routeId, teamId, undefined, selectedPoints, penaltyMinutes || undefined);
      triggerSuccess(teamId, 100 + selectedPoints);
      insertNotification({ team_id: teamId, type: "points", title: "Clue Completed! 🎯", message: `Your team earned ${100 + selectedPoints} points!`, points: 100 + selectedPoints }).catch(() => {});
      closeMiniGame();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setDialogBusy(false);
    }
  };

  const handleApproveSkip = async () => {
    if (!miniGameTeam) return;
    const { routeId, teamId } = miniGameTeam;
    setDialogBusy(true);
    setError(null);
    try {
      await approveTeam(routeId, teamId, undefined, undefined, penaltyMinutes || undefined);
      triggerSuccess(teamId, 100);
      insertNotification({ team_id: teamId, type: "points", title: "Clue Completed! 🎯", message: "Your team earned 100 points!", points: 100 }).catch(() => {});
      closeMiniGame();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setDialogBusy(false);
    }
  };

  if (!spotId) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <Backdrop />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-8">
          <p className="text-5xl">🔐</p>
          <p className="mt-4 font-display text-2xl font-extrabold" style={{ color: "var(--fg-muted)" }}>
            Not logged in
          </p>
        </div>
      </div>
    );
  }

  // Filter map teams to only those assigned to this spot
  const mapTeams = teamLocations.filter(t => arrivingIds.has(t.id));

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />

      <SuccessOverlay
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        pointsEarned={successPoints}
        title="APPROVED!"
        subtitle="Team awarded successfully"
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
          try { await confirmHandler(); } finally { setConfirmLoading(false); setConfirmDef(null); setConfirmHandler(null); }
        }}
        onCancel={() => { setConfirmDef(null); setConfirmHandler(null); }}
      />

      <BroadcastBanner broadcast={broadcast} />

      <div className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-8">
        <Logo className="h-10 w-10 sm:h-12 sm:w-12 drop-shadow-md" />
        <div className="flex items-center gap-2 sm:gap-3">
          {session?.role === "spot-leader" && (
            <span className="hidden sm:inline-block rounded-full bg-[var(--surface)] px-4 py-2 text-[13px] font-bold shadow-lg" style={{ color: "var(--fg-muted)" }}>
              📍 {session.spotName}
            </span>
          )}
          <button
            onClick={() => {
              setConfirmDef({ title: "Logout", message: "Are you sure you want to logout?" });
              setConfirmHandler(async () => { clearSession(); });
            }}
            className="ripple touch-press rounded-full px-4 sm:px-6 py-2 sm:py-2.5 text-[12px] sm:text-[14px] font-black uppercase tracking-wide transition-opacity hover:opacity-70 shadow-xl"
            style={{ color: "var(--fg-muted)", background: "var(--surface)" }}
          >
            🚪 Logout
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-20 pt-10 sm:pt-20">

        <Reveal duration={0.5}>
          <header className="mb-10 text-center">
            <h1 className="font-display text-[28px] sm:text-[32px] font-black" style={{ color: "var(--fg)" }}>
              {data?.spot.name ?? "Spot Leader"}
            </h1>
            <p className="mt-2 text-[13px] sm:text-[15px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--fg-muted)" }}>
              📍 {data?.spot.location_hint ?? ""}
            </p>
          </header>
        </Reveal>

        <AnimatePresence>
          {(justArrivedTeamIds.length > 0 || nearbyTeamIds.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-8 overflow-hidden rounded-[32px] border-4 p-6 shadow-xl"
              style={{
                background: justArrivedTeamIds.length > 0
                  ? "linear-gradient(135deg, var(--color-brand-green), #1a8a02)"
                  : "var(--color-brand-green)",
                borderColor: "var(--color-brand-green-dark)",
                color: "#fff",
              }}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl" style={{ animation: justArrivedTeamIds.length > 0 ? "bounce 0.6s infinite" : "none" }}>
                  {justArrivedTeamIds.length > 0 ? "🚨" : "⚡"}
                </span>
                <div>
                  <h3 className="text-[18px] font-black uppercase tracking-wide">
                    {justArrivedTeamIds.length > 0 ? "New Team Arrived!" : "Team Incoming!"}
                  </h3>
                  <p className="text-[14px] font-bold opacity-90">
                    {nearbyTeamIds.length} {nearbyTeamIds.length === 1 ? "team is" : "teams are"} within{" "}
                    {data?.spot?.radius_meters ?? 100}m of your spot.
                    {justArrivedTeamIds.length > 0 && (
                      <span className="block mt-1 text-[13px] font-black uppercase tracking-wide">
                        🔔 {justArrivedTeamIds.length} just arrived!
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-3xl px-6 py-4 text-center text-[15px] font-bold"
            style={{
              background: "rgba(255,75,75,0.1)",
              border: "2px solid rgba(255,75,75,0.3)",
              color: "var(--color-brand-red)",
            }}
            role="alert"
          >
            ⚠️ {error}
          </motion.div>
        )}

        <Reveal delay={0.08} duration={0.55}>
          <div className="card border-t-[8px] mb-8 p-6 sm:p-10" style={{ background: "var(--surface)", borderColor: "var(--color-brand-blue)" }}>
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
                data-sound="heavy"
                onClick={load}
                disabled={loading}
                className="btn-press ripple w-full sm:w-auto rounded-[20px] px-6 sm:px-8 py-3 sm:py-4 text-[14px] sm:text-[15px] font-black uppercase tracking-wide"
                style={{
                  background: "var(--surface)",
                  border: "3px solid var(--border-soft)",
                  color: "var(--fg-muted)",
                }}
              >
                {loading ? "⟳" : "🔄 Refresh"}
              </button>
            </div>
          </div>
        </Reveal>

        {/* Spot Map & Team Locations */}
        <Reveal delay={0.1} duration={0.5}>
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--fg-muted)" }}>
                📍 {data?.spot?.name ?? "Spot"} Location
              </p>
              <span className="text-[12px] font-bold" style={{ color: "var(--fg-muted)" }}>
                🟢 {mapTeams.filter(t => t.isActive && !t.isDisqualified).length} assigned teams active
                {data?.spot?.latitude && (
                  <span className="ml-3">
                    ⭕ {data?.spot?.radius_meters ?? 100}m radius
                  </span>
                )}
              </span>
            </div>
            <TeamMap teams={mapTeams} spots={data?.spot ? [data.spot] : []} height="360px" />
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
              <div className="card p-12 text-center" style={{ background: "var(--surface)" }}>
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
                    className="card border-t-[8px] p-5 sm:p-10 transition-all touch-press ripple"
                    style={{
                      background: successId === team.teamId
                        ? "linear-gradient(135deg, rgba(88,204,2,0.08), rgba(88,204,2,0.02))"
                        : "var(--surface)",
                      borderColor: successId === team.teamId
                        ? "var(--color-brand-green)"
                        : "var(--color-brand-gold)",
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
                                    ? "rgba(88,204,2,0.15)"
                                    : "rgba(255,200,0,0.15)",
                                color:
                                  team.status === "active"
                                    ? "var(--color-brand-green)"
                                    : "var(--color-brand-gold)",
                              }}
                            >
                              {team.status === "active" ? "🟢 Active" : "🟡 Pending"}
                            </span>
                            {(() => {
                              const loc = teamLocations.find(t => t.id === team.teamId);
                              return loc ? (
                                <span
                                  className="rounded-xl px-2 sm:px-3 py-1 text-[9px] sm:text-[11px] font-extrabold uppercase tracking-wide"
                                  style={{
                                    background: loc.isActive ? "rgba(88,204,2,0.15)" : "rgba(156,163,175,0.15)",
                                    color: loc.isActive ? "var(--color-brand-green)" : "var(--fg-muted)",
                                  }}
                                >
                                  {loc.isActive ? "🟢 Live" : "⚪ Offline"}
                                </span>
                              ) : null;
                            })()}
                          </div>
                        </div>

                        <p className="mt-3 text-[14px] sm:text-[15px] font-semibold leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                          {team.clueText.length > 120
                            ? team.clueText.slice(0, 120) + "…"
                            : team.clueText}
                        </p>

                        <p className="mt-3 flex items-center gap-2 text-[12px] sm:text-[13px] font-extrabold" style={{ color: "var(--fg-muted)" }}>
                          ⏱ Hunting for {team.timeElapsedMinutes}m
                        </p>

                        {team.fullRoute && team.fullRoute.length > 0 && (
                          <div className="mt-6 pt-6 border-t-[3px] border-dashed border-[var(--border-soft)]">
                            <p className="mb-4 text-[12px] sm:text-[13px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--fg-muted)" }}>
                              🗺 Route Journey
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {team.fullRoute.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  <span 
                                    className="rounded-full px-2.5 py-1.5 text-[10px] sm:text-[12px] font-black uppercase tracking-wide"
                                    style={{
                                      background: step.isCurrent 
                                        ? "var(--color-brand-blue)" 
                                        : step.status === "completed" || step.status === "solved" 
                                          ? "var(--color-brand-green)" 
                                          : "var(--border-soft)",
                                      color: step.isCurrent || step.status === "completed" || step.status === "solved" ? "#fff" : "var(--fg-muted)",
                                      opacity: step.status === "pending" && !step.isCurrent ? 0.6 : 1,
                                    }}
                                  >
                                    {step.isCurrent ? "📍" : step.status === "completed" || step.status === "solved" ? "✓" : "⏳"} {step.spotName}
                                  </span>
                                  {idx < team.fullRoute.length - 1 && (
                                    <span className="text-[var(--fg-muted)] opacity-50 font-bold text-xs">→</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <motion.button
                        data-sound="success"
                        whileTap={{ scale: 0.92 }}
                        onClick={() => openMiniGame(team)}
                        disabled={successId === team.teamId}
                        className="btn-press ripple w-full sm:w-auto shrink-0 rounded-[20px] sm:rounded-[24px] px-8 sm:px-10 py-3.5 sm:py-6 text-[15px] sm:text-[17px] font-black uppercase tracking-wide text-white transition-all"
                        style={{
                          background:
                            successId === team.teamId
                              ? "var(--color-brand-green)"
                              : "linear-gradient(135deg, var(--color-brand-blue), #1a6df0)",
                          boxShadow: successId === team.teamId
                            ? "0 8px 0 0 color-mix(in srgb, var(--color-brand-green) 60%, black)"
                            : "0 8px 0 0 #0f4a9e",
                          opacity: successId === team.teamId ? 0.7 : 1,
                          cursor: successId === team.teamId ? "not-allowed" : "pointer",
                        }}
                      >
                        {successId === team.teamId
                          ? "✅ Approved!"
                          : "✅ Approve"}
                      </motion.button>
                    </div>
                  </div>
                </Reveal>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <Reveal delay={0.2} duration={0.5}>
          <p className="mt-12 text-center text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            Treasure Hunt · University of Dhaka — CSE
          </p>
        </Reveal>
      </div>

      {/* Mini-Game Dialog — Gamified */}
      <AnimatePresence>
        {miniGameTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: "spring", stiffness: 250, damping: 22 }}
              className="card w-full max-w-md p-6 sm:p-10"
              style={{ background: "var(--surface)" }}
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
                className="mb-6 sm:mb-8 text-center text-[14px] sm:text-[15px] font-semibold"
                style={{ color: "var(--fg-muted)" }}
              >
                Approve team &amp; award points
              </motion.p>

              {/* Mini-Game Points */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="mb-3 text-[12px] sm:text-[14px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>
                  🎯 Play Mini-Game
                </p>
                <p className="mb-4 text-[13px] sm:text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>
                  Select bonus points (on top of +100):
                </p>
                <div className="mb-6 flex flex-wrap justify-center sm:justify-start gap-2">
                  {MINI_GAME_POINTS.map((p) => (
                    <motion.button
                      key={p}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedPoints(p)}
                      className="btn-press ripple rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 text-[14px] sm:text-[16px] font-extrabold transition-all"
                      style={{
                        background: selectedPoints === p ? "var(--color-brand-gold)" : "var(--border-soft)",
                        color: selectedPoints === p ? "#000" : "var(--fg-muted)",
                        boxShadow: selectedPoints === p ? "0 4px 0 0 rgba(200,150,0,0.5)" : "none",
                        transform: selectedPoints === p ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      +{p}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Penalty */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <p className="mb-3 text-[12px] sm:text-[14px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-red)" }}>
                  ⏳ Penalty (optional)
                </p>
                <div className="mb-8 flex items-center justify-center sm:justify-start gap-4">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setPenaltyMinutes(Math.max(0, penaltyMinutes - 1))}
                    className="btn-press ripple flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl text-[18px] sm:text-[22px] font-extrabold"
                    style={{ background: "var(--border-soft)", color: "var(--fg)" }}
                  >
                    −
                  </motion.button>
                  <span className="min-w-[4rem] sm:min-w-[5rem] text-center text-[28px] sm:text-[32px] font-extrabold tabular-nums" style={{ color: "var(--color-brand-red)" }}>
                    {penaltyMinutes}m
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setPenaltyMinutes(penaltyMinutes + 1)}
                    className="btn-press ripple flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl text-[18px] sm:text-[22px] font-extrabold"
                    style={{ background: "var(--border-soft)", color: "var(--fg)" }}
                  >
                    +
                  </motion.button>
                  {penaltyMinutes > 0 && (
                    <button
                      onClick={() => setPenaltyMinutes(0)}
                      className="btn-press ripple rounded-2xl px-3 py-1.5 text-[11px] sm:text-[12px] font-extrabold uppercase tracking-wide"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
              </motion.div>

              <div className="flex flex-col gap-3">
                <motion.button
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  data-sound="success"
                  onClick={handleApproveWithMiniGame}
                  disabled={selectedPoints === null || dialogBusy}
                  className="btn-press ripple w-full rounded-2xl px-8 py-3.5 sm:py-4 text-[15px] sm:text-[16px] font-extrabold uppercase tracking-wide text-white transition-all"
                  style={{
                    background: "var(--color-brand-gold)",
                    boxShadow: "0 6px 0 0 color-mix(in srgb, var(--color-brand-gold) 60%, black)",
                    opacity: selectedPoints === null || dialogBusy ? 0.4 : 1,
                    cursor: selectedPoints === null || dialogBusy ? "not-allowed" : "pointer",
                  }}
                >
                  {dialogBusy ? "⏳ Processing…" : `🎮 Approve with +${selectedPoints ?? 0} pts`}
                </motion.button>

                <motion.button
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  onClick={handleApproveSkip}
                  disabled={dialogBusy}
                  className="btn-press ripple w-full rounded-2xl px-8 py-3.5 sm:py-4 text-[15px] sm:text-[16px] font-extrabold uppercase tracking-wide text-white transition-all"
                  style={{
                    background: "var(--color-brand-green)",
                    boxShadow: "0 6px 0 0 color-mix(in srgb, var(--color-brand-green) 60%, black)",
                    opacity: dialogBusy ? 0.5 : 1,
                  }}
                >
                  {dialogBusy ? "⏳ Processing…" : "⏭ Skip Game · +100 pts"}
                </motion.button>

                <motion.button
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={closeMiniGame}
                  disabled={dialogBusy}
                  className="btn-press ripple w-full rounded-2xl px-8 py-3.5 sm:py-4 text-[14px] sm:text-[15px] font-extrabold uppercase tracking-wide transition-all"
                  style={{
                    background: "var(--surface)",
                    border: "3px solid var(--border-soft)",
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