import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export type TeamStanding = {
  rank: number;
  team: string;
  score: number;
  you?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  standings: TeamStanding[];
  yourRank?: number;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function LeaderboardOverlay({
  open,
  onClose,
  standings,
  yourRank,
}: Props) {
  // Lock scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const sorted = [...standings].sort((a, b) => a.rank - b.rank);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  // Lookups for podium slots
  const first = top3.find((s) => s.rank === 1);
  const second = top3.find((s) => s.rank === 2);
  const third = top3.find((s) => s.rank === 3);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-md dark:bg-black/65 sm:items-center sm:p-5"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Live leaderboard"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 240, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[32px] border border-black/5 bg-white shadow-[0_-12px_40px_-10px_rgba(0,0,0,0.2)] sm:max-h-[88vh] sm:rounded-[32px] sm:shadow-[0_8px_0_rgba(0,0,0,0.06),0_30px_60px_-20px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-[#0b0717]/95 dark:backdrop-blur-xl"
          >
            <Header onClose={onClose} />

            <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4 sm:px-6">
              <TitleBlock />

              {/* Podium */}
              <div className="mt-8 flex items-end justify-center gap-2 sm:gap-3">
                {second && (
                  <PodiumColumn
                    standing={second}
                    height="h-32"
                    delay={0.1}
                    accent={{
                      bg: "bg-[#58CC02]",
                      ring: "ring-[#3A8400]",
                      text: "text-white",
                      shadow: "shadow-[0_4px_0_#3A8400]",
                      numBg: "text-[#BBB] dark:text-white/30",
                    }}
                  />
                )}
                {first && (
                  <PodiumColumn
                    standing={first}
                    height="h-44"
                    delay={0.25}
                    crown
                    accent={{
                      bg: "bg-[#FFC800]",
                      ring: "ring-[#E0A800]",
                      text: "text-[#5C4500]",
                      shadow: "shadow-[0_4px_0_#E0A800]",
                      numBg: "text-[#E0A800]/40",
                    }}
                  />
                )}
                {third && (
                  <PodiumColumn
                    standing={third}
                    height="h-28"
                    delay={0.18}
                    accent={{
                      bg: "bg-white dark:bg-white/10",
                      ring: "ring-black/10 dark:ring-white/15",
                      text: "text-[#0E6E9C] dark:text-white",
                      shadow: "shadow-[0_4px_0_rgba(0,0,0,0.08)]",
                      numBg: "text-[#BBB] dark:text-white/30",
                    }}
                  />
                )}
              </div>

              {/* Divider */}
              <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/15" />

              {/* List */}
              <ul className="mt-5 grid gap-2">
                {rest.map((s, i) => (
                  <ListRow key={s.rank} standing={s} delay={0.4 + i * 0.06} />
                ))}
              </ul>

              {typeof yourRank === "number" &&
                !sorted.some((s) => s.you && s.rank <= 3) && (
                  <p className="mt-6 text-center text-[12px] font-semibold text-[#777] dark:text-white/55">
                    You're ranked{" "}
                    <span className="font-extrabold text-[#3A8400] dark:text-emerald-300">
                      #{yourRank}
                    </span>
                    . Keep pushing.
                  </p>
                )}
            </div>

            <div className="border-t border-black/5 p-4 sm:p-5 dark:border-white/10">
              <button
                onClick={onClose}
                className="btn-press btn-press--lg btn-primary w-full"
              >
                Back to hunt
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────── Header ───────── */

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-black/5 px-5 py-3.5 sm:px-6 dark:border-white/10">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#777] dark:text-white/55">
        <ChartIcon />
        Live Leaderboard
      </span>
      <button
        onClick={onClose}
        aria-label="Close leaderboard"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/8 bg-white text-[#2B2B2B] transition active:translate-y-[1px] dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
        style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.08)" }}
      >
        <XIcon />
      </button>
    </div>
  );
}

function TitleBlock() {
  return (
    <div className="mt-2 text-center">
      <motion.h2
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease }}
        className="font-display text-3xl font-extrabold tracking-tight text-[#2B2B2B] sm:text-[34px] dark:text-white"
      >
        Live Standings
      </motion.h2>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
        className="mt-1.5 text-[14px] font-semibold text-[#777] dark:text-white/60"
      >
        Updates in real-time. Keep pushing!
      </motion.p>
    </div>
  );
}

/* ───────── Podium ───────── */

type Accent = {
  bg: string;
  ring: string;
  text: string;
  shadow: string;
  numBg: string;
};

