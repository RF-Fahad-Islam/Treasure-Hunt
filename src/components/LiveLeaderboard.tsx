import { motion } from "motion/react";
import { Reveal, WordReveal } from "./Reveal";

export function LiveLeaderboard() {
  return (
    <section className="relative px-5 py-24 sm:px-8 sm:py-32" id="leaderboard">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <Reveal
            duration={0.6}
            className="inline-block rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em]"
            style={{
              background: "rgba(255,200,0,0.12)",
              color: "var(--color-brand-gold)",
            }}
          >
            Coming Soon
          </Reveal>
          <h2 className="mt-4 font-display text-[clamp(2rem,7vw,3.25rem)] font-extrabold leading-tight tracking-tight">
            <WordReveal text="Live Standings" />{" "}
            <WordReveal text="🏆" className="gradient-text" delay={0.2} />
          </h2>
        </div>

        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-12 overflow-hidden rounded-[32px] border-2 p-12 text-center"
          style={{
            borderColor: "rgba(255,200,0,0.2)",
            background: "var(--surface)",
          }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="mb-4 text-6xl"
          >
            🔒
          </motion.div>

          <h3 className="font-display text-[28px] font-extrabold" style={{ color: "var(--fg)" }}>
            Leaderboard Locked
          </h3>
          <p className="mt-2 text-[15px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            Live standings will appear here once the hunt begins. Stay tuned!
          </p>

          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(255,200,0,0.06) 0%, transparent 60%)",
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}
