import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Reveal } from "@/components/Reveal";
import { SuccessOverlay } from "@/components/SuccessOverlay";
import { ExpiredOverlay } from "@/components/ExpiredOverlay";
import { PointsToast } from "@/components/PointsToast";
import { LeaderboardOverlay } from "@/components/leaderboard/LeaderboardOverlay";
import { BroadcastBanner } from "@/components/BroadcastBanner";
import { PullToRefresh } from "@/components/PullToRefresh";
import { LocationGate } from "@/components/LocationGate";
import { OSStatusBar } from "@/components/OSStatusBar";
import { NotificationBell } from "@/components/NotificationBell";
import { ParticipantLobby } from "@/components/ParticipantLobby";
import { TeamAvatarRoom } from "@/components/TeamAvatarRoom";
import { OtherTeamsView } from "@/components/OtherTeamsView";
import { TeamLogoEditModal } from "@/components/TeamLogoEditModal";
import { GamifiedClueCard } from "@/components/GamifiedClueCard";
import { TeamMap } from "@/components/TeamMap";
import { useSession } from "@/store/authStore";
import { useLeaderboardRealtime } from "@/hooks/useLeaderboardRealtime";
import { useBroadcastListener } from "@/hooks/useBroadcastListener";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import {
  fetchDashboardData,
  fetchTeamMembers,
  updateTeamName,
  updateTeamAvatarSeed,
  fetchAllTeamsForLobby,
  revealAnswer,
} from "@/services/team";
import type { DashboardData, TeamLobbyEntry } from "@/services/team";
import type { Participant } from "@/types";
import { Home, Map, Trophy } from "lucide-react";

type App = "lobby" | "map";

