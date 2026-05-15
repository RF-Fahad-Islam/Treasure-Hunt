import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getAvatarUrl } from "@/lib/avatar";

interface Props {
  open: boolean;
  currentSeed: string;
  teamName: string;
  onSave: (seed: string) => void;
  onClose: () => void;
}

export function TeamLogoEditModal({ open, currentSeed, teamName, onSave, onClose }: Props) {
  const [seed, setSeed] = useState(currentSeed || teamName);
  const previewUrl = getAvatarUrl(seed || teamName, 160);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-[#1A1A1A] border-4 border-[var(--border-soft)] rounded-[32px] p-6 w-full max-w-sm shadow-2xl overflow-hidden"
            style={{ borderBottomWidth: "10px" }}
          >
            <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="relative z-10 text-center">
              <h3 className="font-display text-xl font-black text-white mb-5">Team Logo</h3>

              {/* DiceBear Preview */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 shadow-xl">
                  <img src={previewUrl} alt="Team avatar preview" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Seed input */}
              <div className="mb-6">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#888] mb-2 text-left">Avatar Seed</p>
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder={teamName}
                  className="w-full rounded-2xl border-2 px-4 py-3.5 text-[15px] font-bold outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "var(--fg)",
                  }}
                />
                <p className="mt-1.5 text-[10px] font-semibold text-left" style={{ color: "var(--fg-muted)" }}>
                  Type anything to generate a unique team avatar
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="btn-press flex-1 py-3.5 rounded-2xl text-[14px] font-black border"
                  style={{ borderColor: "var(--border-soft)", color: "var(--fg-muted)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => onSave(seed || teamName)}
                  className="btn-press flex-1 py-3.5 rounded-2xl text-[14px] font-black text-white"
                  style={{ background: "var(--color-brand-green)", boxShadow: "0 4px 0 0 var(--color-brand-green-shadow)" }}
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
