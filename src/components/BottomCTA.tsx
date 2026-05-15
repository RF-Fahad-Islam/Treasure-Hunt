import { motion } from "motion/react";
import { RulebookDeck } from "./RulebookDeck";

export function BottomCTA() {
  const handleRegister = () => {
    window.dispatchEvent(new CustomEvent("open-lookup", { detail: "register" }));
  };

  const handleOpenLobby = () => {
    window.dispatchEvent(new CustomEvent("open-lobby"));
  };

  return (
    <section className="py-24 px-5 sm:px-8 bg-[#F7F7F7] dark:bg-[#0A0A0A] relative overflow-hidden">
      {/* Decorative background elements */}
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
            <h2 className="font-display text-[clamp(2.2rem,6vw,4rem)] font-black text-[#2B2B2B] dark:text-white mb-6 leading-[1.1] tracking-tight">
              Ready to embark on <br />
              <span className="text-[var(--color-brand-green)]">a Journey?</span>
            </h2>

            <p className="text-[#777] dark:text-white/60 font-semibold text-[17px] md:text-[19px] mb-12 leading-relaxed">
              Check the rules below and enter the participant lobby. <br className="hidden md:block" />
              Not registered yet? <button onClick={handleRegister} className="text-[var(--color-brand-green)] hover:underline font-black">Register here</button> to join the hunt!
            </p>

            <div className="mt-12 text-left space-y-12">
              <RulebookDeck />
              
              <div className="flex flex-col items-center gap-6">
                <button
                  onClick={handleOpenLobby}
                  className="group relative w-full max-w-md"
                >
                  <div className="absolute inset-0 bg-[#3A8400] rounded-2xl translate-y-2 group-active:translate-y-1 transition-transform" />
                  <div className="relative bg-[#58CC02] rounded-2xl px-8 py-5 text-white font-black text-lg md:text-xl flex items-center justify-center gap-3 hover:-translate-y-1 group-active:translate-y-1 transition-all">
                    Enter Participant Lobby 🎮
                  </div>
                </button>
                
                <p className="text-[13px] font-bold text-[#999] uppercase tracking-widest">
                  Secure Entry · Team Verified
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}




