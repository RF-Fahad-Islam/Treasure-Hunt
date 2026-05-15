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
  fetchRegistrations,
  approveRegistration,
  deleteRegistration,
  generateTeams,
  generateRoutes,
  clearAllTeamsAndRoutes,
  saveTeams,
  saveRoutes,
  deployTeamRoute,
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
  fetchTeamRoutes,
  fetchTeamParticipantsWithEmails,
} from "@/services/admin";
import { fetchActiveSessions, adminDeactivateSession, generateLoginToken } from "@/services/auth";
import type { SessionWithUser } from "@/services/auth";
import type { Participant, Spot, ClueDefinition, EventConfig, Team, Registration } from "@/types";
import { magicLoginEmailHtml } from "@/email-templates/magic-login";
import type { GeneratedTeam, TeamWithRoute } from "@/services/admin";

import { insforge } from "@/lib/insforge";
import { TeamMap } from "@/components/TeamMap";
import { SpotMapPicker } from "@/components/SpotMapPicker";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useTeamLocationsRealtime } from "@/hooks/useTeamLocationsRealtime";
import { disqualifyTeam, reinstateTeam, isActive } from "@/services/location";
import {
  LayoutDashboard, Users, Building2, MapPin, Search,
  Settings, LogIn, Radio, ClipboardList, Link2, Globe,
  Crown, RefreshCw, Trash2, Route,
} from "lucide-react";

type Tab = "dashboard" | "participants" | "teams" | "routes" | "spots" | "clues" | "config" | "sessions" | "broadcast" | "locations" | "registrations" | "login-links";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "participants", label: "Participants", icon: Users },
  { key: "teams", label: "Teams", icon: Building2 },
  { key: "routes", label: "Routes", icon: Route },
  { key: "spots", label: "Spots", icon: MapPin },
  { key: "clues", label: "Clues", icon: Search },
  { key: "config", label: "Event Config", icon: Settings },
  { key: "sessions", label: "Sessions", icon: LogIn },
  { key: "broadcast", label: "Broadcast", icon: Radio },
  { key: "registrations", label: "Registrations", icon: ClipboardList },
  { key: "login-links", label: "Login Links", icon: Link2 },
  { key: "locations", label: "Locations", icon: Globe },
];


