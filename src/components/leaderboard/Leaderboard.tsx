import { motion } from "motion/react";
import { CountUp } from "@/components/CountUp";
import type { LeaderboardEntry } from "@/services/team";

interface Props {
  entries: LeaderboardEntry[];
  currentTeamName?: string;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export function Leaderboard({ entries, currentTeamName }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {entries.map((entry) => {
        const isCurrent = entry.name === currentTeamName;
        const medal = entry.rank <= 3 ? MEDAL[entry.rank - 1] : null;

        return (
          <motion.div
            key={entry.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: entry.rank * 0.05 }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
            style={{
              background: isCurrent ? "rgba(88,204,2,0.08)" : "transparent",
              border: isCurrent ? "1px solid rgba(88,204,2,0.2)" : "1px solid transparent",
            }}
          >
            <span className="w-6 text-center text-[13px] font-extrabold" style={{ color: "var(--fg-muted)" }}>
              {medal ?? entry.rank}
            </span>
            <span className="flex-1 text-[14px] font-bold truncate" style={{ color: isCurrent ? "var(--color-brand-green)" : "var(--fg)" }}>
              {entry.name}
            </span>
            <div className="flex items-center gap-3 text-[13px] font-extrabold tabular-nums">
              {entry.penalty > 0 && (
                <span style={{ color: "var(--color-brand-red)" }}>
                  -{entry.penalty}m
                </span>
              )}
              <CountUp to={entry.score} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
