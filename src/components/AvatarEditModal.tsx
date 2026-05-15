import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const COLORS = [
  "#58cc02", "#1cb0f6", "#ffc800", "#ff4b4b",
  "#8b5cf6", "#ec4899", "#22d3ee", "#a3e635",
  "#f97316", "#06b6d4",
];

const EMOJIS = [
  "🏃", "🎯", "🔍", "🗺", "⭐", "🔥", "💎", "🦅",
  "🐉", "🦊", "🐺", "🦁", "🐯", "🦈", "🦋", "🌊",
  "⚡", "🌙", "☀️", "🍀", "🎲", "🏆", "🚀", "👑",
  "💪", "🧠", "🎨", "📡", "🧭", "🔑",
];

interface Props {
  open: boolean;
  currentEmoji: string;
  currentColor: string;
  onSave: (emoji: string, color: string) => void;
  onClose: () => void;
}

export function AvatarEditModal({ open, currentEmoji, currentColor, onSave, onClose }: Props) {
  const [emoji, setEmoji] = useState(currentEmoji);
  const [color, setColor] = useState(currentColor);

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
              <h3 className="font-display text-xl font-black text-white mb-5">Customize Avatar</h3>

              {/* Preview */}
              <div className="flex justify-center mb-6">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl border-2 border-white/10 shadow-xl"
                  style={{ background: `color-mix(in srgb, ${color} 25%, transparent)` }}
                >
                  {emoji}
                </div>
              </div>

              {/* Color picker */}
              <div className="mb-5">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#888] mb-3 text-left">Color</p>
                <div className="flex flex-wrap gap-2.5 justify-center">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-9 h-9 rounded-xl border-2 transition-all"
                      style={{
                        background: c,
                        borderColor: color === c ? "#ffffff" : "transparent",
                        boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
                        transform: color === c ? "scale(1.15)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Emoji picker */}
              <div className="mb-6">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#888] mb-3 text-left">Icon</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all border"
                      style={{
                        background: emoji === e ? `color-mix(in srgb, ${color} 25%, transparent)` : "rgba(255,255,255,0.04)",
                        borderColor: emoji === e ? color : "rgba(255,255,255,0.06)",
                        transform: emoji === e ? "scale(1.1)" : "scale(1)",
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="btn-press ripple flex-1 py-3.5 rounded-2xl text-[14px] font-black border"
                  style={{ borderColor: "var(--border-soft)", color: "var(--fg-muted)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => onSave(emoji, color)}
                  className="btn-press ripple flex-1 py-3.5 rounded-2xl text-[14px] font-black text-white"
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
