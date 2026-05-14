import { motion } from "motion/react";
import { Logo } from "./Logo";
import { Reveal } from "./Reveal";

export function Footer() {
  return (
    <footer className="relative z-10 mt-16 px-5 pb-10 pt-12 sm:px-8">
      <motion.div
        aria-hidden
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-10 h-px max-w-6xl origin-center bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/15"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <Reveal direction="left" className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-extrabold tracking-tight text-[#2B2B2B] dark:text-white">
              Treasure Hunt
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#777] dark:text-white/45">
              University of Dhaka · CSE
            </span>
          </div>
        </Reveal>

        <Reveal
          direction="right"
          delay={0.1}
          className="flex flex-col gap-1 text-sm font-semibold text-[#777] dark:text-white/55 sm:items-end sm:text-right"
        >
          <span>Built by students, for students.</span>
          <span className="text-xs text-[#999] dark:text-white/35">
            © {new Date().getFullYear()} DU CSE · The Hunt
          </span>
        </Reveal>
      </div>
    </footer>
  );
}
