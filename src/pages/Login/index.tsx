import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Backdrop } from "@/components/Backdrop";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Reveal } from "@/components/Reveal";

/* ─── Types ───────────────────────────────────────────────── */

type Role = "team" | "spot-leader" | "admin";

/* ─── Role Metadata ────────────────────────────────────────── */

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
    shadowColor: "rgba(88,204,2,0.30)",
  },
  {
    id: "spot-leader",
    label: "Spot Leader",
    sub: "I'm guarding",
    emoji: "📍",
    accentVar: "var(--color-brand-blue)",
    shadowColor: "rgba(28,176,246,0.30)",
  },
  {
    id: "admin",
    label: "Admin",
    sub: "I'm running it",
    emoji: "⚙️",
    accentVar: "var(--color-brand-gold)",
    shadowColor: "rgba(255,200,0,0.28)",
  },
];

/* ─── Small helpers ─────────────────────────────────────────── */

function InputField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[13px] font-extrabold uppercase tracking-widest"
        style={{ color: "var(--fg-muted)" }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-2xl border px-4 py-3.5 text-base font-semibold outline-none transition-all duration-200 placeholder:font-normal"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border-soft)",
          color: "var(--fg)",
          boxShadow: "var(--shadow-card)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--color-brand-green)";
          e.currentTarget.style.boxShadow =
            "0 0 0 3px rgba(88,204,2,0.15), var(--shadow-card)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border-soft)";
          e.currentTarget.style.boxShadow = "var(--shadow-card)";
        }}
      />
    </div>
  );
}

/* ─── Role Card ─────────────────────────────────────────────── */

function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: (typeof ROLES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.96 }}
      animate={selected ? { y: -3 } : { y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-4 text-center transition-all duration-200"
      style={{
        background: selected ? "var(--surface)" : "transparent",
        borderColor: selected ? role.accentVar : "var(--border-soft)",
        boxShadow: selected
          ? `0 6px 20px -4px ${role.shadowColor}, 0 3px 0 ${role.shadowColor}`
          : "none",
        cursor: "pointer",
      }}
      aria-pressed={selected}
      aria-label={`Select role: ${role.label}`}
    >
      <span className="text-3xl leading-none">{role.emoji}</span>
      <span
        className="text-[13px] font-extrabold leading-none"
        style={{ color: selected ? role.accentVar : "var(--fg)" }}
      >
        {role.label}
      </span>
      <span className="text-[11px] font-semibold" style={{ color: "var(--fg-muted)" }}>
        {role.sub}
      </span>
    </motion.button>
  );
}

/* ─── Forms per role ────────────────────────────────────────── */

function TeamForm() {
  const [roll, setRoll] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Phase 1.2: wire InsForge auth here
    navigate("/team");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <InputField
        id="team-roll"
        label="Roll Number"
        placeholder="e.g. CSE-2001-014"
        value={roll}
        onChange={setRoll}
        autoComplete="username"
      />
      <InputField
        id="team-code"
        label="Team Code"
        placeholder="Enter your team code"
        value={code}
        onChange={setCode}
        autoComplete="one-time-code"
      />
      <button
        type="submit"
        className="btn-press btn-primary btn-press--lg mt-2 w-full"
        disabled={!roll.trim() || !code.trim()}
        style={
          !roll.trim() || !code.trim()
            ? { opacity: 0.5, cursor: "not-allowed" }
            : {}
        }
      >
        Join the Hunt 🏆
      </button>
      <p className="text-center text-[12px]" style={{ color: "var(--fg-muted)" }}>
        Your roll &amp; team code are provided by the organiser.
      </p>
    </form>
  );
}

