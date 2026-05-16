import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getAvatarUrl } from "@/lib/avatar";
import { fetchTeamMembers } from "@/services/team";
import type { TeamLobbyEntry } from "@/services/team";
import type { Participant } from "@/types";

interface Props {
  teams: TeamLobbyEntry[];
  excludeTeamId: string;
}

export function OtherTeamsView({ teams, excludeTeamId }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<Participant[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const filtered = teams.filter((t) => t.teamId !== excludeTeamId);

  useEffect(() => {
    if (!selectedTeamId) {
      setMembers([]);
      return;
    }
    setLoadingMembers(true);
    fetchTeamMembers(selectedTeamId)
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  }, [selectedTeamId]);

  if (filtered.length === 0) return null;

  const selectedTeam = filtered.find((t) => t.teamId === selectedTeamId);

  return (
    <>
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
              onClick={() => setSelectedTeamId(team.teamId)}
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

      {/* Team Members Modal */}
      <AnimatePresence>
        {selectedTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTeamId(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-[32px] p-6"
              style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.08), 0 16px 32px -8px rgba(0,0,0,0.12)" }}
            >
              <div className="flex items-center gap-3 mb-5">
                <img src={getAvatarUrl(selectedTeam.avatarSeed, 48)} alt={selectedTeam.teamName}
                  className="w-11 h-11 rounded-xl shadow-md" />
                <div>
                  <h3 className="text-[18px] font-black" style={{ color: "#2B2B2B" }}>{selectedTeam.teamName}</h3>
                  <p className="text-[11px] font-bold" style={{ color: "#999" }}>
                    {selectedTeam.memberCount} member{selectedTeam.memberCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTeamId(null)}
                  className="ml-auto shrink-0 rounded-xl w-8 h-8 flex items-center justify-center text-[14px] font-black"
                  style={{ background: "#F0F0F0", color: "#777" }}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {loadingMembers ? (
                  <div className="text-center py-8">
                    <p className="text-[14px] font-bold" style={{ color: "#999" }}>Loading...</p>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[14px] font-bold" style={{ color: "#999" }}>No members found</p>
                  </div>
                ) : (
                  members.map((m) => (
                    <div key={m.id}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3"
                      style={{ background: "#F7F7F7" }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[16px] font-black text-white shrink-0"
                        style={{ background: m.avatar_color || "#1CB0F6" }}>
                        {m.avatar_emoji || m.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold truncate" style={{ color: "#2B2B2B" }}>{m.name}</p>
                        {m.roll && (
                          <p className="text-[11px] font-semibold" style={{ color: "#999" }}>{m.roll}</p>
                        )}
                      </div>
                      {m.is_leader && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-1 rounded-full"
                          style={{ background: "rgba(255,200,0,0.15)", color: "#FFC800" }}>
                          Leader
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
