import { motion } from "motion/react";
import { CountUp } from "./CountUp";
import { Gyro3D } from "./Gyro3D";


const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const stats = [
  {
    k: "Teams",
    n: 10,
    suffix: "",
    tile: "bg-[#E8FFD1] dark:bg-white/[0.04] dark:border dark:border-white/10",
    fg: "text-[#3A8400] dark:text-white",
  },
  {
    k: "Clues",
    n: 7,
    suffix: "",
    tile: "bg-[#DCF1FE] dark:bg-white/[0.04] dark:border dark:border-white/10",
    fg: "text-[#0E6E9C] dark:text-white",
  },
  {
    k: "Duration",
    n: 8,
    suffix: "h",
    tile: "bg-[#FFF1B8] dark:bg-white/[0.04] dark:border dark:border-white/10",
    fg: "text-[#7A5A00] dark:text-white",
  },
] as const;

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center px-5 pt-28 pb-16 sm:px-8"
    >
      {/* Backdrop emblem */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
      >
        <div className="opacity-[0.55] sm:opacity-60">
          <Gyro3D size={460} className="hidden sm:block" />
          <Gyro3D size={320} className="sm:hidden" />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
          className="flex flex-col items-center gap-6 sm:gap-8"
        >


          {/* Event tag */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em]"
            style={{
              background: "color-mix(in srgb, #58CC02 14%, transparent)",
              color: "#3A8400",
            }}
          >
            <Sparkle />
            <span className="dark:text-white/80">The Hunt · 2026 Edition</span>
          </motion.div>

          {/* Display headline */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[clamp(2.75rem,12vw,6rem)] font-extrabold leading-[0.95] tracking-tight text-[#2B2B2B] dark:text-white"
          >
            <span className="block dark:gradient-text">Treasure</span>
            <span className="relative inline-block">
              <span className="dark:gradient-text">Hunt</span>
              <span
                aria-hidden
                className="absolute -right-3 -top-2 text-[0.32em] font-black tracking-tighter sm:-right-6"
                style={{ color: "#58CC02" }}
              >
                ✕
              </span>
            </span>
          </motion.h1>

          {/* University line */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="-mt-1 max-w-md text-[12px] font-extrabold uppercase tracking-[0.24em] text-[#777777] dark:text-white/55 sm:text-sm"
          >
            University of Dhaka
            <span className="mx-2 text-[#BBBBBB] dark:text-white/25">·</span>
            Dept. of CSE
          </motion.p>

          {/* Description */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg text-balance text-[17px] font-semibold leading-relaxed text-[#2B2B2B]/80 dark:text-white/70 sm:text-lg"
          >
            Decode the clues. Race across campus. Outsmart the field.
            Your companion app for every twist of the hunt.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-1 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center"
          >
            <button 
              onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("open-lookup", { detail: "roll" })); }}
              data-sound="heavy" 
              className="btn-press ripple btn-press--lg btn-primary"
            >
              <span>Find your team</span>
              <Arrow />
            </button>

            <a href="#how" className="btn-press ripple btn-press--lg btn-secondary">
              How it works
            </a>
          </motion.div>

          {/* Meta strip — playful colored tiles */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            transition={{ staggerChildren: 0.12, delayChildren: 0.1 }}
            className="mt-6 grid w-full grid-cols-3 gap-3 sm:max-w-md sm:gap-4"
            style={{ perspective: "1000px" }}
          >
            {stats.map((m) => (
              <motion.div
                key={m.k}
                variants={{
                  hidden: { opacity: 0, y: 24, rotateX: -55 },
                  show: { opacity: 1, y: 0, rotateX: 0 },
                }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className={[
                  "rounded-2xl px-3 py-3.5 text-left sm:px-4 sm:py-4",
                  "shadow-[0_3px_0_rgba(0,0,0,0.05)] dark:shadow-none",
                  m.tile,
                ].join(" ")}
                style={{
                  transformStyle: "preserve-3d",
                  transformOrigin: "50% 100%",
                }}
              >
                <CountUp
                  to={m.n}
                  suffix={m.suffix}
                  className={`font-display text-2xl font-extrabold tracking-tight sm:text-3xl ${m.fg}`}
                />
                <div
                  className={`mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] opacity-80 sm:text-[11px] ${m.fg}`}
                >
                  {m.k}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#999] dark:text-white/40">
          <span>Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-[#777]/60 to-transparent dark:from-white/40" />
        </div>
      </motion.div>
    </section>
  );
}

function Sparkle() {
  return (
    <svg width="11" height="11" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill="#58CC02" />
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