function CredentialsForm({
  role,
  accent,
  ctaLabel,
  destination,
}: {
  role: Role;
  accent: string;
  ctaLabel: string;
  destination: string;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Phase 1.2: wire InsForge auth here
    navigate(destination);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <InputField
        id={`${role}-username`}
        label="Username"
        placeholder="Enter username"
        value={username}
        onChange={setUsername}
        autoComplete="username"
      />
      <InputField
        id={`${role}-password`}
        label="Password"
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />
      <button
        type="submit"
        className="btn-press btn-press--lg mt-2 w-full text-white"
        disabled={!username.trim() || !password.trim()}
        style={{
          background: accent,
          boxShadow:
            !username.trim() || !password.trim()
              ? "none"
              : `0 4px 0 0 color-mix(in srgb, ${accent} 60%, black)`,
          opacity: !username.trim() || !password.trim() ? 0.5 : 1,
          cursor:
            !username.trim() || !password.trim() ? "not-allowed" : "pointer",
        }}
      >
        {ctaLabel}
      </button>
    </form>
  );
}

/* ─── Form switcher with animation ─────────────────────────── */

function RoleForm({ role }: { role: Role }) {
  const meta = ROLES.find((r) => r.id === role)!;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={role}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Role heading */}
        <div className="mb-5 text-center">
          <p
            className="text-[13px] font-extrabold uppercase tracking-[0.18em]"
            style={{ color: meta.accentVar }}
          >
            {meta.label} Login
          </p>
          <p className="mt-0.5 text-[22px] font-extrabold" style={{ color: "var(--fg)" }}>
            {role === "team"
              ? "Ready to hunt? 🏃"
              : role === "spot-leader"
              ? "Guard your spot. 📍"
              : "Run the event. ⚙️"}
          </p>
        </div>

        {role === "team" && <TeamForm />}
        {role === "spot-leader" && (
          <CredentialsForm
            role="spot-leader"
            accent={meta.accentVar}
            ctaLabel="Enter Dashboard →"
            destination="/spot-leader"
          />
        )}
        {role === "admin" && (
          <CredentialsForm
            role="admin"
            accent={meta.accentVar}
            ctaLabel="Access Admin Panel →"
            destination="/admin"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */

/**
 * Login page — role selector + role-specific form.
 * Route: /login
 *
 * Auth wiring (InsForge) happens in Phase 1.2.
 * This sub-problem (1.1) covers UI only.
 */
export default function LoginPage() {
  const [role, setRole] = useState<Role>("team");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />

      {/* Theme toggle — top right */}
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {/* Back to landing — top left */}
      <a
        href="/"
        className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-bold uppercase tracking-wide transition-opacity hover:opacity-70"
        style={{ color: "var(--fg-muted)" }}
      >
        ← Back
      </a>

      {/* Center content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">

        {/* Branding */}
        <Reveal duration={0.5}>
          <a href="/" className="flex flex-col items-center gap-3 no-underline">
            <Logo className="h-14 w-14 drop-shadow-lg" />
            <div className="text-center">
              <p className="font-display text-[22px] font-extrabold leading-none" style={{ color: "var(--fg)" }}>
                Treasure Hunt
              </p>
              <p
                className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: "var(--fg-muted)" }}
              >
                DU · CSE · 2026
              </p>
            </div>
          </a>
        </Reveal>

        {/* Card */}
        <Reveal delay={0.08} duration={0.55}>
          <div
            className="card mt-8 w-full max-w-sm p-6"
            style={{ background: "var(--surface)" }}
          >

            {/* Step label */}
            <p
              className="mb-3 text-center text-[11px] font-extrabold uppercase tracking-[0.2em]"
              style={{ color: "var(--fg-muted)" }}
            >
              Step 1 · Who are you?
            </p>

            {/* Role selector */}
            <div className="mb-6 flex gap-2">
              {ROLES.map((r) => (
                <RoleCard
                  key={r.id}
                  role={r}
                  selected={role === r.id}
                  onSelect={() => setRole(r.id)}
                />
              ))}
            </div>

            {/* Divider */}
            <div
              className="mb-5 h-px w-full"
              style={{ background: "var(--border-soft)" }}
            />

            {/* Role-specific form */}
            <RoleForm role={role} />

          </div>
        </Reveal>

        {/* Footer note */}
        <Reveal delay={0.18} duration={0.5}>
          <p
            className="mt-6 text-center text-[12px] font-semibold"
            style={{ color: "var(--fg-muted)" }}
          >
            Treasure Hunt · University of Dhaka &mdash; CSE
          </p>
        </Reveal>

      </div>
    </div>
  );
}
