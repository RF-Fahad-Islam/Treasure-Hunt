import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Backdrop } from "@/components/Backdrop";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Reveal } from "@/components/Reveal";
import { SuccessOverlay } from "@/components/SuccessOverlay";
import { BarChartCard, DoughnutChart } from "@/components/charts";
import { useAuthStore } from "@/store/authStore";
import {
  fetchAllParticipants,
  fetchAllSpots,
  fetchAllClues,
  fetchAllTeams,
  fetchEventConfig,
  generateTeams,
  generateRoutes,
  clearAllTeamsAndRoutes,
  saveTeams,
  saveRoutes,
  addParticipant,
  deleteParticipant,
  updateParticipant,
  createSpot,
  updateSpot,
  deleteSpot,
  createClue,
  deleteClue,
  updateEventConfig,
  resetTeam,
  resetAllHuntData,
} from "@/services/admin";
import { fetchActiveSessions, adminDeactivateSession } from "@/services/auth";
import type { SessionWithUser } from "@/services/auth";
import type { Participant, Spot, ClueDefinition, EventConfig, Team } from "@/types";
import type { GeneratedTeam, TeamWithRoute } from "@/services/admin";

import { insforge } from "@/lib/insforge";

type Tab = "dashboard" | "participants" | "teams" | "spots" | "clues" | "config" | "sessions" | "broadcast";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "participants", label: "Participants", icon: "👥" },
  { key: "teams", label: "Teams", icon: "🏠" },
  { key: "spots", label: "Spots", icon: "📍" },
  { key: "clues", label: "Clues", icon: "🔎" },
  { key: "config", label: "Event Config", icon: "⚙️" },
  { key: "sessions", label: "Sessions", icon: "🔌" },
  { key: "broadcast", label: "Broadcast", icon: "📢" },
];

