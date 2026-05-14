import { motion } from "motion/react";
import { Reveal, WordReveal } from "./Reveal";

type Step = {
  n: string;
  title: string;
  body: string;
  optional?: boolean;
  accent: {
    badgeBg: string;
    badgeFg: string;
    bar: string;
  };
};

const steps: Step[] = [
  {
    n: "01",
    title: "Enter your roll",
    body: "Punch in your student roll to load your team.",
    accent: {
      badgeBg: "bg-[#E8FFD1]",
      badgeFg: "text-[#3A8400]",
      bar: "bg-[#58CC02]",
    },
  },
  {
    n: "02",
    title: "Crack the clue",
    body: "Each clue points to a spot. Solve it. Move.",
    accent: {
      badgeBg: "bg-[#DCF1FE]",
      badgeFg: "text-[#0E6E9C]",
      bar: "bg-[#1CB0F6]",
    },
  },
  {
    n: "03",
    title: "Arrive at the spot to advance",
    body: "Find the location and report to the senior.",
    accent: {
      badgeBg: "bg-[#FFF1B8]",
      badgeFg: "text-[#7A5A00]",
      bar: "bg-[#FFC800]",
    },
  },
  {
    n: "04",
    title: "Beat the timer",
    body: "Fastest team across all clues wins. Every second on the clock counts.",
    accent: {
      badgeBg: "bg-[#FFE4E4]",
      badgeFg: "text-[#C03030]",
      bar: "bg-[#FF4B4B]",
    },
  },
  {
    n: "05",
    title: "Take on the mini-games",
    body: "Crack mini-games at every spot to earn more points and get ahead.",
    optional: true,
    accent: {
      badgeBg: "bg-[#F2EBFF]",
      badgeFg: "text-[#6B3FE3]",
      bar: "bg-[#8B5CF6]",
    },
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function HowItWorks() {
  return (
    <section id="how" className="relative px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <Reveal
            duration={0.6}
            className="inline-block rounded-full bg-[#1CB0F6]/12 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#0E6E9C] dark:bg-transparent dark:px-0 dark:py-0 dark:text-white/45"
          >
            The Rules
          </Reveal>
          <h2 className="mt-4 font-display text-[clamp(2rem,7vw,3.25rem)] font-extrabold leading-tight tracking-tight text-[#2B2B2B] dark:text-white">
            <WordReveal text="Four steps." />
            <br />
            <WordReveal
              text="One winner."
              className="gradient-text"
              delay={0.25}
            />
          </h2>
          <Reveal
            delay={0.25}
            className="mt-5 max-w-xl text-[17px] font-semibold leading-relaxed text-[#777] dark:text-white/65 sm:text-base"
          >
            The path is simple. The hunt isn't.
          </Reveal>
        </div>

        <ol
          className="relative mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2"
          style={{ perspective: "1600px" }}
        >
          {steps.map((s, i) => (
            <motion.li
              key={s.n}
              initial={{
                opacity: 0,
                y: 40,
                rotateX: -28,
                rotateY: i % 2 === 0 ? -8 : 8,
              }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.85, delay: i * 0.1, ease }}
              style={{
                transformStyle: "preserve-3d",
                transformOrigin: "50% 0%",
              }}
              className={[
                "group relative overflow-hidden rounded-3xl p-5 transition sm:p-6",
                s.optional
                  ? "border-2 border-dashed border-[#8B5CF6]/30 bg-[#FBF9FF] dark:border-white/15 dark:bg-white/[0.015] sm:col-span-2"
                  : "border border-black/5 bg-white shadow-[0_3px_0_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/[0.02] dark:shadow-none dark:backdrop-blur-md",
              ].join(" ")}
            >
              {s.optional && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-[#8B5CF6] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white dark:bg-white/10"
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FFC800]" />
                  Bonus
                </motion.span>
              )}

              <div className="flex items-start gap-4">
                <motion.span
                  initial={{ opacity: 0, scale: 0.7 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1 + 0.15,
                    ease,
                  }}
                  className={[
                    "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-display text-base font-black tracking-tight sm:h-14 sm:w-14 sm:text-lg",
                    s.accent.badgeBg,
                    s.accent.badgeFg,
                    "dark:bg-white/5 dark:text-white",
                  ].join(" ")}
                >
                  {s.n}
                </motion.span>

                <div className="flex-1 pr-2">
                  <h3 className="font-display text-[19px] font-extrabold tracking-tight text-[#2B2B2B] dark:text-white sm:text-xl">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-[15px] font-semibold leading-relaxed text-[#777] dark:text-white/65 sm:text-[16px]">
                    {s.body}
                  </p>
                </div>
              </div>

              {/* Accent bar */}
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.9,
                  delay: i * 0.1 + 0.25,
                  ease,
                }}
                className={[
                  "pointer-events-none absolute bottom-0 left-6 right-6 h-1 origin-left rounded-t-full opacity-60 dark:opacity-30",
                  s.accent.bar,
                ].join(" ")}
              />
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
