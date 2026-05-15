import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { insforge } from "@/lib/insforge";

interface Solver {
  nickname: string;
  created_at: string;
}

export function GlobalRiddleLeaderboard() {
  const [solvers, setSolvers] = useState<Solver[]>([]);

  useEffect(() => {
    async function fetchSolvers() {
      const { data, error } = await insforge.database
        .from("mini_game_scores")
        .select("nickname, created_at")
        .eq("score", 0)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSolvers(data as unknown as Solver[]);
      }
    }
    fetchSolvers();
    const interval = setInterval(fetchSolvers, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 border-2 sm:border-4 border-[var(--border-soft)] shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="font-display text-lg sm:text-xl font-black dark:text-white">Riddle Board</h3>
        <span className="text-[10px] font-bold text-[var(--color-brand-green)] bg-[var(--color-brand-green)]/10 px-2 py-0.5 rounded">GLOBAL</span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        <p className="text-[11px] font-semibold mb-3" style={{ color: "#999" }}>
          🧩 Puzzle Solvers
        </p>
        {solvers.length > 0 ? (
          solvers.map((s, idx) => (
            <motion.div
              key={`${s.nickname}-${s.created_at}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="flex items-center gap-2 p-2.5 rounded-xl"
              style={{
                background: idx === 0 ? "rgba(255,200,0,0.08)" : "#F7F7F7",
                border: idx === 0 ? "1px solid rgba(255,200,0,0.2)" : "1px solid transparent",
              }}
            >
              <span className="text-sm shrink-0">
                {idx === 0 ? "👑" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
              </span>
              <span className="text-[13px] font-bold truncate" style={{ color: "#2B2B2B" }}>{s.nickname}</span>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-3xl mb-3">🔐</p>
            <p className="text-[13px] font-bold" style={{ color: "#999" }}>Solve the puzzle to secure ur name in the board</p>
          </div>
        )}
      </div>
    </div>
  );
}
