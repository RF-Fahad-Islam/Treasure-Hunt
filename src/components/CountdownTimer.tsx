import { useEffect, useState } from "react";
import { motion } from "motion/react";

export function CountdownTimer() {
  // Hardcoded target date for May 16, 7:30 AM (local time +06:00)
  const [targetTime] = useState<Date>(new Date("2026-05-16T07:30:00+06:00"));
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [loading] = useState(false);

  useEffect(() => {
    if (!targetTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        clearInterval(interval);
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({ d, h, m, s });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  if (loading || !timeLeft) return null;

  return (
    <section className="relative overflow-hidden py-24 sm:py-32 bg-[#05030A]">
      {/* Decorative gradient orb */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-brand-green)] opacity-[0.15] blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-[#58CC02] mb-6"
          >
            ⏳ The Hunt Begins In
          </motion.div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8">
          <TimeUnit value={timeLeft.d} label="Days" />
          <Separator />
          <TimeUnit value={timeLeft.h} label="Hours" />
          <Separator />
          <TimeUnit value={timeLeft.m} label="Minutes" />
          <Separator />
          <TimeUnit value={timeLeft.s} label="Seconds" />
        </div>
      </div>
    </section>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="flex flex-col items-center"
    >
      <div className="relative w-20 h-24 sm:w-28 sm:h-32 md:w-32 md:h-36 bg-[#1A1A1A] border border-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl">
        {/* Inner glass reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        
        {/* Flip line */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-black/40 -translate-y-1/2 z-10" />

        <span className="font-display text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-tighter drop-shadow-lg tabular-nums">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="mt-4 text-[12px] sm:text-[14px] font-extrabold uppercase tracking-[0.3em] text-[#888]">
        {label}
      </span>
    </motion.div>
  );
}

function Separator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="flex flex-col justify-center items-center gap-3 sm:gap-4 h-24 sm:h-32 md:h-36 pb-2"
    >
      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#58CC02] opacity-80 shadow-[0_0_15px_rgba(88,204,2,0.5)]" />
      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#58CC02] opacity-80 shadow-[0_0_15px_rgba(88,204,2,0.5)]" />
    </motion.div>
  );
}
