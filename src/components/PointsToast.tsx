import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  open: boolean;
  points: number;
  onClose: () => void;
}

export function PointsToast({ open, points, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: -60, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -60, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-6 left-6 z-[150] flex items-center gap-3 rounded-2xl px-5 py-4 shadow-2xl border"
          style={{
            background: "linear-gradient(135deg, #1A1A1A, #120b21)",
            borderColor: "rgba(88,204,2,0.25)",
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "rgba(88,204,2,0.15)" }}
          >
            ⭐
          </motion.div>
          <div>
            <p className="text-[13px] font-extrabold text-white">Points Earned!</p>
            <p className="text-[11px] font-bold text-[#888]">
              <span className="text-[var(--color-brand-green)] text-[15px] font-black">+{points}</span> added to your score
            </p>
          </div>
          <button onClick={onClose} className="ml-2 text-white/30 hover:text-white/60 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