function useCountdown(target: string | null) {
  const [display, setDisplay] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!target) return;
    const targetMs = new Date(target).getTime();
    const interval = setInterval(() => {
      const diff = targetMs - Date.now();
      if (diff <= 0) { setExpired(true); setDisplay({ d: 0, h: 0, m: 0, s: 0 }); clearInterval(interval); return; }
      setDisplay({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return { display, expired };
}

const APPS: { key: App; label: string; icon: React.ElementType }[] = [
  { key: "lobby", label: "Lobby", icon: Home },
  { key: "map", label: "Map", icon: Map },
];

export default function TeamDashboardPage() {
  const session = useSession();
  const teamId = session?.role === "team" ? session.teamId : null;

  const [data, setData] = useState<DashboardData | null>(null);
  const [teamMembers, setTeamMembers] = useState<Participant[]>([]);
  const [allTeamsLobby, setAllTeamsLobby] = useState<TeamLobbyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeApp, setActiveApp] = useState<App>("lobby");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPoints, setSuccessPoints] = useState(0);
  const [successRank, setSuccessRank] = useState<number | undefined>(undefined);
  const [initialPos, setInitialPos] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const [toastPoints, setToastPoints] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [showLogoEdit, setShowLogoEdit] = useState(false);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const prevCompletedRef = useRef(0);
  const prevPointsRef = useRef(0);
  const streakCountRef = useRef(0);

  useLocationTracker(teamId ?? "", initialPos);

  const leaderboard = useLeaderboardRealtime();
  const sessionRole = session?.role === "team" ? "team" : null;
  const broadcast = useBroadcastListener(sessionRole);
  const { display: countdown, expired: huntStarted } = useCountdown(data?.eventConfig?.event_start_time ?? null);

  const isHuntActive = data?.eventConfig?.hunt_started === true || huntStarted;

  const huntStartsIn = countdown ? `${countdown.d > 0 ? `${countdown.d}d ` : ""}${countdown.h}h ${countdown.m}m ${countdown.s}s` : null;

  const me = teamMembers.find(p => p.id === (session?.role === "team" ? session.participantId : null));
  const isLeader = me?.is_leader === true;
  const isDisqualified = data?.team.is_disqualified === true;

  const teamSeed = data?.team.avatar_seed || data?.team.name || "Team";

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [d, members, allTeams] = await Promise.all([
        fetchDashboardData(teamId),
        fetchTeamMembers(teamId),
        fetchAllTeamsForLobby(),
      ]);
      setData(d);
      setTeamMembers(members);
      setAllTeamsLobby(allTeams);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!data) return;
    if (data.completedClues > prevCompletedRef.current && prevCompletedRef.current > 0) {
      streakCountRef.current += 1;
      const earned = (data.team.total_points ?? 0) - prevPointsRef.current;
      setSuccessPoints(earned > 0 ? earned : (data.eventConfig?.points_per_clue ?? 100));
      const rank = leaderboard.findIndex(e => e.name === data.team.name) + 1;
      setSuccessRank(rank > 0 ? rank : undefined);
      setShowSuccess(true);
    } else if (data.completedClues === prevCompletedRef.current) {
      // no change
    } else {
      streakCountRef.current = 0;
    }
    prevCompletedRef.current = data.completedClues;
    prevPointsRef.current = data.team.total_points ?? 0;
  }, [data, leaderboard]);

  const handleTimeout = useCallback(() => {
    if (data?.currentRoute?.status === "active" || data?.currentRoute?.status === "pending") {
      setShowTimeout(true);
    }
  }, [data]);

  const handleReveal = async () => {
    if (!data?.currentRoute || !teamId) return;
    try {
      await revealAnswer(data.currentRoute.id, teamId);
      setShowTimeout(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reveal answer");
    }
  };

  const handleNewPoints = useCallback((points: number) => {
    setToastPoints(points);
    setShowToast(true);
    setSuccessPoints(points);
    const rank = leaderboard.findIndex(e => e.name === data?.team.name) + 1;
    setSuccessRank(rank > 0 ? rank : undefined);
    setShowSuccess(true);
  }, [leaderboard, data]);

  const handleTeamNameSave = async () => {
    if (!teamId || !nameInput.trim()) return;
    try {
      await updateTeamName(teamId, nameInput.trim());
      setShowNameEdit(false);
      await load();
    } catch { /* silent */ }
  };

  const handleTeamAvatarSave = async (seed: string) => {
    if (!teamId) return;
    try {
      await updateTeamAvatarSeed(teamId, seed);
      setShowLogoEdit(false);
      await load();
    } catch { /* silent */ }
  };

  const myMapLocation = initialPos ? { lat: initialPos.lat, lng: initialPos.lng } : null;

  if (!session) {
    return (
      <div className="relative min-h-screen overflow-hidden" style={{ background: "#F7F7F7" }}>
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <p className="text-5xl">🔐</p>
          <p className="mt-4 font-display text-2xl font-extrabold" style={{ color: "#777777" }}>Not logged in</p>
        </div>
      </div>
    );
  }

  if (session.role === "team" && !teamId) {
    return (
      <div className="relative min-h-screen overflow-hidden" style={{ background: "#F7F7F7", paddingBottom: "calc(3rem + env(safe-area-inset-bottom, 0px))" }}>
        <div className="mx-auto max-w-2xl px-4 pt-24">
          <ParticipantLobby />
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="relative min-h-screen overflow-hidden" style={{ background: "#F7F7F7" }}>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <motion.p animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-5xl">🔍</motion.p>
          <p className="mt-4 font-display text-xl font-extrabold" style={{ color: "#777777" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <LocationGate onLocationGranted={setInitialPos}>
    <div className="relative min-h-screen overflow-hidden pb-28" style={{ background: "#F7F7F7", paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}>

      <SuccessOverlay open={showSuccess} onClose={() => setShowSuccess(false)} pointsEarned={successPoints} newRank={successRank} />
      <ExpiredOverlay open={showTimeout} onContinue={handleReveal} autoContinueSec={5} />
      <BroadcastBanner broadcast={broadcast} />

      <LeaderboardOverlay
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        standings={leaderboard.map(e => ({
          rank: e.rank,
          team: e.name,
          score: e.score,
          you: e.name === data?.team.name,
        }))}
        yourRank={leaderboard.findIndex(e => e.name === data?.team.name) + 1}
      />

      <PointsToast open={showToast} points={toastPoints} onClose={() => setShowToast(false)} />

      {/* Disqualified overlay */}
      <AnimatePresence>
        {isDisqualified && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md" style={{ background: "rgba(0,0,0,0.7)" }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
              className="w-full max-w-sm rounded-[32px] p-10 text-center"
              style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.08), 0 16px 32px -8px rgba(0,0,0,0.12)", borderTop: "12px solid #FF4B4B" }}>
              <div className="mb-4 text-5xl">🚫</div>
              <h2 className="mb-2 text-[20px] font-extrabold" style={{ color: "#FF4B4B" }}>Team Disqualified</h2>
              <p className="mb-2 text-[14px] font-semibold leading-relaxed" style={{ color: "#777777" }}>
                Your team has been disqualified by the admin.
              </p>
              <p className="text-[12px] font-bold leading-relaxed" style={{ color: "#777777", opacity: 0.6 }}>
                You can no longer participate in the hunt.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OS Status Bar */}
      <OSStatusBar
        teamName={data?.team.name ?? ""}
        teamSeed={teamSeed}
        teamMembers={teamMembers}
        hasGps={initialPos !== null}
        onTeamNameEdit={() => { setNameInput(data?.team.name ?? ""); setShowNameEdit(true); }}
        onTeamAvatarEdit={() => setShowLogoEdit(true)}
      />

      {/* Name edit modal */}
      <AnimatePresence>
        {showNameEdit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNameEdit(false)} className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)" }} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative rounded-[32px] p-6 w-full max-w-sm shadow-2xl"
              style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.08), 0 16px 32px -8px rgba(0,0,0,0.12)" }}>
              <div className="relative z-10">
                <h3 className="font-display text-xl font-black mb-5 text-center" style={{ color: "#2B2B2B" }}>Edit Team Name</h3>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full rounded-2xl border-2 px-4 py-3.5 text-[15px] font-bold outline-none mb-5 transition-all"
                  style={{ background: "#F7F7F7", borderColor: "#E0E0E0", color: "#2B2B2B" }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTeamNameSave(); }}
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowNameEdit(false)}
                    className="btn-press flex-1 py-3.5 rounded-2xl text-[14px] font-black"
                    style={{ background: "#F0F0F0", color: "#777777" }}>Cancel</button>
                  <button onClick={handleTeamNameSave}
                    className="btn-press flex-1 py-3.5 rounded-2xl text-[14px] font-black text-white"
                    style={{ background: "#58CC02", boxShadow: "0 4px 0 0 #3A8400" }}>Save</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TeamLogoEditModal
        open={showLogoEdit}
        currentSeed={teamSeed}
        teamName={data?.team.name ?? ""}
        onSave={handleTeamAvatarSave}
        onClose={() => setShowLogoEdit(false)}
      />

      {/* Main content */}
      <PullToRefresh onRefresh={load}>
      <div className="relative z-10 mx-auto max-w-2xl px-4 pt-20">
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-3xl px-6 py-4 text-center text-[15px] font-bold"
            style={{ background: "rgba(255,75,75,0.08)", border: "2px solid rgba(255,75,75,0.2)", color: "#FF4B4B" }}>
            ⚠️ {error}
            <button onClick={load} className="ml-3 underline font-extrabold">Retry</button>
          </motion.div>
        )}

        {data && (
          <>
            {/* ── APP: LOBBY ── */}
            {activeApp === "lobby" && (
              <div className="space-y-5">
                {!isHuntActive ? (
                  <>
                    {/* Pre-hunt countdown */}
                    <Reveal delay={0.06} duration={0.6}>
                      <motion.div
                        className="relative overflow-hidden rounded-[32px] p-8 sm:p-10 text-center"
                        style={{ background: "#FFF8E0", boxShadow: "0 4px 0 rgba(255,200,0,0.2), 0 12px 24px -8px rgba(0,0,0,0.06)" }}
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,200,0,0.06)_0%,transparent_70%)] pointer-events-none" />
                        <div className="relative z-10">
                          <motion.div animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="mb-4 text-6xl">⏳</motion.div>
                          <h2 className="font-display text-2xl font-black mb-2" style={{ color: "#FFC800" }}>Waiting for the Hunt</h2>
                          <p className="text-[14px] font-bold mb-6" style={{ color: "rgba(200,150,0,0.6)" }}>The hunt hasn't started yet. Check back when it's time!</p>
                          {countdown && (
                            <div className="flex justify-center gap-2 sm:gap-4">
                              <TimeBlock value={countdown.d} label="Days" />
                              <TimeDot />
                              <TimeBlock value={countdown.h} label="Hours" />
                              <TimeDot />
                              <TimeBlock value={countdown.m} label="Minutes" />
                              <TimeDot />
                              <TimeBlock value={countdown.s} label="Seconds" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </Reveal>

                    {/* Locked Clue Card */}
                    <Reveal delay={0.1} duration={0.55}>
                      <GamifiedClueCard
                        clueDefinition={data.clueDefinition}
                        spot={data.spot}
                        completedClues={data.completedClues}
                        totalClues={data.totalClues}
                        streak={streakCountRef.current}
                        clueStartedAt={data.currentRoute?.clue_started_at ?? null}
                        timeLimitMinutes={data.eventConfig?.clue_time_limit_minutes ?? 40}
                        onTimeout={handleTimeout}
                        showTimeout={showTimeout}
                        locked={true}
                        huntStartsIn={huntStartsIn}
                      />
                    </Reveal>

                    {/* Team Avatar Room */}
                    <Reveal delay={0.14} duration={0.55}>
                      <TeamAvatarRoom
                        members={teamMembers}
                        teamSeed={teamSeed}
                        teamName={data.team.name}
                        currentUserId={session?.role === "team" ? session.participantId : undefined}
                      />
                    </Reveal>

                    {/* Live Standings */}
                    <Reveal delay={0.18} duration={0.5}>
                      <LiveStandingsSection
                        leaderboard={leaderboard}
                        myTeamName={data.team.name}
                        showLeaderboard={() => setShowLeaderboard(true)}
                      />
                    </Reveal>
                  </>
                ) : (
                  <>
                    {/* Gamified Stats Cards */}
                    <Reveal delay={0.06} duration={0.5}>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <GamifiedStatCard
                          icon="⭐"
                          label="Points"
                          value={`+${data.team.total_points ?? 0}`}
                          color="#58CC02"
                        />
                        <GamifiedStatCard
                          icon="⏱"
                          label="Penalty"
                          value={`-${data.team.total_penalty_seconds ? (data.team.total_penalty_seconds / 60).toFixed(0) : 0} min`}
                          color="#FF4B4B"
                        />
                      </div>
                    </Reveal>

                    {/* Clues progress bar */}
                    <Reveal delay={0.09} duration={0.5}>
                      <div className="rounded-[24px] p-5 sm:p-6"
                        style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.06), 0 12px 24px -8px rgba(0,0,0,0.08)" }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "#777777" }}>
                            Clue Progress
                          </span>
                          <span className="text-[13px] font-black tabular-nums" style={{ color: "#1CB0F6" }}>
                            {data.completedClues}/{data.totalClues}
                          </span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ background: "#F0F0F0" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.totalClues > 0 ? (data.completedClues / data.totalClues) * 100 : 0}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full relative"
                            style={{ background: "linear-gradient(90deg, #1CB0F6, #58CC02)", boxShadow: "0 0 16px rgba(88,204,2,0.3)" }}
                          >
                            <div className="shimmer absolute inset-0" />
                          </motion.div>
                        </div>
                        <p className="mt-2 text-[11px] font-semibold" style={{ color: "#999999" }}>
                          {data.completedClues === data.totalClues ? "🎉 All clues completed!" : `${data.totalClues - data.completedClues} more to go`}
                        </p>
                      </div>
                    </Reveal>

                    {/* Active Clue Card */}
                    <Reveal delay={0.12} duration={0.55}>
                      <GamifiedClueCard
                        clueDefinition={data.clueDefinition}
                        spot={data.spot}
                        completedClues={data.completedClues}
                        totalClues={data.totalClues}
                        streak={streakCountRef.current}
                        clueStartedAt={data.currentRoute?.clue_started_at ?? null}
                        timeLimitMinutes={data.eventConfig?.clue_time_limit_minutes ?? 40}
                        onTimeout={handleTimeout}
                        showTimeout={showTimeout}
                      />
                    </Reveal>

                    {/* Team Avatar Room */}
                    <Reveal delay={0.15} duration={0.55}>
                      <TeamAvatarRoom
                        members={teamMembers}
                        teamSeed={teamSeed}
                        teamName={data.team.name}
                        currentUserId={session?.role === "team" ? session.participantId : undefined}
                      />
                    </Reveal>

                    {/* Other Teams (leader only) */}
                    {isLeader && (
                      <Reveal delay={0.18} duration={0.5}>
                        <OtherTeamsView teams={allTeamsLobby} excludeTeamId={teamId!} />
                      </Reveal>
                    )}

                    {/* Live Standings */}
                    <Reveal delay={0.2} duration={0.5}>
                      <LiveStandingsSection
                        leaderboard={leaderboard}
                        myTeamName={data.team.name}
                        showLeaderboard={() => setShowLeaderboard(true)}
                      />
                    </Reveal>
                  </>
                )}
              </div>
            )}

            {/* ── APP: MAP ── */}
            {activeApp === "map" && (
              <div>
                <Reveal delay={0.06} duration={0.5}>
                  <div className="rounded-[24px] overflow-hidden" style={{ height: "60vh", minHeight: 360, boxShadow: "0 4px 0 rgba(0,0,0,0.06), 0 12px 24px -8px rgba(0,0,0,0.08)" }}>
                    <TeamMap
                      teams={[]}
                      spots={data?.spot ? [data.spot] : []}
                      height="100%"
                      myLocation={myMapLocation}
                    />
                  </div>
                </Reveal>
              </div>
            )}
          </>
        )}

        <Reveal delay={0.2} duration={0.5}>
          <p className="mt-12 text-center text-[13px] font-semibold" style={{ color: "#BBBBBB" }}>
            Treasure Hunt · University of Dhaka — CSE
          </p>
        </Reveal>
      </div>
      </PullToRefresh>

      {/* Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pt-2 px-4"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))", background: "linear-gradient(0deg, rgba(247,247,247,0.95) 60%, transparent)" }}>
        <div className="inline-flex rounded-2xl p-1.5 gap-1 backdrop-blur-xl shadow-2xl items-center" style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.06)" }}>
          {APPS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveApp(key)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wide transition-all"
              style={{
                background: activeApp === key ? "#58CC02" : "transparent",
                color: activeApp === key ? "#FFFFFF" : "#777777",
                boxShadow: activeApp === key ? "0 2px 8px rgba(88,204,2,0.3)" : "none",
              }}
            >
              <Icon size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
          <div className="w-px h-6 mx-1" style={{ background: "rgba(0,0,0,0.06)" }} />
          <NotificationBell teamId={teamId!} onNewPoints={handleNewPoints} dropUp />
        </div>
      </div>
    </div>
    </LocationGate>
  );
}

/* ──────────────────── Sub-components ──────────────────── */

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-18 sm:w-18 sm:h-22 rounded-2xl flex items-center justify-center relative overflow-hidden"
        style={{ background: "#FFFFFF", boxShadow: "0 2px 0 rgba(255,200,0,0.15), 0 8px 16px -4px rgba(0,0,0,0.06)" }}>
        <span className="font-display text-2xl sm:text-3xl font-black tracking-tighter tabular-nums" style={{ color: "#2B2B2B" }}>
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: "#999999" }}>{label}</span>
    </div>
  );
}

