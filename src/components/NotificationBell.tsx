import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchNotifications, markAllRead } from "@/services/notifications";
import type { Notification } from "@/types";

interface Props {
  teamId: string;
  /** Called when new notifications arrive so parent can show SuccessOverlay etc. */
  onNewPoints?: (points: number) => void;
  /** If true, dropdown opens upward (for bottom-anchored placement) */
  dropUp?: boolean;
}

export function NotificationBell({ teamId, onNewPoints, dropUp }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevLenRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!teamId) return;
    let mounted = true;

    async function poll() {
      try {
        const result = await fetchNotifications(teamId);
        if (!mounted) return;
        if (result.length > prevLenRef.current && prevLenRef.current > 0) {
          const newOnes = result.slice(0, result.length - prevLenRef.current);
          for (const n of newOnes) {
            if (n.type === "points" && n.points > 0) {
              onNewPoints?.(n.points);
            }
          }
        }
        prevLenRef.current = result.length;
        setNotifications(result);
      } catch { /* silent */ }
    }

    poll();
    const interval = setInterval(poll, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [teamId, onNewPoints]);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full bg-[var(--surface)] p-2.5 shadow-xl hover:opacity-80 transition-opacity"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg)" }} />
          <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg)" }} />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-brand-red)] text-white text-[10px] font-extrabold flex items-center justify-center shadow-lg">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: dropUp ? 8 : -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropUp ? 8 : -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${dropUp ? "bottom-full mb-2" : "left-0 mt-2"} w-80 sm:w-96 rounded-2xl bg-[#1A1A1A] border border-[var(--border-soft)] shadow-2xl overflow-hidden z-50`}
            style={{ maxHeight: "70vh" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-white">Notifications</h3>
              {unread > 0 && (
                <button
                  onClick={async () => { await markAllRead(teamId); setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); }}
                  className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--color-brand-blue)] hover:opacity-80"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "50vh" }}>
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-3xl mb-2">🔔</p>
                  <p className="text-[13px] font-bold text-[#888]">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3.5 border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                    style={{ opacity: n.read ? 0.6 : 1 }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: n.type === "points" ? "rgba(88,204,2,0.15)" : "rgba(28,176,246,0.15)" }}>
                      {n.type === "points" ? "⭐" : "📢"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-white truncate">{n.title}</p>
                      <p className="text-[12px] font-semibold text-[#888] mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] font-bold text-[#666] mt-1">
                        {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                      </p>
                    </div>
                    {n.points > 0 && (
                      <span className="text-[13px] font-extrabold shrink-0" style={{ color: "var(--color-brand-green)" }}>
                        +{n.points}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
