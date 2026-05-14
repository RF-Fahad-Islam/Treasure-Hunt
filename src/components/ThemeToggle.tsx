import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#2B2B2B] transition active:translate-y-[1px] dark:border-white/10 dark:bg-white/5 dark:text-white"
      style={{
        boxShadow: isDark
          ? "0 2px 0 rgba(0,0,0,0.4)"
          : "0 2px 0 rgba(0,0,0,0.08)",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.25 }}
            className="absolute"
          >
            <MoonIcon />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.25 }}
            className="absolute"
          >
            <SunIcon />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" fill="#FFC800" />
      <g stroke="#FFC800" strokeWidth="2" strokeLinecap="round">
        <path d="M12 3v2.5" />
        <path d="M12 18.5V21" />
        <path d="M3 12h2.5" />
        <path d="M18.5 12H21" />
        <path d="M5.5 5.5l1.8 1.8" />
        <path d="M16.7 16.7l1.8 1.8" />
        <path d="M5.5 18.5l1.8-1.8" />
        <path d="M16.7 7.3l1.8-1.8" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20.5 14.3A8.5 8.5 0 119.7 3.5a7 7 0 0010.8 10.8z"
        fill="#C4B5FD"
        stroke="#C4B5FD"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
