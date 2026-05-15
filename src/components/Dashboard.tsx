import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { SuccessOverlay } from "./SuccessOverlay";
import { ExpiredOverlay } from "./ExpiredOverlay";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  LeaderboardOverlay,
  type TeamStanding,
} from "./LeaderboardOverlay";

export type HuntStatus = "Active Hunt" | "Mini-game" | "Arrived";

export type DashboardData = {
  roll: string;
  team: string;
  members: string[]; 
  clue: string;
  points: number;
  penalties: number;
  status: HuntStatus;
  /** Unix-ms timestamp when the 40-min window expires. Negative remaining = overtime. */
  timerEndsAt: number;
  rank: number;
  standings: TeamStanding[];
};

type CelebrationPayload = {
  pointsEarned: number;
  newRank?: number;
};

export function Dashboard({ data }: { data: DashboardData }) {
  const [celebration, setCelebration] = useState<CelebrationPayload | null>(null);
  const [expired, setExpired] = useState(false);
  const [showConfirmReveal, setShowConfirmReveal] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [localPenalties, setLocalPenalties] = useState(data.penalties);
  
  const prevStatusRef = useRef<HuntStatus>(data.status);

  // Overtime penalty logic: 1 point every 3 minutes
  useEffect(() => {
    if (data.status !== "Active Hunt") return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const overtimeMs = now - data.timerEndsAt;
      if (overtimeMs > 0) {
        // Calculate penalty based on total overtime
        const threeMinMs = 3 * 60 * 1000;
        const totalPenalty = Math.floor(overtimeMs / threeMinMs);
        if (totalPenalty > 0) {
          setLocalPenalties(data.penalties + totalPenalty);
        }
      }
    }, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, [data.status, data.timerEndsAt, data.penalties]);

  // Fire celebration when status transitions to "Arrived".
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev !== "Arrived" && data.status === "Arrived") {
      setCelebration({ pointsEarned: 700, newRank: 2 });
    }
    prevStatusRef.current = data.status;
  }, [data.status]);

  const handleRevealSpot = () => {
    setShowConfirmReveal(false);
    setExpired(false);
    // Logic to reveal spot would go here (e.g. backend call)
    console.log("Spot revealed. Points: +0");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-5"
      >
        <TopRow team={data.team} roll={data.roll} status={data.status} />
        <TimerDisplay
          endsAt={data.timerEndsAt}
          status={data.status}
          onExpire={() => setExpired(true)}
        />
        <ScoreRow points={data.points} penalties={localPenalties} />
        <LeaderboardButton
          rank={data.rank}
          onClick={() => setLeaderboardOpen(true)}
        />
        <ClueCard clue={data.clue} />
        <SquadList members={data.members} />

        {import.meta.env.DEV && (
          <DevControls
            onCelebrate={() =>
              setCelebration({ pointsEarned: 700, newRank: 2 })
            }
            onExpire={() => setExpired(true)}
          />
        )}
      </motion.div>

      <SuccessOverlay
        open={celebration !== null}
        onClose={() => setCelebration(null)}
        pointsEarned={celebration?.pointsEarned ?? 0}
        newRank={celebration?.newRank}
      />

      <ExpiredOverlay
        open={expired}
        onContinue={() => setExpired(false)}
        onReveal={() => setShowConfirmReveal(true)}
      />

      <ConfirmDialog
        open={showConfirmReveal}
        title="Reveal Spot Location?"
        message="If you reveal the spot location now, you will receive +0 bonus points for this clue. You will still incur any accrued time penalties. Continue?"
        confirmLabel="Reveal Spot"
        cancelLabel="Keep Finding"
        destructive={true}
        onConfirm={handleRevealSpot}
        onCancel={() => setShowConfirmReveal(false)}
      />

      <LeaderboardOverlay
        open={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        standings={data.standings}
        yourRank={data.rank}
      />
    </>
  );
}

/* ───────────────────────── Leaderboard button ───────────────────────── */

