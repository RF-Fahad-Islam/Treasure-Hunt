import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

type Props = {
  open: boolean;
  onClose: () => void;
  pointsEarned: number;
  newRank?: number;
  title?: string;
  subtitle?: string;
  autoCloseMs?: number;
};

const LIGHT_COLORS = ["#58CC02", "#1CB0F6", "#FFC800", "#FF4B4B", "#8B5CF6"];
const DARK_COLORS = ["#a78bfa", "#ec4899", "#22d3ee", "#a3e635", "#f0abfc"];

const ease = [0.22, 1, 0.36, 1] as const;

export function SuccessOverlay({
  open,
  onClose,
  pointsEarned,
  newRank,
  title = "NICE!",
  subtitle = "Mission Accomplished",
  autoCloseMs = 6000,
}: Props) {
  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Fire confetti when opened
  useEffect(() => {
    if (!open) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) return;

    const isDark = document.documentElement.classList.contains("dark");
    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

    // Big initial burst
    confetti({
      particleCount: 110,
      spread: 90,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.55 },
      colors,
      ticks: 220,
    });

    // Side cannons firing for ~2s
    const end = Date.now() + 2000;
    let raf = 0;
    const fire = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        startVelocity: 50,
        origin: { x: 0, y: 0.75 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        startVelocity: 50,
        origin: { x: 1, y: 0.75 },
        colors,
      });
      if (Date.now() < end) raf = requestAnimationFrame(fire);
    };
    fire();

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [open]);

  // Auto-close
  useEffect(() => {
    if (!open || autoCloseMs <= 0) return;
    const id = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(id);
  }, [open, autoCloseMs, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-5 backdrop-blur-md dark:bg-black/65"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Mission accomplished"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-sm flex-col items-center gap-5 overflow-hidden rounded-[32px] border border-black/5 bg-white p-7 text-center shadow-[0_8px_0_rgba(0,0,0,0.06),0_30px_60px_-20px_rgba(0,0,0,0.25)] sm:p-8 dark:border-white/10 dark:bg-[#0b0717]/95 dark:shadow-[0_20px_60px_-10px_rgba(139,92,246,0.4)] dark:backdrop-blur-xl"
          >
            {/* Soft glow behind icon (dark mode) */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 left-1/2 hidden h-48 w-48 -translate-x-1/2 rounded-full opacity-60 blur-3xl dark:block"
              style={{
                background:
                  "radial-gradient(circle, rgba(236,72,153,0.5) 0%, rgba(139,92,246,0.3) 50%, transparent 80%)",
              }}
            />

            {/* Celebration icon */}
            <motion.div
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.1,
                type: "spring",
                stiffness: 260,
                damping: 14,
              }}
              className="relative"
            >
              <PartyIcon />
              <motion.span
                aria-hidden
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0.9] }}
                transition={{ delay: 0.35, duration: 0.6, ease }}
                className="absolute -right-3 -top-1 text-2xl"
              >
                ✨
              </motion.span>
              <motion.span
                aria-hidden
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.9] }}
                transition={{ delay: 0.5, duration: 0.6, ease }}
                className="absolute -left-4 top-2 text-xl"
              >
                ✨
              </motion.span>
            </motion.div>

            {/* NICE! big text */}
            <motion.h2
              initial={{ y: 24, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 200,
                damping: 16,
              }}
              className="w-full px-2 font-display text-[32px] font-black leading-none tracking-tight text-[#58CC02] sm:text-[54px] dark:gradient-text break-words"
              style={{
                textShadow:
                  "var(--nice-shadow, 0 4px 0 rgba(58, 132, 0, 0.12))",
              }}
            >
              {title}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.45, ease }}
              className="-mt-2 text-[16px] font-bold text-[#777] dark:text-white/60 px-4"
            >
              {subtitle}
            </motion.p>

            {/* Reward card */}
            <motion.div
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.55, ease }}
              className="w-full overflow-hidden rounded-3xl border border-[#FFC800]/30 bg-[#FFF8DC] p-5 dark:border-amber-300/15 dark:bg-amber-300/[0.05]"
            >
              <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#7A5A00] dark:text-amber-200/70">
                Rewards Earned
              </div>
              <motion.div
                initial={{ scale: 0.85 }}
                animate={{ scale: [0.85, 1.08, 1] }}
                transition={{
                  delay: 0.6,
                  duration: 0.55,
                  times: [0, 0.6, 1],
                  ease,
                }}
                className="mt-2 flex items-center justify-center gap-2"
              >
                <StarIcon />
                <span className="font-display text-[44px] font-black tabular-nums leading-none text-[#FFC800] sm:text-5xl">
                  +{pointsEarned.toLocaleString()}
                </span>
              </motion.div>

              {typeof newRank === "number" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75, duration: 0.4 }}
                  className="mt-4 flex items-center justify-center gap-2 border-t border-[#FFC800]/20 pt-3 text-[13px] font-bold text-[#777] dark:border-amber-300/10 dark:text-white/60"
                >
                  <span>Updated Rank</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E8FFD1] px-2 py-0.5 text-[12px] font-extrabold text-[#3A8400] dark:bg-emerald-500/15 dark:text-emerald-300">
                    <TrendUpIcon />#{newRank}
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* Continue button */}
            <motion.button
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.45, ease }}
              onClick={onClose}
              className="btn-press ripple btn-press--lg btn-primary w-full"
              autoFocus
            >
              <span>Continue</span>
              <Arrow />
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────── Icons ───────── */

function PartyIcon() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="party-cone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFC800" />
          <stop offset="100%" stopColor="#FF9500" />
        </linearGradient>
      </defs>
      {/* Cone */}
      <path
        d="M14 60 L46 28 L56 38 Z"
        fill="url(#party-cone)"
        stroke="#E0A800"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Sparkles */}
      <circle cx="58" cy="20" r="3" fill="#58CC02" />
      <circle cx="64" cy="34" r="2.4" fill="#1CB0F6" />
      <circle cx="46" cy="14" r="2.4" fill="#FF4B4B" />
      <circle cx="36" cy="22" r="2" fill="#8B5CF6" />
      <path
        d="M52 8 L52 14 M49 11 L55 11"
        stroke="#FFC800"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M68 14 L68 18 M66 16 L70 16"
        stroke="#58CC02"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l2.4 6.9 7.3.6-5.6 4.8 1.8 7.1L12 17.8 6.1 21.4l1.8-7.1L2.3 9.5l7.3-.6L12 2z"
        fill="#FFC800"
        stroke="#E0A800"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 17l6-6 4 4 8-8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 7h7v7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
