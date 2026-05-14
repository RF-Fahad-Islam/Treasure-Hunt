import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Backdrop } from "@/components/Backdrop";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Reveal } from "@/components/Reveal";
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
} from "@/services/admin";
import type { Participant, Spot, ClueDefinition } from "@/types";
import type { GeneratedTeam, TeamWithRoute } from "@/services/admin";

type Step = "idle" | "preview" | "saved" | "routes-preview" | "complete";

export default function AdminPage() {
  const { clearSession } = useAuthStore();

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

  useEffect(() => {
    loadData();
  }, []);

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
    setSuccess("Teams reshuffled!");
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
      setSuccess(`${generated.length} teams created and routed!`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  const totalUnassigned = participants.filter((p) => !p.team_id).length;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />

      <div className="absolute right-4 top-4 z-20 flex items-center gap-3">
        <button
          onClick={clearSession}
          className="rounded-full px-4 py-2 text-[12px] font-bold uppercase tracking-wide transition-opacity hover:opacity-70"
          style={{ color: "var(--fg-muted)", background: "var(--surface)" }}
        >
          Logout
        </button>
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-20">
        <Reveal duration={0.5}>
          <header className="mb-10 text-center">
            <div className="flex items-center justify-center gap-3">
              <Logo className="h-10 w-10 drop-shadow-lg" />
              <div>
                <h1 className="font-display text-[28px] font-extrabold leading-none" style={{ color: "var(--fg)" }}>
                  Admin Panel
                </h1>
                <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--fg-muted)" }}>
                  Team Generator
                </p>
              </div>
            </div>
          </header>
        </Reveal>

        {error && (
          <Reveal>
            <div
              className="mb-6 rounded-2xl px-5 py-3 text-center text-[13px] font-bold"
              style={{
                background: "rgba(255,75,75,0.08)",
                border: "1px solid rgba(255,75,75,0.25)",
                color: "var(--color-brand-red)",
              }}
              role="alert"
            >
              {error}
            </div>
          </Reveal>
        )}

        {success && (
          <Reveal>
            <div
              className="mb-6 rounded-2xl px-5 py-3 text-center text-[13px] font-bold"
              style={{
                background: "rgba(88,204,2,0.08)",
                border: "1px solid rgba(88,204,2,0.25)",
                color: "var(--color-brand-green)",
              }}
            >
              {success}
            </div>
          </Reveal>
        )}

        <Reveal delay={0.08} duration={0.55}>
          <div className="card mb-8 p-6" style={{ background: "var(--surface)" }}>
            <h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>
              Data Overview
            </h2>
            <div className="flex flex-wrap gap-6">
              <Stat label="Participants" value={participants.length} accent="var(--color-brand-blue)" />
              <Stat label="Unassigned" value={totalUnassigned} accent="var(--color-brand-red)" />
              <Stat label="Existing Teams" value={existingTeams} accent="var(--color-brand-gold)" />
              <Stat label="Spots" value={spots.length} accent="var(--color-brand-green)" />
              <Stat label="Clues" value={clues.length} accent="var(--color-brand-green)" />
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="btn-press mt-4 rounded-xl px-4 py-2 text-[12px] font-extrabold uppercase tracking-wide transition-all"
              style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", color: "var(--fg-muted)" }}
            >
              {loading ? "Loading…" : "Refresh Data"}
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.14} duration={0.55}>
          <div className="card mb-8 p-6" style={{ background: "var(--surface)" }}>
            <h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>
              Step 1 — Generate Teams
            </h2>
            <p className="mb-4 text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
              Randomly assign participants into teams of 5. Each team gets a unique name and code.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading || participants.length < 5}
                className="btn-press btn-primary btn-press--lg"
                style={participants.length < 5 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
              >
                Generate Teams
              </button>
              {step === "preview" && (
                <button
                  onClick={handleReshuffle}
                  disabled={loading}
                  className="btn-press rounded-xl px-5 py-2.5 text-[13px] font-extrabold uppercase tracking-wide transition-all"
                  style={{ background: "var(--surface)", border: "2px solid var(--border-soft)", color: "var(--fg)" }}
                >
                  Reshuffle
                </button>
              )}
              {step === "preview" && (
                <button
                  onClick={handleSaveTeams}
                  disabled={loading}
                  className="btn-press rounded-xl px-5 py-2.5 text-[13px] font-extrabold uppercase tracking-wide text-white transition-all"
                  style={{
                    background: "var(--color-brand-green)",
                    boxShadow: "0 4px 0 0 color-mix(in srgb, var(--color-brand-green) 60%, black)",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {loading ? "Saving…" : "Save Teams & Routes"}
                </button>
              )}
            </div>
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          {step === "preview" && generated.length > 0 && (
            <motion.div
              key="teams-preview"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <Reveal duration={0.45}>
                <div className="card p-6" style={{ background: "var(--surface)" }}>
                  <h2 className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>
                    Preview — {generated.length} Teams
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {generated.map((team, i) => (
                      <TeamCard key={i} team={team} />
                    ))}
                  </div>
                </div>
              </Reveal>
            </motion.div>
          )}
        </AnimatePresence>

        {teamRoutes.length > 0 && (
          <Reveal delay={0.1} duration={0.55}>
            <div className="card mt-8 p-6" style={{ background: "var(--surface)" }}>
              <h2 className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-gold)" }}>
                Generated Routes
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {teamRoutes.map((tr, i) => (
                  <RouteCard key={i} teamName={tr.team.name} route={tr.route} spots={spots} />
                ))}
              </div>
            </div>
          </Reveal>
        )}

        <Reveal delay={0.2} duration={0.5}>
          <p className="mt-10 text-center text-[12px] font-semibold" style={{ color: "var(--fg-muted)" }}>
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
      <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
        {label}
      </span>
      <span className="text-[28px] font-extrabold leading-none" style={{ color: accent }}>
        {value}
      </span>
    </div>
  );
}

function TeamCard({ team }: { team: GeneratedTeam }) {
  return (
    <div
      className="rounded-2xl border-2 p-4 transition-all"
      style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[16px] font-extrabold" style={{ color: "var(--fg)" }}>
          {team.name}
        </span>
        <span
          className="rounded-lg px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide"
          style={{ background: "rgba(88,204,2,0.12)", color: "var(--color-brand-green)" }}
        >
          {team.teamCode}
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {team.members.map((m) => (
          <li key={m.id} className="text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            {m.name}
          </li>
        ))}
      </ul>
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
      className="rounded-2xl border-2 p-4 transition-all"
      style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}
    >
      <span className="mb-2 block text-[16px] font-extrabold" style={{ color: "var(--fg)" }}>
        {teamName}
      </span>
      <ol className="flex flex-col gap-1.5">
        {route.map((r) => (
          <li key={r.order} className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
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
