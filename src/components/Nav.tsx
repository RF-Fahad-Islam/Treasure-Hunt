import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
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
            <a
              href="#roll"
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
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
