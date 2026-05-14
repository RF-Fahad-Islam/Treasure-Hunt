import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Reveal, WordReveal } from "./Reveal";
import { CountUp } from "./CountUp";
import { insforge } from "@/lib/insforge";
import type { EventConfig } from "@/types";

interface TeamRow {
  id: string;
  name: string;
  score: number;
  penalty: number;
  rank: number;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export function LiveLeaderboard() {
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const teamsRef = useRef<TeamRow[]>([]);

  const deriveRanks = useCallback((rows: TeamRow[]): TeamRow[] =>
    [...rows]
      .sort((a, b) => b.score - a.score || a.penalty - b.penalty)
      .map((t, i) => ({ ...t, rank: i + 1 })), []);

  const handleTeamUpdate = useCallback((payload: any) => {
    const { id, name, total_points, total_penalty_seconds } = payload;
    setTeams((prev) => {
      const next = [...prev];
      const idx = next.findIndex((t) => t.id === id);
      const row: TeamRow = {
        id,
        name,
        score: total_points ?? 0,
        penalty: total_penalty_seconds ?? 0,
        rank: 0,
      };
      if (idx >= 0) {
        next[idx] = row;
      } else {
        next.push(row);
      }
      return deriveRanks(next);
    });
  }, [deriveRanks]);

  /* ─── Initial fetch + realtime subscription ──────────────── */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      /* Fetch event config + initial leaderboard in parallel */
      const [configResult, teamsResult] = await Promise.all([
        insforge.database.from("event_config").select("*").limit(1).single(),
        insforge.database
          .from("teams")
          .select("*")
          .order("total_points", { ascending: false })
          .order("total_penalty_seconds", { ascending: true }),
      ]);

      if (cancelled) return;

      if (!configResult.error && configResult.data) {
        setConfig(configResult.data as EventConfig);
      } else {
        setError("Could not load event config");
      }

      if (!teamsResult.error && teamsResult.data) {
        const rows: TeamRow[] = (teamsResult.data as any[]).map((t) => ({
          id: t.id,
          name: t.name,
          score: t.total_points ?? 0,
          penalty: t.total_penalty_seconds ?? 0,
          rank: 0,
        }));
        const ranked = deriveRanks(rows);
        teamsRef.current = ranked;
        setTeams(ranked);
      }

      /* Connect realtime + subscribe to leaderboard channel */
      try {
        await insforge.realtime.connect();
        const sub = await insforge.realtime.subscribe("leaderboard");
        if (!cancelled && sub.ok) {
          insforge.realtime.on("team_updated", handleTeamUpdate);
        }
      } catch {
        /* realtime is best-effort — stale data still shown */
      }
    }

    init();

    return () => {
      cancelled = true;
      insforge.realtime.off("team_updated", handleTeamUpdate);
      insforge.realtime.unsubscribe("leaderboard");
      insforge.realtime.disconnect();
    };
  }, [handleTeamUpdate, deriveRanks]);

  /* ─── Countdown till hunt starts ─────────────────────────── */
  useEffect(() => {
    if (!config || config.hunt_started) return;
    if (!config.hunt_started_at) return;

    const tick = () => {
      const now = Date.now();
      const target = new Date(config.hunt_started_at!).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setCountdown("00:00:00");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [config]);

  const isLocked = !config?.hunt_started;

  const lockVariants = {
    hidden: { scale: 0.85, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="relative px-5 py-24 sm:px-8 sm:py-32" id="leaderboard">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <Reveal
            duration={0.6}
            className="inline-block rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em]"
            style={{
              background: "rgba(255,200,0,0.12)",
              color: "var(--color-brand-gold)",
            }}
          >
            {isLocked ? "Coming Soon" : "Live"}
          </Reveal>
          <h2 className="mt-4 font-display text-[clamp(2rem,7vw,3.25rem)] font-extrabold leading-tight tracking-tight">
            <WordReveal text={isLocked ? "Leaderboard" : "Live Standings"} />{" "}
            <WordReveal text="🏆" className="gradient-text" delay={0.2} />
          </h2>
        </div>

        {error && (
          <p className="mt-8 text-center text-[15px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            {error}
          </p>
        )}

        {isLocked ? (
          <>
            <motion.div
              variants={lockVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative mt-12 overflow-hidden rounded-[32px] border-2 p-12 text-center"
              style={{
                borderColor: "rgba(255,200,0,0.2)",
                background: "var(--surface)",
              }}
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="mb-4 text-6xl"
              >
                🔒
              </motion.div>

              <h3 className="font-display text-[28px] font-extrabold" style={{ color: "var(--fg)" }}>
                Leaderboard Locked
              </h3>
              <p className="mt-2 text-[15px] font-semibold" style={{ color: "var(--fg-muted)" }}>
                {config?.hunt_started_at
                  ? "The hunt hasn't started yet. Check back when the event begins!"
                  : "The start time hasn't been set yet."}
              </p>

              {config?.hunt_started_at && (
                <div className="mt-8">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: "var(--fg-muted)" }}>
                    Starts in
                  </p>
                  <motion.p
                    key={countdown}
                    initial={{ scale: 1.1, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-2 font-display text-[56px] font-black tabular-nums leading-none tracking-tight sm:text-[64px]"
                    style={{ color: "var(--color-brand-gold)" }}
                  >
                    {countdown || "--:--:--"}
                  </motion.p>
                </div>
              )}

              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 0%, rgba(255,200,0,0.06) 0%, transparent 60%)",
                }}
              />
            </motion.div>
          </>
        ) : (
          <div className="mt-12 flex flex-col gap-3">
            {teams.length === 0 && (
              <div className="py-12 text-center">
                <motion.p
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-5xl"
                >
                  🏆
                </motion.p>
                <p className="mt-4 text-[16px] font-bold" style={{ color: "var(--fg-muted)" }}>
                  No teams yet
                </p>
              </div>
            )}
            {teams.map((t) => {
              const medal = t.rank <= 3 ? MEDAL[t.rank - 1] : null;
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: t.rank * 0.04 }}
                  className="flex items-center gap-4 rounded-2xl px-5 py-4"
                  style={{ background: "var(--surface)" }}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-extrabold"
                    style={{ background: "var(--border-soft)", color: "var(--fg-muted)" }}
                  >
                    {medal ?? t.rank}
                  </span>
                  <span className="flex-1 text-[15px] font-bold truncate" style={{ color: "var(--fg)" }}>
                    {t.name}
                  </span>
                  {t.penalty > 0 && (
                    <span className="text-[12px] font-extrabold" style={{ color: "var(--color-brand-red)" }}>
                      -{Math.round(t.penalty / 60)}m
                    </span>
                  )}
                  <span className="text-[20px] font-extrabold tabular-nums" style={{ color: "var(--color-brand-green)" }}>
                    <CountUp to={t.score} />
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
