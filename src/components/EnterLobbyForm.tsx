import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { lookupRegistrationByRoll, loginFromRegistration } from "@/services/auth";

export function EnterLobbyForm() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
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
      // 1. Look up registration
      const reg = await lookupRegistrationByRoll(roll.trim());
      
      // 2. Simple email check for security
      if (reg.email.toLowerCase() !== email.trim().toLowerCase()) {
        throw new Error("Email doesn't match our records for this roll.");
      }

      // 3. Login and get session
      const session = await loginFromRegistration(reg.id);
      setSession(session);
      
      // 4. Navigate to team/waiting area
      navigate("/team", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Enter Lobby Form */}
      <div 
        className="rounded-[32px] p-6 sm:p-10 text-center bg-white border-2 border-black/[0.04] shadow-xl relative overflow-hidden" 
        style={{ borderBottomWidth: "10px" }}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-[#58CC02]/20" />
        
        <p className="text-3xl sm:text-4xl mb-3 transform hover:scale-110 transition-transform cursor-default">🚪</p>
        <h3 className="font-display text-xl sm:text-2xl font-black mb-1.5" style={{ color: "#2B2B2B" }}>
          Enter the Lobby
        </h3>
        <p className="text-[13px] sm:text-[14px] font-semibold mb-6 sm:mb-8 max-w-[280px] mx-auto" style={{ color: "#777" }}>
          Already registered? Enter your credentials to join your team.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4 max-w-sm mx-auto">
          <div className="space-y-3 sm:space-y-4">
            <input
              type="text"
              placeholder="Student Roll"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              required
              className="w-full rounded-2xl border-2 px-4 py-3.5 sm:px-5 sm:py-4 text-[15px] sm:text-[16px] font-black outline-none text-center transition-all focus:border-[#58CC02] focus:ring-4 focus:ring-[#58CC02]/10"
              style={{ borderColor: "#E0E0E0", background: "#F7F7F7", color: "#2B2B2B" }}
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border-2 px-4 py-3.5 sm:px-5 sm:py-4 text-[15px] sm:text-[16px] font-black outline-none text-center transition-all focus:border-[#58CC02] focus:ring-4 focus:ring-[#58CC02]/10"
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
    </div>
  );
}

