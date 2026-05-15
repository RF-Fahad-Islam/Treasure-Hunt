import { motion } from "motion/react";
import { EnterLobbyForm } from "./EnterLobbyForm";

export function BottomCTA() {
  const handleRegister = () => {
    window.dispatchEvent(new CustomEvent("open-lookup", { detail: "register" }));
  };

  return (
    <section className="py-24 px-5 sm:px-8 bg-[#F7F7F7] dark:bg-[#0A0A0A] relative overflow-hidden">
      {/* Decorative background elements - adjusted for light theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[var(--color-brand-green)]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-[#1A1A1A] border-4 border-black/[0.03] dark:border-white/5 rounded-[40px] p-8 md:p-16 text-center shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] relative overflow-hidden"
          style={{ borderBottomWidth: "12px", borderBottomColor: "rgba(0,0,0,0.05)" }}
        >
          {/* Subtle top highlight */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-black/[0.05] to-transparent" />

          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-[clamp(2rem,6vw,4rem)] font-black text-[#2B2B2B] dark:text-white mb-6 leading-[1.1] tracking-tight">
              Ready to embark on <br />
              <span className="text-[var(--color-brand-green)]">a Journey?</span>
            </h2>

            <p className="text-[#777] dark:text-white/60 font-semibold text-[17px] md:text-[19px] mb-12 leading-relaxed">
              Check the rules below and enter the participant lobby. <br className="hidden md:block" />
              Not registered yet? <button onClick={handleRegister} className="text-[var(--color-brand-green)] hover:underline font-black">Register here</button> to join the hunt!
            </p>

            <div className="mt-12 text-left">
              <EnterLobbyForm />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


