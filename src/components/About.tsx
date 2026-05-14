import { type ReactElement } from "react";
import { motion } from "motion/react";
import { Reveal, WordReveal } from "./Reveal";

type Feature = {
  title: string;
  body: string;
  icon: () => ReactElement;
  iconBg: string;
  darkGlow: string;
};

const features: Feature[] = [
  {
    title: "Live clue feed",
    body: "Receive the next clue the moment the previous one is solved. Stay in the loop, wherever the hunt takes you.",
    icon: BoltIcon,
    iconBg: "bg-[#E8FFD1] dark:bg-violet-500/15",
    darkGlow: "from-violet-500/30 to-fuchsia-500/10",
  },
  {
    title: "Team intel",
    body: "Your roster, your captain, your status. Everything your team needs in one tap.",
    icon: UsersIcon,
    iconBg: "bg-[#DCF1FE] dark:bg-pink-500/15",
    darkGlow: "from-fuchsia-500/30 to-pink-500/10",
  },
  {
    title: "Leaderboard",
    body: "Track the chase in real time. Watch your team climb — or close the gap.",
    icon: TrophyIcon,
    iconBg: "bg-[#FFF1B8] dark:bg-cyan-500/15",
    darkGlow: "from-cyan-400/30 to-sky-500/10",
  },
];

export function About() {
  return (
    <section id="about" className="relative px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Header />

        <div
          className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-3"
          style={{ perspective: "1400px" }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{
                opacity: 0,
                y: 36,
                rotateY: i === 1 ? 0 : i === 0 ? -22 : 22,
                rotateX: -8,
              }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.85,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ transformStyle: "preserve-3d" }}
              className="group relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 shadow-[0_3px_0_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.02] dark:shadow-none dark:backdrop-blur-md"
            >
              {/* Dark-mode glow */}
              <div
                className={`pointer-events-none absolute -top-20 -right-20 hidden h-48 w-48 rounded-full bg-gradient-to-br ${f.darkGlow} opacity-70 blur-3xl transition-opacity group-hover:opacity-100 dark:block`}
              />

              <div className="relative">
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${f.iconBg} dark:ring-1 dark:ring-white/10`}
                >
                  <f.icon />
                </div>
                <h3 className="mt-5 font-display text-[22px] font-extrabold tracking-tight text-[#2B2B2B] dark:text-white sm:text-2xl">
                  {f.title}
                </h3>
                <p className="mt-2 text-[15px] font-semibold leading-relaxed text-[#777] dark:text-white/65 sm:text-base">
                  {f.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Header() {
  return (
    <div className="max-w-2xl">
      <Reveal
        duration={0.6}
        className="inline-block rounded-full bg-[#58CC02]/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#3A8400] dark:bg-transparent dark:px-0 dark:py-0 dark:text-white/45"
      >
        The Companion
      </Reveal>
      <h2 className="mt-4 font-display text-[clamp(2rem,7vw,3.25rem)] font-extrabold leading-tight tracking-tight text-[#2B2B2B] dark:text-white">
        <WordReveal text="Built for the chase." />
        <br />
        <WordReveal
          text="Not the chaos."
          className="gradient-text"
          delay={0.3}
        />
      </h2>
      <Reveal
        delay={0.25}
        className="mt-5 max-w-xl text-[17px] font-semibold leading-relaxed text-[#777] dark:text-white/65 sm:text-lg"
      >
        Everything you need during the hunt — clues, team status, the
        leaderboard — wrapped in one calm, fast interface.
      </Reveal>
    </div>
  );
}

function BoltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
        fill="#58CC02"
        stroke="#58CC02"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3.2" stroke="#1CB0F6" strokeWidth="1.8" />
      <circle cx="17" cy="9.5" r="2.4" stroke="#1CB0F6" strokeWidth="1.8" />
      <path
        d="M3 19c.6-3 3.2-4.5 6-4.5s5.4 1.5 6 4.5"
        stroke="#1CB0F6"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M15.5 19c.5-2 2-3 4-3 1.3 0 2.5.4 3.5 1.3"
        stroke="#1CB0F6"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4h10v4a5 5 0 11-10 0V4z"
        stroke="#E0A800"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="#FFC800"
      />
      <path
        d="M5 6H3v2a3 3 0 003 3M19 6h2v2a3 3 0 01-3 3"
        stroke="#E0A800"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 14v3h4v-3M8 20h8"
        stroke="#E0A800"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
