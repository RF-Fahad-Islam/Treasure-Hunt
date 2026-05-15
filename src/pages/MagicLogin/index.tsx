import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Backdrop } from "@/components/Backdrop";
import { consumeLoginToken, loginByRoll, loginSpotLeader } from "@/services/auth";
import { insforge } from "@/lib/insforge";
import { useAuthStore } from "@/store/authStore";

type Status = "loading" | "invalid" | "expired" | "success" | "error";

async function loginByTeamId(teamId: string, teamCode: string) {
  const { data: participants, error } = await insforge.database
    .from("participants")
    .select("id, name, roll, is_leader")
    .eq("team_id", teamId)
    .order("is_leader", { ascending: false });

  if (error || !participants || participants.length === 0)
    throw new Error("Team not found");

  const leader = participants.find((p: any) => p.is_leader) ?? participants[0] as any;
  return loginByRoll(leader.roll ?? "", teamCode);
}

export default function MagicLoginPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [status, setStatus] = useState<Status>("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMsg("No login token provided.");
      return;
    }

    consumeLoginToken(token)
      .then(async (result) => {
        if (!result) {
          setStatus("invalid");
          setMsg("This link is invalid, expired, or already used.");
          return;
        }

        const { targetRole, targetId, metadata } = result;

        if (targetRole === "team") {
          const targetIsTeam = metadata?.targetIsTeam === true;
          const teamCode = metadata?.teamCode as string | undefined;

          if (targetIsTeam && teamCode) {
            const session = await loginByTeamId(targetId, teamCode);
            setSession(session);
            setStatus("success");
            setMsg("Logged in! Redirecting…");
            setTimeout(() => navigate("/team", { replace: true }), 800);
          } else {
            const roll = metadata?.roll as string | undefined;
            if (roll && teamCode) {
              const session = await loginByRoll(roll, teamCode);
              setSession(session);
              setStatus("success");
              setMsg("Logged in! Redirecting…");
              setTimeout(() => navigate("/team", { replace: true }), 800);
            } else {
              setStatus("error");
              setMsg("Incomplete login data. Please log in manually.");
            }
          }
        } else if (targetRole === "spot-leader") {
          const { data: spots } = await insforge.database
            .from("spots")
            .select("spot_leader_code")
            .eq("id", targetId)
            .limit(1);
          if (!spots || spots.length === 0) {
            setStatus("error");
            setMsg("Spot not found.");
            return;
          }
          const leaderCode = (spots[0] as any).spot_leader_code;
          const session = await loginSpotLeader("", leaderCode);
          setSession(session);
          setStatus("success");
          setMsg("Logged in! Redirecting…");
          setTimeout(() => navigate("/spot-leader", { replace: true }), 800);
        }
      })
      .catch(() => {
        setStatus("error");
        setMsg("Something went wrong. Please try logging in manually.");
      });
  }, [token, navigate, setSession]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
          className="w-full max-w-sm rounded-[32px] border-t-[8px] p-10 text-center"
          style={{
            background: "var(--surface)",
            borderColor: status === "success"
              ? "var(--color-brand-green)"
              : status === "invalid" || status === "expired"
                ? "var(--color-brand-red)"
                : "var(--color-brand-blue)",
          }}
        >
          <div className="mb-4 text-6xl">
            {status === "loading" && "🔗"}
            {status === "invalid" && "🔒"}
            {status === "expired" && "⏰"}
            {status === "success" && "🎉"}
            {status === "error" && "⚠️"}
          </div>

          <h2 className="mb-2 text-[20px] font-extrabold" style={{ color: "var(--fg)" }}>
            {status === "loading" && "Verifying Link…"}
            {status === "invalid" && "Invalid Link"}
            {status === "expired" && "Link Expired"}
            {status === "success" && "Welcome Back!"}
            {status === "error" && "Something Went Wrong"}
          </h2>

          <p className="mb-6 text-[14px] font-semibold leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            {msg || "Verifying your magic login link…"}
          </p>

          {(status === "invalid" || status === "expired" || status === "error") && (
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="w-full rounded-2xl py-4 text-[14px] font-black uppercase tracking-wide"
              style={{ background: "var(--color-brand-blue)", color: "#fff" }}
            >
              Go to Login
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
