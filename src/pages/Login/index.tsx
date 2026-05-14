import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Backdrop } from "@/components/Backdrop";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Reveal } from "@/components/Reveal";
import { useAuthStore } from "@/store/authStore";
import { loginTeam, loginSpotLeader, loginAdmin } from "@/services/auth";

type Role = "team" | "spot-leader" | "admin";

const ROLES: {
  id: Role;
  label: string;
  sub: string;
  emoji: string;
  accentVar: string;
  shadowColor: string;
}[] = [
  {
    id: "team",
    label: "Team",
    sub: "I'm hunting",
    emoji: "🏃",
    accentVar: "var(--color-brand-green)",
    shadowColor: "rgba(88,204,2,0.35)",
  },
  {
    id: "spot-leader",
    label: "Spot Leader",
    sub: "I'm guarding",
    emoji: "📍",
    accentVar: "var(--color-brand-blue)",
    shadowColor: "rgba(28,176,246,0.35)",
  },
  {
    id: "admin",
    label: "Admin",
    sub: "I'm running it",
    emoji: "⚙️",
    accentVar: "var(--color-brand-gold)",
    shadowColor: "rgba(255,200,0,0.33)",
  },
];

function InputField({
  id, label, type = "text", placeholder, value, onChange, autoComplete, disabled,
}: {
  id: string; label: string; type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; autoComplete?: string; disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14px] font-extrabold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
        {label}
      </label>
      <input
        id={id} type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} disabled={disabled}
        className="w-full rounded-2xl border-2 px-5 py-4 text-[16px] font-semibold outline-none transition-all duration-200 placeholder:font-normal disabled:opacity-50"
        style={{
          background: "var(--surface)", borderColor: "var(--border-soft)", color: "var(--fg)",
          boxShadow: "var(--shadow-card)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--color-brand-green)";
          e.currentTarget.style.boxShadow = "0 0 0 4px rgba(88,204,2,0.15), var(--shadow-card)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border-soft)";
          e.currentTarget.style.boxShadow = "var(--shadow-card)";
        }}
      />
    </div>
  );
}

