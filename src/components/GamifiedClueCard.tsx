import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CountdownTimer as ClueTimer } from "@/components/timer/CountdownTimer";
import type { ClueDefinition, Spot } from "@/types";

interface Props {
  clueDefinition: ClueDefinition | null;
  spot: Spot | null;
  completedClues: number;
  totalClues: number;
  streak: number;
  clueStartedAt: string | null;
  timeLimitMinutes: number;
  onTimeout: () => void;
  showTimeout: boolean;
}

export function GamifiedClueCard({
  clueDefinition, spot, completedClues, totalClues,
  streak, clueStartedAt, timeLimitMinutes, onTimeout, showTimeout,
}: Props) {
  const [hintRevealed, setHintRevealed] = useState(false);

  const progress = totalClues > 0 ? (completedClues / totalClues) * 100 : 0;

  const difficultyColor =
    clueDefinition?.difficulty === "hard" ? "var(--color-brand-red)" :
    clueDefinition?.difficulty === "easy" ? "var(--color-brand-green)" :
    "var(--color-brand-gold)";

  const difficultyLabel =
    clueDefinition?.difficulty === "hard" ? "🔥 Hard" :
    clueDefinition?.difficulty === "easy" ? "🌱 Easy" :
    "⭐ Medium";

  if (!clueDefinition || !spot) {
    return (
      <div className="card border-t-[8px] p-10 text-center" style={{ background: "var(--surface)", borderColor: "var(--color-brand-blue)" }}>
        <div className="py-8 text-center">
          <p className="text-5xl mb-4">
            {totalClues === 0 ? "🕐" : "🏆"}
          </p>
          <p className="text-[20px] font-bold" style={{ color: "var(--fg-muted)" }}>
            {totalClues === 0 ? "No clues assigned yet." : "All clues completed! Amazing!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-t-[8px] overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--color-brand-green)" }}>
      {/* Progress bar */}
      <div className="h-2 bg-white/5 relative overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: "linear-gradient(90deg, var(--color-brand-green), var(--color-brand-blue))" }}
        />
      </div>

      <div className="p-6 sm:p-8">
        {/* Header: progress + streak */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-black uppercase tracking-[0.12em]" style={{ color: "var(--fg-muted)" }}>
              Clue {completedClues + 1} of {totalClues}
            </span>
          </div>
          {streak > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ background: "rgba(255,200,0,0.12)" }}
            >
              <span className="text-[15px]">🔥</span>
              <span className="text-[12px] font-extrabold" style={{ color: "var(--color-brand-gold)" }}>x{streak}</span>
            </motion.div>
          )}
        </div>

        {/* Timer */}
        <div className="mb-5">
          <ClueTimer
            startedAt={clueStartedAt}
            timeLimitMinutes={timeLimitMinutes}
            onTimeout={onTimeout}
            paused={showTimeout}
          />
        </div>

        {/* Spot + Difficulty badges */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="rounded-xl px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wide"
            style={{ background: "rgba(28,176,246,0.12)", color: "var(--color-brand-blue)" }}>
            📍 {spot.name}
          </span>
          <span className="rounded-xl px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wide"
            style={{
              background: `color-mix(in srgb, ${difficultyColor} 15%, transparent)`,
              color: difficultyColor,
              boxShadow: `0 0 12px color-mix(in srgb, ${difficultyColor} 20%, transparent)`,
            }}>
            {difficultyLabel}
          </span>
        </div>

        {/* Clue image */}
        {clueDefinition.image_url && (
          <motion.img
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            src={clueDefinition.image_url} alt="Clue visual"
            className="mb-4 w-full rounded-2xl object-cover shadow-lg" style={{ maxHeight: 280 }} />
        )}

        {/* Clue text */}
        <motion.p
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[22px] sm:text-[26px] font-black leading-relaxed" style={{ color: "var(--fg)" }}>
          {clueDefinition.clue_text}
        </motion.p>

        {/* Hint reveal */}
        {spot.location_hint && !hintRevealed && (
          <button
            onClick={() => setHintRevealed(true)}
            className="mt-4 w-full rounded-2xl py-3 text-[13px] font-extrabold uppercase tracking-wide transition-all"
            style={{ background: "rgba(28,176,246,0.1)", border: "2px dashed rgba(28,176,246,0.3)", color: "var(--color-brand-blue)" }}
          >
            💡 Reveal Hint
          </button>
        )}

        <AnimatePresence>
          {spot.location_hint && hintRevealed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 overflow-hidden"
            >
              <div className="rounded-[20px] px-5 py-4"
                style={{ background: "rgba(28,176,246,0.1)", border: "2px solid rgba(28,176,246,0.2)" }}>
                <p className="text-[14px] font-black" style={{ color: "var(--color-brand-blue)" }}>
                  💡 {spot.location_hint}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
