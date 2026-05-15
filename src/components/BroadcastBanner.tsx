import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Broadcast } from "@/hooks/useBroadcastListener";

interface Props {
  broadcast: Broadcast | null;
}

export function BroadcastBanner({ broadcast }: Props) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<Broadcast | null>(null);

  useEffect(() => {
    if (broadcast) {
      setCurrent(broadcast);
      setVisible(true);
    }
  }, [broadcast]);

  const time = current
    ? new Date(current.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <AnimatePresence>
      {visible && current && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed left-4 right-4 top-4 z-[60] mx-auto max-w-xl"
        >
          <div
            className="relative overflow-hidden rounded-2xl border-2 px-5 py-4 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #1c1050, #2a1060)",
              borderColor: "rgba(139,92,246,0.4)",
            }}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl">📢</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "#a78bfa" }}>
                    Broadcast from {current.sender}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {time}
                  </span>
                </div>
                <p className="mt-1 text-[15px] font-bold leading-relaxed" style={{ color: "#f3f4f6" }}>
                  {current.message}
                </p>
              </div>
              <button
                onClick={() => setVisible(false)}
                className="ripple touch-press shrink-0 rounded-xl px-2.5 py-1.5 text-[12px] font-extrabold transition-opacity hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
              >
                ✕
              </button>
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 0%, rgba(139,92,246,0.1) 0%, transparent 60%)",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
