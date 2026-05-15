import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Backdrop } from "@/components/Backdrop";
import { Logo } from "@/components/Logo";
import { Confetti } from "@/components/Confetti";
import { CountUp } from "@/components/CountUp";
import { insforge } from "@/lib/insforge";
import type { Team } from "@/types";

const MEDAL = ["🥇", "🥈", "🥉"];
const PODIUM_HEIGHTS = ["h-48", "h-32", "h-24"];

export default function ResultsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insforge.database.from("teams")
      .select("*")
      .order("total_points", { ascending: false })
      .order("total_penalty_seconds", { ascending: true })
      .then(({ data, error }) => {
        if (!error) setTeams((data ?? []) as Team[]);
        setLoading(false);
      });
  }, []);

  const top3 = teams.slice(0, 3);
  const rest = teams.slice(3);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />
      <Confetti active={!loading && teams.length > 0} />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-20">
        <div className="mb-12 text-center">
          <Logo className="mx-auto h-16 w-16 drop-shadow-lg" />
          <motion.h1
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-3 font-display text-[36px] font-extrabold"
            style={{ color: "var(--fg)" }}
          >
            🏆 Final Results
          </motion.h1>
          <p className="mt-1 text-[14px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--fg-muted)" }}>
            Treasure Hunt · DU CSE 2026
          </p>
        </div>

        {loading && (
          <div className="py-20 text-center">
            <motion.p animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-6xl">
              🏆
            </motion.p>
            <p className="mt-4 text-[18px] font-bold" style={{ color: "var(--fg-muted)" }}>
              Loading results…
            </p>
          </div>
        )}

        {!loading && teams.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-6xl">🔍</p>
            <p className="mt-4 text-[20px] font-bold" style={{ color: "var(--fg-muted)" }}>
              No results yet. The hunt is still ongoing!
            </p>
          </div>
        )}

        {top3.length === 3 && (
          <div className="mb-16 flex items-end justify-center gap-6">
            {[1, 0, 2].map((idx) => {
              const t = top3[idx];
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.2, type: "spring", stiffness: 150 }}
                  className="flex flex-col items-center gap-3"
                >
                  <motion.span
                    initial={{ rotate: -20, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.3 + idx * 0.2, type: "spring", stiffness: 200 }}
                    className="text-5xl"
                  >
                    {MEDAL[idx]}
                  </motion.span>
                  <span className="text-[16px] font-extrabold text-center max-w-[120px] truncate" style={{ color: "var(--fg)" }}>
                    {t.name}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: PODIUM_HEIGHTS[idx].replace("h-", "") + "rem" }}
                    className={`w-28 rounded-t-3xl flex items-center justify-center`}
                    style={{
                      height: idx === 0 ? "12rem" : idx === 1 ? "8rem" : "6rem",
                      background: idx === 0
                        ? "linear-gradient(180deg, var(--color-brand-gold), rgba(255,200,0,0.2))"
                        : "var(--surface)",
                      border: `3px solid ${idx === 0 ? "var(--color-brand-gold)" : "var(--border-soft)"}`,
                    }}
                  >
                    <span className="text-[28px] font-extrabold tabular-nums" style={{ color: idx === 0 ? "#000" : "var(--fg)" }}>
                      <CountUp to={t.total_points ?? 0} />
                    </span>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {rest.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="card flex items-center gap-5 px-6 py-4"
              style={{ background: "var(--surface)" }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-extrabold"
                style={{ background: "var(--border-soft)", color: "var(--fg-muted)" }}>
                {i + 4}
              </span>
              <span className="flex-1 text-[16px] font-bold truncate" style={{ color: "var(--fg)" }}>
                {t.name}
              </span>
              {t.total_penalty_seconds != null && t.total_penalty_seconds > 0 && (
                <span className="rounded-xl px-3 py-1 text-[12px] font-extrabold"
                  style={{ background: "rgba(255,75,75,0.1)", color: "var(--color-brand-red)" }}>
                  -{Math.round(t.total_penalty_seconds / 60)}m
                </span>
              )}
              <span className="text-[20px] font-extrabold tabular-nums" style={{ color: "var(--color-brand-green)" }}>
                <CountUp to={t.total_points ?? 0} />
              </span>
            </motion.div>
          ))}
        </div>

        <p className="mt-12 text-center text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
          University of Dhaka — Department of CSE
        </p>
      </div>
    </div>
  );
}