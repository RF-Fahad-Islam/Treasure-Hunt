import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { RollLookup } from "./RollLookup";
import { useSession, useAuthStore } from "@/store/authStore";

const ROLE_LABEL: Record<string, string> = {
  team: "🏃 Team",
  "spot-leader": "📍 Spot Lead",
  admin: "⚙️ Admin",
};

const ROLE_PATH: Record<string, string> = {
  team: "/team",
  "spot-leader": "/spot-leader",
  admin: "/admin",
};

export function Nav() {
  const session = useSession();
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials = session
    ? ("participantName" in session
        ? (session as any).participantName
        : "spotName" in session
          ? (session as any).spotName
          : "AD"
      )
        .split(" ")
        .map((s: string) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  return (
    <>
      <RollLookup open={showLookup} onClose={() => setShowLookup(false)} />
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled ? "py-2" : "py-4",
        ].join(" ")}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div
            className={[
              "flex items-center justify-between rounded-3xl px-3 py-2.5 transition-all duration-300",
              scrolled
                ? "border border-black/5 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]"
                : "bg-transparent",
            ].join(" ")}
          >
            <a href="#top" className="flex items-center gap-2.5">
              <Logo className="h-9 w-9" />
              <div className="flex flex-col leading-none">
                <span className="font-display text-[16px] font-extrabold tracking-tight">
                  Treasure Hunt
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#777777] dark:text-white/45">
                  DU · CSE
                </span>
              </div>
            </a>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              {session ? (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu((v) => !v)}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-extrabold transition-all"
                    style={{ background: "var(--surface)", color: "var(--fg)" }}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-extrabold text-white"
                      style={{ background: "var(--color-brand-green)" }}
                    >
                      {initials}
                    </span>
                  </button>

                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                      <div
                        className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border p-3 shadow-lg"
                        style={{ background: "var(--surface)", borderColor: "var(--border-soft)" }}
                      >
                        <p className="mb-1 px-2 text-[14px] font-extrabold truncate" style={{ color: "var(--fg)" }}>
                          {"participantName" in session
                            ? (session as any).participantName
                            : "spotName" in session
                              ? (session as any).spotName
                              : "Admin"}
                        </p>
                        <p className="mb-3 px-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
                          {ROLE_LABEL[session.role] ?? session.role}
                        </p>
                        <button
                          onClick={() => { setShowMenu(false); navigate(ROLE_PATH[session.role] ?? "/"); }}
                          className="w-full rounded-xl px-3 py-2.5 text-[13px] font-bold text-left transition-all"
                          style={{ color: "var(--fg)" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--border-soft)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          🚀 Dashboard
                        </button>
                        <button
                          onClick={() => { setShowMenu(false); clearSession(); navigate("/"); }}
                          className="ripple touch-press w-full rounded-xl px-3 py-2.5 text-[13px] font-bold text-left transition-all"
                          style={{ color: "var(--color-brand-red)" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,75,75,0.08)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          🚪 Log out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLookup(true)}
                  className="group relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-extrabold uppercase tracking-wide text-white transition active:translate-y-[1px]"
                  style={{
                    background: "var(--color-brand-green)",
                    boxShadow: "0 3px 0 var(--color-brand-green-shadow)",
                  }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  Find team
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
