import { motion } from "motion/react";
import { CountdownTimer as ClueTimer } from "@/components/timer/CountdownTimer";
import type { ClueDefinition, Spot } from "@/types";

interface Props {
  clueDefinition: ClueDefinition | null;
  spot: Spot | null;
  completedClues: number;
  totalClues: number;
  streak: number;
  clueStartedAt: string | null;
  helpActivatedAt?: string | null;
  timeoutAckAt?: string | null;
  timeLimitMinutes: number;
  onTimeout: () => void;
  showTimeout: boolean;
  locked?: boolean;
  huntStartsIn?: string | null;
}

export function GamifiedClueCard({
  clueDefinition, spot, completedClues, totalClues,
  streak, clueStartedAt, helpActivatedAt, timeoutAckAt, timeLimitMinutes, onTimeout, showTimeout,
  locked, huntStartsIn,
}: Props) {
  const progress = totalClues > 0 ? (completedClues / totalClues) * 100 : 0;

  if (!clueDefinition || !spot) {
    return (
      <div className="rounded-[24px] p-8 text-center" style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.06), 0 12px 24px -8px rgba(0,0,0,0.08)", borderTop: "6px solid #1CB0F6" }}>
        <div className="py-6 text-center">
          <p className="text-5xl mb-4">
            {totalClues === 0 ? "🕐" : "🏆"}
          </p>
          <p className="text-[20px] font-bold" style={{ color: "#777777" }}>
            {totalClues === 0 ? "No clues assigned yet." : "All clues completed! Amazing!"}
          </p>
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="rounded-[24px] overflow-hidden relative" style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.06), 0 12px 24px -8px rgba(0,0,0,0.08)" }}>
        <div className="h-2" style={{ background: "linear-gradient(90deg, #FFC800, #FF9500)" }} />
        <div className="p-8 text-center">
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="mb-4 text-5xl">🔒</motion.div>
          <h3 className="font-display text-2xl font-black mb-2" style={{ color: "#FFC800" }}>Clue Locked</h3>
          <p className="text-[14px] font-semibold mb-4" style={{ color: "#777777" }}>
            The hunt hasn't started yet. The clue will unlock when the event begins.
          </p>
          {huntStartsIn && (
            <div className="inline-flex items-center gap-2 rounded-2xl px-5 py-3" style={{ background: "#FFF8E0" }}>
              <span className="text-[13px] font-extrabold" style={{ color: "#FFC800" }}>⏳ Starts in {huntStartsIn}</span>
            </div>
          )}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="rounded-xl px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wide" style={{ background: "rgba(28,176,246,0.1)", color: "#1CB0F6" }}>
              📍 {spot.name}
            </span>
          </div>
          {clueDefinition.image_url && (
            <div className="mt-4 rounded-2xl overflow-hidden opacity-50">
              <img src={clueDefinition.image_url} alt="Clue visual" className="w-full object-cover" style={{ maxHeight: 160 }} />
            </div>
          )}
          <p className="mt-4 text-[16px] font-black opacity-40 select-none" style={{ color: "#2B2B2B" }}>
            {clueDefinition.clue_text}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] overflow-hidden" style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.06), 0 12px 24px -8px rgba(0,0,0,0.08)", borderTop: "6px solid #58CC02" }}>
      {/* Progress bar */}
      <div className="h-2 relative overflow-hidden" style={{ background: "#F0F0F0" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: "linear-gradient(90deg, #58CC02, #1CB0F6)" }}
        />
      </div>

      <div className="p-6 sm:p-8">
        {/* Header: progress + streak */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-black uppercase tracking-[0.12em]" style={{ color: "#777777" }}>
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
              <span className="text-[12px] font-extrabold" style={{ color: "#FFC800" }}>x{streak}</span>
            </motion.div>
          )}
        </div>

        {/* Timer */}
        <div className="mb-5">
          <ClueTimer
            startedAt={clueStartedAt}
            timeoutAckAt={timeoutAckAt}
            timeLimitMinutes={timeLimitMinutes}
            onTimeout={onTimeout}
            paused={showTimeout}
          />
        </div>

        {/* Spot badge */}
        <div className="mb-4">
          <span className="inline-block rounded-xl px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wide" 
            style={{ 
              background: helpActivatedAt ? "rgba(255, 75, 75, 0.1)" : "rgba(28,176,246,0.1)", 
              color: helpActivatedAt ? "#FF4B4B" : "#1CB0F6" 
            }}>
            📍 {helpActivatedAt ? spot.name : "Destination: ???"}
          </span>
        </div>

        {/* Help Mode Status */}
        {helpActivatedAt && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 rounded-2xl p-4 border-2 border-dashed border-[#FF4B4B]/30 bg-rose-50/50"
          >
            <div className="flex items-center gap-3 mb-2">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2.5 h-2.5 rounded-full bg-[#FF4B4B]"
              />
              <span className="text-[13px] font-black uppercase tracking-wider text-[#FF4B4B]">
                Help Mode Active
              </span>
            </div>
            <p className="text-[12px] font-bold text-[#FF4B4B]/70 leading-snug">
              Destination revealed! ⚠️ Penalty is now <span className="font-black underline">1 pt / 2 min</span>. Reach the spot leader quickly!
            </p>
          </motion.div>
        )}

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
          className="text-[22px] sm:text-[26px] font-black leading-relaxed" style={{ color: "#2B2B2B" }}>
          {clueDefinition.clue_text}
        </motion.p>
      </div>
    </div>
  );
}
