import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CountUp } from "@/components/CountUp";
import type { LeaderboardEntry } from "@/services/team";

interface Props {
  entries: LeaderboardEntry[];
  currentTeamName?: string;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export function Leaderboard({ entries, currentTeamName }: Props) {
  const [open, setOpen] = useState(false);

  const rankColor = (rank: number) => {
    if (rank === 1) return "#eab308";
    if (rank === 2) return "#9ca3af";
    if (rank === 3) return "#d97706";
    return "#6b7280";
  };

  return (
    <>
      <div className="flex justify-center">
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl py-4 text-[15px] font-extrabold uppercase tracking-wide text-white transition-transform hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #58cc02, #1cb0f6)",
            boxShadow: "0 0 15px rgba(34,197,94,0.4)",
          }}
        >
          🏆 Open Live Standings
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md rounded-3xl border overflow-hidden"
              style={{
                background: "#140e24",
                borderColor: "rgba(55,65,81,1)",
                boxShadow: "0 0 40px rgba(20,14,36,0.9)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center justify-between p-6 border-b"
                style={{ background: "#0b0714", borderColor: "rgba(31,41,55,1)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg text-lg"
                    style={{
                      background: "rgba(234,179,8,0.2)",
                      color: "#eab308",
                      boxShadow: "0 0 10px rgba(234,179,8,0.3)",
                    }}
                  >
                    🏆
                  </div>
                  <h2 className="text-xl font-bold tracking-wide" style={{ color: "#f3f4f6" }}>
                    Live Standings
                  </h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-full transition-colors"
                  style={{ color: "#6b7280", background: "rgba(31,41,55,0.5)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div
                className="p-6 flex flex-col gap-3 max-h-[60vh] overflow-y-auto"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#eab308 transparent" }}
              >
                {entries.map((entry) => {
                  const isCurrent = entry.name === currentTeamName;
                  const medal = entry.rank <= 3 ? MEDAL[entry.rank - 1] : null;

                  return (
                    <motion.div
                      key={entry.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: entry.rank * 0.03 }}
                      className="flex items-center justify-between p-4 rounded-xl border relative overflow-hidden"
                      style={{
                        background: isCurrent
                          ? "rgba(34,197,94,0.1)"
                          : "#1a132f",
                        borderColor: isCurrent
                          ? "rgba(34,197,94,0.5)"
                          : "rgba(75,85,99,0.3)",
                        boxShadow: isCurrent
                          ? "0 0 15px rgba(34,197,94,0.15)"
                          : "none",
                      }}
                    >
                      {isCurrent && (
                        <div
                          className="absolute left-0 top-0 w-1 h-full"
                          style={{
                            background: "#22c55e",
                            boxShadow: "0 0 8px rgba(34,197,94,1)",
                          }}
                        />
                      )}

                      <div className="flex items-center gap-4" style={{ paddingLeft: isCurrent ? "0.5rem" : "0" }}>
                        <span
                          className="w-6 text-center text-lg font-extrabold"
                          style={{ color: rankColor(entry.rank) }}
                        >
                          {medal ?? entry.rank}
                        </span>
                        <div>
                          <p
                            className="font-bold text-sm"
                            style={{ color: isCurrent ? "#22c55e" : "#f3f4f6" }}
                          >
                            {entry.name}
                            {isCurrent ? " (You)" : ""}
                          </p>
                          <p
                            className="text-[11px] uppercase tracking-wider font-semibold"
                            style={{ color: "rgba(255,255,255,0.38)" }}
                          >
                            <CountUp to={entry.score} /> pts
                            {entry.penalty > 0 ? ` · -${entry.penalty}m` : ""}
                          </p>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span
                          className="text-[10px] px-2 py-1 rounded font-bold uppercase"
                          style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e" }}
                        >
                          Rising
                        </span>
                      ) : medal ? (
                        <span style={{ fontSize: "0.875rem" }}>{medal}</span>
                      ) : null}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
