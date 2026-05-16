import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getAvatarUrl } from "@/lib/avatar";
import { useAuthStore } from "@/store/authStore";
import type { Participant } from "@/types";

interface Props {
  teamName: string;
  teamSeed: string;
  teamMembers: Participant[];
  hasGps?: boolean;
  onTeamNameEdit: () => void;
  onTeamAvatarEdit: () => void;
}

export function OSStatusBar({ teamName, teamSeed, teamMembers, hasGps = false, onTeamNameEdit, onTeamAvatarEdit }: Props) {
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const clearSession = useAuthStore((s) => s.clearSession);
  const me = teamMembers.find((p) => p.id === (useAuthStore.getState().session?.role === "team" ? (useAuthStore.getState().session as any)?.participantId : null));
  const isLeader = me?.is_leader === true;

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 backdrop-blur-xl border-b"
      style={{ paddingTop: "calc(0.625rem + env(safe-area-inset-top, 0px))", paddingBottom: "0.625rem", background: "var(--surface)", borderColor: "var(--border-soft)" }}>
      {/* Left: Clock */}
      <div className="flex items-center gap-2">
        <span className="text-[16px] font-extrabold tabular-nums tracking-wide"
          style={{ color: "var(--fg)" }}>
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
        </span>
      </div>

      {/* Center: Notifications */}
      <div className="flex items-center gap-3">
        {hasGps && (
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold"
            style={{ background: "#F0FFF0", color: "#22c55e", boxShadow: "0 2px 0 rgba(34,197,94,0.15)" }}>
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />GPS
          </span>
        )}
      </div>

      {/* Right: Team avatar + menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all hover:opacity-80"
          style={{ background: "var(--surface)", boxShadow: "0 2px 0 var(--border-soft), 0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <img
            src={getAvatarUrl(teamSeed, 32)}
            alt={teamName}
            className="w-7 h-7 rounded-lg shrink-0"
          />
          <span className="text-[13px] font-black max-w-[100px] truncate" style={{ color: "var(--fg)" }}>{teamName}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: "var(--fg-muted)" }}
            className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}>
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden z-50"
              style={{ background: "var(--surface)", boxShadow: "0 4px 0 var(--border-strong), 0 16px 32px -8px rgba(0,0,0,0.12)", border: "1px solid var(--border-soft)" }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-soft)" }}>
                <p className="text-[13px] font-black" style={{ color: "var(--fg)" }}>{teamName}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--fg-muted)" }}>{teamMembers.length} members</p>
              </div>
              {isLeader && (
                <>
                  <button
                    onClick={() => { setMenuOpen(false); onTeamNameEdit(); }}
                    className="w-full text-left px-4 py-3 text-[13px] font-bold transition-colors flex items-center gap-2"
                    style={{ color: "var(--fg)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    Edit Team Name
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onTeamAvatarEdit(); }}
                    className="w-full text-left px-4 py-3 text-[13px] font-bold transition-colors flex items-center gap-2"
                    style={{ color: "var(--fg)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Change Team Logo
                  </button>
                </>
              )}
              <button
                onClick={() => { setMenuOpen(false); clearSession(); }}
                className="w-full text-left px-4 py-3 text-[13px] font-bold transition-colors flex items-center gap-2"
                style={{ color: "#FF4B4B" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.03)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                Log Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
