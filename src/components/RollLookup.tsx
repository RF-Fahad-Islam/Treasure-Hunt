import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Reveal, WordReveal } from "./Reveal";

type LookupResult = {
  roll: string;
  team: string;
  captain: string;
  members: string[];
  station: string;
};

type Status = "idle" | "loading" | "success" | "error";

export function RollLookup() {
  const [roll, setRoll] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = roll.trim();
    if (!trimmed) {
      setError("Enter your roll to continue.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);
    setResult(null);

    // Backend wiring point: replace mockLookup with
    //   const res = await fetch(`/api/roll/${encodeURIComponent(trimmed)}`)
    try {
      const data = await mockLookup(trimmed);
      if (!data) {
        setError("We couldn't find that roll. Double-check and try again.");
        setStatus("error");
        return;
      }
      setResult(data);
      setStatus("success");
    } catch {
      setError("Something broke on our end. Try again in a moment.");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setError(null);
    setRoll("");
  }

  return (
    <section id="roll" className="relative px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <Reveal
            duration={0.6}
            className="inline-block rounded-full bg-[#58CC02]/12 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#3A8400] dark:bg-transparent dark:px-0 dark:py-0 dark:text-white/45"
          >
            Your Hunt Begins Here
          </Reveal>
          <h2 className="mt-4 font-display text-[clamp(2rem,7vw,3.25rem)] font-extrabold leading-tight tracking-tight text-[#2B2B2B] dark:text-white">
            <WordReveal text="Find your" />{" "}
            <WordReveal
              text="team."
              className="gradient-text"
              delay={0.2}
            />
          </h2>
          <Reveal
            delay={0.2}
            className="mx-auto mt-4 max-w-md text-[17px] font-semibold leading-relaxed text-[#777] dark:text-white/65 sm:text-base"
          >
            Enter your student roll. We'll pull up your team, your
            captain, and your squad.
          </Reveal>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 36, rotateX: -22, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-10 sm:mt-12"
          style={{
            perspective: "1400px",
            transformStyle: "preserve-3d",
            transformOrigin: "50% 0%",
          }}
        >
          {/* Dark-mode glow ring */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-px hidden rounded-[32px] opacity-60 blur-2xl dark:block"
            style={{
              background:
                "linear-gradient(120deg, rgba(139,92,246,0.4), rgba(236,72,153,0.35), rgba(34,211,238,0.35))",
            }}
          />

          <div
            className="relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_4px_0_rgba(0,0,0,0.06)] sm:p-7 dark:border-white/10 dark:bg-[#0b0717]/80 dark:shadow-none dark:backdrop-blur-xl"
          >
            <AnimatePresence mode="wait" initial={false}>
              {status !== "success" ? (
                <motion.form
                  key="form"
                  onSubmit={onSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-4"
                >
                  <label
                    htmlFor="roll-input"
                    className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#777] dark:text-white/55"
                  >
                    Student Roll
                  </label>

                  <div className="relative">
                    <input
                      id="roll-input"
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      placeholder="e.g. 30-001"
                      value={roll}
                      onChange={(e) => {
                        setRoll(e.target.value);
                        if (status === "error") {
                          setStatus("idle");
                          setError(null);
                        }
                      }}
                      disabled={status === "loading"}
                      className="w-full rounded-2xl border-2 border-black/8 bg-[#FAFAFA] px-4 py-4 font-display text-2xl font-extrabold tracking-wider text-[#2B2B2B] placeholder:font-sans placeholder:text-base placeholder:font-semibold placeholder:tracking-normal placeholder:text-[#BBB] focus:border-[#58CC02] focus:bg-white focus:outline-none sm:py-5 sm:text-3xl dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/25 dark:focus:bg-white/[0.07]"
                    />
                    {status === "loading" && (
                      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                        <div className="absolute inset-y-0 w-1/2 shimmer" />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="btn-press btn-press--lg btn-primary disabled:opacity-70"
                  >
                    {status === "loading" ? (
                      <>
                        <Spinner />
                        <span>Searching…</span>
                      </>
                    ) : (
                      <>
                        <span>Reveal my team</span>
                        <Arrow />
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-semibold text-[#C03030] dark:text-rose-300/90"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.form>
              ) : (
                <ResultCard
                  key="result"
                  result={result!}
                  onReset={reset}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ResultCard({
  result,
  onReset,
}: {
  result: LookupResult;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#777] dark:text-white/45">
          Roll {result.roll}
        </span>
        <button
          onClick={onReset}
          className="text-[12px] font-bold text-[#1CB0F6] underline-offset-4 transition hover:underline dark:text-white/55"
        >
          Search another
        </button>
      </div>

      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#777] dark:text-white/45">
          Your team
        </div>
        <div className="mt-1.5 font-display text-3xl font-extrabold tracking-tight gradient-text sm:text-4xl">
          {result.team}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoTile label="Captain" value={result.captain} accent="green" />
        <InfoTile label="Start station" value={result.station} accent="blue" />
      </div>

      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#777] dark:text-white/45">
          Squad
        </div>
        <ul className="mt-2 grid gap-1.5">
          {result.members.map((m) => (
            <li
              key={m}
              className="flex items-center gap-2 rounded-2xl border border-black/5 bg-[#FAFAFA] px-3 py-2.5 text-[15px] font-semibold text-[#2B2B2B] dark:border-white/5 dark:bg-white/[0.02] dark:text-white/85"
            >
              <Dot />
              {m}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function InfoTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "green" | "blue";
}) {
  const bg = accent === "green" ? "bg-[#E8FFD1]" : "bg-[#DCF1FE]";
  const fg = accent === "green" ? "text-[#3A8400]" : "text-[#0E6E9C]";
  return (
    <div
      className={`rounded-2xl ${bg} px-4 py-3 dark:bg-white/[0.03] dark:ring-1 dark:ring-white/10`}
    >
      <div
        className={`text-[10px] font-extrabold uppercase tracking-[0.22em] ${fg} opacity-80 dark:text-white/45`}
      >
        {label}
      </div>
      <div
        className={`mt-1 font-display text-base font-extrabold tracking-tight ${fg} dark:text-white sm:text-lg`}
      >
        {value}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      className="animate-spin"
      aria-hidden
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="2"
      />
      <path
        d="M14 8a6 6 0 00-6-6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Dot() {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{
        background: "#58CC02",
      }}
    />
  );
}

// Temporary placeholder until backend hooks up.
async function mockLookup(roll: string): Promise<LookupResult | null> {
  await new Promise((r) => setTimeout(r, 900));
  if (roll.toLowerCase() === "demo") return null;
  return {
    roll,
    team: "The Ghost Bytes",
    captain: "Rafsan Hossain",
    station: "Curzon Hall · Gate 2",
    members: [
      "Rafsan Hossain (Captain)",
      "Nabila Karim",
      "Tahmid Rahman",
      "Sumaiya Akter",
    ],
  };
}
