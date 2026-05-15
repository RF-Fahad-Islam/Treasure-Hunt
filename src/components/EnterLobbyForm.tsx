import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuthStore } from "@/store/authStore";
import { lookupRegistrationByRoll, loginFromRegistration } from "@/services/auth";
import { BookOpen, ChevronDown } from "lucide-react";

const RULES = [
  { icon: "👥", title: "Team Formation", desc: "All teams are assigned by the organizers after registration closes. You'll be notified in the lobby once your team is formed." },
  { icon: "🗺️", title: "The Hunt", desc: "Teams follow a unique route of clue spots across campus. Solve each clue to find the next location and earn points." },
  { icon: "⭐", title: "Scoring", desc: "Each clue solved awards points. Bonus points are available through mini-games at select spots. Penalties apply for skipping clues." },
  { icon: "⏱️", title: "Time Limit", desc: "Each clue has a time limit. If time runs out, you can reveal the answer but with reduced points." },
  { icon: "🏆", title: "Winning", desc: "The team with the highest points at the end of the hunt wins. Tie-breakers are decided by total penalty time." },
  { icon: "📋", title: "Eligibility", desc: "Open to all DU CSE students. Registration requires your student roll and a valid email address." },
];

export function EnterLobbyForm() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [roll, setRoll] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!roll.trim() || !email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const reg = await lookupRegistrationByRoll(roll.trim());
      if (reg.email.toLowerCase() !== email.trim().toLowerCase()) {
        throw new Error("Email doesn't match our records for this roll.");
      }
      const session = await loginFromRegistration(reg.id);
      setSession(session);
      navigate("/team", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
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
      {/* Rulebook */}
      <div className="rounded-[24px] mb-5 overflow-hidden" style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.06), 0 12px 24px -8px rgba(0,0,0,0.08)" }}>
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
        >
          <div className="flex items-center gap-3">
            <BookOpen size={20} style={{ color: "#1CB0F6" }} />
            <span className="text-[15px] font-black" style={{ color: "#2B2B2B" }}>Rulebook & Details</span>
          </div>
          <motion.div animate={{ rotate: showRules ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={20} style={{ color: "#999" }} />
          </motion.div>
        </button>

        <motion.div
          initial={false}
          animate={{ height: showRules ? "auto" : 0, opacity: showRules ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="px-5 sm:px-6 pb-6 space-y-4">
            {RULES.map((rule) => (
              <div key={rule.title} className="flex gap-3">
                <span className="text-lg shrink-0 mt-0.5">{rule.icon}</span>
                <div>
                  <h4 className="text-[13px] font-black" style={{ color: "#2B2B2B" }}>{rule.title}</h4>
                  <p className="text-[12px] font-semibold mt-0.5 leading-relaxed" style={{ color: "#777" }}>{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Enter Lobby Form */}
      <div className="rounded-[24px] p-6 sm:p-8 text-center" style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.06), 0 12px 24px -8px rgba(0,0,0,0.08)" }}>
        <p className="text-3xl mb-2">🚪</p>
        <h3 className="font-display text-xl font-black mb-1" style={{ color: "#2B2B2B" }}>
          Enter the Lobby
        </h3>
        <p className="text-[13px] font-semibold mb-5" style={{ color: "#777" }}>
          Already registered? Enter your roll and email to join.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <input
            type="text"
            placeholder="Student Roll"
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            required
            className="w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-extrabold outline-none text-center transition-all"
            style={{ borderColor: "#E0E0E0", background: "#F7F7F7", color: "#2B2B2B" }}
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-extrabold outline-none text-center transition-all"
            style={{ borderColor: "#E0E0E0", background: "#F7F7F7", color: "#2B2B2B" }}
          />

          {error && (
            <p className="text-[13px] font-bold" style={{ color: "var(--color-brand-red)" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !roll.trim() || !email.trim()}
            className="w-full py-3.5 rounded-2xl text-[14px] font-black text-white disabled:opacity-50 transition-all"
            style={{ background: "#58CC02", boxShadow: "0 4px 0 0 #3A8400" }}
          >
            {loading ? "Entering..." : "Enter Lobby 🎮"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
