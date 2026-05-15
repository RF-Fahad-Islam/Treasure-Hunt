import { motion } from "motion/react";
import { getAvatarUrl } from "@/lib/avatar";
import type { Participant } from "@/types";

interface Props {
  members: Participant[];
  teamSeed: string;
  teamName: string;
  currentUserId: string | undefined;
}

export function TeamAvatarRoom({ members, teamSeed, teamName, currentUserId }: Props) {
  const sorted = [...members].sort((a, b) => (b.is_leader ? 1 : 0) - (a.is_leader ? 1 : 0));
  const isInParty = (p: Participant) => p.is_leader || true;

  return (
    <div className="relative overflow-hidden rounded-[32px] shadow-2xl"
      style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.06), 0 16px 32px -8px rgba(0,0,0,0.1)" }}>
      {/* Wall */}
      <div className="h-16 sm:h-20 relative flex items-center justify-center"
        style={{ background: "linear-gradient(180deg, #F0F0F0 0%, #EBEBEB 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.02) 40px, rgba(0,0,0,0.02) 41px)" }} />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] opacity-40" style={{ color: "#777777" }}>Team Room</span>
      </div>

      {/* Floor with tiles */}
      <div className="relative px-6 pb-10 pt-6 sm:pt-10"
        style={{
          background: "linear-gradient(180deg, #F5F5F5 0%, #F0F0F0 60%, #EBEBEB 100%)",
          perspective: "600px",
        }}>
        {/* Floor tile pattern */}
        <div className="absolute inset-0 opacity-6 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(0,0,0,0.03) 48px, rgba(0,0,0,0.03) 49px), repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(0,0,0,0.03) 48px, rgba(0,0,0,0.03) 49px)",
            transform: "rotateX(30deg)",
            transformOrigin: "bottom",
          }} />

        {/* Center: Team Logo on pedestal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
          className="relative z-10 flex flex-col items-center mb-10 sm:mb-14"
        >
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2"
              style={{ background: "#F7F7F7", borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <img src={getAvatarUrl(teamSeed, 128)} alt={teamName} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -inset-3 rounded-3xl border border-[rgba(0,0,0,0.04)] -z-10"
              style={{ background: "radial-gradient(circle, rgba(88,204,2,0.06) 0%, transparent 70%)" }} />
          </div>
          <p className="mt-3 text-[13px] font-extrabold text-center" style={{ color: "#2B2B2B" }}>{teamName}</p>
        </motion.div>

        {/* Members arranged in arc */}
        <div className="relative z-10 flex justify-center gap-3 sm:gap-5 flex-wrap">
          {sorted.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.15 + i * 0.08 }}
              className={`flex flex-col items-center gap-1.5 ${p.id === currentUserId ? "ring-2 ring-[#58CC02] rounded-2xl ring-offset-2 ring-offset-transparent p-2" : "p-2"}`}
            >
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 shadow-lg transition-transform hover:scale-110 duration-200"
                  style={{
                    borderColor: p.is_leader ? "#FFC800" : "rgba(0,0,0,0.08)",
                    boxShadow: p.is_leader ? "0 0 16px rgba(255,200,0,0.25)" : "0 2px 8px rgba(0,0,0,0.06)",
                  }}>
                  <img src={getAvatarUrl(p.name || p.roll || p.id, 96)} alt={p.name}
                    className="w-full h-full object-cover" />
                </div>
                {p.is_leader && (
                  <span className="absolute -top-1 -right-1 text-lg drop-shadow-lg">👑</span>
                )}
              </div>
              <span className="text-[12px] font-extrabold text-center leading-tight max-w-[72px] truncate"
                style={{ color: "#2B2B2B" }}>
                {p.name}
              </span>
              {p.roll && (
                <span className="text-[9px] font-bold opacity-50 text-center" style={{ color: "#777777" }}>
                  {p.roll}
                </span>
              )}
              <span className={`w-1.5 h-1.5 rounded-full ${isInParty(p) ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" : "bg-gray-300"}`} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
