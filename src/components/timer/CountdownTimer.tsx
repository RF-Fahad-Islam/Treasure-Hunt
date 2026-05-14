import { useState, useEffect } from "react";
import { motion } from "motion/react";

interface Props {
  startedAt: string | null;
  timeLimitMinutes: number;
  onTimeout: () => void;
  paused?: boolean;
}

export function CountdownTimer({ startedAt, timeLimitMinutes, onTimeout, paused }: Props) {
  const [remaining, setRemaining] = useState<number>(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!startedAt) return;
    if (paused) return;

    const limitMs = timeLimitMinutes * 60 * 1000;
    const startMs = new Date(startedAt).getTime();

    function tick() {
      const elapsed = Date.now() - startMs;
      const left = Math.max(0, limitMs - elapsed);
      setRemaining(left);

      if (left <= 0 && !expired) {
        setExpired(true);
        onTimeout();
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt, timeLimitMinutes, paused, expired, onTimeout]);

  const totalSec = Math.ceil(remaining / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const fraction = startedAt ? remaining / (timeLimitMinutes * 60 * 1000) : 1;
  const urgent = fraction < 0.1;
  const warning = fraction < 0.25 && !urgent;

  let color = "var(--color-brand-green)";
  if (urgent) color = "var(--color-brand-red)";
  else if (warning) color = "var(--color-brand-gold)";

  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      animate={urgent ? { scale: [1, 1.04, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1.5 }}
    >
      <span className="text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--fg-muted)" }}>
        {expired ? "Time's up!" : "Time Remaining"}
      </span>
      <span
        className="font-display text-[42px] font-extrabold leading-none tabular-nums"
        style={{ color }}
      >
        {display}
      </span>
    </motion.div>
  );
}
