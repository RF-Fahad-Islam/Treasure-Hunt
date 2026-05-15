import { motion } from "motion/react";
import { CountUp } from "@/components/CountUp";
import type { LeaderboardEntry } from "@/services/team";

interface Props {
  entries: LeaderboardEntry[];
  currentTeamName?: string;
}

export function Leaderboard({ entries, currentTeamName }: Props) {
  const top3 = entries.slice(0, 3);
  const remaining = entries.slice(3);

  const team2 = top3[1];
  const team1 = top3[0];
  const team3 = top3[2];

  if (entries.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-[32px] font-extrabold mb-2" style={{ color: "var(--fg)" }}>Live Standings</h2>
        <p className="text-[16px] font-semibold" style={{ color: "var(--fg-muted)" }}>Updates in real-time. Keep pushing!</p>
      </div>

      {/* Podium Section */}
      <div className="flex justify-center items-end gap-2 md:gap-6 h-64 mt-8 relative w-full px-4">
        {/* 2nd Place */}
        {team2 && (
          <div className="flex flex-col items-center w-1/3 max-w-[120px] order-1 z-10 relative h-full justify-end">
            <div className="absolute top-10 text-[48px] font-extrabold opacity-40" style={{ color: "var(--fg-muted)" }}>2</div>
            <div className="rounded-t-[20px] w-full h-[60%] flex flex-col items-center justify-start pt-4 shadow-lg border-b-[6px] transition-transform hover:-translate-y-1" style={{ background: "var(--color-brand-green)", color: "white", borderColor: "var(--color-brand-green-dark, #1e5000)" }}>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                <span className="text-[20px]">⭐</span>
              </div>
              <span className="text-[14px] font-extrabold truncate w-full px-2 text-center">{team2.name}</span>
              <span className="text-[28px] font-extrabold mt-auto pb-4"><CountUp to={team2.score} /></span>
            </div>
          </div>
        )}
        
        {/* 1st Place */}
        {team1 && (
          <div className="flex flex-col items-center w-1/3 max-w-[140px] order-2 z-20 relative h-full justify-end">
            <div className="absolute top-0 z-30 animate-bounce">
              <span className="text-6xl drop-shadow-md">👑</span>
            </div>
            <div className="rounded-t-[20px] w-full h-[80%] flex flex-col items-center justify-start pt-12 shadow-lg border-b-[6px] relative overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--color-brand-gold)" }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(255, 200, 0, 0.1), transparent)" }}></div>
              <span className="text-[15px] font-extrabold truncate w-full px-2 text-center mt-2" style={{ color: "var(--fg)" }}>{team1.name}</span>
              <span className="text-[32px] font-extrabold mt-auto pb-4 drop-shadow-sm" style={{ color: "var(--color-brand-gold)" }}><CountUp to={team1.score} /></span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {team3 && (
          <div className="flex flex-col items-center w-1/3 max-w-[120px] order-3 z-10 relative h-full justify-end">
            <div className="absolute top-20 text-[48px] font-extrabold opacity-40" style={{ color: "var(--fg-muted)" }}>3</div>
            <div className="rounded-t-[20px] w-full h-[45%] flex flex-col items-center justify-start pt-4 shadow-lg border-b-[6px]" style={{ background: "var(--surface)", borderColor: "var(--border-soft)" }}>
              <span className="text-[14px] font-extrabold truncate w-full px-2 text-center mt-2" style={{ color: "var(--fg)" }}>{team3.name}</span>
              <span className="text-[28px] font-extrabold mt-auto pb-4" style={{ color: "var(--fg-muted)" }}><CountUp to={team3.score} /></span>
            </div>
          </div>
        )}
        
        {/* Podium Base line */}
        <div className="absolute bottom-0 left-0 w-full h-2 rounded-full -z-10" style={{ background: "var(--border-soft)" }}></div>
      </div>

      {/* Remaining Teams List */}
      <div className="flex flex-col gap-4 mt-6">
        {remaining.map((entry, index) => {
          const rank = entry.rank;
          const isCurrent = entry.name === currentTeamName;
          
          let iconBg = "transparent";
          if (rank === 4) { iconBg = "rgba(28,176,246,0.2)"; }
          else if (rank === 5) { iconBg = "rgba(255,142,212,0.2)"; }
          else { iconBg = "var(--border-soft)"; }

          return (
            <motion.div 
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-[20px] shadow-md p-4 md:p-6 flex items-center justify-between gap-6 border-b-[6px] transition-colors cursor-pointer ${isCurrent ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
              style={{ background: isCurrent ? "rgba(34,197,94,0.1)" : "var(--surface)", borderColor: isCurrent ? "var(--color-brand-green)" : "var(--border-soft)" }}
            >
              <div className="flex items-center gap-4 md:gap-6">
                <span className="text-[28px] md:text-[32px] font-extrabold w-8 text-center" style={{ color: "var(--fg-muted)", opacity: 0.7 }}>{rank}</span>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: iconBg }}>
                  <span className="text-[24px]">👥</span>
                </div>
                <span className="text-[16px] md:text-[18px] font-extrabold" style={{ color: isCurrent ? "var(--color-brand-green)" : "var(--fg)" }}>
                  {entry.name} {isCurrent && "(You)"}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[28px] md:text-[32px] font-extrabold" style={{ color: isCurrent ? "var(--color-brand-green)" : "var(--fg)" }}>
                  <CountUp to={entry.score} />
                </span>
                {entry.penalty > 0 && <span className="text-[12px] font-bold" style={{ color: "var(--color-brand-red)" }}>-{entry.penalty}m penalty</span>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