export default function AdminPage() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const [tab, setTab] = useState<Tab>("dashboard");

  /* ─── Data ─── */
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [clues, setClues] = useState<ClueDefinition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [sessions, setSessions] = useState<SessionWithUser[]>([]);

  /* ─── UI ─── */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTeamCount, setSuccessTeamCount] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, s, c, t, e] = await Promise.all([
        fetchAllParticipants(),
        fetchAllSpots(),
        fetchAllClues(),
        fetchAllTeams(),
        fetchEventConfig(),
      ]);
      setParticipants(p);
      setSpots(s);
      setClues(c);
      setTeams(t);
      setEventConfig(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ─── Helpers ─── */
  function flash(msg: string) { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }
  function flashError(msg: string) { setError(msg); setTimeout(() => setError(null), 5000); }

  /* ─── Derived chart data ──────────────────────────────────── */
  const teamScoreData = teams
    .filter((t) => (t.total_points ?? 0) > 0)
    .sort((a, b) => (b.total_points ?? 0) - (a.total_points ?? 0))
    .map((t) => ({ label: t.name, value: t.total_points ?? 0 }));
  const participantDistData = [
    {
      label: "Assigned",
      value: participants.filter((p) => p.team_id).length,
      color: "var(--color-brand-green)",
    },
    {
      label: "Unassigned",
      value: participants.filter((p) => !p.team_id).length,
      color: "var(--color-brand-red)",
    },
  ];
  const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
  for (const c of clues) {
    const d = c.difficulty ?? "medium";
    if (d === "easy") difficultyCounts.easy++;
    else if (d === "hard") difficultyCounts.hard++;
    else difficultyCounts.medium++;
  }
  const clueDiffData = [
    { label: "🌱 Easy", value: difficultyCounts.easy, color: "var(--color-brand-green)" },
    { label: "⭐ Medium", value: difficultyCounts.medium, color: "var(--color-brand-gold)" },
    { label: "🔥 Hard", value: difficultyCounts.hard, color: "var(--color-brand-red)" },
  ];
  const huntProgressData = [
    {
      label: "Completed",
      value: teams.filter((t) => t.hunt_completed).length,
      color: "var(--color-brand-green)",
    },
    {
      label: "In Progress",
      value: teams.filter((t) => !t.hunt_completed).length,
      color: "var(--color-brand-blue)",
    },
  ];

  /* ==============================================================
     TAB: DASHBOARD
     ============================================================== */
  function renderDashboard() {
    const totalParticipants = participants.length;
    const unassigned = participants.filter((p) => !p.team_id).length;
    const clueCount = clues.length;
    const spotCount = spots.length;
    const leaderCount = participants.filter((p) => p.is_leader).length;

    return (
      <div className="flex flex-col gap-5">
        {/* Thin status bar */}
        <div
          className="flex items-center gap-1 overflow-x-auto rounded-2xl px-4 py-2.5 text-[12px] font-extrabold tabular-nums whitespace-nowrap scrollbar-none"
          style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}
        >
          <StatPill icon="👥" value={totalParticipants} label="total" accent="var(--color-brand-blue)" />
          <Divider />
          <StatPill icon="🔓" value={unassigned} label="unassigned" accent="var(--color-brand-red)" />
          <Divider />
          <StatPill icon="👑" value={leaderCount} label="leaders" accent="var(--color-brand-gold)" />
          <Divider />
          <StatPill icon="🏠" value={teams.length} label="teams" accent="var(--color-brand-gold)" />
          <Divider />
          <StatPill icon="📍" value={spotCount} label="spots" accent="var(--color-brand-green)" />
          <Divider />
          <StatPill icon="🔎" value={clueCount} label="clues" accent="var(--color-brand-green)" />

          <div className="ml-auto flex gap-1 shrink-0 pl-3">
            <button
              data-sound="heavy"
              onClick={loadData}
              disabled={loading}
              className="rounded-xl px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide transition-all active:scale-95"
              style={{ background: "var(--border-soft)", color: "var(--fg-muted)" }}
            >
              {loading ? "⟳" : "🔄"}
            </button>
            <button
              data-sound="error"
              onClick={async () => {
                if (confirm("Reset ALL hunt data?")) {
                  try { await resetAllHuntData(); flash("🗑 Reset"); await loadData(); } catch { flashError("Reset failed"); }
                }
              }}
              className="rounded-xl px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide transition-all active:scale-95"
              style={{ background: "rgba(255,75,75,0.1)", color: "var(--color-brand-red)" }}
            >
              🗑
            </button>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-5 lg:grid-cols-2">
          <BarChartCard
            title="🏆 Team Scores"
            subtitle={teams.length > 0 ? "Ranked by total points" : undefined}
            accent="var(--color-brand-gold)"
            data={teamScoreData}
            height={Math.max(160, teamScoreData.length * 32)}
            formatValue={(v) => `${v} pts`}
          />
          <DoughnutChart
            title="👥 Participant Assignment"
            subtitle={`${participants.length} total`}
            accent="var(--color-brand-blue)"
            data={participantDistData}
            size={160}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <BarChartCard
            title="🔎 Clue Difficulty"
            subtitle={`${clues.length} total clues`}
            accent="var(--color-brand-green)"
            data={clueDiffData}
            height={140}
            formatValue={(v) => `${v} clue${v !== 1 ? "s" : ""}`}
          />
          <DoughnutChart
            title="🏁 Hunt Progress"
            subtitle={`${teams.length} teams`}
            accent="var(--color-brand-green)"
            data={huntProgressData}
            size={160}
          />
        </div>
      </div>
    );
  }



  /* ==============================================================
     TAB: PARTICIPANTS
     ============================================================== */
  const [newName, setNewName] = useState("");
  const [newRoll, setNewRoll] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingPart, setEditingPart] = useState<string | null>(null);
  const [editPartData, setEditPartData] = useState<Partial<Participant>>({});

  async function handleAddParticipant(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await addParticipant({ name: newName.trim(), roll: newRoll.trim() || undefined, email: newEmail.trim() || undefined, phone: newPhone.trim() || undefined });
      setNewName(""); setNewRoll(""); setNewEmail(""); setNewPhone("");
      flash(`✅ ${newName.trim()} added!`);
      await loadData();
    } catch (err) {
      flashError(err instanceof Error ? err.message : "Failed to add");
    } finally { setAdding(false); }
  }

  async function handleDeleteParticipant(id: string, name: string) {
    if (!confirm(`Delete ${name}?`)) return;
    try { await deleteParticipant(id); flash(`🗑 ${name} deleted.`); await loadData(); } catch (err) { flashError("Delete failed"); }
  }

  function startEditPart(p: Participant) {
    setEditingPart(p.id);
    setEditPartData({ name: p.name, roll: p.roll, email: p.email, phone: p.phone });
  }

  async function saveEditPart(id: string) {
    try { await updateParticipant(id, editPartData); flash("✅ Updated"); setEditingPart(null); await loadData(); } catch (err) { flashError("Update failed"); }
  }

  function renderParticipants() {
    const unassigned = participants.filter((p) => !p.team_id);
    const assigned = participants.filter((p) => p.team_id);
    return (
      <div className="flex flex-col gap-6">
        <div className="card p-6" style={{ background: "var(--surface)" }}>
          <h3 className="mb-4 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-blue)" }}>➕ Add Participant</h3>
          <form onSubmit={handleAddParticipant} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[160px]">
              <label className="mb-1.5 block text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" required className="w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-semibold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </div>
            <div className="w-28">
              <label className="mb-1.5 block text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Roll</label>
              <input value={newRoll} onChange={e => setNewRoll(e.target.value)} placeholder="01" className="w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-semibold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="mb-1.5 block text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Email</label>
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="optional" type="email" className="w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-semibold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </div>
            <div className="w-36">
              <label className="mb-1.5 block text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Phone</label>
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="optional" className="w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-semibold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </div>
            <button data-sound="confirm" type="submit" disabled={adding || !newName.trim()} className="btn-press ripple rounded-2xl px-8 py-3.5 text-[14px] font-extrabold uppercase tracking-wide text-white" style={{ background: "var(--color-brand-blue)", opacity: adding || !newName.trim() ? 0.5 : 1 }}>{adding ? "⏳" : "➕ Add"}</button>
          </form>
        </div>

        <SectionList title={`🔓 Unassigned (${unassigned.length})`} accent="var(--color-brand-red)">
          {unassigned.map((p) => (
            <ParticipantRow key={p.id} p={p} editing={editingPart === p.id} editData={editingPart === p.id ? editPartData : {}} onEdit={() => startEditPart(p)} onSave={() => saveEditPart(p.id)} onChange={(d) => setEditPartData((prev) => ({ ...prev, ...d }))} onCancel={() => setEditingPart(null)} onDelete={() => handleDeleteParticipant(p.id, p.name)} deletable />
          ))}
          {unassigned.length === 0 && <p className="py-4 text-center text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>All participants are assigned.</p>}
        </SectionList>

        <SectionList title={`✅ Assigned (${assigned.length})`} accent="var(--color-brand-green)">
          {assigned.map((p) => {
            const team = teams.find((t) => t.id === p.team_id);
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "var(--border-soft)" }}>
                <span className="flex-1 text-[14px] font-bold truncate" style={{ color: "var(--fg)" }}>{p.is_leader ? "👑 " : ""}{p.name}</span>
                <span className="text-[11px] font-semibold" style={{ color: "var(--fg-muted)" }}>{p.roll || "—"}</span>
                <span className="text-[12px] font-bold" style={{ color: "var(--color-brand-green)" }}>{team?.name ?? "—"}</span>
              </div>
            );
          })}
        </SectionList>
      </div>
    );
  }

  /* ==============================================================
     TAB: TEAMS
     ============================================================== */
  type Step = "idle" | "preview" | "saved" | "complete";
  const [step, setStep] = useState<Step>("idle");
  const [generated, setGenerated] = useState<GeneratedTeam[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<TeamWithRoute[]>([]);
  const [moveTarget, setMoveTarget] = useState<{ memberId: string; fromTeamIndex: number } | null>(null);
  const [transferTarget, setTransferTarget] = useState<number | null>(null);

  function handleGenerate() {
    setError(null);
    if (participants.length < 5) { setError("Need at least 5 participants."); return; }
    setGenerated(generateTeams(participants));
    setStep("preview");
    setSavedRoutes([]);
    setSuccess(null);
  }

  function handleReshuffle() {
    setError(null);
    setGenerated(generateTeams(participants));
    flash("🔄 Reshuffled!");
  }

  function handleMoveMember(from: number, to: number, memberId: string) {
    if (from === to) { setMoveTarget(null); return; }
    setGenerated((prev) => {
      const g = prev.map((t) => ({ ...t, members: [...t.members] }));
      const fm = g[from], tm = g[to];
      const idx = fm.members.findIndex((m) => m.id === memberId);
      if (idx === -1) return prev;
      const [m] = fm.members.splice(idx, 1);
      if (m.is_leader) { m.is_leader = false; if (fm.members.length > 0) fm.members[0].is_leader = true; }
      tm.members.push(m);
      return g;
    });
    setMoveTarget(null);
  }

  function handleTransferLeader(teamIndex: number, newLeaderId: string) {
    setGenerated((prev) => prev.map((t, i) => i !== teamIndex ? t : { ...t, members: t.members.map((m) => ({ ...m, is_leader: m.id === newLeaderId })) }));
    setTransferTarget(null);
  }

  async function handleSaveTeams() {
    setLoading(true); setError(null);
    try {
      await clearAllTeamsAndRoutes();
      const idMap = await saveTeams(generated);
      const routes = generateRoutes(clues, generated);
      await saveRoutes(routes, idMap);
      setSavedRoutes(routes);
      setStep("complete");
      setSuccessTeamCount(generated.length);
      setShowSuccess(true);
      await loadData();
    } catch (err) { flashError(err instanceof Error ? err.message : "Save failed"); } finally { setLoading(false); }
  }

  function renderTeamList() {
    return (
      <div className="flex flex-col gap-4">
        {teams.length === 0 && <p className="py-8 text-center text-[15px] font-semibold" style={{ color: "var(--fg-muted)" }}>No teams yet. Go to the Teams tab to generate them.</p>}
        {teams.map((t) => (
          <div key={t.id} className="flex items-center gap-4 rounded-2xl px-5 py-3" style={{ background: "var(--border-soft)" }}>
            <span className="font-display text-[18px] font-extrabold min-w-[140px]" style={{ color: "var(--fg)" }}>{t.name}</span>
            <span className="rounded-xl px-3 py-1 text-[11px] font-extrabold" style={{ background: "rgba(88,204,2,0.12)", color: "var(--color-brand-green)" }}>🏷 {t.team_code}</span>
            <span className="text-[12px] font-semibold" style={{ color: "var(--fg-muted)" }}>⚡ {t.hunt_completed ? "✅ Done" : `Clue ${(t.current_clue_index ?? 0) + 1}`}</span>
            <span className="text-[12px] font-semibold" style={{ color: "var(--fg-muted)" }}>{t.total_points ?? 0} pts</span>
            <button onClick={async () => { try { await resetTeam(t.id); flash(`🔄 ${t.name} reset`); await loadData(); } catch { flashError("Reset failed"); } }} className="ml-auto rounded-xl px-3 py-1.5 text-[11px] font-extrabold" style={{ background: "rgba(255,200,0,0.1)", color: "var(--color-brand-gold)" }}>🔄 Reset</button>
          </div>
        ))}
      </div>
    );
  }

  function renderTeams() {
    return (
      <div className="flex flex-col gap-8">
        <div className="card p-6" style={{ background: "var(--surface)" }}>
          <h3 className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>🏗 Generate Teams</h3>
          <p className="mb-5 text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>Randomly assign participants into teams of 5. First member = 👑 leader.</p>
          <div className="flex flex-wrap gap-4">
            <button data-sound="confirm" onClick={handleGenerate} disabled={loading || participants.length < 5} className="btn-press ripple btn-primary rounded-2xl px-8 py-4 text-[15px]" style={participants.length < 5 ? { opacity: 0.5, cursor: "not-allowed" } : {}}>🚀 Generate Teams</button>
            {step === "preview" && <button onClick={handleReshuffle} disabled={loading} className="btn-press ripple rounded-2xl px-6 py-4 text-[14px] font-extrabold uppercase tracking-wide" style={{ background: "var(--surface)", border: "3px solid var(--border-soft)", color: "var(--fg)" }}>🔀 Reshuffle</button>}
            {step === "preview" && <button data-sound="success" onClick={handleSaveTeams} disabled={loading} className="btn-press ripple rounded-2xl px-8 py-4 text-[15px] font-extrabold uppercase tracking-wide text-white" style={{ background: "var(--color-brand-green)", boxShadow: "0 6px 0 0 color-mix(in srgb, var(--color-brand-green) 60%, black)", opacity: loading ? 0.5 : 1 }}>{loading ? "⏳ Saving…" : "💾 Save Teams & Routes"}</button>}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "preview" && generated.length > 0 && (
            <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="card p-6" style={{ background: "var(--surface)" }}>
                <h3 className="mb-1 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>👀 Preview — {generated.length} Teams</h3>
                <p className="mb-5 text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>⇄ move member · 👑 transfer leader <span style={{ color: "var(--color-brand-red)" }}>(exactly one leader)</span></p>
                <div className="grid gap-5 sm:grid-cols-2">
                  {generated.map((team, i) => (
                    <TeamCard key={i} team={team} teamIndex={i} teamNames={generated.map((t) => t.name)} isMoveActive={moveTarget?.fromTeamIndex === i} isTransferActive={transferTarget === i} onStartMove={(mid) => setMoveTarget({ memberId: mid, fromTeamIndex: i })} onStartTransfer={() => setTransferTarget(i)} onMoveTo={(toIdx) => handleMoveMember(i, toIdx, moveTarget!.memberId)} onTransferTo={(nid) => handleTransferLeader(i, nid)} onCancel={() => { setMoveTarget(null); setTransferTarget(null); }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {savedRoutes.length > 0 && (
          <div className="card p-6" style={{ background: "var(--surface)" }}>
            <h3 className="mb-5 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>🗺 Generated Routes</h3>
            <div className="grid gap-5 sm:grid-cols-2">{savedRoutes.map((tr, i) => <RouteCard key={i} teamName={tr.team.name} route={tr.route} spots={spots} />)}</div>
          </div>
        )}

        <div className="card p-6" style={{ background: "var(--surface)" }}>
          <h3 className="mb-4 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-blue)" }}>🏠 All Teams</h3>
          {renderTeamList()}
        </div>
      </div>
    );
  }

  /* ==============================================================
     TAB: SPOTS
     ============================================================== */
  const [newSpot, setNewSpot] = useState({ name: "", description: "", location_hint: "", spot_leader_code: "", has_mini_game: false, mini_game_description: "" });
  const [editingSpot, setEditingSpot] = useState<string | null>(null);
  const [editSpotData, setEditSpotData] = useState<Partial<Spot>>({});

  async function handleCreateSpot(e: React.FormEvent) {
    e.preventDefault();
    if (!newSpot.name.trim() || !newSpot.spot_leader_code.trim()) return;
    try { await createSpot(newSpot); flash(`📍 ${newSpot.name} created`); setNewSpot({ name: "", description: "", location_hint: "", spot_leader_code: "", has_mini_game: false, mini_game_description: "" }); await loadData(); } catch (err) { flashError("Create failed"); }
  }

  function startEditSpot(s: Spot) { setEditingSpot(s.id); setEditSpotData(s); }

  async function saveEditSpot(id: string) {
    try { await updateSpot(id, editSpotData); flash("✅ Spot updated"); setEditingSpot(null); await loadData(); } catch (err) { flashError("Update failed"); }
  }

  async function handleDeleteSpot(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all its clues?`)) return;
    try { await deleteSpot(id); flash(`🗑 ${name} deleted`); await loadData(); } catch { flashError("Delete failed"); }
  }

  function renderSpots() {
    return (
      <div className="flex flex-col gap-6">
        <div className="card p-6" style={{ background: "var(--surface)" }}>
          <h3 className="mb-4 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-blue)" }}>📍 Create Spot</h3>
          <form onSubmit={handleCreateSpot} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[140px]"><label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Name *</label><input value={newSpot.name} onChange={e => setNewSpot(p => ({ ...p, name: e.target.value }))} placeholder="Library" required className="w-full rounded-2xl border-2 px-4 py-3 text-[14px] font-semibold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} /></div>
            <div className="flex-1 min-w-[140px]"><label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Leader Code *</label><input value={newSpot.spot_leader_code} onChange={e => setNewSpot(p => ({ ...p, spot_leader_code: e.target.value.toUpperCase() }))} placeholder="LIB-2026" required className="w-full rounded-2xl border-2 px-4 py-3 text-[14px] font-semibold tracking-wider uppercase outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} /></div>
            <div className="flex-1 min-w-[140px]"><label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Location Hint</label><input value={newSpot.location_hint} onChange={e => setNewSpot(p => ({ ...p, location_hint: e.target.value }))} placeholder="Near the entrance" className="w-full rounded-2xl border-2 px-4 py-3 text-[14px] font-semibold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} /></div>
            <div className="w-full"><label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Description</label><textarea value={newSpot.description} onChange={e => setNewSpot(p => ({ ...p, description: e.target.value }))} placeholder="Spot details…" rows={2} className="w-full rounded-2xl border-2 px-4 py-3 text-[14px] font-semibold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} /></div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-[13px] font-bold cursor-pointer" style={{ color: "var(--fg)" }}><input type="checkbox" checked={newSpot.has_mini_game} onChange={e => setNewSpot(p => ({ ...p, has_mini_game: e.target.checked }))} className="h-4 w-4" /> Has Mini-Game</label>
            </div>
            {newSpot.has_mini_game && <div className="w-full"><textarea value={newSpot.mini_game_description} onChange={e => setNewSpot(p => ({ ...p, mini_game_description: e.target.value }))} placeholder="Mini-game description…" rows={2} className="w-full rounded-2xl border-2 px-4 py-3 text-[14px] font-semibold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} /></div>}
            <div className="w-full"><button type="submit" className="btn-press ripple rounded-2xl px-8 py-3.5 text-[14px] font-extrabold uppercase tracking-wide text-white" style={{ background: "var(--color-brand-blue)" }}>➕ Create Spot</button></div>
          </form>
        </div>

        <SectionList title={`📍 All Spots (${spots.length})`} accent="var(--color-brand-green)">
          {spots.map((s) => (
            editingSpot === s.id ? (
              <div key={s.id} className="flex flex-col gap-3 rounded-2xl p-4" style={{ background: "var(--border-soft)" }}>
                <input value={editSpotData.name ?? ""} onChange={e => setEditSpotData(p => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border-2 px-3 py-2 text-[14px] font-bold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                <input value={editSpotData.spot_leader_code ?? ""} onChange={e => setEditSpotData(p => ({ ...p, spot_leader_code: e.target.value.toUpperCase() }))} className="w-full rounded-xl border-2 px-3 py-2 text-[14px] font-bold tracking-wider uppercase outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                <input value={editSpotData.location_hint ?? ""} onChange={e => setEditSpotData(p => ({ ...p, location_hint: e.target.value }))} className="w-full rounded-xl border-2 px-3 py-2 text-[14px] font-semibold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                <div className="flex gap-2"><button onClick={() => saveEditSpot(s.id)} className="rounded-xl px-4 py-2 text-[12px] font-extrabold text-white" style={{ background: "var(--color-brand-green)" }}>💾 Save</button><button onClick={() => setEditingSpot(null)} className="rounded-xl px-4 py-2 text-[12px] font-extrabold" style={{ color: "var(--fg-muted)" }}>Cancel</button></div>
              </div>
            ) : (
              <div key={s.id} className="flex items-center gap-4 rounded-2xl px-4 py-3" style={{ background: "var(--border-soft)" }}>
                <span className="font-display text-[16px] font-extrabold min-w-[120px]" style={{ color: "var(--fg)" }}>{s.name}</span>
                <span className="rounded-xl px-2 py-0.5 text-[10px] font-extrabold tracking-wider" style={{ background: "rgba(28,176,246,0.1)", color: "var(--color-brand-blue)" }}>🔑 {s.spot_leader_code}</span>
                <span className="text-[12px] font-semibold truncate flex-1" style={{ color: "var(--fg-muted)" }}>{s.location_hint ?? ""}</span>
                <span className="text-[11px] font-semibold" style={{ color: s.has_mini_game ? "var(--color-brand-gold)" : "var(--fg-muted)" }}>{s.has_mini_game ? "🎮 Mini-Game" : "—"}</span>
                <div className="flex gap-1"><button onClick={() => startEditSpot(s)} className="rounded-xl px-3 py-1.5 text-[11px] font-extrabold" style={{ color: "var(--color-brand-blue)" }}>✏️</button><button onClick={() => handleDeleteSpot(s.id, s.name)} className="rounded-xl px-3 py-1.5 text-[11px] font-extrabold" style={{ color: "var(--color-brand-red)" }}>🗑</button></div>
              </div>
            )
          ))}
          {spots.length === 0 && <p className="py-4 text-center text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>No spots yet. Create one above.</p>}
        </SectionList>
      </div>
    );
  }

  /* ==============================================================
     TAB: CLUES
     ============================================================== */
  const [newClue, setNewClue] = useState({ spot_id: "", clue_text: "", image_url: "", difficulty: "medium" });
  const [filterSpot, setFilterSpot] = useState("");

  async function handleCreateClue(e: React.FormEvent) {
    e.preventDefault();
    if (!newClue.spot_id || !newClue.clue_text.trim()) return;
    try { await createClue(newClue); flash("🔎 Clue created"); setNewClue({ spot_id: "", clue_text: "", image_url: "", difficulty: "medium" }); await loadData(); } catch (err) { flashError("Create failed"); }
  }

  async function handleDeleteClue(id: string) {
    if (!confirm("Delete this clue?")) return;
    try { await deleteClue(id); flash("🗑 Clue deleted"); await loadData(); } catch { flashError("Delete failed"); }
  }

  function renderClues() {
    const filtered = filterSpot ? clues.filter((c) => c.spot_id === filterSpot) : clues;
    return (
      <div className="flex flex-col gap-6">
        <div className="card p-6" style={{ background: "var(--surface)" }}>
          <h3 className="mb-4 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-blue)" }}>🔎 Create Clue</h3>
          <form onSubmit={handleCreateClue} className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[160px]">
                <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Spot *</label>
                <select value={newClue.spot_id} onChange={e => setNewClue(p => ({ ...p, spot_id: e.target.value }))} required className="w-full rounded-2xl border-2 px-4 py-3 text-[14px] font-semibold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }}>
                  <option value="">Select spot…</option>
                  {spots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="w-36">
                <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Difficulty</label>
                <select value={newClue.difficulty} onChange={e => setNewClue(p => ({ ...p, difficulty: e.target.value }))} className="w-full rounded-2xl border-2 px-4 py-3 text-[14px] font-semibold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }}>
                  <option value="easy">🌱 Easy</option><option value="medium">⭐ Medium</option><option value="hard">🔥 Hard</option>
                </select>
              </div>
            </div>
            <div><label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Clue Text *</label><textarea value={newClue.clue_text} onChange={e => setNewClue(p => ({ ...p, clue_text: e.target.value }))} placeholder="The puzzle…" rows={3} className="w-full rounded-2xl border-2 px-4 py-3 text-[14px] font-semibold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} /></div>
            <div><label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Image URL (optional)</label><input value={newClue.image_url} onChange={e => setNewClue(p => ({ ...p, image_url: e.target.value }))} placeholder="https://…" className="w-full rounded-2xl border-2 px-4 py-3 text-[14px] font-semibold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} /></div>
            <button type="submit" className="btn-press ripple rounded-2xl px-8 py-3.5 text-[14px] font-extrabold uppercase tracking-wide text-white" style={{ background: "var(--color-brand-blue)" }}>➕ Create Clue</button>
          </form>
        </div>

        <SectionList title={`🔎 All Clues (${clues.length})`} accent="var(--color-brand-green)">
          <div className="mb-3 flex gap-2">
            <button onClick={() => setFilterSpot("")} className="rounded-xl px-3 py-1.5 text-[11px] font-extrabold" style={{ background: !filterSpot ? "var(--color-brand-blue)" : "var(--border-soft)", color: !filterSpot ? "#fff" : "var(--fg)" }}>All</button>
            {spots.map((s) => <button key={s.id} onClick={() => setFilterSpot(s.id)} className="rounded-xl px-3 py-1.5 text-[11px] font-extrabold" style={{ background: filterSpot === s.id ? "var(--color-brand-blue)" : "var(--border-soft)", color: filterSpot === s.id ? "#fff" : "var(--fg)" }}>{s.name}</button>)}
          </div>
          {filtered.map((c) => {
            const spot = spots.find((s) => s.id === c.spot_id);
            return (
              <div key={c.id} className="flex items-start gap-4 rounded-2xl px-4 py-3" style={{ background: "var(--border-soft)" }}>
                <span className="rounded-xl px-2 py-0.5 text-[10px] font-extrabold" style={{ background: "rgba(28,176,246,0.1)", color: "var(--color-brand-blue)" }}>{spot?.name ?? "—"}</span>
                <span className="flex-1 text-[13px] font-semibold leading-relaxed" style={{ color: "var(--fg)" }}>{c.clue_text.length > 80 ? c.clue_text.slice(0, 80) + "…" : c.clue_text}</span>
                <span className="text-[11px] font-bold" style={{ color: c.difficulty === "hard" ? "var(--color-brand-red)" : c.difficulty === "easy" ? "var(--color-brand-green)" : "var(--color-brand-gold)" }}>{c.difficulty === "hard" ? "🔥" : c.difficulty === "easy" ? "🌱" : "⭐"}</span>
                <button onClick={() => handleDeleteClue(c.id)} className="rounded-xl px-2 py-1 text-[11px] font-extrabold" style={{ color: "var(--color-brand-red)" }}>🗑</button>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="py-4 text-center text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>No clues match the filter.</p>}
        </SectionList>
      </div>
    );
  }

  /* ==============================================================
     TAB: EVENT CONFIG
     ============================================================== */
  const [configForm, setConfigForm] = useState<Partial<EventConfig>>({});
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    if (eventConfig && !configLoaded) {
      setConfigForm(eventConfig);
      setConfigLoaded(true);
    }
  }, [eventConfig, configLoaded]);

  async function handleSaveConfig() {
    try { await updateEventConfig(configForm); flash("⚙️ Config saved!"); setConfigLoaded(false); await loadData(); } catch (err) { flashError("Save failed"); }
  }

  async function handleToggleHunt() {
    const next = !configForm.hunt_started;
    const updates: Partial<EventConfig> = { hunt_started: next };
    if (next && !configForm.hunt_started_at) {
      updates.hunt_started_at = new Date().toISOString();
    }
    setConfigForm((prev) => ({ ...prev, ...updates }));
    try { await updateEventConfig(updates); flash(next ? "🏁 Hunt started!" : "⏸ Hunt paused"); setConfigLoaded(false); await loadData(); } catch (err) { flashError("Toggle failed"); }
  }

  function renderConfig() {
    return (
      <div className="card p-6 max-w-2xl" style={{ background: "var(--surface)" }}>
        <h3 className="mb-6 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>⚙️ Event Configuration</h3>

        <div className="flex flex-col gap-5">
          <Field label="Event Name">
            <input value={configForm.event_name ?? ""} onChange={e => setConfigForm(p => ({ ...p, event_name: e.target.value }))} className="w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-bold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Clue Time Limit (min)">
              <input type="number" value={configForm.clue_time_limit_minutes ?? 40} onChange={e => setConfigForm(p => ({ ...p, clue_time_limit_minutes: Number(e.target.value) }))} className="w-full rounded-2xl border-2 px-4 py-3 text-[18px] font-extrabold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </Field>
            <Field label="Points Per Clue">
              <input type="number" value={configForm.points_per_clue ?? 100} onChange={e => setConfigForm(p => ({ ...p, points_per_clue: Number(e.target.value) }))} className="w-full rounded-2xl border-2 px-4 py-3 text-[18px] font-extrabold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </Field>
            <Field label="Max Mini-Game Points">
              <input type="number" value={configForm.max_mini_game_points ?? 60} onChange={e => setConfigForm(p => ({ ...p, max_mini_game_points: Number(e.target.value) }))} className="w-full rounded-2xl border-2 px-4 py-3 text-[18px] font-extrabold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </Field>
            <Field label="Start Time">
              <input type="datetime-local" value={configForm.hunt_started_at ? configForm.hunt_started_at.slice(0, 16) : ""} onChange={e => setConfigForm(p => ({ ...p, hunt_started_at: e.target.value ? new Date(e.target.value).toISOString() : null }))} className="w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-bold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-2xl p-5" style={{ background: configForm.hunt_started ? "rgba(88,204,2,0.06)" : "rgba(255,75,75,0.06)", border: `2px solid ${configForm.hunt_started ? "rgba(88,204,2,0.2)" : "rgba(255,75,75,0.2)"}` }}>
            <div>
              <p className="text-[14px] font-extrabold" style={{ color: configForm.hunt_started ? "var(--color-brand-green)" : "var(--color-brand-red)" }}>
                {configForm.hunt_started ? "🏁 Hunt is LIVE" : "⏸ Hunt is PAUSED"}
              </p>
              <p className="text-[12px] font-semibold mt-1" style={{ color: "var(--fg-muted)" }}>
                {configForm.hunt_started ? "Teams are actively hunting." : "Teams cannot proceed until started."}
              </p>
            </div>
            <button data-sound="confirm" onClick={handleToggleHunt} className="btn-press ripple rounded-2xl px-6 py-3 text-[13px] font-extrabold uppercase tracking-wide text-white" style={{ background: configForm.hunt_started ? "var(--color-brand-red)" : "var(--color-brand-green)" }}>
              {configForm.hunt_started ? "⏸ Pause" : "🏁 Start Hunt"}
            </button>
          </div>

          <button data-sound="success" onClick={handleSaveConfig} className="btn-press ripple btn-primary w-full">💾 Save Configuration</button>
        </div>
      </div>
    );
  }

  /* ==============================================================
     TAB: SESSIONS
     ============================================================== */
  const [showSessions, setShowSessions] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  async function loadSessions() {
    setSessionsLoading(true);
    try { const s = await fetchActiveSessions(); setSessions(s); } catch { /* ignore */ } finally { setSessionsLoading(false); }
  }

  async function handleKickSession(sessionId: string) {
    try { await adminDeactivateSession(sessionId); setSessions((prev) => prev.filter((s) => s.id !== sessionId)); flash("🔌 Session deactivated"); } catch { flashError("Failed to deactivate"); }
  }

  function renderSessions() {
    return (
      <div className="card p-6" style={{ background: "var(--surface)" }}>
        <p className="mb-5 text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>One session per user. Deactivating logs them out instantly.</p>
        <button onClick={() => { setShowSessions(v => !v); if (!showSessions) loadSessions(); }} className="btn-press ripple rounded-2xl px-6 py-3 text-[13px] font-extrabold uppercase tracking-wide" style={{ background: "var(--surface)", border: "2px solid var(--border-soft)", color: "var(--fg-muted)" }}>
          {showSessions ? "🙈 Hide" : "👁 View"} Active Sessions
        </button>
        <AnimatePresence>
          {showSessions && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-5 flex flex-col gap-2">
              {sessionsLoading && <p className="py-4 text-center text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>⏳ Loading sessions…</p>}
              {!sessionsLoading && sessions.length === 0 && <p className="py-4 text-center text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>💤 No active sessions.</p>}
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-4 rounded-2xl px-5 py-3.5" style={{ background: "var(--border-soft)" }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[15px] font-extrabold truncate" style={{ color: "var(--fg)" }}>{s.user_name ?? s.user_id}</span>
                      <span className="rounded-xl px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide" style={{ background: s.user_role === "admin" ? "rgba(255,200,0,0.15)" : s.user_role === "spot-leader" ? "rgba(28,176,246,0.15)" : "rgba(88,204,2,0.15)", color: s.user_role === "admin" ? "var(--color-brand-gold)" : s.user_role === "spot-leader" ? "var(--color-brand-blue)" : "var(--color-brand-green)" }}>
                        {s.user_role === "admin" ? "⚙️ Admin" : s.user_role === "spot-leader" ? "📍 Spot" : "🏃 Team"}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] font-semibold truncate" style={{ color: "var(--fg-muted)" }}>📱 {s.device_info ?? "Unknown device"}</p>
                    <p className="text-[11px] font-semibold" style={{ color: "var(--fg-muted)" }}>🕐 {new Date(s.created_at).toLocaleString()}</p>
                  </div>
                  <button onClick={() => handleKickSession(s.id)} className="btn-press ripple shrink-0 rounded-2xl px-5 py-3 text-[12px] font-extrabold uppercase tracking-wide text-white" style={{ background: "var(--color-brand-red)" }}>🔌 Kick</button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ==============================================================
     TAB: BROADCAST
     ============================================================== */
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState<"all" | "spot-leaders" | "teams">("all");
  const [broadcastSending, setBroadcastSending] = useState(false);

  async function handleSendBroadcast() {
    if (!broadcastMsg.trim()) return;
    setBroadcastSending(true);
    try {
      await insforge.realtime.connect();
      await insforge.realtime.publish("broadcast", "new_broadcast", {
        id: crypto.randomUUID(),
        message: broadcastMsg.trim(),
        audience: broadcastAudience,
        sender: "Admin",
        timestamp: new Date().toISOString(),
      });
      flash("📢 Broadcast sent!");
      setBroadcastMsg("");
    } catch {
      flashError("Broadcast failed");
    } finally {
      setBroadcastSending(false);
    }
  }

  function renderBroadcast() {
    return (
      <div className="card p-6 max-w-2xl" style={{ background: "var(--surface)" }}>
        <div className="mb-6 flex items-center gap-3">
          <span className="text-2xl">📢</span>
          <div>
            <h3 className="text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-blue)" }}>
              Send Broadcast
            </h3>
            <p className="mt-0.5 text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
              Message will appear instantly on all matching screens.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
              Audience
            </label>
            <div className="flex gap-2">
              {([["all", "🌐 All"], ["spot-leaders", "📍 Spot Leaders"], ["teams", "🏃 Teams"]] as const).map(
                ([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setBroadcastAudience(value)}
                    className="btn-press ripple rounded-2xl px-5 py-3 text-[13px] font-extrabold uppercase tracking-wide transition-all"
                    style={{
                      background: broadcastAudience === value ? "var(--color-brand-blue)" : "var(--border-soft)",
                      color: broadcastAudience === value ? "#fff" : "var(--fg-muted)",
                    }}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
              Message
            </label>
            <textarea
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="Type your announcement…"
              rows={4}
              className="w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-semibold outline-none resize-none"
              style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }}
            />
          </div>

          <button
            onClick={handleSendBroadcast}
            data-sound="confirm"
            disabled={broadcastSending || !broadcastMsg.trim()}
            className="btn-press ripple rounded-2xl px-8 py-4 text-[15px] font-extrabold uppercase tracking-wide text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              boxShadow: "0 6px 0 0 #5b21b6",
              opacity: broadcastSending || !broadcastMsg.trim() ? 0.5 : 1,
            }}
          >
            {broadcastSending ? "⏳ Sending…" : "📢 Broadcast"}
          </button>
        </div>
      </div>
    );
  }

  /* ==============================================================
     RENDER
     ============================================================== */
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />
      <SuccessOverlay open={showSuccess} onClose={() => setShowSuccess(false)} pointsEarned={successTeamCount} title="GENERATED!" subtitle="Teams created and routed" />

      <div className="absolute right-4 top-4 z-20 flex items-center gap-3">
        <button onClick={clearSession} className="ripple touch-press rounded-2xl px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide shadow-lg transition-opacity hover:opacity-70" style={{ color: "var(--fg-muted)", background: "var(--surface)" }}>🚪 Logout</button>
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-20">
        {/* Header */}
        <Reveal duration={0.5}>
          <header className="mb-8 text-center">
            <div className="flex items-center justify-center gap-4">
              <Logo className="h-14 w-14 drop-shadow-lg" />
              <div>
                <h1 className="font-display text-[32px] font-extrabold leading-none" style={{ color: "var(--fg)" }}>⚙️ Admin Panel</h1>
                <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--fg-muted)" }}>Full Database Control</p>
              </div>
            </div>
          </header>
        </Reveal>

        {/* Error / Success */}
        {error && <Banner type="error">{error}</Banner>}
        {success && <Banner type="success">{success}</Banner>}

        {/* Tab bar */}
        <div className="mb-8 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className="rounded-2xl px-5 py-3 text-[13px] font-extrabold uppercase tracking-wide transition-all ripple touch-press" style={{ background: tab === t.key ? "var(--color-brand-blue)" : "var(--surface)", color: tab === t.key ? "#fff" : "var(--fg-muted)", border: tab === t.key ? "none" : "2px solid var(--border-soft)" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {tab === "dashboard" && renderDashboard()}
            {tab === "participants" && renderParticipants()}
            {tab === "teams" && renderTeams()}
            {tab === "spots" && renderSpots()}
            {tab === "clues" && renderClues()}
            {tab === "config" && renderConfig()}
            {tab === "sessions" && renderSessions()}
            {tab === "broadcast" && renderBroadcast()}
          </motion.div>
        </AnimatePresence>

        <Reveal delay={0.3} duration={0.5}>
          <p className="mt-16 text-center text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>Treasure Hunt · University of Dhaka — CSE</p>
        </Reveal>
      </div>
    </div>
  );
}

/* ===== Shared sub-components ===== */

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="card flex flex-col gap-1 p-5" style={{ background: "var(--surface)" }}>
      <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>{label}</span>
      <motion.span key={value} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-[34px] font-extrabold leading-none tabular-nums" style={{ color: accent }}>{value}</motion.span>
    </div>
  );
}

function StatPill({ icon, value, label, accent }: { icon: string; value: number; label: string; accent: string }) {
  return (
    <span className="flex items-center gap-1 shrink-0" style={{ color: accent }}>
      <span className="text-[13px]">{icon}</span>
      <motion.span key={value} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-[14px] font-black leading-none tabular-nums">{value}</motion.span>
      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--fg-muted)", opacity: 0.7 }}>{label}</span>
    </span>
  );
}

function Divider() {
  return <span className="inline-block w-px h-4 shrink-0 mx-1" style={{ background: "var(--border-soft)" }} />;
}

function Banner({ type, children }: { type: "error" | "success"; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`mb-6 rounded-3xl px-6 py-4 text-center text-[14px] font-bold`} style={{ background: type === "error" ? "rgba(255,75,75,0.1)" : "rgba(88,204,2,0.1)", border: `2px solid ${type === "error" ? "rgba(255,75,75,0.3)" : "rgba(88,204,2,0.3)"}`, color: type === "error" ? "var(--color-brand-red)" : "var(--color-brand-green)" }}>
      {type === "error" ? "⚠️ " : "✅ "}{children}
    </motion.div>
  );
}

function SectionList({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="card p-5" style={{ background: "var(--surface)" }}>
      <h3 className="mb-4 text-[14px] font-extrabold uppercase tracking-[0.18em]" style={{ color: accent }}>{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>{label}</label>
      {children}
    </div>
  );
}

function ParticipantRow({ p, editing, editData, onEdit, onSave, onChange, onCancel, onDelete, deletable }: {
  p: Participant; editing: boolean; editData: Partial<Participant>; onEdit: () => void; onSave: () => void; onChange: (d: Partial<Participant>) => void; onCancel: () => void; onDelete: () => void; deletable?: boolean;
}) {
  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl p-3" style={{ background: "var(--border-soft)" }}>
        <div className="flex gap-2">
          <input value={editData.name ?? ""} onChange={e => onChange({ name: e.target.value })} className="flex-1 rounded-xl border-2 px-3 py-2 text-[14px] font-bold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
          <input value={editData.roll ?? ""} onChange={e => onChange({ roll: e.target.value })} className="w-20 rounded-xl border-2 px-3 py-2 text-[14px] font-semibold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
        </div>
        <div className="flex gap-2">
          <button onClick={onSave} className="rounded-xl px-3 py-1.5 text-[12px] font-extrabold text-white" style={{ background: "var(--color-brand-green)" }}>💾 Save</button>
          <button onClick={onCancel} className="rounded-xl px-3 py-1.5 text-[12px] font-extrabold" style={{ color: "var(--fg-muted)" }}>Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-2.5" style={{ background: "var(--border-soft)" }}>
      <span className="flex-1 text-[14px] font-bold truncate" style={{ color: "var(--fg)" }}>{p.name}</span>
      <span className="text-[11px] font-semibold" style={{ color: "var(--fg-muted)" }}>{p.roll || "—"}</span>
      <span className="text-[11px] font-semibold" style={{ color: "var(--fg-muted)" }}>{p.email || "—"}</span>
      <button onClick={onEdit} className="rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold hover:opacity-70" style={{ color: "var(--color-brand-blue)" }}>✏️</button>
      {deletable && <button onClick={onDelete} className="rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold hover:opacity-70" style={{ color: "var(--color-brand-red)" }}>✕</button>}
    </div>
  );
}

function TeamCard({ team, teamIndex, teamNames, isMoveActive, isTransferActive, onStartMove, onStartTransfer, onMoveTo, onTransferTo, onCancel }: {
  team: GeneratedTeam; teamIndex: number; teamNames: string[]; isMoveActive: boolean; isTransferActive: boolean; onStartMove: (mid: string) => void; onStartTransfer: () => void; onMoveTo: (i: number) => void; onTransferTo: (nid: string) => void; onCancel: () => void;
}) {
  const leaderCount = team.members.filter((m) => m.is_leader).length;
  return (
    <div className="rounded-2xl border-2 p-5 transition-all relative" style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[18px] font-extrabold" style={{ color: "var(--fg)" }}>{team.name}</span>
        <span className="rounded-xl px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wide" style={{ background: "rgba(88,204,2,0.12)", color: "var(--color-brand-green)" }}>🏷 {team.teamCode}</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {team.members.map((m) => (
          <li key={m.id} className="flex items-center gap-2 text-[14px] font-semibold min-h-[32px]" style={{ color: "var(--fg-muted)" }}>
            {m.is_leader ? <button onClick={onStartTransfer} className="text-[16px] transition-opacity hover:opacity-70" title="Transfer leadership">👑</button> : <span className="w-5 text-center text-[12px] opacity-40">•</span>}
            <span className="flex-1 truncate">{m.name}</span>
            <button onClick={() => onStartMove(m.id)} className="rounded-lg px-2 py-0.5 text-[13px] font-extrabold transition-all hover:opacity-70" style={{ background: "var(--border-soft)", color: "var(--fg-muted)" }} title="Move to another team">⇄</button>
          </li>
        ))}
      </ul>
      {leaderCount !== 1 && <p className="mt-2 text-[11px] font-extrabold text-center" style={{ color: "var(--color-brand-red)" }}>⚠️ {leaderCount === 0 ? "No leader!" : `${leaderCount} leaders!`}</p>}

      {isTransferActive && (
        <div className="absolute left-0 right-0 z-10 mx-5 mt-3 rounded-2xl border-2 p-3 shadow-lg" style={{ background: "var(--surface)", borderColor: "var(--color-brand-gold)" }}>
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--color-brand-gold)" }}>Transfer 👑 to:</p>
          <div className="flex flex-col gap-1">
            {team.members.map((m) => (
              <button key={m.id} onClick={() => onTransferTo(m.id)} className="rounded-xl px-3 py-2 text-[13px] font-bold text-left transition-all hover:opacity-70" style={{ background: m.is_leader ? "rgba(255,200,0,0.1)" : "var(--border-soft)", color: "var(--fg)" }}>
                {m.is_leader ? "👑 " : "   "}{m.name}
              </button>
            ))}
          </div>
          <button onClick={onCancel} className="mt-2 w-full rounded-xl py-2 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Cancel</button>
        </div>
      )}

      {isMoveActive && (
        <div className="absolute left-0 right-0 z-10 mx-5 mt-3 rounded-2xl border-2 p-3 shadow-lg" style={{ background: "var(--surface)", borderColor: "var(--color-brand-blue)" }}>
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--color-brand-blue)" }}>Move to:</p>
          <div className="flex flex-col gap-1">
            {teamNames.map((name, i) => i === teamIndex ? null : (
              <button key={i} onClick={() => onMoveTo(i)} className="rounded-xl px-3 py-2 text-[13px] font-bold text-left transition-all hover:opacity-70" style={{ background: "var(--border-soft)", color: "var(--fg)" }}>→ {name}</button>
            ))}
          </div>
          <button onClick={onCancel} className="mt-2 w-full rounded-xl py-2 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

function RouteCard({ teamName, route, spots }: { teamName: string; route: { order: number; spotId: string }[]; spots: Spot[] }) {
  const spotMap = new Map(spots.map((s) => [s.id, s.name]));
  return (
    <div className="rounded-2xl border-2 p-5 transition-all" style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}>
      <span className="mb-3 block text-[18px] font-extrabold" style={{ color: "var(--fg)" }}>🗺 {teamName}</span>
      <ol className="flex flex-col gap-2">
        {route.map((r) => (
          <li key={r.order} className="flex items-center gap-3 text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-extrabold text-white" style={{ background: "var(--color-brand-green)" }}>{r.order + 1}</span>
            {spotMap.get(r.spotId) ?? "Unknown Spot"}
          </li>
        ))}
      </ol>
    </div>
  );
}
