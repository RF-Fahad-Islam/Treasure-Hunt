import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { Backdrop } from "@/components/Backdrop";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Reveal } from "@/components/Reveal";
import { SuccessOverlay } from "@/components/SuccessOverlay";
import { ExpiredOverlay } from "@/components/ExpiredOverlay";
import { CountdownTimer } from "@/components/timer/CountdownTimer";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { useSession } from "@/store/authStore";
import {
  fetchDashboardData,
  fetchLeaderboard,
  revealAnswer,
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPoints, setSuccessPoints] = useState(0);
  const [successRank, setSuccessRank] = useState<number | undefined>(undefined);
  const prevCompletedRef = useRef(0);
  const prevPointsRef = useRef(0);

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

  useEffect(() => {
    const interval = setInterval(() => {
      if (teamId) {
        fetchLeaderboard()
          .then(setLeaderboard)
          .catch(() => {});
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [teamId]);

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
  }, [data]);

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

  if (!teamId) {
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

  if (loading && !data) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <Backdrop />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
          <motion.p
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-5xl"
          >
            🔍
          </motion.p>
          <p className="mt-4 font-display text-xl font-extrabold" style={{ color: "var(--fg-muted)" }}>
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

      <SuccessOverlay
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        pointsEarned={successPoints}
        newRank={successRank}
      />

      <ExpiredOverlay
        open={showTimeout}
        onContinue={handleReveal}
        autoContinueSec={5}
      />

      {session?.role === "team" && (
        <div className="absolute right-4 top-4 z-20 flex items-center gap-3">
          <span className="rounded-full bg-[var(--surface)] px-4 py-2 text-[13px] font-bold shadow-lg" style={{ color: "var(--fg-muted)" }}>
            🏃 {session.participantName}
          </span>
          <ThemeToggle />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-20">
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
            <button onClick={load} className="ml-3 underline font-extrabold">
              Retry
            </button>
          </motion.div>
        )}

        {data && (
          <>
            <Reveal duration={0.5}>
              <header className="mb-10 text-center">
                <div className="flex items-center justify-center gap-4">
                  <Logo className="h-12 w-12 drop-shadow-lg" />
                  <div>
                    <h1 className="font-display text-[28px] font-extrabold leading-none" style={{ color: "var(--fg)" }}>
                      {data.team.name}
                    </h1>
                    <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--fg-muted)" }}>
                      🎯 Clue {data.completedClues + 1} of {data.totalClues}
                    </p>
                  </div>
                </div>
              </header>
            </Reveal>

            <div className="grid gap-8 lg:grid-cols-3">

              <div className="flex flex-col gap-8 lg:col-span-2">

                <Reveal delay={0.06} duration={0.5}>
                  <div className="card p-8 text-center" style={{ background: "var(--surface)" }}>
                    <CountdownTimer
                      startedAt={data.currentRoute?.clue_started_at ?? null}
                      timeLimitMinutes={data.eventConfig?.clue_time_limit_minutes ?? 40}
                      onTimeout={handleTimeout}
                      paused={showTimeout}
                    />
                  </div>
                </Reveal>

                <Reveal delay={0.1} duration={0.55}>
                  <div className="card p-8" style={{ background: "var(--surface)" }}>
                    {data.clueDefinition && data.spot ? (
                      <>
                        <div className="mb-4 flex items-center gap-3">
                          <span className="rounded-xl px-4 py-1.5 text-[12px] font-extrabold uppercase tracking-wide"
                            style={{
                              background: "rgba(28,176,246,0.12)",
                              color: "var(--color-brand-blue)",
                            }}
                          >
                            📍 {data.spot.name}
                          </span>
                          {data.clueDefinition.difficulty && (
                            <span className="rounded-xl px-4 py-1.5 text-[12px] font-extrabold uppercase tracking-wide"
                              style={{
                                background: data.clueDefinition.difficulty === "hard"
                                  ? "rgba(255,75,75,0.12)"
                                  : "rgba(255,200,0,0.12)",
                                color: data.clueDefinition.difficulty === "hard"
                                  ? "var(--color-brand-red)"
                                  : "var(--color-brand-gold)",
                              }}
                            >
                              {data.clueDefinition.difficulty === "hard" ? "🔥 Hard" : data.clueDefinition.difficulty === "easy" ? "🌱 Easy" : "⭐ Medium"}
                            </span>
                          )}
                        </div>
                        {data.clueDefinition.image_url && (
                          <img
                            src={data.clueDefinition.image_url}
                            alt="Clue visual"
                            className="mb-4 w-full rounded-2xl object-cover shadow-lg"
                            style={{ maxHeight: 300 }}
                          />
                        )}
                        <p className="text-[22px] font-bold leading-relaxed" style={{ color: "var(--fg)" }}>
                          {data.clueDefinition.clue_text}
                        </p>
                        {data.spot.location_hint && (
                          <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mt-4 rounded-2xl px-5 py-3 text-[15px] font-bold italic"
                            style={{
                              background: "rgba(28,176,246,0.08)",
                              border: "1px solid rgba(28,176,246,0.2)",
                              color: "var(--color-brand-blue)",
                            }}
                          >
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
                          {data.totalClues === 0
                            ? "No clues assigned yet. Check back later."
                            : data.currentRoute === null
                            ? "All clues completed! Amazing!"
                            : "Loading clue…"}
                        </p>
                      </div>
                    )}
                  </div>
                </Reveal>

                <Reveal delay={0.14} duration={0.5}>
                  <div className="card p-8" style={{ background: "var(--surface)" }}>
                    <h3 className="mb-4 text-[14px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--fg-muted)" }}>
                      📊 Progress
                    </h3>
                    <div className="mb-4 flex items-baseline gap-3">
                      <span className="text-[42px] font-extrabold leading-none tabular-nums" style={{ color: "var(--color-brand-green)" }}>
                        <motion.span
                          key={data.team.total_points ?? 0}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          {data.team.total_points ?? 0}
                        </motion.span>
                      </span>
                      <span className="text-[16px] font-bold" style={{ color: "var(--fg-muted)" }}>
                        points
                      </span>
                    </div>
                    <div className="h-4 w-full overflow-hidden rounded-full" style={{ background: "var(--border-soft)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ background: progress === 100 ? "var(--color-brand-gold)" : "var(--color-brand-green)" }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[13px] font-bold" style={{ color: "var(--fg-muted)" }}>
                        {data.completedClues} / {data.totalClues} clues
                      </p>
                      {progress === 100 && (
                        <motion.p
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-[13px] font-extrabold"
                          style={{ color: "var(--color-brand-gold)" }}
                        >
                          🏆 Complete!
                        </motion.p>
                      )}
                    </div>
                  </div>
                </Reveal>

              </div>

              <Reveal delay={0.12} duration={0.55}>
                <div className="lg:sticky lg:top-24 lg:self-start">
                  <Leaderboard entries={leaderboard} currentTeamName={data.team.name} />
                </div>
              </Reveal>

            </div>
          </>
        )}

        <Reveal delay={0.2} duration={0.5}>
          <p className="mt-12 text-center text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            Treasure Hunt · University of Dhaka — CSE
          </p>
        </Reveal>
      </div>
    </div>
  );
}