import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { Reveal } from "./Reveal";
import { Lock, Sparkles, Key, Trophy } from "lucide-react";
import { GlobalRiddleLeaderboard } from "./GlobalRiddleLeaderboard";
import { insforge } from "@/lib/insforge";

const CODE = "0849";

export function TreasurePuzzle() {
  const [input, setInput] = useState("");
  const [isOpened, setIsOpened] = useState(false);
  const [isError, setIsError] = useState(false);
  const [solverName, setSolverName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleKeypad = (val: string) => {
    if (isOpened) return;
    if (input.length < 4) {
      const newInput = input + val;
      setInput(newInput);
      if (newInput.length === 4) {
        if (newInput === CODE) {
          triggerSuccess();
        } else {
          triggerError();
        }
      }
    }
  };

  const triggerSuccess = () => {
    setIsOpened(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FFC800", "#58CC02", "#1CB0F6", "#FF4B4B"],
    });
  };

  const triggerError = () => {
    setIsError(true);
    setTimeout(() => {
      setIsError(false);
      setInput("");
    }, 600);
  };

  const handleClaimSpot = async () => {
    if (!solverName.trim() || submitting) return;
    setSubmitting(true);
    try {
      await insforge.database.from("mini_game_scores").insert([{ nickname: solverName.trim(), score: 0 }]);
      setSubmitted(true);
    } catch { /* silent */ }
    setSubmitting(false);
  };

  return (
    <section className="relative py-24 px-5 sm:px-8 overflow-hidden bg-[#F7F7F7] dark:bg-[#0A0A0A]">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <Reveal>
            <span className="inline-block px-3 py-1 rounded-full bg-[#FFC800]/10 border border-[#FFC800]/20 text-[11px] font-black uppercase tracking-[0.2em] text-[#7A5A00] dark:text-[#FFC800] mb-6">
              The Secret Vault
            </span>
          </Reveal>
          
          <Reveal delay={0.1}>
            <h2 className="font-display text-[clamp(2rem,7vw,3.5rem)] font-black leading-tight tracking-tight text-[#2B2B2B] dark:text-white mb-6">
              Solve the riddle. <br />
              <span className="text-[#FFC800]">Claim the glory.</span>
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Puzzle content */}
          <div className="lg:col-span-3 flex flex-col items-center">
            <Reveal delay={0.2}>
              <div className="max-w-xl w-full mb-8">
                <p className="text-[17px] font-semibold text-[#777] dark:text-white/60 mb-6 text-center">
                  A hidden treasure awaits the sharpest minds. Solve this to find the 4-digit key:
                </p>
                <div className="bg-[#1E1E1E] rounded-2xl p-6 text-left font-mono text-sm shadow-xl border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Key size={24} className="text-[#FFC800]" />
                  </div>
                  <div className="flex gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                  </div>
                  <code className="block space-y-2 text-white/90">
                    <p><span className="text-[#6A9955] italic">// Riddle:</span></p>
                    <p className="text-[#CE9178]">"I have keys but no locks."</p>
                    <p className="text-[#CE9178]">"I have space but no room."</p>
                    <p className="text-[#CE9178]">"You can enter, but never go inside."</p>
                  </code>
                </div>
              </div>
            </Reveal>

            <div className="flex flex-col items-center justify-center gap-12 lg:flex-row lg:items-start lg:gap-20">
              {/* Treasure Box Visual */}
              <div className="relative">
                <AnimatePresence mode="wait">
                  {!isOpened ? (
                <motion.div
                  key="closed"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    x: isError ? [0, -10, 10, -10, 10, 0] : 0 
                  }}
                  transition={{ 
                    x: { duration: 0.4 },
                    scale: { type: "spring", damping: 15 }
                  }}
                  className="relative cursor-pointer group"
                >
                  <ChestSVG isOpen={false} />
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-[#FFC800]/20 blur-3xl -z-10 rounded-full" 
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Lock className="text-white drop-shadow-lg" size={48} strokeWidth={3} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="opened"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 2 }}
                    className="absolute inset-0 bg-[#FFC800]/30 blur-3xl -z-10 rounded-full"
                  />
                  <ChestSVG isOpen={true} />
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: -60, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center"
                  >
                    <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-3xl shadow-2xl border-4 border-[#FFC800] relative">
                      <Sparkles className="text-[#FFC800] mb-2 mx-auto" size={32} fill="currentColor" />
                      <p className="text-[#2B2B2B] dark:text-white font-black text-lg">HUNT2026</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#777]">Early Access Key</p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Keypad UI + Name claim */}
          <div className="w-full max-w-[280px]">
            <div className="mb-6 flex justify-center gap-3">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-12 h-14 rounded-2xl border-4 flex items-center justify-center text-2xl font-black transition-all ${
                    input[i] 
                      ? "border-[#FFC800] bg-[#FFC800]/10 text-[#7A5A00] dark:text-[#FFC800]" 
                      : "border-black/5 bg-white dark:bg-white/[0.03] dark:border-white/10"
                  } ${isError ? "border-red-500 bg-red-50" : ""}`}
                >
                  {input[i] ? "•" : ""}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "⌫"].map((btn) => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === "C") setInput("");
                    else if (btn === "⌫") setInput(input.slice(0, -1));
                    else handleKeypad(btn.toString());
                  }}
                  disabled={isOpened}
                  className="btn-press ripple h-14 rounded-2xl bg-white dark:bg-white/[0.05] border-2 border-black/5 dark:border-white/10 flex items-center justify-center font-black text-lg text-[#2B2B2B] dark:text-white hover:border-[#FFC800]/50 transition-colors disabled:opacity-30"
                  style={{ borderBottomWidth: "6px" }}
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Claim spot form */}
            <AnimatePresence>
              {isOpened && !submitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 p-4 rounded-2xl text-center"
                  style={{ background: "rgba(88,204,2,0.06)", border: "1px solid rgba(88,204,2,0.2)" }}
                >
                  <Trophy size={20} className="mx-auto mb-2 text-[#FFC800]" />
                  <p className="text-[12px] font-extrabold mb-3" style={{ color: "#2B2B2B" }}>
                    Secure your name on the Riddle Board!
                  </p>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={solverName}
                    onChange={(e) => setSolverName(e.target.value)}
                    maxLength={20}
                    className="w-full px-3 py-2.5 rounded-xl text-center text-[14px] font-bold outline-none mb-3"
                    style={{ background: "#F0F0F0", color: "#2B2B2B" }}
                  />
                  <button
                    onClick={handleClaimSpot}
                    disabled={!solverName.trim() || submitting}
                    className="w-full py-2.5 rounded-xl text-[13px] font-black text-white disabled:opacity-50 transition-all"
                    style={{ background: "#58CC02", boxShadow: "0 4px 0 0 #3A8400" }}
                  >
                    {submitting ? "..." : "Claim Spot 🏆"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {submitted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 rounded-2xl text-center"
                style={{ background: "rgba(88,204,2,0.08)", border: "1px solid rgba(88,204,2,0.25)" }}
              >
                <p className="text-2xl mb-1">✅</p>
                <p className="text-[14px] font-black" style={{ color: "#58CC02" }}>Claimed!</p>
                <p className="text-[11px] font-semibold mt-1" style={{ color: "#777" }}>
                  {solverName} is on the board
                </p>
              </motion.div>
            )}
          </div>
        </div>
          </div>

          {/* Leaderboard panel */}
          <div className="lg:col-span-1">
            <GlobalRiddleLeaderboard />
          </div>
        </div>
      </div>
    </section>
  );
}

function ChestSVG({ isOpen }: { isOpen: boolean }) {
  return (
    <svg width="240" height="200" viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
      {/* Base */}
      <rect x="30" y="90" width="180" height="90" rx="16" fill="#8B4513" stroke="#5D2E0D" strokeWidth="8"/>
      <rect x="30" y="100" width="180" height="20" fill="#A0522D" opacity="0.5"/>
      
      {/* Lid - Animated */}
      <motion.g
        animate={{ 
          rotateX: isOpen ? -110 : 0,
          y: isOpen ? -10 : 0
        }}
        transition={{ type: "spring", damping: 12, stiffness: 100 }}
        style={{ transformOrigin: "120px 90px", perspective: "1000px" }}
      >
        <path d="M30 90C30 51.3401 61.3401 20 100 20H140C178.66 20 210 51.3401 210 90H30Z" fill="#A0522D" stroke="#5D2E0D" strokeWidth="8"/>
        <rect x="40" y="40" width="160" height="40" rx="4" fill="#CD853F" opacity="0.3"/>
        {/* Lock mechanism on lid */}
        <rect x="105" y="70" width="30" height="30" rx="6" fill="#FFC800" stroke="#7A5A00" strokeWidth="4"/>
        <circle cx="120" cy="82" r="4" fill="#7A5A00"/>
      </motion.g>

      {/* Gold bands */}
      <rect x="60" y="90" width="12" height="90" fill="#FFC800" stroke="#7A5A00" strokeWidth="4"/>
      <rect x="168" y="90" width="12" height="90" fill="#FFC800" stroke="#7A5A00" strokeWidth="4"/>
      
      {/* Lid bands when closed */}
      {!isOpen && (
        <>
          <rect x="60" y="20" width="12" height="70" fill="#FFC800" stroke="#7A5A00" strokeWidth="4"/>
          <rect x="168" y="20" width="12" height="70" fill="#FFC800" stroke="#7A5A00" strokeWidth="4"/>
        </>
      )}
    </svg>
  );
}