const ADMIN_STYLES = `
  .admin-tabs-container::-webkit-scrollbar {
    height: 6px;
    display: block;
  }
  .admin-tabs-container::-webkit-scrollbar-track {
    background: var(--border-soft);
    border-radius: 10px;
  }
  .admin-tabs-container::-webkit-scrollbar-thumb {
    background: var(--color-brand-blue);
    border-radius: 10px;
  }
  .admin-tabs-container {
    scrollbar-width: thin;
    scrollbar-color: var(--color-brand-blue) var(--border-soft);
  }
  
  /* Prevent horizontal overflow on mobile while allowing vertical scroll */
  body {
    overflow-x: hidden;
  }
  
  /* Fatty input overrides for better mobile touch */
  input, textarea, select {
    font-size: 16px !important; /* Prevent iOS zoom */
  }
  
  @media (max-width: 1024px) {
    .card {
      border-radius: 24px !important;
      padding: 1.25rem !important;
    }
    .btn-press {
      padding-top: 1.25rem !important;
      padding-bottom: 1.25rem !important;
    }
    /* Bottom tabs sticky */
    .admin-tabs-container {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: var(--surface);
      border-top: 4px solid var(--border-soft);
      padding: 12px 16px;
      padding-bottom: calc(12px + env(safe-area-inset-bottom));
      margin-bottom: 0 !important;
      gap: 12px !important;
      box-shadow: 0 -8px 24px rgba(0,0,0,0.1);
      border-radius: 28px 28px 0 0;
    }
    .admin-tabs-container button {
      flex: 0 0 auto;
      padding: 12px 20px !important;
      font-size: 14px !important;
    }
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

export default function AdminPage() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = ADMIN_STYLES;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);


  const clearSession = useAuthStore((s) => s.clearSession);
  const [tab, setTab] = useState<Tab>("dashboard");

  /* ─── Data ─── */
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [clues, setClues] = useState<ClueDefinition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [sessions, setSessions] = useState<SessionWithUser[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const teamLocations = useTeamLocationsRealtime();

  /* ─── Login Links state ─── */
  const [linkTeams, setLinkTeams] = useState<Awaited<ReturnType<typeof fetchTeamParticipantsWithEmails>>>([]);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkSending, setLinkSending] = useState(false);
  const [linkResults, setLinkResults] = useState<{ ok: number; fail: number; errors: string[] } | null>(null);
  const [linkCopiedId, setLinkCopiedId] = useState<string | null>(null);
  const [spotLinks, setSpotLinks] = useState<{ id: string; name: string; url: string }[]>([]);
  const [spotLinkLoading, setSpotLinkLoading] = useState<string | null>(null);

  /* ─── UI ─── */
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTeamCount, setSuccessTeamCount] = useState(0);
  const [confirmDef, setConfirmDef] = useState<{ title: string; message: string; destructive?: boolean } | null>(null);
  const [confirmHandler, setConfirmHandler] = useState<(() => Promise<void>) | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [newClue, setNewClue] = useState({ spot_id: "", clue_text: "", difficulty: "medium", image_url: "" });
  const [filterSpot, setFilterSpot] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, c, t, e, r] = await Promise.all([
        fetchAllParticipants(),
        fetchAllSpots(),
        fetchAllClues(),
        fetchAllTeams(),
        fetchEventConfig(),
        fetchRegistrations(),
      ]);
      setParticipants(p);
      setSpots(s);
      setClues(c);
      setTeams(t);
      setEventConfig(e);
      setRegistrations(r);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ─── Helpers ─── */
  function flash(msg: string) { console.log(msg); }
  function flashError(msg: string) { console.error(msg); }

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
          <StatPill icon={<Users size={18} />} value={totalParticipants} label="total" accent="var(--color-brand-blue)" />
          <Divider />
          <StatPill icon={<Users size={18} />} value={unassigned} label="unassigned" accent="var(--color-brand-red)" />
          <Divider />
          <StatPill icon={<Crown size={18} />} value={leaderCount} label="leaders" accent="var(--color-brand-gold)" />
          <Divider />
          <StatPill icon={<Building2 size={18} />} value={teams.length} label="teams" accent="var(--color-brand-gold)" />
          <Divider />
          <StatPill icon={<MapPin size={18} />} value={spotCount} label="spots" accent="var(--color-brand-green)" />
          <Divider />
          <StatPill icon={<Search size={18} />} value={clueCount} label="clues" accent="var(--color-brand-green)" />

          <div className="ml-auto flex gap-1 shrink-0 pl-3">
            <button
              data-sound="heavy"
              onClick={loadData}
              disabled={loading}
              className="rounded-xl px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide transition-all active:scale-95"
              style={{ background: "var(--border-soft)", color: "var(--fg-muted)" }}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              data-sound="error"
              onClick={() => {
                setConfirmDef({ title: "Reset All Hunt Data", message: "Teams, routes, and assignments will be cleared. This cannot be undone.", destructive: true });
                setConfirmHandler(() => async () => {
                  await resetAllHuntData(); flash("🗑 Reset"); await loadData();
                });
              }}
              className="rounded-xl px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide transition-all active:scale-95"
              style={{ background: "rgba(255,75,75,0.1)", color: "var(--color-brand-red)" }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-5 lg:grid-cols-2">
          <BarChartCard
            title="Team Scores"
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

        {teamLocations.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--fg-muted)" }}>
                🗺 Team Locations
              </p>
              <span className="text-[12px] font-bold" style={{ color: "#22c55e" }}>
                🟢 {teamLocations.filter(t => t.isActive && !t.isDisqualified).length} active
              </span>
            </div>
            <TeamMap teams={teamLocations} height="240px" />
          </div>
        )}
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
    // no-op error clear
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
    setConfirmDef({ title: "Delete Participant", message: `Delete ${name}? This cannot be undone.`, destructive: true });
    setConfirmHandler(() => async () => {
      try { await deleteParticipant(id); flash(`🗑 ${name} deleted.`); await loadData(); } catch (err) { flashError("Delete failed"); }
    });
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
          <form onSubmit={handleAddParticipant} className="flex flex-wrap items-end gap-5">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 block text-[13px] font-black uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" required className="w-full rounded-[24px] border-4 px-6 py-4 text-[17px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </div>
            <div className="w-32">
              <label className="mb-2 block text-[13px] font-black uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Roll</label>
              <input value={newRoll} onChange={e => setNewRoll(e.target.value)} placeholder="01" className="w-full rounded-[24px] border-4 px-6 py-4 text-[17px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 block text-[13px] font-black uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Email</label>
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="optional" type="email" className="w-full rounded-[24px] border-4 px-6 py-4 text-[17px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </div>
            <div className="w-44">
              <label className="mb-2 block text-[13px] font-black uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Phone</label>
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="optional" className="w-full rounded-[24px] border-4 px-6 py-4 text-[17px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </div>
            <button data-sound="confirm" type="submit" disabled={adding || !newName.trim()} className="btn-press ripple rounded-[24px] px-10 py-5 text-[16px] font-black uppercase tracking-wide text-white" style={{ background: "var(--color-brand-blue)", boxShadow: "0 8px 0 0 var(--color-brand-blue-dark)", opacity: adding || !newName.trim() ? 0.5 : 1 }}>{adding ? "⏳" : "➕ Add"}</button>
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

  /* === ROUTE PLAN CREATOR STATE === */
  const [selectedRouteTeam, setSelectedRouteTeam] = useState<string | null>(null);
  const [currentRoutePlan, setCurrentRoutePlan] = useState<string[]>([]);

  function handleGenerate() {
    if (participants.length < 5) { console.error("Need at least 5 participants."); return; }
    setGenerated(generateTeams(participants));
    setStep("preview");
    setSavedRoutes([]);
    setSavedRoutes([]);
  }

  function handleReshuffle() {
    // no-op error clear
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
    setLoading(true);
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
        {teams.map((t) => {
          const loc = teamLocations.find(l => l.id === t.id);
          const active = t.is_disqualified ? false : loc?.isActive ?? isActive(t.last_active_at);
          return (
          <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-3xl p-5 transition-all hover:scale-[1.01]" style={{ background: "var(--surface)", border: "4px solid var(--border-soft)" }}>
            <div className="flex flex-1 items-center justify-between sm:justify-start gap-4">
              <div className="flex flex-col min-w-0">
                <span className="font-display text-[18px] sm:text-[20px] font-black truncate" style={{ color: t.is_disqualified ? "var(--fg-muted)" : "var(--fg)" }}>{t.name}</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`rounded-xl px-3 py-1 text-[11px] font-black uppercase tracking-wider ${t.is_disqualified ? "opacity-50" : ""}`} style={{ background: "rgba(88,204,2,0.12)", color: "var(--color-brand-green)" }}>🏷 {t.team_code}</span>
                  {t.is_disqualified ? (
                    <span className="rounded-xl px-3 py-1 text-[11px] font-black uppercase tracking-wider" style={{ background: "rgba(255,75,75,0.12)", color: "var(--color-brand-red)" }}>🚫 DQ</span>
                  ) : (
                    <span className="rounded-xl px-3 py-1 text-[11px] font-black uppercase tracking-wider" style={{ background: active ? "rgba(88,204,2,0.12)" : "rgba(156,163,175,0.12)", color: active ? "var(--color-brand-green)" : "var(--fg-muted)" }}>
                      {active ? "🟢 ONLINE" : "⚪ OFFLINE"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 pt-4 sm:pt-0 border-t sm:border-0" style={{ borderColor: "var(--border-soft)" }}>
              <div className="flex gap-5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tighter opacity-40" style={{ color: "var(--fg-muted)" }}>HUNT STATUS</span>
                  <span className="text-[14px] font-black" style={{ color: "var(--fg)" }}>⚡ {t.hunt_completed ? "✅ DONE" : `CLUE ${(t.current_clue_index ?? 0) + 1}`}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tighter opacity-40" style={{ color: "var(--fg-muted)" }}>POINTS</span>
                  <span className="text-[14px] font-black" style={{ color: "var(--fg)" }}>{t.total_points ?? 0} <span className="text-[11px] opacity-50 font-bold">PTS</span></span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => {
                  setConfirmDef({ title: "Reset Team", message: `Reset ${t.name}? All progress, points, and penalties will be cleared.`, destructive: true });
                  setConfirmHandler(() => async () => {
                    try { await resetTeam(t.id); flash(`🔄 ${t.name} reset`); await loadData(); } catch { flashError("Reset failed"); }
                  });
                }} className="btn-press flex h-11 w-11 items-center justify-center rounded-2xl transition-all" style={{ background: "rgba(255,200,0,0.1)", color: "var(--color-brand-gold)" }}>
                  <span className="material-symbols-outlined text-[20px] font-bold">refresh</span>
                </button>
                
                {t.is_disqualified ? (
                  <button onClick={() => {
                    setConfirmDef({ title: "Reinstate Team", message: `Reinstate ${t.name}? They will regain access to the dashboard.` });
                    setConfirmHandler(() => async () => {
                      try { await reinstateTeam(t.id); flash(`✅ ${t.name} reinstated`); await loadData(); } catch { flashError("Reinstate failed"); }
                    });
                  }} className="btn-press flex h-11 w-11 items-center justify-center rounded-2xl transition-all" style={{ background: "rgba(88,204,2,0.1)", color: "var(--color-brand-green)" }}>
                    <span className="material-symbols-outlined text-[20px] font-bold">check_circle</span>
                  </button>
                ) : (
                  <button onClick={() => {
                    setConfirmDef({ title: "Disqualify Team", message: `Disqualify ${t.name}? They will be blocked from the dashboard and marked on the map.`, destructive: true });
                    setConfirmHandler(() => async () => {
                      try { await disqualifyTeam(t.id); flash(`🚫 ${t.name} disqualified`); await loadData(); } catch { flashError("Disqualify failed"); }
                    });
                  }} className="btn-press flex h-11 w-11 items-center justify-center rounded-2xl transition-all" style={{ background: "rgba(255,75,75,0.1)", color: "var(--color-brand-red)" }}>
                    <span className="material-symbols-outlined text-[20px] font-bold">block</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })}
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

  function renderRoutes() {
    return (
      <div className="flex flex-col gap-8">
        <div className="card p-6 border-t-[8px]" style={{ background: "var(--surface)", borderColor: "var(--color-brand-blue)" }}>
          <h3 className="mb-3 text-[16px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-blue)" }}>🗺️ Route Plan Creator</h3>
          <p className="mb-6 text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>Select a team to deploy a custom route flow.</p>
          
          <div className="flex flex-wrap gap-3 mb-8">
            {teams.map(t => (
              <button
                key={t.id}
                onClick={async () => { 
                  setSelectedRouteTeam(t.id); 
                  setLoading(true);
                  try {
                    const routes = await fetchTeamRoutes(t.id);
                    setCurrentRoutePlan(routes.map(r => r.clue_id));
                  } catch (e: any) {
                    flashError("Failed to fetch existing route: " + e.message);
                    setCurrentRoutePlan([]);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="btn-press rounded-[20px] px-6 py-4 text-[14px] font-black uppercase tracking-wider transition-all"
                style={{
                  background: selectedRouteTeam === t.id ? "var(--color-brand-blue)" : "var(--border-soft)",
                  color: selectedRouteTeam === t.id ? "white" : "var(--fg-muted)",
                  boxShadow: selectedRouteTeam === t.id ? "0 6px 0 0 var(--color-brand-blue-dark)" : "0 6px 0 0 rgba(0,0,0,0.1)",
                  transform: selectedRouteTeam === t.id ? "translateY(2px)" : "none"
                }}
              >
                {t.name}
              </button>
            ))}
            {teams.length === 0 && <p className="text-[13px] italic opacity-60" style={{ color: "var(--fg-muted)" }}>No teams available. Generate teams first.</p>}
          </div>

          {selectedRouteTeam && (
            <div className="rounded-3xl border-4 p-6" style={{ borderColor: "var(--border-soft)" }}>
              <div className="mb-6 flex items-center justify-between">
                <h4 className="text-[18px] font-black uppercase tracking-wide" style={{ color: "var(--fg)" }}>
                  Route for {teams.find(t => t.id === selectedRouteTeam)?.name}
                </h4>
                <span className="rounded-full px-4 py-1.5 text-[12px] font-black uppercase tracking-widest shadow-sm" style={{ background: "rgba(28, 176, 246, 0.1)", color: "var(--color-brand-blue)" }}>
                  {currentRoutePlan.length} Clues
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Available Clues */}
                <div>
                  <h5 className="mb-4 text-[14px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--fg-muted)" }}>Available Clues</h5>
                  <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2 admin-tabs-container">
                    {clues.map(c => {
                      const spot = spots.find(s => s.id === c.spot_id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => setCurrentRoutePlan([...currentRoutePlan, c.id])}
                          className="text-left touch-press ripple rounded-2xl p-4 border-4 transition-all"
                          style={{ background: "var(--surface)", borderColor: "var(--border-soft)", outline: "none" }}
                          onFocus={(e) => e.currentTarget.style.borderColor = "var(--color-brand-blue)"}
                          onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-soft)"}
                        >
                          <p className="text-[15px] font-black" style={{ color: "var(--fg)" }}>📍 {spot?.name || "Unknown Spot"}</p>
                          <p className="text-[13px] font-semibold mt-1 truncate" style={{ color: "var(--fg-muted)" }}>{c.clue_text}</p>
                        </button>
                      )
                    })}
                    {clues.length === 0 && <p className="text-[13px] italic" style={{ color: "var(--fg-muted)" }}>No clues found. Create clues first.</p>}
                  </div>
                </div>

                {/* Selected Route */}
                <div className="flex flex-col">
                  <h5 className="mb-4 text-[14px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--color-brand-gold)" }}>Current Flow</h5>
                  <div className="flex-1 flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2 admin-tabs-container">
                    {currentRoutePlan.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border-4 border-dashed p-6 text-center" style={{ borderColor: "var(--border-soft)" }}>
                        <span className="text-3xl mb-2">🗺️</span>
                        <p className="text-[13px] font-bold" style={{ color: "var(--fg-muted)" }}>Empty Route</p>
                        <p className="text-[11px] font-semibold mt-1" style={{ color: "var(--fg-muted)" }}>Click clues on the left to build the flow.</p>
                      </div>
                    )}
                    {currentRoutePlan.map((clueId, idx) => {
                      const c = clues.find(x => x.id === clueId);
                      const spot = spots.find(s => s.id === c?.spot_id);
                      return (
                        <div key={`${clueId}-${idx}`} className="flex items-center gap-3 rounded-2xl p-3 border-4" style={{ borderColor: "var(--color-brand-blue)", background: "rgba(28, 176, 246, 0.05)" }}>
                          <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full font-black text-white shadow-sm" style={{ background: "var(--color-brand-blue)" }}>{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-black truncate" style={{ color: "var(--fg)" }}>{spot?.name}</p>
                          </div>
                          <button onClick={() => setCurrentRoutePlan(currentRoutePlan.filter((_, i) => i !== idx))} className="shrink-0 btn-press text-[16px] w-10 h-10 rounded-xl bg-red-100 text-red-600 flex justify-center items-center hover:bg-red-200 transition-colors">✕</button>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    onClick={async () => {
                      if (currentRoutePlan.length === 0) return;
                      setLoading(true);
                      try {
                        await deployTeamRoute(selectedRouteTeam, currentRoutePlan);
                        flash("✅ Route deployed!");
                        setSelectedRouteTeam(null);
                        setCurrentRoutePlan([]);
                        await loadData();
                      } catch(e: any) {
                        flashError(e.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={currentRoutePlan.length === 0 || loading}
                    className="mt-6 w-full btn-press ripple rounded-[20px] py-4 text-[16px] font-black uppercase tracking-wide text-white transition-all shadow-md"
                    style={{ background: currentRoutePlan.length > 0 ? "var(--color-brand-green)" : "var(--border-soft)", opacity: loading || currentRoutePlan.length === 0 ? 0.6 : 1 }}
                  >
                    {loading ? "⏳ Deploying..." : "🚀 Deploy Route"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 pt-8 border-t-4" style={{ borderColor: "var(--border-soft)" }}>
            <h3 className="mb-6 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-blue)" }}>🏠 All Teams Status</h3>
            {renderTeamList()}
          </div>
        </div>
      </div>
    );
  }

  /* ==============================================================
     TAB: SPOTS
     ============================================================== */
  const [newSpot, setNewSpot] = useState({ 
    name: "", 
    description: "", 
    location_hint: "", 
    spot_leader_code: "", 
    has_mini_game: false, 
    mini_game_description: "",
    latitude: "" as any,
    longitude: "" as any,
    radius_meters: "" as any
  });
  const [editingSpot, setEditingSpot] = useState<string | null>(null);
  const [editSpotData, setEditSpotData] = useState<Partial<Spot>>({});

  const handleSpotMapChange = (lat: number, lng: number) => {
    setNewSpot(p => ({ ...p, latitude: lat, longitude: lng }));
  };

  const handleEditSpotMapChange = (lat: number, lng: number) => {
    setEditSpotData(p => ({ ...p, latitude: lat, longitude: lng }));
  };

  async function handleCreateSpot(e: React.FormEvent) {
    e.preventDefault();
    if (!newSpot.name.trim() || !newSpot.spot_leader_code.trim()) return;
    try { 
      await createSpot({
        ...newSpot,
        latitude: newSpot.latitude ? Number(newSpot.latitude) : undefined,
        longitude: newSpot.longitude ? Number(newSpot.longitude) : undefined,
        radius_meters: newSpot.radius_meters ? Number(newSpot.radius_meters) : undefined,
      }); 
      flash(`📍 ${newSpot.name} created`); 
      setNewSpot({ name: "", description: "", location_hint: "", spot_leader_code: "", has_mini_game: false, mini_game_description: "", latitude: "" as any, longitude: "" as any, radius_meters: "" as any }); 
      await loadData(); 
    } catch (err) { flashError("Create failed"); }
  }

  function startEditSpot(s: Spot) { setEditingSpot(s.id); setEditSpotData(s); }

  async function saveEditSpot(id: string) {
    try { await updateSpot(id, editSpotData); flash("✅ Spot updated"); setEditingSpot(null); await loadData(); } catch (err) { flashError("Update failed"); }
  }

  async function handleDeleteSpot(id: string, name: string) {
    setConfirmDef({ title: "Delete Spot", message: `Delete "${name}" and all its clues? This cannot be undone.`, destructive: true });
    setConfirmHandler(async () => {
      try { await deleteSpot(id); flash(`🗑 ${name} deleted`); await loadData(); } catch { flashError("Delete failed"); }
    });
  }

  function renderSpots() {
    return (
      <div className="flex flex-col gap-6">
        <div className="card p-8" style={{ background: "var(--surface)" }}>
          <h3 className="mb-6 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-blue)" }}>📍 Create Spot</h3>
          <form onSubmit={handleCreateSpot} className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-5">
              <div className="flex-1 min-w-[240px]">
                <Field label="Spot Name *">
                  <input value={newSpot.name} onChange={e => setNewSpot(p => ({ ...p, name: e.target.value }))} placeholder="Central Library" required className="w-full rounded-[24px] border-4 px-6 py-4 text-[18px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                </Field>
              </div>
              <div className="flex-1 min-w-[240px]">
                <Field label="Leader Code *">
                  <input value={newSpot.spot_leader_code} onChange={e => setNewSpot(p => ({ ...p, spot_leader_code: e.target.value.toUpperCase() }))} placeholder="LIB-2026" required className="w-full rounded-[24px] border-4 px-6 py-4 text-[18px] font-black tracking-wider uppercase outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                </Field>
              </div>
            </div>
            <Field label="Location Hint">
              <input value={newSpot.location_hint} onChange={e => setNewSpot(p => ({ ...p, location_hint: e.target.value }))} placeholder="Near the main entrance pillars" className="w-full rounded-[24px] border-4 px-6 py-4 text-[18px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </Field>

            <Field label="Location on Map">
              <SpotMapPicker
                lat={newSpot.latitude ? Number(newSpot.latitude) : null}
                lng={newSpot.longitude ? Number(newSpot.longitude) : null}
                radius={newSpot.radius_meters ? Number(newSpot.radius_meters) : null}
                onChange={handleSpotMapChange}
              />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Latitude">
                  <input type="number" step="any" value={newSpot.latitude} onChange={e => setNewSpot(p => ({ ...p, latitude: e.target.value }))} placeholder="23.72..." className="w-full rounded-[24px] border-4 px-6 py-4 text-[18px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                </Field>
                <Field label="Longitude">
                  <input type="number" step="any" value={newSpot.longitude} onChange={e => setNewSpot(p => ({ ...p, longitude: e.target.value }))} placeholder="90.39..." className="w-full rounded-[24px] border-4 px-6 py-4 text-[18px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                </Field>
              </div>
            </Field>

            <Field label="Detection Radius (meters)">
              <input type="number" min="10" step="10" value={newSpot.radius_meters} onChange={e => setNewSpot(p => ({ ...p, radius_meters: e.target.value }))} placeholder="100" className="w-full rounded-[24px] border-4 px-6 py-4 text-[18px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </Field>

            <Field label="Description">
              <textarea value={newSpot.description} onChange={e => setNewSpot(p => ({ ...p, description: e.target.value }))} placeholder="Detailed instructions for the leader…" rows={3} className="w-full rounded-[24px] border-4 px-6 py-4 text-[18px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </Field>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-4 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={newSpot.has_mini_game} onChange={e => setNewSpot(p => ({ ...p, has_mini_game: e.target.checked }))} className="sr-only" />
                  <div className={`w-14 h-8 rounded-full transition-colors ${newSpot.has_mini_game ? "bg-[var(--color-brand-blue)]" : "bg-gray-300"}`} />
                  <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${newSpot.has_mini_game ? "translate-x-6" : ""}`} />
                </div>
                <span className="text-[17px] font-black" style={{ color: "var(--fg)" }}>Include Mini-Game</span>
              </label>
            </div>
            {newSpot.has_mini_game && (
              <Field label="Mini-Game Rules">
                <textarea value={newSpot.mini_game_description} onChange={e => setNewSpot(p => ({ ...p, mini_game_description: e.target.value }))} placeholder="E.g., Complete the puzzle in 2 mins…" rows={2} className="w-full rounded-[24px] border-4 px-6 py-4 text-[18px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
              </Field>
            )}
            <button data-sound="confirm" type="submit" className="btn-press ripple btn-primary w-full py-5 text-[18px] rounded-[24px] shadow-[0_8px_0_0_var(--color-brand-blue-dark)]">➕ Create New Spot</button>
          </form>
        </div>

        <SectionList title={`📍 All Spots (${spots.length})`} accent="var(--color-brand-green)">
          <div className="grid gap-6">
            {spots.map((s) => (
              <div key={s.id} className="card p-6 flex flex-col gap-4 border-4 rounded-[28px]" style={{ background: "var(--surface)", borderColor: "var(--border-soft)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[20px] font-black uppercase" style={{ color: "var(--fg)" }}>{s.name}</span>
                    <span className="rounded-xl px-3 py-1.5 text-[12px] font-black uppercase tracking-widest" style={{ background: "rgba(28,176,246,0.1)", color: "var(--color-brand-blue)" }}>{s.spot_leader_code}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditSpot(s)} className="btn-press ripple rounded-2xl bg-white/10 p-3 text-[18px] border-2 border-transparent hover:border-blue-400" title="Edit Spot">✏️</button>
                    <button onClick={() => handleDeleteSpot(s.id, s.name)} className="btn-press ripple rounded-2xl bg-white/10 p-3 text-[18px] border-2 border-transparent hover:border-red-400" title="Delete Spot">🗑</button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[12px] font-bold opacity-60 flex-wrap" style={{ color: "var(--fg)" }}>
                  📍 {s.latitude?.toFixed(4) || "—"}, {s.longitude?.toFixed(4) || "—"}
                  {s.radius_meters && <span>⭕ {s.radius_meters}m radius</span>}
                  <span className="mx-2">•</span>
                  {s.location_hint || "No hint provided."}
                </div>
                {s.has_mini_game && (
                  <div className="rounded-2xl px-4 py-2 text-[12px] font-black uppercase tracking-wider inline-flex items-center gap-2 self-start" style={{ background: "rgba(255,200,0,0.15)", color: "var(--color-brand-gold)" }}>
                    🎮 Mini-Game Active
                  </div>
                )}
              </div>
            ))}
          </div>
          {spots.length === 0 && <p className="py-12 text-center text-[16px] font-black opacity-40">No spots configured.</p>}
        </SectionList>

        <AnimatePresence>
          {editingSpot && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="card w-full max-w-2xl p-8" style={{ background: "var(--surface)" }}>
                <h3 className="mb-6 text-[22px] font-black uppercase tracking-wide" style={{ color: "var(--color-brand-blue)" }}>✏️ Edit Spot</h3>
                <div className="grid gap-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Spot Name *">
                      <input value={editSpotData.name || ""} onChange={e => setEditSpotData(p => ({ ...p, name: e.target.value }))} className="w-full rounded-2xl border-4 px-5 py-3 text-[16px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                    </Field>
                    <Field label="Leader Code *">
                      <input value={editSpotData.spot_leader_code || ""} onChange={e => setEditSpotData(p => ({ ...p, spot_leader_code: e.target.value.toUpperCase() }))} className="w-full rounded-2xl border-4 px-5 py-3 text-[16px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                    </Field>
                  </div>
                  <Field label="Location on Map">
                    <SpotMapPicker
                      lat={editSpotData.latitude ?? null}
                      lng={editSpotData.longitude ?? null}
                      radius={editSpotData.radius_meters ?? null}
                      onChange={handleEditSpotMapChange}
                    />
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <Field label="Latitude">
                        <input type="number" step="any" value={editSpotData.latitude ?? ""} onChange={e => setEditSpotData(p => ({ ...p, latitude: e.target.value ? Number(e.target.value) : null }))} className="w-full rounded-2xl border-4 px-5 py-3 text-[16px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                      </Field>
                      <Field label="Longitude">
                        <input type="number" step="any" value={editSpotData.longitude ?? ""} onChange={e => setEditSpotData(p => ({ ...p, longitude: e.target.value ? Number(e.target.value) : null }))} className="w-full rounded-2xl border-4 px-5 py-3 text-[16px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                      </Field>
                    </div>
                  </Field>
                  <Field label="Detection Radius (meters)">
                    <input type="number" min="10" step="10" value={editSpotData.radius_meters ?? ""} onChange={e => setEditSpotData(p => ({ ...p, radius_meters: e.target.value ? Number(e.target.value) : null }))} className="w-full rounded-2xl border-4 px-5 py-3 text-[16px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                  </Field>
                  <Field label="Location Hint">
                    <input value={editSpotData.location_hint || ""} onChange={e => setEditSpotData(p => ({ ...p, location_hint: e.target.value }))} className="w-full rounded-2xl border-4 px-5 py-3 text-[16px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                  </Field>
                  <Field label="Description">
                    <textarea value={editSpotData.description || ""} onChange={e => setEditSpotData(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-2xl border-4 px-5 py-3 text-[16px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                  </Field>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-4 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" checked={!!editSpotData.has_mini_game} onChange={e => setEditSpotData(p => ({ ...p, has_mini_game: e.target.checked }))} className="sr-only" />
                        <div className={`w-14 h-8 rounded-full transition-colors ${editSpotData.has_mini_game ? "bg-[var(--color-brand-blue)]" : "bg-gray-300"}`} />
                        <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${editSpotData.has_mini_game ? "translate-x-6" : ""}`} />
                      </div>
                      <span className="text-[17px] font-black" style={{ color: "var(--fg)" }}>Include Mini-Game</span>
                    </label>
                  </div>
                  {editSpotData.has_mini_game && (
                    <Field label="Mini-Game Rules">
                      <textarea value={editSpotData.mini_game_description || ""} onChange={e => setEditSpotData(p => ({ ...p, mini_game_description: e.target.value }))} rows={2} className="w-full rounded-2xl border-4 px-5 py-3 text-[16px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
                    </Field>
                  )}
                </div>
                <div className="mt-8 flex gap-4">
                  <button onClick={() => saveEditSpot(editingSpot)} className="flex-1 btn-press ripple rounded-2xl bg-[var(--color-brand-blue)] py-4 text-[15px] font-black uppercase text-white shadow-[0_6px_0_0_var(--color-brand-blue-dark)]">💾 Save Changes</button>
                  <button onClick={() => setEditingSpot(null)} className="flex-1 btn-press ripple rounded-2xl bg-[var(--surface)] border-4 py-4 text-[15px] font-black uppercase" style={{ borderColor: "var(--border-soft)", color: "var(--fg-muted)" }}>Cancel</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  async function handleCreateClue(e: React.FormEvent) {
    e.preventDefault();
    if (!newClue.spot_id || !newClue.clue_text.trim()) return;
    try {
      await createClue(newClue);
      flash("🔎 Clue created!");
      setNewClue({ spot_id: "", clue_text: "", difficulty: "medium", image_url: "" });
      await loadData();
    } catch (err) { flashError("Create failed"); }
  }

  async function handleDeleteClue(id: string) {
    setConfirmDef({ title: "Delete Clue", message: "Are you sure you want to delete this clue? This cannot be undone.", destructive: true });
    setConfirmHandler(() => async () => {
      try {
        await deleteClue(id);
        flash("🗑 Clue deleted");
        await loadData();
      } catch { flashError("Delete failed"); }
    });
  }

  function renderClues() {

    const filtered = filterSpot ? clues.filter((c) => c.spot_id === filterSpot) : clues;
    return (
      <div className="flex flex-col gap-6">
        <div className="card p-8" style={{ background: "var(--surface)" }}>
          <h3 className="mb-6 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>🔎 Create New Clue</h3>
          <form onSubmit={handleCreateClue} className="flex flex-col gap-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Select Spot *">
                <select value={newClue.spot_id} onChange={e => setNewClue(p => ({ ...p, spot_id: e.target.value }))} required className="w-full rounded-[24px] border-4 px-6 py-4 text-[17px] font-black outline-none appearance-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }}>
                  <option value="">Choose a location…</option>
                  {spots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Difficulty Level">
                <select value={newClue.difficulty} onChange={e => setNewClue(p => ({ ...p, difficulty: e.target.value }))} className="w-full rounded-[24px] border-4 px-6 py-4 text-[17px] font-black outline-none appearance-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }}>
                  <option value="easy">🌱 Easy</option>
                  <option value="medium">⭐ Medium</option>
                  <option value="hard">🔥 Hard</option>
                </select>
              </Field>
            </div>
            <Field label="Clue Riddle *">
              <textarea value={newClue.clue_text} onChange={e => setNewClue(p => ({ ...p, clue_text: e.target.value }))} placeholder="Describe the location without naming it…" rows={3} className="w-full rounded-[24px] border-4 px-6 py-4 text-[18px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </Field>
            <Field label="Reference Image URL (optional)">
              <input value={newClue.image_url} onChange={e => setNewClue(p => ({ ...p, image_url: e.target.value }))} placeholder="https://example.com/photo.jpg" className="w-full rounded-[24px] border-4 px-6 py-4 text-[17px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </Field>
            <button data-sound="confirm" type="submit" className="btn-press ripple btn-primary w-full py-5 text-[18px] rounded-[24px] shadow-[0_8px_0_0_var(--color-brand-blue-dark)]">➕ Create Clue</button>
          </form>
        </div>

        <SectionList title={`🔎 All Clues (${clues.length})`} accent="var(--color-brand-gold)">
          <div className="mb-6 flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            <button onClick={() => setFilterSpot("")} className={`rounded-[20px] px-6 py-3 text-[14px] font-black uppercase tracking-wide transition-all ${!filterSpot ? "text-white" : ""}`} style={{ background: !filterSpot ? "var(--color-brand-blue)" : "var(--border-soft)", color: !filterSpot ? "#white" : "var(--fg-muted)" }}>All</button>
            {spots.map((s) => (
              <button key={s.id} onClick={() => setFilterSpot(s.id)} className={`rounded-[20px] px-6 py-3 text-[14px] font-black uppercase tracking-wide transition-all whitespace-nowrap ${filterSpot === s.id ? "text-white" : ""}`} style={{ background: filterSpot === s.id ? "var(--color-brand-blue)" : "var(--border-soft)", color: filterSpot === s.id ? "#white" : "var(--fg-muted)" }}>{s.name}</button>
            ))}
          </div>

          <div className="grid gap-6">
            {filtered.map((c) => {
              const spot = spots.find((s) => s.id === c.spot_id);
              return (
                <div key={c.id} className="card p-6 flex flex-col gap-4 border-4 rounded-[28px] relative overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border-soft)" }}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="rounded-2xl px-4 py-1.5 text-[12px] font-black uppercase tracking-widest" style={{ background: "rgba(28,176,246,0.15)", color: "var(--color-brand-blue)" }}>{spot?.name ?? "Unknown Spot"}</span>
                      <span className="rounded-2xl px-4 py-1.5 text-[15px] font-black shadow-sm" style={{ background: "var(--surface)", border: "2px solid var(--border-soft)" }}>{c.difficulty === "hard" ? "🔥" : c.difficulty === "easy" ? "🌱" : "⭐"}</span>
                    </div>
                    <button onClick={() => handleDeleteClue(c.id)} className="btn-press ripple rounded-2xl bg-white/10 p-4 text-[20px] border-2 border-transparent hover:border-red-400" title="Delete Clue">🗑</button>
                  </div>
                  <div className="text-[17px] font-black leading-relaxed" style={{ color: "var(--fg)" }}>{c.clue_text}</div>
                  {c.image_url && (
                    <div className="mt-2 rounded-[20px] overflow-hidden border-2 border-[var(--border-soft)]">
                      <img src={c.image_url} alt="Clue reference" className="w-full h-32 object-cover" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && <p className="py-12 text-center text-[16px] font-black opacity-40">No clues found for this filter.</p>}
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

  async function handleToggleHunt() {
    const newState = !configForm.hunt_started;
    setConfirmDef({
      title: newState ? "Start Hunt" : "Pause Hunt",
      message: newState ? "Are you sure you want to START the hunt? Teams will be able to start finding clues." : "Are you sure you want to PAUSE the hunt? Teams will be blocked from proceeding.",
      destructive: !newState
    });
    setConfirmHandler(() => async () => {
      try {
        await updateEventConfig({ ...configForm, hunt_started: newState });
        setConfigForm(p => ({ ...p, hunt_started: newState }));
        flash(newState ? "🏁 Hunt started!" : "⏸ Hunt paused");
        await loadData();
      } catch { flashError("Failed to toggle hunt"); }
    });
  }

  async function handleSaveConfig() {
    setConfirmDef({ title: "Save Settings", message: "Apply these event configuration changes?" });
    setConfirmHandler(() => async () => {
      try {
        await updateEventConfig(configForm);
        flash("⚙️ Configuration saved");
        await loadData();
      } catch { flashError("Save failed"); }
    });
  }

  function renderConfig() {

    return (
      <div className="card p-8 max-w-2xl" style={{ background: "var(--surface)" }}>
        <h3 className="mb-6 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>⚙️ Event Configuration</h3>

        <div className="flex flex-col gap-6">
          <Field label="Event Name">
            <input value={configForm.event_name ?? ""} onChange={e => setConfigForm(p => ({ ...p, event_name: e.target.value }))} className="w-full rounded-[24px] border-4 px-6 py-4 text-[18px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
          </Field>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Clue Time Limit (min)">
              <input type="number" value={configForm.clue_time_limit_minutes ?? 40} onChange={e => setConfigForm(p => ({ ...p, clue_time_limit_minutes: Number(e.target.value) }))} className="w-full rounded-[24px] border-4 px-6 py-4 text-[22px] font-black outline-none tabular-nums" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </Field>
            <Field label="Points Per Clue">
              <input type="number" value={configForm.points_per_clue ?? 100} onChange={e => setConfigForm(p => ({ ...p, points_per_clue: Number(e.target.value) }))} className="w-full rounded-[24px] border-4 px-6 py-4 text-[22px] font-black outline-none tabular-nums" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </Field>
            <Field label="Max Mini-Game Points">
              <input type="number" value={configForm.max_mini_game_points ?? 60} onChange={e => setConfigForm(p => ({ ...p, max_mini_game_points: Number(e.target.value) }))} className="w-full rounded-[24px] border-4 px-6 py-4 text-[22px] font-black outline-none tabular-nums" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </Field>
            <Field label="Start Time">
              <input type="datetime-local" value={configForm.hunt_started_at ? configForm.hunt_started_at.slice(0, 16) : ""} onChange={e => setConfigForm(p => ({ ...p, hunt_started_at: e.target.value ? new Date(e.target.value).toISOString() : null }))} className="w-full rounded-[24px] border-4 px-6 py-4 text-[16px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-[28px] border-4 p-6" style={{ background: configForm.hunt_started ? "rgba(88,204,2,0.06)" : "rgba(255,75,75,0.06)", borderColor: configForm.hunt_started ? "rgba(88,204,2,0.2)" : "rgba(255,75,75,0.2)" }}>
            <div>
              <p className="text-[16px] font-black" style={{ color: configForm.hunt_started ? "var(--color-brand-green)" : "var(--color-brand-red)" }}>
                {configForm.hunt_started ? "🏁 Hunt is LIVE" : "⏸ Hunt is PAUSED"}
              </p>
              <p className="text-[13px] font-black mt-1 opacity-70" style={{ color: "var(--fg)" }}>
                {configForm.hunt_started ? "Teams are actively hunting." : "Teams cannot proceed until started."}
              </p>
            </div>
            <button data-sound="confirm" onClick={handleToggleHunt} className="btn-press ripple rounded-[20px] px-8 py-4 text-[14px] font-black uppercase tracking-wide text-white" style={{ background: configForm.hunt_started ? "var(--color-brand-red)" : "var(--color-brand-green)", boxShadow: `0 6px 0 0 ${configForm.hunt_started ? "#b91c1c" : "#15803d"}` }}>
              {configForm.hunt_started ? "⏸ Pause" : "🏁 Start Hunt"}
            </button>
          </div>

          <button data-sound="success" onClick={handleSaveConfig} className="btn-press ripple btn-primary w-full py-5 text-[18px] rounded-[24px] shadow-[0_8px_0_0_var(--color-brand-blue-dark)]">💾 Save Configuration</button>
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

  async function handleKickSession(sessionId: string, userName: string) {
    setConfirmDef({ title: "Kick Session", message: `Deactivate this session for ${userName}? They will be logged out immediately.`, destructive: true });
    setConfirmHandler(() => async () => {
      try { await adminDeactivateSession(sessionId); setSessions((prev) => prev.filter((s) => s.id !== sessionId)); flash("🔌 Session deactivated"); } catch { flashError("Failed to deactivate"); }
    });
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
                  <button onClick={() => handleKickSession(s.id, s.user_name ?? s.user_id)} className="btn-press ripple shrink-0 rounded-2xl px-5 py-3 text-[12px] font-extrabold uppercase tracking-wide text-white" style={{ background: "var(--color-brand-red)" }}>🔌 Kick</button>
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
    setConfirmDef({ title: "Send Broadcast", message: `Send this message to ${broadcastAudience === "all" ? "everyone" : broadcastAudience === "spot-leaders" ? "all spot leaders" : "all teams"}?` });
    setConfirmHandler(() => async () => {
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
    });
  }

  function renderBroadcast() {
    return (
      <div className="card p-6 max-w-2xl relative overflow-hidden" style={{ background: "var(--surface)", borderTop: "4px solid var(--color-brand-blue)" }}>
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
                    className={`flex-1 btn-press ripple rounded-[20px] px-6 py-4 text-[14px] font-black uppercase tracking-wide transition-all border-4 ${broadcastAudience === value ? "text-white" : ""}`}
                    style={{ background: broadcastAudience === value ? "var(--color-brand-blue)" : "var(--surface)", borderColor: broadcastAudience === value ? "var(--color-brand-blue-dark)" : "var(--border-soft)", color: broadcastAudience === value ? "white" : "var(--fg-muted)" }}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[13px] font-black uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
              Message
            </label>

            <textarea
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="Type your announcement…"
              rows={4}
              className="w-full rounded-[24px] border-4 px-6 py-4 text-[18px] font-black outline-none resize-none"
              style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }}
            />
          </div>
          <button
            onClick={handleSendBroadcast}
            data-sound="confirm"
            disabled={broadcastSending || !broadcastMsg.trim()}
            className="btn-press ripple rounded-[24px] px-10 py-6 text-[18px] font-black uppercase tracking-wide text-white transition-all shadow-[0_8px_0_0_#5b21b6]"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              opacity: broadcastSending || !broadcastMsg.trim() ? 0.5 : 1,
            }}
          >
            {broadcastSending ? "⏳ Sending…" : "📢 Send Broadcast Now"}
          </button>

        </div>
      </div>
    );
  }

  /* ==============================================================
     TAB: REGISTRATIONS
     ============================================================== */
  const [approvingReg, setApprovingReg] = useState<string | null>(null);

  async function handleApproveRegistration(id: string, name: string) {
    setApprovingReg(id);
    try {
      await approveRegistration(id);
      flash(`✅ ${name} approved & added to participants`);
      await loadData();
    } catch (err) {
      flashError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setApprovingReg(null);
    }
  }

  function handleDeleteRegistration(id: string, name: string) {
    setConfirmDef({ title: "Delete Registration", message: `Delete registration for ${name}?`, destructive: true });
    setConfirmHandler(() => async () => {
      try { await deleteRegistration(id); flash(`🗑 ${name} registration deleted`); await loadData(); } catch { flashError("Delete failed"); }
    });
  }

  function renderRegistrations() {
    const pending = registrations.filter((r) => !r.approved);
    const approved = registrations.filter((r) => r.approved);
    return (
      <div className="flex flex-col gap-6">
        <SectionList title={`📋 Pending (${pending.length})`} accent="var(--color-brand-blue)">
          {pending.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl px-4 py-3.5" style={{ background: "var(--border-soft)" }}>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-black truncate" style={{ color: "var(--fg)" }}>{r.name}</p>
                <p className="text-[12px] font-semibold mt-0.5" style={{ color: "var(--fg-muted)" }}>
                  Roll: {r.roll} · Email: {r.email}
                </p>
              </div>
              <p className="text-[11px] font-bold shrink-0" style={{ color: "var(--fg-muted)" }}>
                {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
              </p>
              <button
                onClick={() => handleApproveRegistration(r.id, r.name)}
                disabled={approvingReg === r.id}
                className="btn-press rounded-2xl px-6 py-2.5 text-[12px] font-black uppercase tracking-wide transition-all shrink-0 disabled:opacity-50"
                style={{ background: "var(--color-brand-green)", color: "#fff", boxShadow: "0 4px 0 0 var(--color-brand-green-shadow)" }}
              >
                {approvingReg === r.id ? "⏳" : "✅ Approve"}
              </button>
              <button
                onClick={() => handleDeleteRegistration(r.id, r.name)}
                className="rounded-2xl px-3 py-2.5 text-[14px] transition-all shrink-0 hover:opacity-70"
                style={{ color: "var(--color-brand-red)" }}
              >
                🗑
              </button>
            </div>
          ))}
          {pending.length === 0 && (
            <p className="py-6 text-center text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>
              No pending registrations.
            </p>
          )}
        </SectionList>

        <SectionList title={`✅ Approved (${approved.length})`} accent="var(--color-brand-green)">
          {approved.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "var(--border-soft)" }}>
              <span className="flex-1 text-[14px] font-bold truncate" style={{ color: "var(--fg)" }}>{r.name}</span>
              <span className="text-[12px] font-semibold" style={{ color: "var(--fg-muted)" }}>Roll: {r.roll}</span>
              <span className="text-[11px] font-bold" style={{ color: "var(--color-brand-green)" }}>Approved</span>
            </div>
          ))}
          {approved.length === 0 && (
            <p className="py-6 text-center text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>
              No approved registrations yet.
            </p>
          )}
        </SectionList>
      </div>
    );
  }

  /* ==============================================================
     TAB: LOCATIONS
     ============================================================== */
  function renderLocations() {
    return (
      <div className="flex flex-col gap-6">
        <div className="card p-6" style={{ background: "var(--surface)" }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-green)" }}>
              🗺 Live Team Locations
            </h3>
            <div className="flex items-center gap-4 text-[12px] font-bold">
              <span style={{ color: "#22c55e" }}>🟢 {teamLocations.filter(t => t.isActive && !t.isDisqualified).length} active</span>
              <span style={{ color: "#9ca3af" }}>⚪ {teamLocations.filter(t => !t.isActive && !t.isDisqualified).length} inactive</span>
              <span style={{ color: "#ef4444" }}>🚫 {teamLocations.filter(t => t.isDisqualified).length} disqualified</span>
            </div>
          </div>
          <TeamMap teams={teamLocations} spots={spots} height="480px" />
        </div>

        <div className="card p-6" style={{ background: "var(--surface)" }}>
          <h3 className="mb-4 text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-blue)" }}>
            🏠 Team Status
          </h3>
          <div className="flex flex-col gap-3">
            {teams.length === 0 && <p className="py-4 text-center text-[15px] font-semibold" style={{ color: "var(--fg-muted)" }}>No teams yet.</p>}
            {teams.map((t) => {
              const loc = teamLocations.find(l => l.id === t.id);
              const active = t.is_disqualified ? false : loc?.isActive ?? isActive(t.last_active_at);
              return (
                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-3xl p-5" style={{ background: "var(--border-soft)" }}>
                  <div className="flex flex-1 items-center justify-between sm:justify-start gap-4">
                    <span className="text-[17px] sm:text-[19px] font-black" style={{ color: t.is_disqualified ? "var(--fg-muted)" : "var(--fg)" }}>{t.name}</span>
                    <div className="flex items-center gap-3">
                      {t.is_disqualified ? (
                        <span className="rounded-2xl px-4 py-1.5 text-[11px] font-black uppercase tracking-wider" style={{ background: "rgba(255,75,75,0.15)", color: "var(--color-brand-red)" }}>🚫 DISQUALIFIED</span>
                      ) : (
                        <span className="rounded-2xl px-4 py-1.5 text-[11px] font-black uppercase tracking-wider" style={{ background: active ? "rgba(88,204,2,0.15)" : "rgba(156,163,175,0.15)", color: active ? "var(--color-brand-green)" : "var(--fg-muted)" }}>
                          {active ? "🟢 ACTIVE" : "⚪ OFFLINE"}
                        </span>
                      )}
                      <span className="text-[12px] font-bold opacity-60" style={{ color: "var(--fg-muted)" }}>
                        {loc ? new Date(loc.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-3 sm:pt-0 border-t sm:border-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    {t.is_disqualified ? (
                      <button onClick={() => {
                        setConfirmDef({ title: "Reinstate Team", message: `Reinstate ${t.name}? They will regain access to the dashboard.` });
                        setConfirmHandler(() => async () => { try { await reinstateTeam(t.id); flash(`✅ ${t.name} reinstated`); await loadData(); } catch { flashError("Reinstate failed"); } });
                      }} className="btn-press rounded-2xl px-6 py-2.5 text-[12px] font-black uppercase tracking-wide transition-all shadow-sm" style={{ background: "var(--surface)", color: "var(--color-brand-green)" }}>✅ Reinstate</button>
                    ) : (
                      <button onClick={() => {
                        setConfirmDef({ title: "Disqualify Team", message: `Disqualify ${t.name}? They will be blocked from the dashboard and marked on the map.`, destructive: true });
                        setConfirmHandler(() => async () => { try { await disqualifyTeam(t.id); flash(`🚫 ${t.name} disqualified`); await loadData(); } catch { flashError("Disqualify failed"); } });
                      }} className="btn-press rounded-2xl px-6 py-2.5 text-[12px] font-black uppercase tracking-wide transition-all shadow-sm" style={{ background: "var(--surface)", color: "var(--color-brand-red)" }}>🚫 Disqualify</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ==============================================================
     TAB: LOGIN LINKS
     ============================================================== */

  async function loadLinkTeams() {
    setLinkLoading(true);
    try {
      const result = await fetchTeamParticipantsWithEmails();
      setLinkTeams(result);
    } catch {
      flashError("Failed to load team data");
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleSendTeamLoginLinks() {
    setConfirmDef({
      title: "Send Login Links",
      message: `Send magic login emails to all ${linkTeams.length} team participants? Each gets a unique one-click login link.`,
    });
    setConfirmHandler(() => async () => {
      setLinkSending(true);
      setLinkResults(null);
      const errors: string[] = [];
      let ok = 0;

      for (const p of linkTeams) {
        try {
          const token = await generateLoginToken("team", p.participantId, {
            roll: p.roll,
            teamCode: p.teamCode,
          });
          const loginUrl = `${window.location.origin}/magic-login/${token}`;
          await insforge.emails.send({
            to: p.email,
            subject: `Log in to Treasure Hunt — ${p.teamName}`,
            html: magicLoginEmailHtml({ name: p.name, loginUrl, role: "team" }),
          });
          ok++;
        } catch (err) {
          errors.push(`${p.name} (${p.email}): ${err instanceof Error ? err.message : "Failed"}`);
        }
      }

      setLinkResults({ ok, fail: errors.length, errors });
      setLinkSending(false);
      flash(`Sent ${ok} of ${linkTeams.length} emails`);
    });
  }

  async function handleGenerateSpotLink(spotId: string, spotName: string) {
    setSpotLinkLoading(spotId);
    try {
      const token = await generateLoginToken("spot-leader", spotId);
      const url = `${window.location.origin}/magic-login/${token}`;
      const existing = spotLinks.filter((s) => s.id !== spotId);
      setSpotLinks([...existing, { id: spotId, name: spotName, url }]);
    } catch {
      flashError("Failed to generate link");
    } finally {
      setSpotLinkLoading(null);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setLinkCopiedId(id);
      setTimeout(() => setLinkCopiedId(null), 2000);
    }).catch(() => flashError("Copy failed"));
  }

  function renderLoginLinks() {
    return (
      <div className="flex flex-col gap-6">
        {/* Team push email */}
        <div className="card p-8" style={{ background: "var(--surface)", borderTop: "6px solid var(--color-brand-blue)" }}>
          <div className="mb-2 flex items-center gap-3">
            <span className="text-2xl">🏃</span>
            <h3 className="text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-blue)" }}>
              Team Login Links
            </h3>
          </div>
          <p className="mb-6 text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            Send one-click login emails to all team participants. Each link is unique, single-use, and expires in 7 days.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={loadLinkTeams}
              disabled={linkLoading}
              className="btn-press rounded-2xl px-6 py-3 text-[13px] font-black uppercase tracking-wide transition-all"
              style={{ background: "var(--border-soft)", color: "var(--fg-muted)" }}
            >
              {linkLoading ? "⏳ Loading…" : `🔄 Load Teams (${linkTeams.length || "?"})`}
            </button>

            {linkTeams.length > 0 && (
              <button
                onClick={handleSendTeamLoginLinks}
                disabled={linkSending}
                className="btn-press rounded-2xl px-8 py-3 text-[13px] font-black uppercase tracking-wide text-white transition-all"
                style={{ background: "var(--color-brand-green)", opacity: linkSending ? 0.6 : 1 }}
              >
                {linkSending ? "⏳ Sending…" : `📧 Send to ${linkTeams.length}`}
              </button>
            )}
          </div>

          {linkResults && (
            <div className="mt-6 rounded-3xl border-4 p-6" style={{ borderColor: linkResults.fail > 0 ? "rgba(255,75,75,0.2)" : "rgba(88,204,2,0.2)", background: linkResults.fail > 0 ? "rgba(255,75,75,0.05)" : "rgba(88,204,2,0.05)" }}>
              <p className="text-[15px] font-black" style={{ color: linkResults.fail > 0 ? "var(--color-brand-red)" : "var(--color-brand-green)" }}>
                ✅ {linkResults.ok} sent {linkResults.fail > 0 ? `· ❌ ${linkResults.fail} failed` : ""}
              </p>
              {linkResults.errors.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
                  {linkResults.errors.map((e, i) => (
                    <p key={i} className="text-[12px] font-semibold" style={{ color: "var(--color-brand-red)" }}>{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {linkTeams.length > 0 && (
            <div className="mt-6 max-h-48 overflow-y-auto space-y-2">
              {linkTeams.map((p) => (
                <div key={p.participantId} className="flex items-center gap-3 rounded-2xl px-4 py-2.5" style={{ background: "var(--border-soft)" }}>
                  <div className="flex-1 min-w-0">
                    <span className="text-[14px] font-black truncate" style={{ color: "var(--fg)" }}>{p.name}</span>
                    <span className="ml-2 text-[11px] font-semibold" style={{ color: "var(--fg-muted)" }}>{p.email}</span>
                  </div>
                  <span className="text-[11px] font-bold shrink-0" style={{ color: "var(--color-brand-blue)" }}>{p.teamName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spot leader links */}
        <div className="card p-8" style={{ background: "var(--surface)", borderTop: "6px solid var(--color-brand-gold)" }}>
          <div className="mb-2 flex items-center gap-3">
            <span className="text-2xl">📍</span>
            <h3 className="text-[15px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>
              Spot Leader Login Links
            </h3>
          </div>
          <p className="mb-6 text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            Generate a one-click login link for each spot leader. Share the link manually or copy it.
          </p>

          <div className="grid gap-3">
            {spots.map((s) => {
              const link = spotLinks.find((l) => l.id === s.id);
              return (
                <div key={s.id} className="flex items-center gap-4 rounded-2xl px-5 py-4" style={{ background: "var(--border-soft)" }}>
                  <div className="flex-1 min-w-0">
                    <span className="text-[15px] font-black" style={{ color: "var(--fg)" }}>{s.name}</span>
                    <p className="text-[11px] font-bold opacity-60" style={{ color: "var(--fg-muted)" }}>
                      Code: {s.spot_leader_code}
                    </p>
                  </div>
                  {link ? (
                    <div className="flex items-center gap-2">
                      <input readOnly value={link.url} className="w-48 rounded-xl border-2 px-3 py-2 text-[12px] font-mono font-bold outline-none truncate" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} onClick={(e) => (e.target as HTMLInputElement).select()} />
                      <button onClick={() => copyToClipboard(link.url, link.id)}
                        className="btn-press rounded-xl px-4 py-2 text-[12px] font-extrabold uppercase tracking-wide transition-all"
                        style={{ background: linkCopiedId === link.id ? "var(--color-brand-green)" : "var(--surface)", color: linkCopiedId === link.id ? "#fff" : "var(--fg)" }}>
                        {linkCopiedId === link.id ? "✅" : "📋 Copy"}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleGenerateSpotLink(s.id, s.name)}
                      disabled={spotLinkLoading === s.id}
                      className="btn-press rounded-2xl px-5 py-2.5 text-[12px] font-extrabold uppercase tracking-wide transition-all"
                      style={{ background: "var(--color-brand-blue)", color: "#fff", opacity: spotLinkLoading === s.id ? 0.6 : 1 }}>
                      {spotLinkLoading === s.id ? "⏳" : "🔗 Generate"}
                    </button>
                  )}
                </div>
              );
            })}
            {spots.length === 0 && (
              <p className="py-6 text-center text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>
                No spots configured yet.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ==============================================================
     RENDER
     ============================================================== */
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ background: "var(--color-brand-blue)" }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ background: "var(--color-brand-green)" }} />
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />

      <Backdrop />
      <SuccessOverlay open={showSuccess} onClose={() => setShowSuccess(false)} pointsEarned={successTeamCount} title="GENERATED!" subtitle="Teams created and routed" />

      <ConfirmDialog
        open={confirmDef !== null}
        title={confirmDef?.title ?? ""}
        message={confirmDef?.message ?? ""}
        destructive={confirmDef?.destructive}
        loading={confirmLoading}
        onConfirm={async () => {
          if (!confirmHandler) return;
          setConfirmLoading(true);
          try { await confirmHandler(); } finally { setConfirmLoading(false); setConfirmDef(null); setConfirmHandler(null); }
        }}
        onCancel={() => { setConfirmDef(null); setConfirmHandler(null); }}
      />

      <div className="relative z-20 mx-auto max-w-6xl px-4 py-8 lg:px-8 pb-32 lg:pb-12">
        {/* Header */}
        <Reveal duration={0.8}>
          <header className="mb-10 flex items-center justify-between sticky top-0 z-40 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0 rounded-b-3xl sm:rounded-none">
            <div className="flex items-center gap-3 sm:gap-4">
              <Logo className="h-10 w-10 sm:h-12 sm:w-12 drop-shadow-md" />
              <div className="min-w-0">
                <h1 className="text-[22px] sm:text-[32px] font-black leading-tight truncate gradient-text">
                  <span className="sm:hidden">Admin</span>
                  <span className="hidden sm:inline">Admin Dashboard</span>
                </h1>
                <p className="hidden sm:block text-[14px] font-bold" style={{ color: "var(--fg-muted)" }}>Control Center · Treasure Hunt DU</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <button onClick={() => {
                setConfirmDef({ title: "Logout", message: "Are you sure you want to logout?" });
                setConfirmHandler(() => async () => { clearSession(); });
              }} className="rounded-2xl border-2 px-4 py-2 sm:px-5 sm:py-2.5 text-[12px] sm:text-[13px] font-black uppercase tracking-wide transition-all btn-press touch-press" style={{ borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--fg)" }}>Logout</button>
            </div>
          </header>
        </Reveal>

        {/* Error / Success feedback removed as per request */}


        {/* Tab bar */}
        <div className="mb-10 flex items-center gap-4 overflow-x-auto pb-4 lg:pb-0 flex-nowrap lg:flex-wrap admin-tabs-container scrollbar-hide lg:static lg:bg-transparent lg:border-0 lg:shadow-none lg:p-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              data-sound="click"
              onClick={() => setTab(t.key)}
              className={`rounded-[28px] px-8 py-5 text-[17px] font-black uppercase tracking-wide transition-all btn-press touch-press ${tab === t.key ? "shadow-lg" : ""}`}
              style={{
                background: tab === t.key ? "var(--color-brand-blue)" : "var(--surface)",
                color: tab === t.key ? "#fff" : "var(--fg-muted)",
                border: "none",
                boxShadow: tab === t.key ? "0 8px 0 0 var(--color-brand-blue-dark)" : "0 8px 0 0 var(--border-soft)",
              }}
            >
              <t.icon size={20} className="mr-2 shrink-0" strokeWidth={2.5} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {tab === "dashboard" && renderDashboard()}
            {tab === "participants" && renderParticipants()}
            {tab === "teams" && renderTeams()}
            {tab === "routes" && renderRoutes()}
            {tab === "spots" && renderSpots()}
            {tab === "clues" && renderClues()}
            {tab === "config" && renderConfig()}
            {tab === "sessions" && renderSessions()}
            {tab === "broadcast" && renderBroadcast()}
            {tab === "registrations" && renderRegistrations()}
            {tab === "login-links" && renderLoginLinks()}
            {tab === "locations" && renderLocations()}
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

// removed unused Stat component

function StatPill({ icon, value, label, accent }: { icon: React.ReactNode; value: number; label: string; accent: string }) {
  return (
    <span className="flex items-center gap-3 shrink-0 rounded-[24px] px-6 py-3.5 shadow-sm" style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent, border: `2px solid color-mix(in srgb, ${accent} 30%, transparent)` }}>
      <span className="flex items-center justify-center">{icon}</span>
      <motion.span key={value} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-[20px] font-black leading-none tabular-nums">{value}</motion.span>
      <span className="text-[12px] font-black uppercase tracking-widest opacity-90">{label}</span>
    </span>
  );
}

function Divider() {
  return <span className="inline-block w-px h-4 shrink-0 mx-1" style={{ background: "var(--border-soft)" }} />;
}

// removed unused Banner component

function SectionList({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="card p-8 relative overflow-hidden" style={{ background: "var(--surface)", borderTop: `6px solid ${accent}` }}>
      <h3 className="mb-6 text-[16px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
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
      <div className="flex flex-col gap-4 rounded-[28px] border-4 p-5" style={{ background: "var(--surface)", borderColor: "var(--color-brand-blue)" }}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name">
            <input value={editData.name ?? ""} onChange={e => onChange({ name: e.target.value })} className="w-full rounded-[20px] border-2 px-4 py-3 text-[15px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
          </Field>
          <Field label="Roll">
            <input value={editData.roll ?? ""} onChange={e => onChange({ roll: e.target.value })} className="w-full rounded-[20px] border-2 px-4 py-3 text-[15px] font-black outline-none" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)" }} />
          </Field>
        </div>
        <div className="flex gap-3">
          <button onClick={onSave} className="flex-1 btn-press rounded-[20px] py-3 text-[13px] font-black uppercase text-white" style={{ background: "var(--color-brand-green)" }}>💾 Save</button>
          <button onClick={onCancel} className="flex-1 btn-press rounded-[20px] py-3 text-[13px] font-black uppercase" style={{ background: "var(--border-soft)", color: "var(--fg-muted)" }}>Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-4 rounded-[28px] border-4 px-6 py-4" style={{ background: "var(--surface)", borderColor: "var(--border-soft)" }}>
      <div className="flex-1 min-w-0">
        <p className="text-[17px] font-black truncate" style={{ color: "var(--fg)" }}>{p.name}</p>
        <p className="text-[12px] font-black opacity-60 uppercase tracking-widest" style={{ color: "var(--fg)" }}>Roll {p.roll || "N/A"}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="btn-press rounded-2xl bg-white/10 p-3 text-[18px] border-2 border-transparent hover:border-blue-400" title="Edit">✏️</button>
        {deletable && <button onClick={onDelete} className="btn-press rounded-2xl bg-white/10 p-3 text-[18px] border-2 border-transparent hover:border-red-400" title="Delete">✕</button>}
      </div>
    </div>
  );
}

function TeamCard({ team, teamIndex, teamNames, isMoveActive, isTransferActive, onStartMove, onStartTransfer, onMoveTo, onTransferTo, onCancel }: {
  team: GeneratedTeam; teamIndex: number; teamNames: string[]; isMoveActive: boolean; isTransferActive: boolean; onStartMove: (mid: string) => void; onStartTransfer: () => void; onMoveTo: (i: number) => void; onTransferTo: (nid: string) => void; onCancel: () => void;
}) {
  const leaderCount = team.members.filter((m) => m.is_leader).length;
  return (
    <div className="card p-6 border-4 rounded-[28px] relative overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", borderTopColor: "var(--color-brand-blue)" }}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="text-[18px] font-black uppercase truncate" style={{ color: "var(--fg)" }}>{team.name}</span>
        <span className="shrink-0 rounded-2xl px-4 py-2 text-[12px] font-black uppercase tracking-widest shadow-sm" style={{ background: "rgba(88,204,2,0.1)", color: "var(--color-brand-green)", border: "2px solid rgba(88,204,2,0.2)" }}>🏷 {team.teamCode}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {team.members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "var(--border-soft)" }}>
            {m.is_leader ? (
              <button onClick={onStartTransfer} className="btn-press text-[20px] filter drop-shadow-sm" title="Transfer leadership">👑</button>
            ) : (
              <span className="w-6 text-center text-[10px] opacity-30">•</span>
            )}
            <span className="flex-1 text-[14px] font-black truncate" style={{ color: "var(--fg)" }}>{m.name}</span>
            <button onClick={() => onStartMove(m.id)} className="btn-press rounded-xl bg-white/10 p-2 text-[16px] border-2 border-transparent hover:border-blue-400" title="Move member">⇄</button>
          </li>
        ))}
      </ul>
      {leaderCount !== 1 && (
        <div className="mt-4 rounded-2xl p-3 text-center border-2 border-dashed" style={{ borderColor: "var(--color-brand-red)", background: "rgba(255,75,75,0.05)" }}>
          <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: "var(--color-brand-red)" }}>⚠️ {leaderCount === 0 ? "No leader assigned!" : `${leaderCount} leaders detected!`}</p>
        </div>
      )}

      {isTransferActive && (
        <div className="absolute inset-x-4 top-20 z-20 rounded-[28px] border-4 p-5 shadow-2xl" style={{ background: "var(--surface)", borderColor: "var(--color-brand-gold)" }}>
          <p className="mb-4 text-[12px] font-black uppercase tracking-[0.15em] text-center" style={{ color: "var(--color-brand-gold)" }}>New 👑 Leader</p>
          <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
            {team.members.map((m) => (
              <button key={m.id} onClick={() => onTransferTo(m.id)} className="btn-press rounded-2xl px-5 py-4 text-[15px] font-black text-left transition-all border-2" style={{ background: m.is_leader ? "rgba(255,200,0,0.1)" : "var(--border-soft)", borderColor: m.is_leader ? "var(--color-brand-gold)" : "transparent", color: "var(--fg)" }}>
                {m.is_leader ? "👑 " : ""}{m.name}
              </button>
            ))}
          </div>
          <button onClick={onCancel} className="mt-4 w-full rounded-2xl py-4 text-[13px] font-black uppercase tracking-widest" style={{ background: "var(--border-soft)", color: "var(--fg-muted)" }}>Cancel</button>
        </div>
      )}

      {isMoveActive && (
        <div className="absolute inset-x-4 top-20 z-20 rounded-[28px] border-4 p-5 shadow-2xl" style={{ background: "var(--surface)", borderColor: "var(--color-brand-blue)" }}>
          <p className="mb-4 text-[12px] font-black uppercase tracking-[0.15em] text-center" style={{ color: "var(--color-brand-blue)" }}>Move to Team</p>
          <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
            {teamNames.map((name, i) => i === teamIndex ? null : (
              <button key={i} onClick={() => onMoveTo(i)} className="btn-press rounded-2xl px-5 py-4 text-[15px] font-black text-left transition-all border-2" style={{ background: "var(--border-soft)", borderColor: "transparent", color: "var(--fg)" }}>→ {name}</button>
            ))}
          </div>
          <button onClick={onCancel} className="mt-4 w-full rounded-2xl py-4 text-[13px] font-black uppercase tracking-widest" style={{ background: "var(--border-soft)", color: "var(--fg-muted)" }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

function RouteCard({ teamName, route, spots }: { teamName: string; route: { order: number; spotId: string }[]; spots: Spot[] }) {
  const spotMap = new Map(spots.map((s) => [s.id, s.name]));
  return (
    <div className="card p-6 border-4 rounded-[28px] relative overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border-soft)", borderTopColor: "var(--color-brand-gold)" }}>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl">🗺</span>
        <span className="text-[18px] font-black uppercase truncate" style={{ color: "var(--fg)" }}>{teamName}</span>
      </div>
      <div className="flex flex-col gap-3">
        {route.map((r, idx) => (
          <div key={r.order} className="flex items-center gap-4 rounded-2xl px-4 py-3" style={{ background: "var(--border-soft)" }}>
            <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-black text-white shadow-sm" style={{ background: "var(--color-brand-green)" }}>{idx + 1}</span>
            <span className="text-[15px] font-black truncate" style={{ color: "var(--fg)" }}>{spotMap.get(r.spotId) ?? "Unknown Spot"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