function RoleCard({
  role, selected, onSelect, disabled,
}: {
  role: (typeof ROLES)[number]; selected: boolean; onSelect: () => void; disabled: boolean;
}) {
  return (
    <motion.button
      type="button" onClick={onSelect} whileTap={{ scale: 0.94 }}
      animate={selected ? { y: -4 } : { y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 px-3 py-5 text-center transition-all duration-200"
      style={{
        background: selected ? "var(--surface)" : "transparent",
        borderColor: selected ? role.accentVar : "var(--border-soft)",
        boxShadow: selected ? `0 8px 28px -4px ${role.shadowColor}, 0 4px 0 ${role.shadowColor}` : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled && !selected ? 0.6 : 1,
      }}
      disabled={disabled}
      aria-pressed={selected}
    >
      <span className="text-4xl leading-none">{role.emoji}</span>
      <span className="text-[15px] font-extrabold leading-none" style={{ color: selected ? role.accentVar : "var(--fg)" }}>
        {role.label}
      </span>
      <span className="text-[12px] font-semibold" style={{ color: "var(--fg-muted)" }}>
        {role.sub}
      </span>
    </motion.button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="rounded-2xl px-5 py-3.5 text-center text-[14px] font-bold"
      style={{
        background: "rgba(255,75,75,0.1)",
        border: "2px solid rgba(255,75,75,0.3)",
        color: "var(--color-brand-red)",
      }}
      role="alert"
    >
      ⚠️ {message}
    </motion.div>
  );
}

function TeamForm({ isLoading, error, onSubmit }: {
  isLoading: boolean; error: string | null; onSubmit: (a: string, b: string) => Promise<void>;
}) {
  const [roll, setRoll] = useState("");
  const [code, setCode] = useState("");
  const canSubmit = roll.trim().length > 0 && code.trim().length > 0 && !isLoading;

  return (
    <form onSubmit={(e) => { e.preventDefault(); void onSubmit(roll, code); }} className="flex flex-col gap-5">
      <InputField id="team-roll" label="👑 Leader Name / Roll" placeholder="e.g. Fahad Islam" value={roll} onChange={setRoll} autoComplete="name" disabled={isLoading} />
      <InputField id="team-code" label="🏷 Team Code" placeholder="Enter your team code" value={code} onChange={setCode} autoComplete="one-time-code" disabled={isLoading} />
      {error && <ErrorBanner message={error} />}
      <motion.button
        data-sound="success"
        whileTap={canSubmit ? { scale: 0.96 } : {}}
        type="submit" className="btn-press ripple btn-primary btn-press--lg mt-2 w-full rounded-2xl py-4 text-[16px]"
        disabled={!canSubmit}
        style={!canSubmit ? { opacity: 0.5, cursor: "not-allowed" } : {}}
      >
        {isLoading ? "⏳ Joining…" : "🏆 Join the Hunt"}
      </motion.button>
      <p className="text-center text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
        Only team leaders can log in. Your name &amp; code are provided by the organiser.
      </p>
    </form>
  );
}

function CredentialsForm({
  role, accent, ctaLabel, usernameLabel, passwordLabel, usernamePlaceholder, passwordPlaceholder,
  isLoading, error, onSubmit,
}: {
  role: Role; accent: string; ctaLabel: string; usernameLabel: string; passwordLabel: string;
  usernamePlaceholder: string; passwordPlaceholder: string; isLoading: boolean; error: string | null;
  onSubmit: (a: string, b: string) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const canSubmit = username.trim().length > 0 && password.trim().length > 0 && !isLoading;

  return (
    <form onSubmit={(e) => { e.preventDefault(); void onSubmit(username, password); }} className="flex flex-col gap-5">
      <InputField id={`${role}-username`} label={usernameLabel} placeholder={usernamePlaceholder} value={username} onChange={setUsername} autoComplete="username" disabled={isLoading} />
      <InputField id={`${role}-password`} label={passwordLabel} type="password" placeholder={passwordPlaceholder} value={password} onChange={setPassword} autoComplete="current-password" disabled={isLoading} />
      {error && <ErrorBanner message={error} />}
      <motion.button
        data-sound="success"
        whileTap={canSubmit ? { scale: 0.96 } : {}}
        type="submit" className="btn-press ripple btn-press--lg mt-2 w-full rounded-2xl py-4 text-[16px] text-white"
        disabled={!canSubmit}
        style={{
          background: accent,
          boxShadow: !canSubmit ? "none" : `0 6px 0 0 color-mix(in srgb, ${accent} 60%, black)`,
          opacity: !canSubmit ? 0.5 : 1,
          cursor: !canSubmit ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? "⏳ Verifying…" : ctaLabel}
      </motion.button>
    </form>
  );
}

function RoleForm({ role, isLoading, error, onSubmit }: {
  role: Role; isLoading: boolean; error: string | null; onSubmit: (a: string, b: string) => Promise<void>;
}) {
  const meta = ROLES.find((r) => r.id === role)!;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={role}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-6 text-center">
          <p className="text-[14px] font-extrabold uppercase tracking-[0.18em]" style={{ color: meta.accentVar }}>
            {meta.label} Login
          </p>
          <p className="mt-1 text-[26px] font-extrabold" style={{ color: "var(--fg)" }}>
            {role === "team" ? "🏃 Ready to hunt?" : role === "spot-leader" ? "📍 Guard your spot." : "⚙️ Run the event."}
          </p>
        </div>

        {role === "team" && <TeamForm isLoading={isLoading} error={error} onSubmit={onSubmit} />}
        {role === "spot-leader" && (
          <CredentialsForm role="spot-leader" accent={meta.accentVar} ctaLabel="📍 Enter Dashboard →"
            usernameLabel="Spot Name (optional)" passwordLabel="Leader Code"
            usernamePlaceholder="Your name (optional)" passwordPlaceholder="Enter your spot leader code"
            isLoading={isLoading} error={error} onSubmit={onSubmit} />
        )}
        {role === "admin" && (
          <CredentialsForm role="admin" accent={meta.accentVar} ctaLabel="⚙️ Access Admin Panel →"
            usernameLabel="Username" passwordLabel="Password"
            usernamePlaceholder="admin" passwordPlaceholder="Enter admin password"
            isLoading={isLoading} error={error} onSubmit={onSubmit} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default function LoginPage() {
  const [role, setRole] = useState<Role>("team");
  const navigate = useNavigate();
  const { setSession, setLoading, setError, isLoading, error } = useAuthStore();

  const handleRoleChange = (r: Role) => { setRole(r); setError(null); };

  const handleSubmit = async (a: string, b: string) => {
    setLoading(true);
    setError(null);
    try {
      let session;
      if (role === "team") { session = await loginTeam(a, b); setSession(session); navigate("/team", { replace: true }); }
      else if (role === "spot-leader") { session = await loginSpotLeader(a, b); setSession(session); navigate("/spot-leader", { replace: true }); }
      else { session = await loginAdmin(a, b); setSession(session); navigate("/admin", { replace: true }); }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg.includes("duplicate") || msg.includes("unique") ? "Session conflict. Please try again." : msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />

      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <a href="/" className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-bold uppercase tracking-wide transition-opacity hover:opacity-70" style={{ color: "var(--fg-muted)", background: "var(--surface)" }}>
        ← Back
      </a>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <Reveal duration={0.5}>
          <a href="/" className="flex flex-col items-center gap-4 no-underline">
            <Logo className="h-16 w-16 drop-shadow-lg" />
            <div className="text-center">
              <p className="font-display text-[28px] font-extrabold leading-none" style={{ color: "var(--fg)" }}>
                Treasure Hunt
              </p>
              <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--fg-muted)" }}>
                DU · CSE · 2026
              </p>
            </div>
          </a>
        </Reveal>

        <Reveal delay={0.08} duration={0.55}>
          <div className="card mt-10 w-full max-w-md p-8" style={{ background: "var(--surface)" }}>
            <p className="mb-4 text-center text-[12px] font-extrabold uppercase tracking-[0.2em]" style={{ color: "var(--fg-muted)" }}>
              Step 1 · Who are you?
            </p>

            <div className="mb-8 flex gap-3">
              {ROLES.map((r) => (
                <RoleCard key={r.id} role={r} selected={role === r.id} onSelect={() => handleRoleChange(r.id)} disabled={isLoading} />
              ))}
            </div>

            <div className="mb-6 h-px w-full" style={{ background: "var(--border-soft)" }} />

            <RoleForm role={role} isLoading={isLoading} error={error} onSubmit={handleSubmit} />
          </div>
        </Reveal>

        <Reveal delay={0.18} duration={0.5}>
          <p className="mt-8 text-center text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            Treasure Hunt · University of Dhaka — CSE
          </p>
        </Reveal>
      </div>
    </div>
  );
}