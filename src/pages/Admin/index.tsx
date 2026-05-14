import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Backdrop } from "@/components/Backdrop";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Reveal } from "@/components/Reveal";
import { SuccessOverlay } from "@/components/SuccessOverlay";
import { useAuthStore } from "@/store/authStore";
import {
  fetchAllParticipants,
  fetchAllSpots,
  fetchAllClues,
  fetchExistingTeams,
  generateTeams,
  generateRoutes,
  clearAllTeamsAndRoutes,
  saveTeams,
  saveRoutes,
  addParticipant,
  deleteParticipant,
} from "@/services/admin";
import { fetchActiveSessions, adminDeactivateSession } from "@/services/auth";
import type { SessionWithUser } from "@/services/auth";
import type { Participant, Spot, ClueDefinition } from "@/types";
import type { GeneratedTeam, TeamWithRoute } from "@/services/admin";

type Step = "idle" | "preview" | "saved" | "routes-preview" | "complete";

export default function AdminPage() {
  const clearSession = useAuthStore((s) => s.clearSession);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [clues, setClues] = useState<ClueDefinition[]>([]);
  const [existingTeams, setExistingTeams] = useState<number>(0);

  const [step, setStep] = useState<Step>("idle");
  const [generated, setGenerated] = useState<GeneratedTeam[]>([]);
  const [teamRoutes, setTeamRoutes] = useState<TeamWithRoute[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTeamCount, setSuccessTeamCount] = useState(0);

  const [newName, setNewName] = useState("");
  const [newRoll, setNewRoll] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [showParticipantList, setShowParticipantList] = useState(false);
  const [moveTarget, setMoveTarget] = useState<{ memberId: string; fromTeamIndex: number } | null>(null);
  const [transferTarget, setTransferTarget] = useState<number | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [p, s, c, t] = await Promise.all([
        fetchAllParticipants(),
        fetchAllSpots(),
        fetchAllClues(),
        fetchExistingTeams(),
      ]);
      setParticipants(p);
      setSpots(s);
      setClues(c);
      setExistingTeams(t.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function handleGenerate() {
    setError(null);
    if (participants.length < 5) {
      setError("Need at least 5 participants to generate teams.");
      return;
    }
    const teams = generateTeams(participants);
    setGenerated(teams);
    setStep("preview");
    setTeamRoutes([]);
    setSuccess(null);
  }

  function handleReshuffle() {
    setError(null);
    const teams = generateTeams(participants);
    setGenerated(teams);
    setSuccess("🔄 Teams reshuffled!");
  }

  function handleMoveMember(fromTeamIndex: number, toTeamIndex: number, memberId: string) {
    if (fromTeamIndex === toTeamIndex) { setMoveTarget(null); return; }
    setGenerated((prev) => {
      const newTeams = prev.map((t) => ({ ...t, members: [...t.members] }));
      const fromTeam = newTeams[fromTeamIndex];
      const toTeam = newTeams[toTeamIndex];
      const idx = fromTeam.members.findIndex((m) => m.id === memberId);
      if (idx === -1) return prev;
      const [member] = fromTeam.members.splice(idx, 1);
      if (member.is_leader) {
        member.is_leader = false;
        if (fromTeam.members.length > 0) fromTeam.members[0].is_leader = true;
      }
      toTeam.members.push(member);
      return newTeams;
    });
    setMoveTarget(null);
  }

  function handleTransferLeader(teamIndex: number, newLeaderId: string) {
    setGenerated((prev) => {
      const newTeams = prev.map((t) => ({ ...t, members: t.members.map((m) => ({ ...m, is_leader: false })) }));
      const team = newTeams[teamIndex];
      const nl = team.members.find((m) => m.id === newLeaderId);
      if (nl) nl.is_leader = true;
      return newTeams;
    });
    setTransferTarget(null);
  }

  async function handleSaveTeams() {
    setLoading(true);
    setError(null);
    try {
      await clearAllTeamsAndRoutes();
      const idMap = await saveTeams(generated);
      const routes = generateRoutes(clues, generated);
      await saveRoutes(routes, idMap);
      setTeamRoutes(routes);
      setStep("complete");
      setSuccess(`🎉 ${generated.length} teams created and routed!`);
      setSuccessTeamCount(generated.length);
      setShowSuccess(true);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddParticipant(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await addParticipant({ name: newName.trim(), roll: newRoll.trim() || undefined, email: newEmail.trim() || undefined, phone: newPhone.trim() || undefined });
      setNewName(""); setNewRoll(""); setNewEmail(""); setNewPhone("");
      setSuccess(`✅ ${newName.trim()} added!`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add participant");
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteParticipant(id: string, name: string) {
    if (!confirm(`Delete ${name}?`)) return;
    setError(null);
    try {
      await deleteParticipant(id);
      setSuccess(`🗑 ${name} deleted.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const [sessions, setSessions] = useState<SessionWithUser[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  async function loadSessions() {
    setSessionsLoading(true);
    try {
      const s = await fetchActiveSessions();
      setSessions(s);
    } catch { /* ignore */ }
    setSessionsLoading(false);
  }

  async function handleKickSession(sessionId: string) {
    try {
      await adminDeactivateSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSuccess("🔌 Session deactivated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate");
    }
  }

  const totalUnassigned = participants.filter((p) => !p.team_id).length;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />

      <SuccessOverlay
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        pointsEarned={successTeamCount}
        title="GENERATED!"
        subtitle="Teams created and routed"
      />

      <div className="absolute right-4 top-4 z-20 flex items-center gap-3">
        <button
          onClick={clearSession}
          className="rounded-2xl px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide transition-opacity hover:opacity-70 shadow-lg"
          style={{ color: "var(--fg-muted)", background: "var(--surface)" }}
        >
          🚪 Logout
        </button>
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-20">
        <Reveal duration={0.5}>
          <header className="mb-12 text-center">
            <div className="flex items-center justify-center gap-4">
              <Logo className="h-14 w-14 drop-shadow-lg" />
              <div>
                <h1 className="font-display text-[32px] font-extrabold leading-none" style={{ color: "var(--fg)" }}>
                  ⚙️ Admin Panel
                </h1>
                <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--fg-muted)" }}>
                  Team Generator &amp; Event Control
                </p>
              </div>
            </div>
          </header>
        </Reveal>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-3xl px-6 py-4 text-center text-[15px] font-bold"
            style={{
              background: "rgba(255,75,75,0.1)",
              border: "2px solid rgba(255,75,75,0.3)",
              color: "var(--color-brand-red)",
            }}
            role="alert"
          >
            ⚠️ {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-3xl px-6 py-4 text-center text-[15px] font-bold"
            style={{
              background: "rgba(88,204,2,0.1)",
              border: "2px solid rgba(88,204,2,0.3)",
              color: "var(--color-brand-green)",
            }}
          >
            {success}
          </motion.div>
        )}

        <Reveal delay={0.08} duration={0.55}>
          <div className="card mb-8 p-8" style={{ background: "var(--surface)" }}>
            <h2 className="mb-4 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>
              📊 Data Overview
            </h2>
            <div className="flex flex-wrap gap-8">
              <Stat label="👥 Participants" value={participants.length} accent="var(--color-brand-blue)" />
              <Stat label="🔓 Unassigned" value={totalUnassigned} accent="var(--color-brand-red)" />
              <Stat label="🏠 Teams" value={existingTeams} accent="var(--color-brand-gold)" />
              <Stat label="📍 Spots" value={spots.length} accent="var(--color-brand-green)" />
              <Stat label="🔎 Clues" value={clues.length} accent="var(--color-brand-green)" />
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="btn-press mt-6 rounded-2xl px-6 py-3 text-[13px] font-extrabold uppercase tracking-wide transition-all"
              style={{ background: "var(--surface)", border: "2px solid var(--border-soft)", color: "var(--fg-muted)" }}
            >
              {loading ? "⟳ Loading…" : "🔄 Refresh Data"}
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.1} duration={0.55}>
          <div className="card mb-8 p-8" style={{ background: "var(--surface)" }}>
            <h2 className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-blue)" }}>
              👤 Participants
            </h2>
            <p className="mb-5 text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>
              Add participants before generating teams. Only the team leader (👑 first member) can log in.
            </p>

            <form onSubmit={handleAddParticipant} className="mb-6 flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[160px]">
                <label className="mb-1.5 block text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Fahad Islam" required
                  className="w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-semibold outline-none transition-all"
                  style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
              </div>
              <div className="w-28">
                <label className="mb-1.5 block text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Roll</label>
                <input value={newRoll} onChange={e => setNewRoll(e.target.value)} placeholder="e.g. 01"
                  className="w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-semibold outline-none"
                  style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="mb-1.5 block text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Email</label>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="optional" type="email"
                  className="w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-semibold outline-none"
                  style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
              </div>
              <div className="w-36">
                <label className="mb-1.5 block text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Phone</label>
                <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="optional"
                  className="w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-semibold outline-none"
                  style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit" disabled={adding || !newName.trim()}
                className="btn-press rounded-2xl px-8 py-3.5 text-[14px] font-extrabold uppercase tracking-wide text-white transition-all"
                style={{ background: "var(--color-brand-blue)", opacity: adding || !newName.trim() ? 0.5 : 1 }}>
                {adding ? "⏳ Adding…" : "➕ Add"}
              </motion.button>
            </form>

            <button
              onClick={() => setShowParticipantList(v => !v)}
              className="btn-press rounded-2xl px-6 py-3 text-[13px] font-extrabold uppercase tracking-wide transition-all"
              style={{ background: "var(--surface)", border: "2px solid var(--border-soft)", color: "var(--fg-muted)" }}
            >
              {showParticipantList ? "🙈 Hide" : "👥 Show"} All ({participants.length})
            </button>

            <AnimatePresence>
              {showParticipantList && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 flex max-h-72 flex-col gap-2 overflow-y-auto"
                >
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center gap-4 rounded-2xl px-5 py-3"
                      style={{ background: "var(--border-soft)" }}>
                      <span className="flex-1 text-[14px] font-bold" style={{ color: "var(--fg)" }}>
                        {p.name}
                        {p.is_leader ? <span className="ml-2 text-[13px]">👑</span> : ""}
                      </span>
                      <span className="text-[12px] font-semibold" style={{ color: "var(--fg-muted)" }}>
                        {p.roll || "—"}
                      </span>
                      <span className="rounded-xl px-3 py-1 text-[11px] font-extrabold"
                        style={{
                          background: p.team_id ? "rgba(88,204,2,0.12)" : "rgba(255,75,75,0.1)",
                          color: p.team_id ? "var(--color-brand-green)" : "var(--color-brand-red)",
                        }}
                      >
                        {p.team_id ? "✅ Assigned" : "🔓 Free"}
                      </span>
                      {!p.team_id && (
                        <button
                          onClick={() => handleDeleteParticipant(p.id, p.name)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[18px] font-extrabold hover:opacity-70 transition-opacity"
                          style={{ color: "var(--color-brand-red)", background: "rgba(255,75,75,0.1)" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        <Reveal delay={0.14} duration={0.55}>
          <div className="card mb-8 p-8" style={{ background: "var(--surface)" }}>
            <h2 className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>
              🏗 Step 1 — Generate Teams
            </h2>
            <p className="mb-5 text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>
              Randomly assign participants into teams of 5. Each team gets a unique name and code. First member = 👑 leader.
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerate}
                disabled={loading || participants.length < 5}
                className="btn-press btn-primary btn-press--lg rounded-2xl px-8 py-4 text-[15px]"
                style={participants.length < 5 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
              >
                🚀 Generate Teams
              </motion.button>
              {step === "preview" && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReshuffle}
                  disabled={loading}
                  className="btn-press rounded-2xl px-6 py-4 text-[14px] font-extrabold uppercase tracking-wide transition-all"
                  style={{ background: "var(--surface)", border: "3px solid var(--border-soft)", color: "var(--fg)" }}
                >
                  🔀 Reshuffle
                </motion.button>
              )}
              {step === "preview" && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveTeams}
                  disabled={loading}
                  className="btn-press rounded-2xl px-8 py-4 text-[15px] font-extrabold uppercase tracking-wide text-white transition-all"
                  style={{
                    background: "var(--color-brand-green)",
                    boxShadow: "0 6px 0 0 color-mix(in srgb, var(--color-brand-green) 60%, black)",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {loading ? "⏳ Saving…" : "💾 Save Teams & Routes"}
                </motion.button>
              )}
            </div>
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          {step === "preview" && generated.length > 0 && (
            <motion.div
              key="teams-preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
            >
              <Reveal duration={0.45}>
                <div className="card p-8" style={{ background: "var(--surface)" }}>
                  <h2 className="mb-1 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>
                    👀 Preview — {generated.length} Teams
                  </h2>
                  <p className="mb-5 text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
                    ⇄ move member · 👑 transfer leader <span style={{ color: "var(--color-brand-red)" }}>(exactly one leader per team)</span>
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {generated.map((team, i) => (
                      <TeamCard
                        key={i}
                        team={team}
                        teamIndex={i}
                        teamNames={generated.map((t) => t.name)}
                        isMoveActive={moveTarget?.fromTeamIndex === i}
                        activeMoveMemberId={moveTarget?.memberId ?? null}
                        isTransferActive={transferTarget === i}
                        onStartMove={(memberId) => setMoveTarget({ memberId, fromTeamIndex: i })}
                        onStartTransfer={() => setTransferTarget(i)}
                        onMoveTo={(toIdx) => handleMoveMember(i, toIdx, moveTarget!.memberId)}
                        onTransferTo={(newLeaderId) => handleTransferLeader(i, newLeaderId)}
                        onCancel={() => { setMoveTarget(null); setTransferTarget(null); }}
                      />
                    ))}
                  </div>
                </div>
              </Reveal>
            </motion.div>
          )}
        </AnimatePresence>

        {teamRoutes.length > 0 && (
          <Reveal delay={0.1} duration={0.55}>
            <div className="card mt-8 p-8" style={{ background: "var(--surface)" }}>
              <h2 className="mb-5 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>
                🗺 Generated Routes
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {teamRoutes.map((tr, i) => (
                  <RouteCard key={i} teamName={tr.team.name} route={tr.route} spots={spots} />
                ))}
              </div>
            </div>
          </Reveal>
        )}

        <Reveal delay={0.2} duration={0.5}>
          <div className="card mb-8 p-8" style={{ background: "var(--surface)" }}>
            <h2 className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-blue)" }}>
              🔌 Active Sessions
            </h2>
            <p className="mb-5 text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>
              One session per user. Deactivating a session logs them out instantly.
            </p>
            <button
              onClick={() => { setShowSessions(v => !v); if (!showSessions) loadSessions(); }}
              className="btn-press rounded-2xl px-6 py-3 text-[13px] font-extrabold uppercase tracking-wide transition-all"
              style={{ background: "var(--surface)", border: "2px solid var(--border-soft)", color: "var(--fg-muted)" }}
            >
              {showSessions ? "🙈 Hide" : "👁 View"} Active Sessions
            </button>

            <AnimatePresence>
              {showSessions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 flex flex-col gap-2"
                >
                  {sessionsLoading && (
                    <p className="py-4 text-center text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>⏳ Loading sessions…</p>
                  )}
                  {!sessionsLoading && sessions.length === 0 && (
                    <p className="py-4 text-center text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>💤 No active sessions.</p>
                  )}
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-4 rounded-2xl px-5 py-3.5"
                      style={{ background: "var(--border-soft)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-[15px] font-extrabold truncate" style={{ color: "var(--fg)" }}>
                            {s.user_name ?? s.user_id}
                          </span>
                          <span className="rounded-xl px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide"
                            style={{
                              background: s.user_role === "admin" ? "rgba(255,200,0,0.15)" : s.user_role === "spot-leader" ? "rgba(28,176,246,0.15)" : "rgba(88,204,2,0.15)",
                              color: s.user_role === "admin" ? "var(--color-brand-gold)" : s.user_role === "spot-leader" ? "var(--color-brand-blue)" : "var(--color-brand-green)",
                            }}>
                            {s.user_role === "admin" ? "⚙️ Admin" : s.user_role === "spot-leader" ? "📍 Spot" : "🏃 Team"}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] font-semibold truncate" style={{ color: "var(--fg-muted)" }}>
                          📱 {s.device_info ?? "Unknown device"}
                        </p>
                        <p className="text-[11px] font-semibold" style={{ color: "var(--fg-muted)" }}>
                          🕐 {new Date(s.created_at).toLocaleString()}
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleKickSession(s.id)}
                        className="btn-press shrink-0 rounded-2xl px-5 py-3 text-[12px] font-extrabold uppercase tracking-wide text-white transition-all"
                        style={{ background: "var(--color-brand-red)" }}
                      >
                        🔌 Kick
                      </motion.button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        <Reveal delay={0.24} duration={0.5}>
          <p className="mt-12 text-center text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            Treasure Hunt · University of Dhaka — CSE
          </p>
        </Reveal>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[13px] font-bold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
        {label}
      </span>
      <motion.span
        key={value}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        className="text-[36px] font-extrabold leading-none tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </motion.span>
    </div>
  );
}

interface TeamCardProps {
  team: GeneratedTeam;
  teamIndex: number;
  teamNames: string[];
  isMoveActive: boolean;
  activeMoveMemberId: string | null;
  isTransferActive: boolean;
  onStartMove: (memberId: string) => void;
  onStartTransfer: () => void;
  onMoveTo: (toTeamIndex: number) => void;
  onTransferTo: (newLeaderId: string) => void;
  onCancel: () => void;
}

function TeamCard({
  team,
  teamIndex,
  teamNames,
  isMoveActive,
  activeMoveMemberId,
  isTransferActive,
  onStartMove,
  onStartTransfer,
  onMoveTo,
  onTransferTo,
  onCancel,
}: TeamCardProps) {
  const teamCount = teamNames.length;
  const leaderCount = team.members.filter((m) => m.is_leader).length;

  return (
    <div
      className="rounded-2xl border-2 p-5 transition-all relative"
      style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[18px] font-extrabold" style={{ color: "var(--fg)" }}>
          {team.name}
        </span>
        <span
          className="rounded-xl px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wide"
          style={{ background: "rgba(88,204,2,0.12)", color: "var(--color-brand-green)" }}
        >
          🏷 {team.teamCode}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {team.members.map((m) => (
          <li key={m.id} className="flex items-center gap-2 text-[14px] font-semibold min-h-[32px]" style={{ color: "var(--fg-muted)" }}>
            {m.is_leader ? (
              <button
                onClick={onStartTransfer}
                className="text-[16px] transition-opacity hover:opacity-70"
                title="Transfer leadership"
              >
                👑
              </button>
            ) : (
              <span className="w-5 text-center text-[12px] opacity-40">•</span>
            )}
            <span className="flex-1 truncate">{m.name}</span>
            <button
              onClick={() => onStartMove(m.id)}
              className="rounded-lg px-2 py-0.5 text-[13px] font-extrabold transition-all hover:opacity-70"
              style={{ background: "var(--border-soft)", color: "var(--fg-muted)" }}
              title="Move to another team"
            >
              ⇄
            </button>
          </li>
        ))}
      </ul>

      {leaderCount !== 1 && (
        <p className="mt-2 text-[11px] font-extrabold text-center" style={{ color: "var(--color-brand-red)" }}>
          ⚠️ {leaderCount === 0 ? "No leader!" : `${leaderCount} leaders!`}
        </p>
      )}

      {isTransferActive && (
        <div
          className="absolute left-0 right-0 z-10 mx-5 mt-3 rounded-2xl border-2 p-3 shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--color-brand-gold)" }}
        >
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--color-brand-gold)" }}>
            Transfer 👑 to:
          </p>
          <div className="flex flex-col gap-1">
            {team.members.map((m) => (
              <button
                key={m.id}
                onClick={() => onTransferTo(m.id)}
                className="rounded-xl px-3 py-2 text-[13px] font-bold text-left transition-all hover:opacity-70"
                style={{ background: m.is_leader ? "rgba(255,200,0,0.1)" : "var(--border-soft)", color: "var(--fg)" }}
              >
                {m.is_leader ? "👑 " : "   "}{m.name}
              </button>
            ))}
          </div>
          <button
            onClick={onCancel}
            className="mt-2 w-full rounded-xl py-2 text-[11px] font-extrabold uppercase tracking-wide"
            style={{ color: "var(--fg-muted)" }}
          >
            Cancel
          </button>
        </div>
      )}

      {isMoveActive && (
        <div
          className="absolute left-0 right-0 z-10 mx-5 mt-3 rounded-2xl border-2 p-3 shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--color-brand-blue)" }}
        >
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--color-brand-blue)" }}>
            Move to:
          </p>
          <div className="flex flex-col gap-1">
            {teamNames.map((name, i) =>
              i === teamIndex ? null : (
                <button
                  key={i}
                  onClick={() => onMoveTo(i)}
                  className="rounded-xl px-3 py-2 text-[13px] font-bold text-left transition-all hover:opacity-70"
                  style={{ background: "var(--border-soft)", color: "var(--fg)" }}
                >
                  → {name}
                </button>
              )
            )}
          </div>
          <button
            onClick={onCancel}
            className="mt-2 w-full rounded-xl py-2 text-[11px] font-extrabold uppercase tracking-wide"
            style={{ color: "var(--fg-muted)" }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function RouteCard({
  teamName,
  route,
  spots,
}: {
  teamName: string;
  route: { order: number; spotId: string }[];
  spots: Spot[];
}) {
  const spotMap = new Map(spots.map((s) => [s.id, s.name]));

  return (
    <div
      className="rounded-2xl border-2 p-5 transition-all"
      style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}
    >
      <span className="mb-3 block text-[18px] font-extrabold" style={{ color: "var(--fg)" }}>
        🗺 {teamName}
      </span>
      <ol className="flex flex-col gap-2">
        {route.map((r) => (
          <li key={r.order} className="flex items-center gap-3 text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-extrabold text-white"
              style={{ background: "var(--color-brand-green)" }}
            >
              {r.order + 1}
            </span>
            {spotMap.get(r.spotId) ?? "Unknown Spot"}
          </li>
        ))}
      </ol>
    </div>
  );
}