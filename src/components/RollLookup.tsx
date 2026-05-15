import { useState, type FormEvent, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/store/authStore";
import { lookupByRoll, loginByRoll } from "@/services/auth";
import { insforge } from "@/lib/insforge";
import { welcomeEmailHtml } from "@/email-templates/welcome";

interface Props {
  open: boolean;
  onClose: () => void;
  initialStep?: Step;
}

type Step = "roll" | "team-info" | "code" | "loading" | "error" | "register" | "register-success";

export function RollLookup({ open, onClose, initialStep = "roll" }: Props) {
  const setSession = useAuthStore((s) => s.setSession);

  const [step, setStep] = useState<Step>(initialStep);
  const [roll, setRoll] = useState("");

  useEffect(() => {
    if (open) {
      setStep(initialStep);
    }
  }, [open, initialStep]);
  const [teamCode, setTeamCode] = useState("");
  const [teamInfo, setTeamInfo] = useState<Awaited<ReturnType<typeof lookupByRoll>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStep("roll");
    setRoll("");
    setTeamCode("");
    setTeamInfo(null);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleRollSubmit(e: FormEvent) {
    e.preventDefault();
    if (!roll.trim()) return;
    setError(null);
    setStep("loading");
    try {
      const info = await lookupByRoll(roll.trim());
      setTeamInfo(info);
      setStep("team-info");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
      setStep("error");
    }
  }

  async function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    if (!teamCode.trim()) return;
    setError(null);
    setStep("loading");
    try {
      const session = await loginByRoll(roll.trim(), teamCode.trim());
      setSession(session);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setStep("code");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md touch-press"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_8px_0_rgba(0,0,0,0.06),0_30px_60px_-20px_rgba(0,0,0,0.25)] sm:p-8 dark:border-white/10 dark:bg-[#0b0717]/95 dark:shadow-[0_20px_60px_-10px_rgba(139,92,246,0.3)] dark:backdrop-blur-xl"
          >
            <AnimatePresence mode="wait">
              {step === "roll" && (
                <RollForm
                  key="roll"
                  roll={roll}
                  setRoll={setRoll}
                  onSubmit={handleRollSubmit}
                  onRegister={() => setStep("register")}
                />
              )}

              {step === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 py-8"
                >
                  <motion.p
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-5xl"
                  >
                    🔍
                  </motion.p>
                  <p className="text-[15px] font-bold" style={{ color: "var(--fg-muted)" }}>
                    Looking up…
                  </p>
                </motion.div>
              )}

              {step === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-4"
                >
                  <p className="text-center text-4xl">😕</p>
                  <p className="text-center text-[15px] font-bold leading-relaxed" style={{ color: "var(--color-brand-red)" }}>
                    {error}
                  </p>
                  <button
                    onClick={() => setStep("roll")}
                    className="btn-press ripple btn-primary w-full"
                  >
                    Try again
                  </button>
                  <button
                    onClick={handleClose}
                    className="btn-press ripple btn-secondary w-full"
                  >
                    Close
                  </button>
                </motion.div>
              )}

              {step === "team-info" && teamInfo && (
                <TeamInfo
                  key="info"
                  teamInfo={teamInfo}
                  teamCode={teamCode}
                  setTeamCode={setTeamCode}
                  error={error}
                  onContinue={() => setStep("code")}
                  onBack={() => { setStep("roll"); setError(null); }}
                  onClose={handleClose}
                />
              )}

              {step === "code" && teamInfo && (
                <CodeEntry
                  key="code"
                  teamInfo={teamInfo}
                  teamCode={teamCode}
                  setTeamCode={setTeamCode}
                  error={error}
                  onSubmit={handleCodeSubmit}
                  onBack={() => setStep("team-info")}
                />
              )}

              {step === "register" && (
                <RegisterForm
                  key="register"
                  onBack={() => setStep("roll")}
                  onSuccess={() => setStep("register-success")}
                />
              )}

              {step === "register-success" && (
                <motion.div
                  key="register-success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-5 items-center text-center py-6"
                >
                  <p className="text-5xl">🎉</p>
                  <h2 className="font-display text-[24px] font-extrabold" style={{ color: "var(--fg)" }}>
                    Registration Submitted!
                  </h2>
                  <p className="text-[15px] font-semibold leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                    Your details have been recorded. <strong style={{ color: "var(--fg)" }}>All the teams will be assigned by your seniors</strong> closer to the event.
                  </p>
                  <button
                    onClick={handleClose}
                    className="btn-press ripple btn-primary w-full mt-4"
                  >
                    Got it!
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Step 1: Enter roll ─────────────────────────────────────── */

function RollForm({
  roll,
  setRoll,
  onSubmit,
  onRegister,
}: {
  roll: string;
  setRoll: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onRegister: () => void;
}) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <motion.form
      key="roll"
      onSubmit={onSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      <div className="text-center">
        <p className="text-4xl mb-2">🔎</p>
        <h2 className="font-display text-[24px] font-extrabold" style={{ color: "var(--fg)" }}>
          Find your team
        </h2>
        <p className="mt-1 text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>
          Enter your student roll to look up your team.
        </p>
      </div>

      <label className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: "var(--fg-muted)" }}>
        Student Roll
      </label>
      <input
        type="text"
        placeholder="e.g. 30"
        value={roll}
        onChange={(e) => setRoll(e.target.value)}
        autoFocus
        className="w-full rounded-2xl border-2 px-4 py-3.5 text-[20px] font-extrabold tracking-wider outline-none transition-all"
        style={{ borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--fg)" }}
      />

      <button data-sound="heavy" type="submit" disabled={!roll.trim()} className="btn-press ripple btn-primary w-full disabled:opacity-50">
        <span>Look up</span>
        <Arrow />
      </button>

      <button type="button" onClick={() => setShowHelp((v) => !v)} className="w-full text-[13px] font-bold underline underline-offset-4" style={{ color: "var(--fg-muted)" }}>
        {showHelp ? "Hide help" : "Need help?"}
      </button>

      {showHelp && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden rounded-2xl border-2 p-4"
          style={{ borderColor: "var(--border-soft)", background: "rgba(28,176,246,0.04)" }}
        >
          <ul className="flex flex-col gap-2 text-[13px] font-semibold leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            <li>🔑 <strong style={{ color: "var(--fg)" }}>Roll number</strong> was provided during registration.</li>
            <li>👥 Once found, you&apos;ll see your <strong style={{ color: "var(--fg)" }}>team name</strong> and <strong style={{ color: "var(--fg)" }}>squad members</strong>.</li>
            <li>🔐 Enter the <strong style={{ color: "var(--fg)" }}>team code</strong> shared by your team leader to log in.</li>
            <li>❓ If you don&apos;t know your roll or team, ask your <strong style={{ color: "var(--fg)" }}>event coordinator</strong>.</li>
          </ul>
        </motion.div>
      )}

      <p className="text-center text-[11px] font-semibold" style={{ color: "var(--fg-muted)" }}>
        Only registered DU CSE students can participate.
      </p>

      <div className="mt-2 pt-4 border-t-2 flex flex-col gap-3" style={{ borderColor: "var(--border-soft)" }}>
        <p className="text-center text-[13px] font-bold" style={{ color: "var(--fg-muted)" }}>
          Haven't registered yet?
        </p>
        <button
          type="button"
          onClick={onRegister}
          className="btn-press ripple btn-secondary w-full"
        >
          📝 Register for the Hunt
        </button>
      </div>
    </motion.form>
  );
}

