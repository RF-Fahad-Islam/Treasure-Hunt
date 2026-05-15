import { useState } from "react";
import { motion } from "motion/react";
import { getAvatarUrl } from "@/lib/avatar";
import type { TeamLobbyEntry } from "@/services/team";

interface Props {
  teams: TeamLobbyEntry[];
  excludeTeamId: string;
}

export function OtherTeamsView({ teams, excludeTeamId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filtered = teams.filter((t) => t.teamId !== excludeTeamId);

  if (filtered.length === 0) return null;

  return (
    <div className="rounded-[24px] border border-white/10 overflow-hidden" style={{ background: "var(--surface)" }}>
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-[13px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--fg-muted)" }}>
          Other Teams ({filtered.length})
        </h3>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map((team) => (
          <motion.button
            key={team.teamId}
            onClick={() => setExpandedId(expandedId === team.teamId ? null : team.teamId)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2 rounded-2xl p-4 transition-all hover:scale-105"
            style={{ background: "var(--border-soft)" }}
          >
            <img src={getAvatarUrl(team.avatarSeed, 64)} alt={team.teamName}
              className="w-12 h-12 rounded-xl shadow-lg" />
            <span className="text-[12px] font-black text-center leading-tight" style={{ color: "var(--fg)" }}>
              {team.teamName}
            </span>
            <span className="text-[10px] font-bold" style={{ color: "var(--fg-muted)" }}>
              {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
