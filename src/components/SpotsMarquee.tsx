import { motion } from "motion/react";
import { Reveal, WordReveal } from "./Reveal";

const SPOTS = [
  "Curzon Hall",
  "TSC",
  "Shaheed Minar",
  "Doel Chattar",
  "Aparajeyo Bangla",
  "Hakim Chattar",
  "Mall Chattar",
  "VC Chattar",
  "Suhrawardy Udyan",
  "Botanical Garden",
];

const ACCENTS = [
  { bg: "bg-[#E8FFD1]", fg: "text-[#3A8400]", dot: "#58CC02" },
  { bg: "bg-[#DCF1FE]", fg: "text-[#0E6E9C]", dot: "#1CB0F6" },
  { bg: "bg-[#FFF1B8]", fg: "text-[#7A5A00]", dot: "#FFC800" },
  { bg: "bg-[#FFE4E4]", fg: "text-[#C03030]", dot: "#FF4B4B" },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function SpotsMarquee() {
  return (
    <section className="relative px-0 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <Reveal
            duration={0.6}
            className="inline-block rounded-full bg-[#FFC800]/20 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#7A5A00] dark:bg-transparent dark:px-0 dark:py-0 dark:text-white/45"
          >
            The Map
          </Reveal>
          <h2 className="mt-4 font-display text-[clamp(2rem,7vw,3.25rem)] font-extrabold leading-tight tracking-tight text-[#2B2B2B] dark:text-white">
            <WordReveal text="Every corner." />
            <br />
            <WordReveal
              text="A clue away."
              className="gradient-text"
              delay={0.25}
            />
          </h2>
          <Reveal
            delay={0.2}
            className="mt-5 max-w-xl text-[17px] font-semibold leading-relaxed text-[#777] dark:text-white/65 sm:text-base"
          >
            The hunt cuts straight through campus. Expect cryptic stops at
            the spots that already feel like home.
          </Reveal>

          <Reveal
            delay={0.3}
            className="mt-5 inline-flex max-w-md items-start gap-2 rounded-2xl border border-[#FFC800]/40 bg-[#FFF8DC] px-3.5 py-2.5 text-[13px] font-semibold leading-relaxed text-[#7A5A00] dark:border-amber-300/15 dark:bg-amber-300/[0.04] dark:text-amber-100/75"
          >
            <InfoIcon />
            <span>
              Heads up — these are example campus spots, not the actual
              clue locations. The real ones stay sealed until the hunt
              begins.
            </span>
          </Reveal>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.9, ease }}
        className="relative mt-12 scene-3d sm:mt-16"
        style={{ perspective: "1400px" }}
      >
        {/* Edge fades — themed */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#F7F7F7] to-transparent dark:from-[#05030a] sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#F7F7F7] to-transparent dark:from-[#05030a] sm:w-32" />

        <div
          className="overflow-hidden"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="marquee-track flex w-max gap-4 py-6"
            style={{
              transform: "rotateX(8deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {[...SPOTS, ...SPOTS].map((spot, i) => (
              <SpotCard key={`${spot}-${i}`} label={spot} index={i} />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function SpotCard({ label, index }: { label: string; index: number }) {
  const tilt = index % 2 === 0 ? -6 : 6;
  const liftZ = index % 3 === 0 ? 30 : 0;
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <div
      className="relative flex h-28 w-56 shrink-0 items-center overflow-hidden rounded-3xl border border-black/5 bg-white px-4 transition-transform sm:h-32 sm:w-64 sm:px-5 dark:border-white/10 dark:bg-white/[0.03] dark:backdrop-blur-md"
      style={{
        transform: `rotateY(${tilt}deg) translateZ(${liftZ}px)`,
        transformStyle: "preserve-3d",
        boxShadow: "0 6px 0 rgba(0,0,0,0.04), 0 20px 30px -20px rgba(0,0,0,0.08)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-10 hidden h-32 w-32 rounded-full opacity-50 blur-2xl dark:block"
        style={{
          background:
            index % 3 === 0
              ? "rgba(139,92,246,0.45)"
              : index % 3 === 1
                ? "rgba(236,72,153,0.4)"
                : "rgba(34,211,238,0.4)",
        }}
      />
      <div className="relative flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent.bg} dark:bg-white/[0.05] dark:ring-1 dark:ring-white/10`}
        >
          <PinIcon color={accent.dot} />
        </div>
        <div className="flex flex-col leading-tight">
          <span
            className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${accent.fg} dark:text-white/45`}
          >
            Spot {((index % SPOTS.length) + 1).toString().padStart(2, "0")}
          </span>
          <span className="font-display text-[17px] font-extrabold tracking-tight text-[#2B2B2B] dark:text-white sm:text-lg">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="mt-0.5 shrink-0"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="#E0A800"
        strokeWidth="1.8"
        className="dark:[stroke:rgba(252,211,77,0.7)]"
      />
      <path
        d="M12 11v5"
        stroke="#E0A800"
        strokeWidth="2"
        strokeLinecap="round"
        className="dark:[stroke:rgba(252,211,77,0.9)]"
      />
      <circle
        cx="12"
        cy="7.8"
        r="1"
        fill="#E0A800"
        className="dark:[fill:rgba(252,211,77,0.95)]"
      />
    </svg>
  );
}

function PinIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22s7-7.2 7-12a7 7 0 10-14 0c0 4.8 7 12 7 12z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.15"
      />
      <circle cx="12" cy="10" r="2.5" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}
