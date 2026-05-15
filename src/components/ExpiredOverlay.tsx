import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  open: boolean;
  onContinue: () => void;
  /** Seconds before auto-continuing. Set 0 to disable. */
  autoContinueSec?: number;
  title?: string;
  body?: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function ExpiredOverlay({
  open,
  onContinue,
  autoContinueSec = 5,
  title = "Mission Expired",
  body = "No worries! A new clue is unlocking. Dust yourself off and let's keep moving.",
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(autoContinueSec);

  // Reset countdown each time we open
  useEffect(() => {
    if (open) setSecondsLeft(autoContinueSec);
  }, [open, autoContinueSec]);

  // Lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Countdown tick
  useEffect(() => {
    if (!open || autoContinueSec <= 0) return;
    if (secondsLeft <= 0) {
      onContinue();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [open, secondsLeft, autoContinueSec, onContinue]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onContinue();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onContinue]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-5 backdrop-blur-md dark:bg-black/65"
          onClick={onContinue}
          role="dialog"
          aria-modal="true"
          aria-label="Mission expired"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-sm flex-col items-center gap-5 overflow-hidden rounded-[32px] border border-black/5 bg-white p-7 text-center shadow-[0_8px_0_rgba(0,0,0,0.06),0_30px_60px_-20px_rgba(0,0,0,0.25)] sm:p-8 dark:border-white/10 dark:bg-[#0b0717]/95 dark:shadow-[0_20px_60px_-10px_rgba(255,75,75,0.35)] dark:backdrop-blur-xl"
          >
            {/* Soft red glow halo (dark mode) */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 left-1/2 hidden h-48 w-48 -translate-x-1/2 rounded-full opacity-60 blur-3xl dark:block"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,75,75,0.55) 0%, rgba(236,72,153,0.25) 50%, transparent 80%)",
              }}
            />

            {/* Icon + radio rings */}
            <div className="relative flex h-32 w-32 items-center justify-center">
              {/* Expanding rings */}
              <ExpandingRing delay={0} />
              <ExpandingRing delay={0.6} />
              <ExpandingRing delay={1.2} />

              {/* Floating decorations */}
              <motion.span
                aria-hidden
                initial={{ scale: 0, rotate: 20 }}
                animate={{
                  scale: [0, 1, 1],
                  y: [0, -3, 0],
                  rotate: [20, -8, 20],
                }}
                transition={{
                  delay: 0.4,
                  duration: 3.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute right-1 top-2"
              >
                <HourglassIcon />
              </motion.span>
              <motion.span
                aria-hidden
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1, 1], rotate: [-12, 12, -12] }}
                transition={{
                  delay: 0.55,
                  duration: 3.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -left-1 bottom-3"
              >
                <SparkleStar />
              </motion.span>

              {/* Center timer-with-slash badge */}
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 240,
                  damping: 14,
                }}
                className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_4px_0_rgba(0,0,0,0.06),0_12px_30px_-10px_rgba(255,75,75,0.45)] ring-1 ring-[#FF4B4B]/20 dark:bg-white/[0.06] dark:shadow-[0_12px_30px_-10px_rgba(255,75,75,0.5)] dark:ring-rose-300/20"
              >
                <TimerSlashIcon />
              </motion.div>
            </div>

            {/* Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0, scale: 0.94 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{
                delay: 0.25,
                type: "spring",
                stiffness: 200,
                damping: 16,
              }}
              className="font-display text-[42px] font-black uppercase leading-none tracking-tight text-[#FF4B4B] sm:text-[48px]"
              style={{
                textShadow: "0 3px 0 rgba(255, 75, 75, 0.15)",
              }}
            >
              {title}
            </motion.h2>

            {/* Body */}
            <motion.p
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.45, ease }}
              className="-mt-1 max-w-xs text-[15px] font-semibold leading-relaxed text-[#777] dark:text-white/65"
            >
              {body}
            </motion.p>

            {/* Continue button */}
            <motion.button
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.45, ease }}
              onClick={onContinue}
              className="btn-press ripple btn-press--lg btn-primary w-full"
              autoFocus
            >
              <span>Get next clue</span>
              <Arrow />
            </motion.button>

            {/* Auto-continue countdown */}
            {autoContinueSec > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="-mt-2 text-[12px] font-semibold text-[#999] dark:text-white/45"
              >
                Next clue ready in{" "}
                <span className="font-extrabold tabular-nums text-[#777] dark:text-white/65">
                  {secondsLeft}s
                </span>
                …
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────── Bits ───────── */

function ExpandingRing({ delay }: { delay: number }) {
  return (
    <motion.span
      aria-hidden
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: [0.4, 1.8], opacity: [0.55, 0] }}
      transition={{
        delay,
        duration: 1.8,
        repeat: Infinity,
        ease: "easeOut",
      }}
      className="absolute h-24 w-24 rounded-full border-2 border-[#FF4B4B]/45 dark:border-rose-400/40"
    />
  );
}

function TimerSlashIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* Crown */}
      <path
        d="M10 2h4"
        stroke="#FF4B4B"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Body */}
      <circle
        cx="12"
        cy="13"
        r="8"
        stroke="#FF4B4B"
        strokeWidth="2.2"
        fill="rgba(255,75,75,0.06)"
      />
      {/* Inner hand */}
      <path
        d="M12 9v4l2 1.5"
        stroke="#FF4B4B"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
      />
      {/* Slash */}
      <path
        d="M5 5 L20 21"
        stroke="#FF4B4B"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3h10M7 21h10"
        stroke="#FFC800"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 3c0 4 5 5 5 9s-5 5-5 9M17 3c0 4-5 5-5 9s5 5 5 9"
        stroke="#FFC800"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M10 7h4M9 18h6"
        stroke="#FFC800"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkleStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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