function LeaderboardButton({
  rank,
  onClick,
}: {
  rank: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-black/5 bg-white px-4 py-3.5 text-left shadow-[0_3px_0_rgba(0,0,0,0.05)] transition active:translate-y-[1px] active:shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #FFC800 0%, #FF9500 100%)",
          boxShadow: "0 3px 0 #E0A800, inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        <TrophyMini />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#777] dark:text-white/55">
          Live Standings
        </span>
        <span className="mt-0.5 block font-display text-[15px] font-extrabold tracking-tight text-[#2B2B2B] dark:text-white">
          You're <span className="text-[#3A8400] dark:text-emerald-300">#{rank}</span> in the hunt
        </span>
      </span>
      <span className="text-[#1CB0F6] transition-transform group-hover:translate-x-0.5">
        <ChevronRight />
      </span>
    </button>
  );
}

function TrophyMini() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4h10v4a5 5 0 11-10 0V4z"
        fill="white"
        stroke="#7A5A00"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M5 6H3v2a3 3 0 003 3M19 6h2v2a3 3 0 01-3 3"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 14v3h4v-3M8 20h8"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ───────────────────────── Dev controls (dev only) ───────────────────────── */

function DevControls({
  onCelebrate,
  onExpire,
}: {
  onCelebrate: () => void;
  onExpire: () => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-black/15 bg-[#FAFAFA] px-3 py-2 text-[11px] font-semibold text-[#777] dark:border-white/15 dark:bg-white/[0.02] dark:text-white/55">
      <span className="uppercase tracking-[0.18em]">Dev</span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCelebrate}
          className="rounded-full bg-[#58CC02] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-[0_2px_0_#3A8400] active:translate-y-[1px]"
        >
          Trigger celebration
        </button>
        <button
          type="button"
          onClick={onExpire}
          className="rounded-full bg-[#FF4B4B] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-[0_2px_0_#C03030] active:translate-y-[1px]"
        >
          Trigger expiry
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────────── Top row ───────────────────────────── */

function TopRow({
  team,
  roll,
  status,
}: {
  team: string;
  roll: string;
  status: HuntStatus;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#777] dark:text-white/45">
          Roll {roll}
        </div>
        <div className="mt-1 truncate font-display text-2xl font-extrabold tracking-tight gradient-text sm:text-3xl">
          {team}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <LiveClock />
        <StatusPill status={status} />
      </div>
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return (
    <div className="font-display text-[15px] font-extrabold tabular-nums text-[#2B2B2B] dark:text-white sm:text-base">
      {time}
    </div>
  );
}

function StatusPill({ status }: { status: HuntStatus }) {
  const styles: Record<HuntStatus, { bg: string; fg: string; dot: string }> = {
    "Active Hunt": {
      bg: "bg-[#E8FFD1] dark:bg-emerald-500/15",
      fg: "text-[#3A8400] dark:text-emerald-300",
      dot: "#58CC02",
    },
    "Mini-game": {
      bg: "bg-[#F2EBFF] dark:bg-violet-500/15",
      fg: "text-[#6B3FE3] dark:text-violet-300",
      dot: "#8B5CF6",
    },
    Arrived: {
      bg: "bg-[#FFF1B8] dark:bg-amber-500/15",
      fg: "text-[#7A5A00] dark:text-amber-200",
      dot: "#FFC800",
    },
  };
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] ${s.bg} ${s.fg}`}
    >
      <span
        className="relative inline-flex h-1.5 w-1.5"
        aria-hidden
      >
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
          style={{ background: s.dot }}
        />
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ background: s.dot }}
        />
      </span>
      {status}
    </span>
  );
}

/* ───────────────────────────── Timer ───────────────────────────── */

function TimerDisplay({
  endsAt,
  status,
  onExpire,
}: {
  endsAt: number;
  status: HuntStatus;
  onExpire?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const remainingMs = endsAt - now;
  const negative = remainingMs < 0;

  // Fire onExpire exactly once when the timer crosses zero during this mount.
  // Don't fire if dashboard mounted with an already-expired timer (avoid
  // unwanted overlay on initial paint).
  const prevRemainingRef = useRef(remainingMs);
  const firedRef = useRef(false);
  useEffect(() => {
    const prev = prevRemainingRef.current;
    if (
      !firedRef.current &&
      status === "Active Hunt" &&
      prev > 0 &&
      remainingMs <= 0
    ) {
      firedRef.current = true;
      onExpire?.();
    }
    prevRemainingRef.current = remainingMs;
  }, [remainingMs, status, onExpire]);
  const absSec = Math.floor(Math.abs(remainingMs) / 1000);
  const mins = Math.floor(absSec / 60);
  const secs = absSec % 60;
  const display = `${negative ? "−" : ""}${mins}:${String(secs).padStart(2, "0")}`;

  // Color thresholds (apply only when status is Active Hunt)
  const isActive = status === "Active Hunt";
  let color = "text-[#2B2B2B] dark:text-white";
  let pulse = false;
  if (isActive) {
    if (negative) {
      color = "text-[#FF4B4B]";
      pulse = true;
    } else if (remainingMs <= 5 * 60 * 1000) {
      color = "text-[#FF4B4B]";
      pulse = true;
    } else if (remainingMs <= 10 * 60 * 1000) {
      color = "text-[#FF9500]";
    } else {
      color = "text-[#3A8400]";
    }
  } else {
    color = "text-[#777] dark:text-white/55";
  }

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-black/5 bg-white px-5 py-6 text-center shadow-[0_3px_0_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/[0.02] dark:shadow-none"
      aria-live="polite"
    >
      <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#777] dark:text-white/45">
        {isActive
          ? negative
            ? "Overtime"
            : "Time remaining"
          : "Status"}
      </div>
      {isActive ? (
        <motion.div
          key={display}
          initial={{ opacity: 0.6, y: 4 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: pulse ? [1, 1.03, 1] : 1,
          }}
          transition={{
            duration: pulse ? 0.9 : 0.2,
            repeat: pulse ? Infinity : 0,
            ease: "easeInOut",
          }}
          className={`mt-2 font-display text-6xl font-extrabold tabular-nums tracking-tight sm:text-7xl ${color}`}
        >
          {display}
        </motion.div>
      ) : (
        <div
          className={`mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl ${color}`}
        >
          {status}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Score row ───────────────────────────── */

function ScoreRow({
  points,
  penalties,
}: {
  points: number;
  penalties: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <ScoreTile
        label="Points"
        value={`+${points.toLocaleString()}`}
        bg="bg-[#E8FFD1] dark:bg-emerald-500/10"
        fg="text-[#3A8400] dark:text-emerald-300"
      />
      <ScoreTile
        label="Penalties"
        value={`−${penalties.toLocaleString()}`}
        bg="bg-[#FFE4E4] dark:bg-rose-500/10"
        fg="text-[#C03030] dark:text-rose-300"
      />
    </div>
  );
}

function ScoreTile({
  label,
  value,
  bg,
  fg,
}: {
  label: string;
  value: string;
  bg: string;
  fg: string;
}) {
  return (
    <div className={`rounded-2xl px-4 py-3.5 ${bg}`}>
      <div
        className={`text-[10px] font-extrabold uppercase tracking-[0.22em] opacity-80 ${fg}`}
      >
        {label}
      </div>
      <div
        className={`mt-0.5 font-display text-2xl font-extrabold tabular-nums tracking-tight sm:text-3xl ${fg}`}
      >
        {value}
      </div>
    </div>
  );
}

/* ───────────────────────────── Clue ───────────────────────────── */

function ClueCard({ clue }: { clue: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 shadow-[0_3px_0_rgba(0,0,0,0.05)] sm:p-8 dark:border-white/10 dark:bg-white/[0.02] dark:shadow-none"
    >
      <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#777] dark:text-white/45">
        <PinIcon />
        Current Clue
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold leading-snug tracking-tight text-[#2B2B2B] sm:text-[28px] sm:leading-snug dark:text-white">
        {clue}
      </p>
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22s7-7.2 7-12a7 7 0 10-14 0c0 4.8 7 12 7 12z"
        stroke="#1CB0F6"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="#1CB0F6"
        fillOpacity="0.18"
      />
      <circle cx="12" cy="10" r="2.5" stroke="#1CB0F6" strokeWidth="1.8" />
    </svg>
  );
}

/* ───────────────────────────── Squad ───────────────────────────── */

function SquadList({ members }: { members: string[] }) {
  return (
    <div>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#777] dark:text-white/45">
        Squad
      </div>
      <ul className="mt-2 grid gap-1.5">
        {members.map((m) => (
          <li
            key={m}
            className="flex items-center gap-2 rounded-2xl border border-black/5 bg-[#FAFAFA] px-3 py-2.5 text-[15px] font-semibold text-[#2B2B2B] dark:border-white/5 dark:bg-white/[0.02] dark:text-white/85"
          >
            <Dot />
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Dot() {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: "#58CC02" }}
    />
  );
}
