import { useState, useRef, useCallback, type ReactNode } from "react";
import { motion } from "motion/react";

interface Props {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
}

export function PullToRefresh({ onRefresh, children, disabled }: Props) {
  const [state, setState] = useState<"idle" | "pulling" | "releasing" | "refreshing">("idle");
  const startY = useRef(0);
  const pullDist = useRef(0);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      pullDist.current = 0;
      setState("pulling");
    },
    [disabled],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (state === "idle" || state === "refreshing") return;
      const dist = Math.max(0, e.touches[0].clientY - startY.current);
      pullDist.current = dist;
      if (dist > 80) setState("releasing");
    },
    [state],
  );

  const handleTouchEnd = useCallback(async () => {
    if (state === "releasing") {
      setState("refreshing");
      try {
        await onRefresh();
      } catch { /* ignore */ }
    }
    setState("idle");
    pullDist.current = 0;
  }, [state, onRefresh]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ minHeight: "100%" }}
    >
      {/* Pull indicator */}
      <motion.div
        animate={{
          height: state === "refreshing" ? 48 : Math.min(pullDist.current * 0.4, 80),
          opacity: state === "refreshing" ? 1 : Math.min(pullDist.current / 80, 1),
        }}
        className="flex items-center justify-center overflow-hidden"
      >
        {state === "refreshing" ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="text-xl"
          >
            🔄
          </motion.span>
        ) : state === "releasing" ? (
          <span className="text-lg">⬆️</span>
        ) : pullDist.current > 0 ? (
          <span className="text-lg">⬇️</span>
        ) : null}
      </motion.div>

      {children}
    </div>
  );
}