function TimeDot() {
  return (
    <div className="flex flex-col items-center justify-center pb-6">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#FFC800", boxShadow: "0 0 8px rgba(255,200,0,0.5)" }} />
      <div className="w-1.5 h-1.5 rounded-full mt-2" style={{ background: "#FFC800", boxShadow: "0 0 8px rgba(255,200,0,0.5)" }} />
    </div>
  );
}

function GamifiedStatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="relative overflow-hidden rounded-[24px] p-5 sm:p-6 transition-all hover:scale-[1.02]"
      style={{ background: "#FFFFFF", boxShadow: `0 4px 0 ${color}30, 0 8px 16px -4px rgba(0,0,0,0.06)`, borderTop: `4px solid ${color}` }}>
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${color}12 0%, transparent 70%)` }} />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} className="text-lg">{icon}</motion.span>
          <h4 className="text-[11px] font-extrabold uppercase tracking-[0.15em]" style={{ color: `${color}BB` }}>{label}</h4>
        </div>
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-2xl sm:text-3xl font-black tabular-nums"
          style={{ color }}
        >{value}</motion.span>
      </div>
    </div>
  );
}

const AVATAR_COLORS = ["#1CB0F6", "#EC4899", "#8B5CF6", "#FF9500", "#22D3EE", "#A3E635"];

function LiveStandingsSection({ leaderboard, myTeamName, showLeaderboard }: {
  leaderboard: { id: string; rank: number; name: string; score: number }[];
  myTeamName: string;
  showLeaderboard: () => void;
}) {
  const myRank = leaderboard.findIndex(e => e.name === myTeamName) + 1;
  const topDisplay = leaderboard.slice(0, 20);

  return (
    <div className="rounded-[24px] p-5 sm:p-6" style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(255,200,0,0.15), 0 12px 24px -8px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={18} style={{ color: "#FFC800" }} />
          <span className="text-[13px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "#FFC800" }}>Live Standings</span>
        </div>
        <button onClick={showLeaderboard}
          className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1"
          style={{ color: "#999999" }}>
          Full Board
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>

      {myRank > 0 && (
        <div className="mb-4 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(88,204,2,0.08)", border: "1px solid rgba(88,204,2,0.2)" }}>
          <span className="text-lg">🏆</span>
          <span className="text-[13px] font-bold" style={{ color: "#2B2B2B" }}>
            You're <span style={{ color: "#58CC02", fontWeight: 900 }}>#{myRank}</span> of {leaderboard.length}
          </span>
          {myRank === 1 && <span className="text-[11px] font-extrabold ml-auto" style={{ color: "#FFC800" }}>👑 LEADING</span>}
          {myRank === 2 && <span className="text-[11px] font-extrabold ml-auto" style={{ color: "#A8A8A8" }}>🥈 CHASING</span>}
          {myRank === 3 && <span className="text-[11px] font-extrabold ml-auto" style={{ color: "#CD7F32" }}>🥉 IN REACH</span>}
        </div>
      )}

      <div className="space-y-1.5">
        {topDisplay.map((entry, i) => {
          const isMe = entry.name === myTeamName;
          const color = AVATAR_COLORS[entry.rank % AVATAR_COLORS.length];
          const rankIcon = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 transition-all"
              style={{
                background: isMe ? "rgba(88,204,2,0.06)" : "#F7F7F7",
                border: isMe ? "1px solid rgba(88,204,2,0.2)" : "1px solid transparent",
              }}
            >
              <span className="w-8 text-center text-[13px] font-black tabular-nums" style={{ color: entry.rank <= 3 ? "#FFC800" : "#BBBBBB" }}>
                {rankIcon}
              </span>
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center" style={{ background: color }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="3.5" fill="white" /><path d="M4 20c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5" stroke="white" strokeWidth="1.8" fill="none" /></svg>
              </div>
              <span className="flex-1 text-[13px] font-bold truncate" style={{ color: isMe ? "#58CC02" : "#2B2B2B" }}>
                {entry.name}
                {isMe && <span className="ml-1.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full" style={{ background: "rgba(88,204,2,0.15)", color: "#58CC02" }}>You</span>}
              </span>
              <span className="text-[14px] font-black tabular-nums" style={{ color: "#58CC02" }}>{entry.score.toLocaleString()}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
