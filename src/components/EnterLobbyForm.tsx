import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuthStore } from "@/store/authStore";
import { loginParticipant } from "@/services/auth";
import { RulebookDeck } from "./RulebookDeck";

export function EnterLobbyForm() {
  const navigate = useNavigate();
  const setParticipant = useAuthStore((s) => s.setParticipant);
  const [roll, setRoll] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!roll.trim() || !email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { participant, error: loginError } = await loginParticipant(roll.trim(), email.trim());
      
      if (loginError) {
        setError(loginError);
        return;
      }

      if (participant) {
        setParticipant(participant);
        navigate("/participant", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-lg mx-auto"
    >
      <RulebookDeck className="mb-6" />

      {/* Enter Lobby Form */}
      <div 
        className="rounded-[32px] p-8 sm:p-12 text-center bg-white border-2 border-black/[0.04] shadow-xl relative overflow-hidden" 
        style={{ borderBottomWidth: "10px" }}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-[#58CC02]/20" />
        
        <p className="text-4xl mb-4 transform hover:scale-110 transition-transform cursor-default">🚪</p>
        <h3 className="font-display text-2xl font-black mb-2" style={{ color: "#2B2B2B" }}>
          Enter the Lobby
        </h3>
        <p className="text-[14px] font-semibold mb-8 max-w-[280px] mx-auto" style={{ color: "#777" }}>
          Already registered? Enter your credentials to join your team.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm mx-auto">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Student Roll"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              required
              className="w-full rounded-2xl border-2 px-5 py-4 text-[16px] font-black outline-none text-center transition-all focus:border-[#58CC02] focus:ring-4 focus:ring-[#58CC02]/10"
              style={{ borderColor: "#E0E0E0", background: "#F7F7F7", color: "#2B2B2B" }}
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border-2 px-5 py-4 text-[16px] font-black outline-none text-center transition-all focus:border-[#58CC02] focus:ring-4 focus:ring-[#58CC02]/10"
              style={{ borderColor: "#E0E0E0", background: "#F7F7F7", color: "#2B2B2B" }}
            />
          </div>

          {error && (
            <p className="text-[13px] font-bold mt-2" style={{ color: "var(--color-brand-red)" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !roll.trim() || !email.trim()}
            className="w-full mt-4 py-4.5 rounded-2xl text-[16px] font-black text-white disabled:opacity-50 transition-all active:scale-95 group"
            style={{ background: "#58CC02", boxShadow: "0 6px 0 0 #3A8400" }}
          >
            <span className="flex items-center justify-center gap-2">
              {loading ? "Entering..." : "Enter Lobby"}
              {!loading && <span className="group-hover:translate-x-1 transition-transform">🎮</span>}
            </span>
          </button>
        </form>
      </div>

    </motion.div>
  );
}
