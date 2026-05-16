import { useState, useEffect } from "react";
import { motion } from "motion/react";

interface Props {
  startedAt: string | null;
  timeoutAckAt?: string | null;
  timeLimitMinutes: number;
  onTimeout: () => void;
  paused?: boolean;
}

export function CountdownTimer({ startedAt, timeoutAckAt, timeLimitMinutes, onTimeout, paused }: Props) {
  const [remaining, setRemaining] = useState<number>(0);
  const [elapsedAck, setElapsedAck] = useState<number>(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!startedAt) return;
    if (paused) return;

    const limitMs = timeLimitMinutes * 60 * 1000;
    const startMs = new Date(startedAt).getTime();
    const ackMs = timeoutAckAt ? new Date(timeoutAckAt).getTime() : null;

    function tick() {
      const now = Date.now();
      const elapsed = now - startMs;
      const left = Math.max(0, limitMs - elapsed);
      setRemaining(left);

      if (ackMs) {
        setElapsedAck(Math.max(0, now - ackMs));
      }

      if (left <= 0 && !expired && !timeoutAckAt) {
        setExpired(true);
        onTimeout();
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt, timeoutAckAt, timeLimitMinutes, paused, expired, onTimeout]);

  // If we have acknowledged the timeout, show a count-up timer
  if (timeoutAckAt) {
    const totalSec = Math.floor(elapsedAck / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    return (
      <motion.div
        className="flex flex-col items-center gap-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "#FF4B4B" }}>
          Extra Time (1pt / 2min)
        </span>
        <span
          className="font-display text-[42px] font-extrabold leading-none tabular-nums"
          style={{ color: "#FF4B4B" }}
        >
          {display}
        </span>
      </motion.div>
    );
  }

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
        {remaining <= 0 ? "Time's up!" : "Time Remaining"}
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
