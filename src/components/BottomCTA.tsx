import { motion } from "motion/react";

export function BottomCTA() {

  const handleBeginHunt = () => {
    window.dispatchEvent(new CustomEvent("open-lookup", { detail: "register" }));
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#1A1A1A] border-4 border-[var(--border-soft)] rounded-[32px] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden"
          style={{ borderBottomWidth: "12px" }}
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

          <h2 className="font-display text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Ready to embark on <span className="text-[var(--color-brand-green)]">a Journey?</span>
          </h2>

          <p className="text-[#888] font-bold text-lg mb-10 max-w-2xl mx-auto">
            Join the most exciting treasure hunt of the year. Challenge your mind, explore the campus, and win amazing prizes!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
            <button
              onClick={handleBeginHunt}
              className="btn-press ripple btn-press--lg btn-primary w-full sm:w-auto min-w-[200px]"
            >
              Begin Hunt
            </button>
          </div>
        </motion.div>
      </div>


    </section>
  );
}