function PodiumColumn({
  standing,
  height,
  delay,
  accent,
  crown,
}: {
  standing: TeamStanding;
  height: string;
  delay: number;
  accent: Accent;
  crown?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.55,
        ease,
      }}
      className="flex flex-1 flex-col items-center"
    >
      {/* Crown on 1st */}
      {crown && (
        <motion.div
          initial={{ y: -8, scale: 0.6, opacity: 0 }}
          animate={{
            y: [0, -4, 0],
            scale: 1,
            opacity: 1,
          }}
          transition={{
            delay: delay + 0.15,
            duration: 2.6,
            y: { repeat: Infinity, duration: 2.4, ease: "easeInOut" },
          }}
          className="mb-1"
        >
          <CrownIcon />
        </motion.div>
      )}

      {/* Rank number ghost */}
      <div
        className={`font-display text-5xl font-black leading-none tracking-tight sm:text-6xl ${accent.numBg}`}
      >
        {standing.rank}
      </div>

      {/* Podium block */}
      <div
        className={`mt-2 flex w-full ${height} flex-col items-center justify-start overflow-hidden rounded-t-2xl px-2 pt-3 ring-1 ${accent.bg} ${accent.ring} ${accent.shadow}`}
      >
        <div
          className={`text-center font-display text-[12px] font-extrabold leading-tight tracking-tight sm:text-[13px] ${accent.text}`}
        >
          {standing.team}
        </div>
        {standing.you && (
          <span
            className={`mt-1 rounded-full bg-black/15 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.18em] ${accent.text}`}
          >
            You
          </span>
        )}
        <div
          className={`mt-auto pb-3 font-display text-xl font-black tabular-nums tracking-tight sm:text-2xl ${accent.text}`}
        >
          {standing.score.toLocaleString()}
        </div>
      </div>
    </motion.div>
  );
}

/* ───────── List row ───────── */

const AVATAR_COLORS = [
  "#1CB0F6",
  "#EC4899",
  "#8B5CF6",
  "#FF9500",
  "#22D3EE",
  "#A3E635",
];

function ListRow({
  standing,
  delay,
}: {
  standing: TeamStanding;
  delay: number;
}) {
  const color = AVATAR_COLORS[standing.rank % AVATAR_COLORS.length];
  const isYou = standing.you;

  return (
    <motion.li
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease }}
      className={[
        "flex items-center gap-3 rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3",
        isYou
          ? "border-[#58CC02]/40 bg-[#E8FFD1] dark:border-emerald-300/30 dark:bg-emerald-500/10"
          : "border-black/5 bg-[#FAFAFA] dark:border-white/8 dark:bg-white/[0.025]",
      ].join(" ")}
    >
      <span
        className={`w-5 text-center font-display text-base font-extrabold tabular-nums ${
          isYou
            ? "text-[#3A8400] dark:text-emerald-300"
            : "text-[#777] dark:text-white/55"
        }`}
      >
        {standing.rank}
      </span>

      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: color }}
      >
        <PersonIcon />
      </span>

      <span
        className={`flex-1 font-display text-[15px] font-extrabold tracking-tight sm:text-base ${
          isYou
            ? "text-[#2B2B2B] dark:text-white"
            : "text-[#2B2B2B] dark:text-white"
        }`}
      >
        {standing.team}
        {isYou && (
          <span className="ml-1.5 rounded-full bg-[#58CC02] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-white">
            You
          </span>
        )}
      </span>

      <span className="font-display text-base font-extrabold tabular-nums text-[#FF4B4B] dark:text-rose-300 sm:text-[17px]">
        {standing.score.toLocaleString()}
      </span>
    </motion.li>
  );
}

/* ───────── Icons ───────── */

function CrownIcon() {
  return (
    <svg width="36" height="32" viewBox="0 0 36 32" fill="none" aria-hidden>
      <path
        d="M3 8l5.5 5L14 4l4 9 4-9 5.5 9L33 8 30 24H6L3 8z"
        fill="#FFC800"
        stroke="#E0A800"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <rect x="6" y="22" width="24" height="4" rx="1.2" fill="#FFC800" stroke="#E0A800" strokeWidth="1.6" />
      <circle cx="8" cy="6" r="2" fill="#FF4B4B" />
      <circle cx="28" cy="6" r="2" fill="#FF4B4B" />
      <circle cx="18" cy="3" r="2" fill="#FF4B4B" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.5" fill="white" />
      <path
        d="M4 20c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