/* ── Step 2: Team info ──────────────────────────────────────── */

function TeamInfo({
  teamInfo,
  teamCode,
  setTeamCode,
  error,
  onContinue,
  onBack,
  onClose,
}: {
  teamInfo: Awaited<ReturnType<typeof lookupByRoll>>;
  teamCode: string;
  setTeamCode: (v: string) => void;
  error: string | null;
  onContinue: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const { participant, team, members } = teamInfo;

  return (
    <motion.div
      key="info"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: "var(--fg-muted)" }}>
          Roll {participant.roll}
        </span>
        <button onClick={onClose} className="text-[12px] font-bold underline underline-offset-4" style={{ color: "var(--fg-muted)" }}>
          Close
        </button>
      </div>

      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: "var(--fg-muted)" }}>
          Your team
        </p>
        <p className="mt-1 font-display text-[28px] font-extrabold tracking-tight gradient-text">
          {team.name}
        </p>
      </div>

      <p className="text-[13px] font-semibold leading-relaxed" style={{ color: "var(--fg-muted)" }}>
        Welcome, <strong style={{ color: "var(--fg)" }}>{participant.name}</strong>!
        {participant.is_leader ? " You are the team leader." : ""}
      </p>

      <div>
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: "var(--fg-muted)" }}>
          Squad ({members.length})
        </p>
        <ul className="flex flex-col gap-1">
          {members.map((m) => (
            <li
              key={m.name}
              className="flex items-center gap-2 rounded-2xl px-3 py-2 text-[14px] font-semibold"
              style={{
                background: m.name === participant.name ? "rgba(88,204,2,0.08)" : "var(--border-soft)",
                color: m.name === participant.name ? "var(--color-brand-green)" : "var(--fg)",
              }}
            >
              {m.is_leader ? <span>👑</span> : <span className="w-4 text-center text-[10px]">•</span>}
              {m.name}
              {m.name === participant.name ? " (You)" : ""}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "rgba(28,176,246,0.06)", border: "1px solid rgba(28,176,246,0.15)" }}>
        <p className="text-[12px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--color-brand-blue)" }}>
          🔑 Enter Team Code
        </p>
        <p className="mt-1 text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
          To verify and log in, enter your team&apos;s secret code.
        </p>
        <input
          type="text"
          placeholder="e.g. PHX2026"
          value={teamCode}
          onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
          autoCapitalize="characters"
          className="mt-3 w-full rounded-2xl border-2 px-4 py-3 text-[18px] font-extrabold tracking-widest uppercase outline-none transition-all"
          style={{ borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--fg)" }}
        />
        {error && (
          <p className="mt-2 text-[13px] font-bold" style={{ color: "var(--color-brand-red)" }}>
            {error}
          </p>
        )}
      </div>

      <button
        data-sound="success"
        onClick={onContinue}
        disabled={!teamCode.trim()}
        className="btn-press ripple btn-primary w-full disabled:opacity-50"
      >
        <span>Verify &amp; Log In</span>
        <Arrow />
      </button>

      <button onClick={onBack} className="w-full text-[13px] font-bold underline underline-offset-4" style={{ color: "var(--fg-muted)" }}>
        ← Different roll
      </button>
    </motion.div>
  );
}

