import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Reveal, WordReveal } from "./Reveal";
import { CountUp } from "./CountUp";
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


  /* ─── Initial fetch + realtime subscription ──────────────── */
  /* Hardcoded locked state for now */
  useEffect(() => {
    setConfig({
      id: "hardcoded",
      event_name: "Treasure Hunt 2026",
      clue_time_limit_minutes: 1,
      points_per_clue: 100,
      max_mini_game_points: 60,
      hunt_started: false,
      hunt_started_at: "2026-05-16T07:30:00+06:00",
      event_start_time: null,
      created_at: null
    });
    setTeams([]);
  }, []);


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
