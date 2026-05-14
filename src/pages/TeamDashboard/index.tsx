import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Backdrop } from "@/components/Backdrop";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Reveal } from "@/components/Reveal";
import { CountdownTimer } from "@/components/timer/CountdownTimer";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { useSession } from "@/store/authStore";
import {
  fetchDashboardData,
  fetchLeaderboard,
  revealAnswer,
  keepSearching,
} from "@/services/team";
import type { DashboardData, LeaderboardEntry } from "@/services/team";

export default function TeamDashboardPage() {
  const session = useSession();
  const teamId = session?.role === "team" ? session.teamId : null;

  const [data, setData] = useState<DashboardData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTimeout, setShowTimeout] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [d, lb] = await Promise.all([
        fetchDashboardData(teamId),
        fetchLeaderboard(),
      ]);
      setData(d);
      setLeaderboard(lb);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { void load(); }, [load]);

  const handleTimeout = useCallback(() => {
    if (data?.currentRoute?.status === "active" || data?.currentRoute?.status === "pending") {
      setShowTimeout(true);
    }
  }, [data]);

  const handleReveal = async () => {
    if (!data?.currentRoute || !teamId) return;
    setBusy(true);
    try {
      await revealAnswer(data.currentRoute.id, teamId);
      setShowTimeout(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reveal answer");
    } finally {
      setBusy(false);
    }
  };

  const handleKeepSearching = async () => {
    if (!data?.currentRoute) return;
    setBusy(true);
    try {
      await keepSearching(data.currentRoute.id);
      setShowTimeout(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (!teamId) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <Backdrop />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
          <p className="font-display text-xl font-extrabold" style={{ color: "var(--fg-muted)" }}>
            Not logged in
          </p>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <Backdrop />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
          <p className="font-display text-xl font-extrabold" style={{ color: "var(--fg-muted)" }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  const progress = data ? Math.round((data.completedClues / data.totalClues) * 100) : 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />

      {session?.role === "team" && (
        <div className="absolute right-4 top-4 z-20 flex items-center gap-3">
          <span className="text-[12px] font-bold" style={{ color: "var(--fg-muted)" }}>
            {session.participantName}
          </span>
          <ThemeToggle />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-20">
        {error && (
          <div
            className="mb-6 rounded-2xl px-5 py-3 text-center text-[13px] font-bold"
            style={{
              background: "rgba(255,75,75,0.08)",
              border: "1px solid rgba(255,75,75,0.25)",
              color: "var(--color-brand-red)",
            }}
            role="alert"
          >
            {error}
            <button onClick={load} className="ml-3 underline">
              Retry
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Header */}
            <Reveal duration={0.5}>
              <header className="mb-8 text-center">
                <div className="flex items-center justify-center gap-3">
                  <Logo className="h-9 w-9 drop-shadow-lg" />
                  <div>
                    <h1 className="font-display text-[22px] font-extrabold leading-none" style={{ color: "var(--fg)" }}>
                      {data.team.name}
                    </h1>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--fg-muted)" }}>
                      Clue {data.completedClues + 1} of {data.totalClues}
                    </p>
                  </div>
                </div>
              </header>
            </Reveal>

            <div className="grid gap-6 lg:grid-cols-3">

              {/* Main column — Clue + Timer */}
              <div className="flex flex-col gap-6 lg:col-span-2">

                {/* Timer */}
                <Reveal delay={0.06} duration={0.5}>
                  <div className="card p-6 text-center" style={{ background: "var(--surface)" }}>
                    <CountdownTimer
                      startedAt={data.currentRoute?.clue_started_at ?? null}
                      timeLimitMinutes={data.eventConfig?.clue_time_limit_minutes ?? 40}
                      onTimeout={handleTimeout}
                      paused={showTimeout}
                    />
                    {data.currentRoute?.status === "completed" && (
                      <motion.p
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="mt-2 text-[18px] font-extrabold"
                        style={{ color: "var(--color-brand-green)" }}
                      >
                        Completed! +{data.eventConfig?.points_per_clue ?? 100} pts
                      </motion.p>
                    )}
                  </div>
                </Reveal>

                {/* Clue Card */}
                <Reveal delay={0.1} duration={0.55}>
                  <div className="card p-6" style={{ background: "var(--surface)" }}>
                    {data.clueDefinition && data.spot ? (
                      <>
                        <div className="mb-3 flex items-center gap-2">
                          <span
                            className="rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide"
                            style={{
                              background: "rgba(28,176,246,0.12)",
                              color: "var(--color-brand-blue)",
                            }}
                          >
                            {data.spot.name}
                          </span>
                          {data.clueDefinition.difficulty && (
                            <span
                              className="rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide"
                              style={{
                                background: "rgba(255,200,0,0.12)",
                                color: "var(--color-brand-gold)",
                              }}
                            >
                              {data.clueDefinition.difficulty}
                            </span>
                          )}
                        </div>
                        <p className="text-[18px] font-bold leading-relaxed" style={{ color: "var(--fg)" }}>
                          {data.clueDefinition.clue_text}
                        </p>
                        {data.spot.location_hint && (
                          <p className="mt-3 text-[13px] font-semibold italic" style={{ color: "var(--fg-muted)" }}>
                            📍 {data.spot.location_hint}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-center text-[16px] font-bold" style={{ color: "var(--fg-muted)" }}>
                        {data.totalClues === 0
                          ? "No clues assigned yet. Check back later."
                          : data.currentRoute === null
                          ? "All clues completed! Amazing!"
                          : "Loading clue…"}
                      </p>
                    )}
                  </div>
                </Reveal>

                {/* Score + Progress */}
                <Reveal delay={0.14} duration={0.5}>
                  <div className="card p-6" style={{ background: "var(--surface)" }}>
                    <h3 className="mb-3 text-[12px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--fg-muted)" }}>
                      Progress
                    </h3>
                    <div className="mb-3 flex items-baseline gap-2">
                      <span className="text-[32px] font-extrabold leading-none" style={{ color: "var(--color-brand-green)" }}>
                        {data.team.total_points ?? 0}
                      </span>
                      <span className="text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
                        points
                      </span>
                    </div>
                    <div
                      className="h-3 w-full overflow-hidden rounded-full"
                      style={{ background: "var(--border-soft)" }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ background: "var(--color-brand-green)" }}
                      />
                    </div>
                    <p className="mt-1.5 text-[12px] font-semibold text-right" style={{ color: "var(--fg-muted)" }}>
                      {data.completedClues} / {data.totalClues} clues
                    </p>
                  </div>
                </Reveal>

              </div>

              {/* Sidebar — Leaderboard */}
              <Reveal delay={0.12} duration={0.55}>
                <div className="card p-6 lg:sticky lg:top-24 lg:self-start" style={{ background: "var(--surface)" }}>
                  <h3 className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>
                    Leaderboard
                  </h3>
                  <Leaderboard entries={leaderboard} currentTeamName={data.team.name} />
                </div>
              </Reveal>

            </div>
          </>
        )}

        <Reveal delay={0.2} duration={0.5}>
          <p className="mt-10 text-center text-[12px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            Treasure Hunt · University of Dhaka — CSE
          </p>
        </Reveal>
      </div>

      {/* Timeout Modal */}
      <AnimatePresence>
        {showTimeout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="card w-full max-w-sm p-8 text-center"
              style={{ background: "var(--surface)" }}
            >
              <p className="mb-1 text-4xl">⏰</p>
              <h2 className="mb-1 text-[22px] font-extrabold" style={{ color: "var(--fg)" }}>
                Time's Up!
              </h2>
              <p className="mb-6 text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
                You didn't solve the clue in time. What now?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleReveal}
                  disabled={busy}
                  className="btn-press w-full rounded-xl px-5 py-3 text-[14px] font-extrabold uppercase tracking-wide transition-all"
                  style={{
                    background: "var(--surface)",
                    border: "2px solid var(--color-brand-red)",
                    color: "var(--color-brand-red)",
                    opacity: busy ? 0.5 : 1,
                  }}
                >
                  {busy ? "Processing…" : "Reveal Answer · 0 pts"}
                </button>
                <button
                  onClick={handleKeepSearching}
                  disabled={busy}
                  className="btn-press w-full rounded-xl px-5 py-3 text-[14px] font-extrabold uppercase tracking-wide text-white transition-all"
                  style={{
                    background: "var(--color-brand-green)",
                    boxShadow: "0 4px 0 0 color-mix(in srgb, var(--color-brand-green) 60%, black)",
                    opacity: busy ? 0.5 : 1,
                  }}
                >
                  {busy ? "Processing…" : "Keep Searching · Still eligible for +100"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
