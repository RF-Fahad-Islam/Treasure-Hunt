import { useState, useRef, useCallback, type ReactNode } from "react";

interface Props {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
}

const THRESHOLD = 80;
const MAX_PULL = 140;

export function PullToRefresh({ onRefresh, children, disabled }: Props) {
  const [state, setState] = useState<"idle" | "pulling" | "ready" | "refreshing">("idle");
  const [pull, setPull] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      setPull(0);
      setState("pulling");
    },
    [disabled],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (state === "refreshing") return;
      const raw = Math.max(0, e.touches[0].clientY - startY.current);
      const dist = Math.min(raw, MAX_PULL);
      setPull(dist);
      if (dist >= THRESHOLD) {
        setState("ready");
      } else if (state === "ready") {
        setState("pulling");
      }
    },
    [state],
  );

  const handleTouchEnd = useCallback(async () => {
    if (state === "ready") {
      setState("refreshing");
      setPull(0);
      try {
        await onRefresh();
      } catch { /* ignore */ }
    }
    setState("idle");
    setPull(0);
  }, [state, onRefresh]);

  const progress = Math.min(pull / THRESHOLD, 1);
  const rotation = pull * 1.8;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        minHeight: "100%",
        transform: state === "refreshing" ? "translateY(0)" : `translateY(${pull * 0.4}px)`,
        transition: state === "idle" || state === "refreshing" ? "transform 0.3s cubic-bezier(0.32, 0.94, 0.6, 1)" : "none",
      }}
    >
      {/* Pull indicator */}
      <div
        style={{
          height: state === "refreshing" ? 48 : pull * 0.4,
          opacity: state === "refreshing" ? 1 : progress,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: state === "refreshing" ? "height 0.3s cubic-bezier(0.32, 0.94, 0.6, 1), opacity 0.2s ease" : "none",
          position: "relative",
          marginTop: pull * 0.4 > 0 ? 0 : 0,
        }}
      >
        {state === "refreshing" ? (
          <Spinner />
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: state === "pulling" ? "transform 0.05s linear" : "transform 0.2s ease",
            }}
          >
            <circle
              cx="12" cy="12" r="9"
              stroke="#E0E0E0"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="12" cy="12" r="9"
              stroke={state === "ready" ? "#58CC02" : "#1CB0F6"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${progress * 56} 56`}
              strokeDashoffset="0"
              style={{ transition: "stroke-dasharray 0.08s linear, stroke 0.15s ease" }}
            />
          </svg>
        )}
      </div>

      {/* Pull hint text */}
      <div
        style={{
          height: state === "refreshing" ? 20 : pull * 0.4 > 16 ? pull * 0.4 - 16 : 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          opacity: state === "refreshing" ? 1 : Math.max(0, (pull - 16) / 30),
          transition: state === "refreshing" ? "height 0.3s cubic-bezier(0.32, 0.94, 0.6, 1), opacity 0.2s ease" : "none",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.05em",
            color: state === "ready" ? "#58CC02" : "#999",
            textTransform: "uppercase",
          }}
        >
          {state === "ready" ? "Release to refresh" : "Pull to refresh"}
        </span>
      </div>

      {children}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      style={{
        animation: "ptr-spin 0.8s linear infinite",
      }}
    >
      <circle cx="12" cy="12" r="9" stroke="#E0E0E0" strokeWidth="3" strokeLinecap="round" />
      <circle
        cx="12" cy="12" r="9"
        stroke="#1CB0F6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="28 56"
        strokeDashoffset="0"
      />
      <style>{`@keyframes ptr-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
