import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { getAvatarUrl } from "@/lib/avatar";
import { useSession, useAuthStore } from "@/store/authStore";
import { fetchRegisteredParticipants, type RegisteredParticipant } from "@/services/auth";
import { updateMyAvatarSeed, updateRegistrationAvatarSeed } from "@/services/team";
import { RulebookDeck } from "./RulebookDeck";

const AVATAR_SEEDS = [
  "Aria", "Blake", "Cipher", "Dune", "Ember", "Frost", "Glimmer", "Haven",
  "Ivy", "Jade", "Kai", "Luna", "Mira", "Nyx", "Orion", "Pixel",
  "Quinn", "Raven", "Storm", "Tide", "Umbra", "Vega", "Wren", "Xeno",
  "Yuki", "Zephyr", "Ash", "Blue", "Coco", "Dusk",
];

export function ParticipantLobby() {
  const navigate = useNavigate();
  const session = useSession();
  const [participants, setParticipants] = useState<RegisteredParticipant[]>([]);
  const showCustomizeDefault = session?.role === "team" ? !session.teamId : true;
  const [showCustomize, setShowCustomize] = useState(showCustomizeDefault);
  const [seed, setSeed] = useState("");
  const [saving, setSaving] = useState(false);
  const updateAvatarSeed = useAuthStore((s) => s.updateAvatarSeed);

  const participantId = session?.role === "team" ? session.participantId : null;
  const participantRoll = session?.role === "team" ? session.participantRoll : null;

  useEffect(() => {
    if (!session || session.role !== "team") return;
    setSeed(session.participantName);
  }, [session]);

  const fetchParticipants = useCallback(async () => {
    try {
      const result = await fetchRegisteredParticipants();
      setParticipants(result);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchParticipants();
    const interval = setInterval(fetchParticipants, 5000);
    return () => clearInterval(interval);
  }, [fetchParticipants]);

  async function handleSaveAvatar() {
    if (!participantId || !seed.trim()) return;
    setSaving(true);
    try {
      await updateMyAvatarSeed(participantId, seed.trim());
      updateAvatarSeed(seed.trim());
      // Also save to registrations table
      if (participantRoll) {
        await updateRegistrationAvatarSeed(participantRoll, seed.trim());
      }
      setShowCustomize(false);
    } catch { /* silent */ }
    setSaving(false);
  }

  const avatarUri = getAvatarUrl(seed || "guest");

  // Group by team
  const teamGroups = new Map<string | null, RegisteredParticipant[]>();
  for (const p of participants) {
    const key = p.teamName ?? null;
    if (!teamGroups.has(key)) teamGroups.set(key, []);
    teamGroups.get(key)!.push(p);
  }
  const sortedTeams = Array.from(teamGroups.entries()).sort(([a], [b]) => {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-5">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 text-[13px] font-extrabold transition-opacity hover:opacity-70"
        style={{ color: "#777777" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Home
      </motion.button>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] p-8 sm:p-10 text-center"
        style={{ background: "#FFF8E0", boxShadow: "0 4px 0 rgba(255,200,0,0.2), 0 12px 24px -8px rgba(0,0,0,0.06)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,200,0,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10">
          <motion.div
            animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="mb-4 text-6xl"
          >
            🎮
          </motion.div>
          <h2 className="font-display text-2xl font-black mb-1" style={{ color: "#FFC800" }}>
            Waiting Room
          </h2>
          <p className="text-[14px] font-bold mb-6" style={{ color: "rgba(200,150,0,0.6)" }}>
            {session?.role === "team" ? session.participantName : "Player"} — you're in! Teams are being assembled.
          </p>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCustomize(true)}
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-[14px] font-black text-white transition-all"
            style={{ background: "#58CC02", boxShadow: "0 4px 0 0 #3A8400" }}
          >
            <img src={avatarUri} alt="avatar" className="w-8 h-8 rounded-full border-2 border-white/30" />
            Create Your Avatar
          </motion.button>
        </div>
      </motion.div>

      {/* Avatar customization modal */}
      <AnimatePresence>
        {showCustomize && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowCustomize(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-[32px] p-8 text-center"
              style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.08), 0 16px 32px -8px rgba(0,0,0,0.12)" }}
            >
              <h3 className="font-display text-xl font-black mb-2" style={{ color: "#2B2B2B" }}>
                ✨ Your Avatar
              </h3>
              <p className="text-[13px] font-semibold mb-6" style={{ color: "#777777" }}>
                Represent yourself throughout the hunt!
              </p>

              <div className="flex justify-center mb-6">
                <motion.div
                  key={seed}
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-28 h-28 rounded-2xl overflow-hidden border-4"
                  style={{ borderColor: "#58CC02", boxShadow: "0 0 24px rgba(88,204,2,0.2)" }}
                >
                  <img src={avatarUri} alt="Preview" className="w-full h-full object-cover" />
                </motion.div>
              </div>

              <div className="mb-6">
                <label className="block text-[11px] font-extrabold uppercase tracking-[0.15em] mb-2 text-left" style={{ color: "#777777" }}>
                  Pick a name / seed
                </label>
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className="w-full rounded-2xl border-2 px-4 py-3 text-[16px] font-extrabold outline-none text-center"
                  style={{ borderColor: "#E0E0E0", background: "#F7F7F7", color: "#2B2B2B" }}
                  placeholder="Enter a name..."
                />
              </div>

              {/* Quick pick grid */}
              <div className="mb-6">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-3 text-left" style={{ color: "#BBBBBB" }}>
                  Quick pick
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {AVATAR_SEEDS.slice(0, 12).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSeed(s)}
                      className={`rounded-xl p-1 transition-all ${seed === s ? "ring-2 ring-[#58CC02]" : "hover:opacity-80"}`}
                      style={{ background: seed === s ? "rgba(88,204,2,0.08)" : "#F0F0F0" }}
                    >
                      <img
                        src={getAvatarUrl(s)}
                        alt={s}
                        className="w-10 h-10 rounded-lg"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCustomize(false)}
                  className="flex-1 py-3.5 rounded-2xl text-[14px] font-black"
                  style={{ background: "#F0F0F0", color: "#777777" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAvatar}
                  disabled={saving || !seed.trim()}
                  className="flex-1 py-3.5 rounded-2xl text-[14px] font-black text-white disabled:opacity-50"
                  style={{ background: "#58CC02", boxShadow: "0 4px 0 0 #3A8400" }}
                >
                  {saving ? "Saving..." : "Save Avatar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registered participants grouped by team */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
            </span>
            <span className="text-[13px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "#58CC02" }}>
              {participants.length} Registered
            </span>
          </div>
        </div>

        {participants.length === 0 ? (
          <div className="rounded-[24px] p-8 text-center" style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.06), 0 12px 24px -8px rgba(0,0,0,0.08)" }}>
            <p className="text-3xl mb-2">👀</p>
            <p className="text-[13px] font-bold" style={{ color: "#999999" }}>No registrations yet</p>
            <p className="text-[11px] font-semibold mt-1" style={{ color: "#BBBBBB" }}>Share the registration link with friends!</p>
          </div>
        ) : (
          sortedTeams.map(([teamName, group]) => (
            <div
              key={teamName ?? "waiting"}
              className="rounded-[24px] p-5 sm:p-6"
              style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.06), 0 12px 24px -8px rgba(0,0,0,0.08)" }}
            >
              {/* Team header */}
              <div className="flex items-center gap-3 mb-4">
                {teamName ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    <h3 className="text-[16px] font-black" style={{ color: "#2B2B2B" }}>{teamName}</h3>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "rgba(88,204,2,0.1)", color: "#58CC02" }}>
                      Team
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⏳</span>
                    <h3 className="text-[16px] font-black" style={{ color: "#FFC800" }}>Waiting for team</h3>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "rgba(255,200,0,0.1)", color: "#FFC800" }}>
                      {group.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Members grid */}
              <div className="flex flex-wrap gap-3 justify-center">
                {group.map((p, i) => {
                  const pSeed = p.avatar_emoji || p.name;
                  const isMe = p.roll === participantRoll;
                  return (
                    <motion.div
                      key={p.registrationId}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03, type: "spring", stiffness: 200, damping: 18 }}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all"
                      style={{
                        background: isMe ? "rgba(88,204,2,0.08)" : "transparent",
                        border: isMe ? "1px solid rgba(88,204,2,0.2)" : "1px solid transparent",
                      }}
                    >
                      <div className="relative">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2"
                          style={{ borderColor: isMe ? "#58CC02" : "rgba(0,0,0,0.08)" }}>
                          <img src={getAvatarUrl(pSeed)} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        {p.approved && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white bg-green-500" />
                        )}
                      </div>
                      <span className="text-[11px] font-extrabold text-center max-w-[64px] truncate" style={{ color: isMe ? "#58CC02" : "#2B2B2B" }}>
                        {p.name}
                        {isMe && <span className="block text-[8px] font-bold uppercase tracking-wide" style={{ color: "#58CC02" }}>You</span>}
                      </span>
                      {!p.approved && (
                        <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "rgba(255,200,0,0.1)", color: "#FFC800" }}>
                          Pending
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </motion.div>

      {/* Rulebook */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <RulebookDeck />
      </motion.div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-[24px] p-5 sm:p-6"
        style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.06), 0 12px 24px -8px rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-start gap-4">
          <span className="text-2xl">📋</span>
          <div>
            <h4 className="text-[14px] font-black mb-1" style={{ color: "#2B2B2B" }}>How teams work</h4>
            <p className="text-[12px] font-semibold leading-relaxed" style={{ color: "#777777" }}>
              Organizers will assemble teams from all registered participants. You'll be notified here once your team is formed.
              Until then, explore the avatar creator and see who else is participating!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