/* ── Step 3: Code entry (focused view) ──────────────────────── */

function CodeEntry({
  teamInfo,
  teamCode,
  setTeamCode,
  error,
  onSubmit,
  onBack,
}: {
  teamInfo: Awaited<ReturnType<typeof lookupByRoll>>;
  teamCode: string;
  setTeamCode: (v: string) => void;
  error: string | null;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <motion.form
      key="code"
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5"
    >
      <div className="text-center">
        <p className="text-4xl mb-2">🔑</p>
        <h2 className="font-display text-[24px] font-extrabold" style={{ color: "var(--fg)" }}>
          Enter Team Code
        </h2>
        <p className="mt-1 text-[14px] font-semibold" style={{ color: "var(--fg-muted)" }}>
          For <strong style={{ color: "var(--fg)" }}>{teamInfo.team.name}</strong>
        </p>
      </div>

      <input
        type="text"
        placeholder="e.g. PHX2026"
        value={teamCode}
        onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
        autoFocus
        autoCapitalize="characters"
        className="w-full rounded-2xl border-2 px-4 py-4 text-[24px] font-extrabold tracking-[0.3em] text-center uppercase outline-none transition-all"
        style={{ borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--fg)" }}
      />

      {error && (
        <p className="text-[13px] font-bold text-center" style={{ color: "var(--color-brand-red)" }}>
          {error}
        </p>
      )}

      <button
        data-sound="success"
        type="submit"
        disabled={!teamCode.trim()}
        className="btn-press ripple btn-primary w-full disabled:opacity-50"
      >
        <span>Log In</span>
        <Arrow />
      </button>

      <button type="button" onClick={onBack} className="w-full text-[13px] font-bold underline underline-offset-4" style={{ color: "var(--fg-muted)" }}>
        ← Back
      </button>
    </motion.form>
  );
}

/* ── Shared ──────────────────────────────────────────────────── */

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Step 4: Registration ─────────────────────────────────────── */

function RegisterForm({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !roll.trim() || !email.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const { error: dbError } = await insforge.database
        .from("registrations")
        .insert({ name: name.trim(), roll: roll.trim(), email: email.trim() });

      if (dbError) {
        if (dbError.code === "23505") {
          throw new Error("This roll number is already registered.");
        }
        throw dbError;
      }

      const { error: emailErr } = await insforge.emails.send({
        to: email.trim(),
        subject: "Welcome to Treasure Hunt 2026!",
        html: welcomeEmailHtml({ name: name.trim(), roll: roll.trim() }),
      });
      if (emailErr) console.error("Welcome email failed:", emailErr.message);

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to submit registration.");
      setSubmitting(false);
    }
  }

  return (
    <motion.form
      key="register"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-4"
    >
      <div className="text-center mb-2">
        <p className="text-4xl mb-2">📝</p>
        <h2 className="font-display text-[24px] font-extrabold" style={{ color: "var(--fg)" }}>
          Register for the Hunt
        </h2>
        <p className="mt-1 text-[13px] font-semibold text-balance" style={{ color: "var(--fg-muted)" }}>
          Sign up to participate. <strong style={{ color: "var(--fg)" }}>All teams will be assigned by your seniors.</strong>
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: "var(--fg-muted)" }}>Full Name</label>
        <input
          type="text"
          placeholder="MD Fahad Islam"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-2xl border-2 px-4 py-3 text-[16px] font-extrabold outline-none transition-all"
          style={{ borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--fg)" }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: "var(--fg-muted)" }}>Student Roll</label>
        <input
          type="text"
          placeholder="64"
          value={roll}
          onChange={(e) => setRoll(e.target.value)}
          required
          className="w-full rounded-2xl border-2 px-4 py-3 text-[16px] font-extrabold outline-none transition-all"
          style={{ borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--fg)" }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: "var(--fg-muted)" }}>Email Address</label>
        <input
          type="email"
          placeholder="rsfahad97@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-2xl border-2 px-4 py-3 text-[16px] font-extrabold outline-none transition-all"
          style={{ borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--fg)" }}
        />
      </div>

      {error && (
        <p className="text-[13px] font-bold text-center" style={{ color: "var(--color-brand-red)" }}>
          {error}
        </p>
      )}

      <button
        data-sound="heavy"
        type="submit"
        disabled={submitting || !name.trim() || !roll.trim() || !email.trim()}
        className="btn-press ripple btn-primary w-full disabled:opacity-50 mt-2"
      >
        <span>{submitting ? "Submitting..." : "Submit Registration"}</span>
        {!submitting && <Arrow />}
      </button>

      <button type="button" onClick={onBack} className="w-full text-[13px] font-bold underline underline-offset-4" style={{ color: "var(--fg-muted)" }}>
        ← Back to Find Team
      </button>
    </motion.form>
  );
}
