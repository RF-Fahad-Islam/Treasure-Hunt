import { useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Reveal, WordReveal } from "./Reveal";
import { Dashboard, type DashboardData, type HuntStatus } from "./Dashboard";

type Status = "idle" | "loading" | "success" | "error";

const ROLL_MIN = 0;
const ROLL_MAX = 100;

function isValidRoll(raw: string): boolean {
  if (!/^\d+$/.test(raw)) return false;
  const n = Number(raw);
  return Number.isInteger(n) && n >= ROLL_MIN && n <= ROLL_MAX;
}

export function RollLookup() {
  const [roll, setRoll] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = roll.trim();
    if (!trimmed) {
      setError("Enter your roll to continue.");
      setStatus("error");
      return;
    }
    if (!isValidRoll(trimmed)) {
      setError(`Roll must be a whole number from ${ROLL_MIN} to ${ROLL_MAX}.`);
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
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch {
      setError("Something broke on our end. Try again in a moment.");
      setStatus("error");
    }
  }

  return (
    <section
      id="roll"
      ref={sectionRef}
      className="relative px-5 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-2xl">
        {status !== "success" && (
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
              Enter your student roll (0–100). We'll load your team and
              your hunt dashboard.
            </Reveal>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 36, rotateX: -22, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className={`relative ${status !== "success" ? "mt-10 sm:mt-12" : "mt-4"}`}
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

          <div className="relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_4px_0_rgba(0,0,0,0.06)] sm:p-7 dark:border-white/10 dark:bg-[#0b0717]/80 dark:shadow-none dark:backdrop-blur-xl">
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
                    Student Roll (0–100)
                  </label>

                  <div className="relative">
                    <input
                      id="roll-input"
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={ROLL_MIN}
                      max={ROLL_MAX}
                      step={1}
                      autoComplete="off"
                      placeholder="e.g. 42"
                      value={roll}
                      onChange={(e) => {
                        // Strip non-digits in case browser permits them.
                        const cleaned = e.target.value.replace(/\D/g, "");
                        // Cap length so they can't paste huge numbers.
                        setRoll(cleaned.slice(0, 3));
                        if (status === "error") {
                          setStatus("idle");
                          setError(null);
                        }
                      }}
                      disabled={status === "loading"}
                      className="w-full appearance-none rounded-2xl border-2 border-black/8 bg-[#FAFAFA] px-4 py-4 font-display text-2xl font-extrabold tabular-nums tracking-wider text-[#2B2B2B] placeholder:font-sans placeholder:text-base placeholder:font-semibold placeholder:tracking-normal placeholder:text-[#BBB] focus:border-[#58CC02] focus:bg-white focus:outline-none sm:py-5 sm:text-3xl dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/25 dark:focus:bg-white/[0.07] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
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
                        <span>Enter the hunt</span>
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
                <Dashboard key="dashboard" data={result!} />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
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

// Placeholder until the backend is live. Demo data + a "not found" branch
// so the error state is testable: try roll 99 to hit it.
async function mockLookup(roll: string): Promise<DashboardData | null> {
  await new Promise((r) => setTimeout(r, 900));
  if (roll === "99") return null;

  const now = Date.now();
  const timerEndsAt = now + 18 * 60 * 1000 + 23 * 1000;

  const status: HuntStatus = "Active Hunt";

  return {
    roll,
    team: "The Ghost Bytes",
    members: [
      "Rafsan Hossain (Captain)",
      "Nabila Karim",
      "Tahmid Rahman",
      "Sumaiya Akter",
      "Arman Chowdhury",
    ],
    clue:
      "Where books sleep quietly and knowledge wakes — beneath the dome that watches over every restless student.",
    points: 1200,
    penalties: 200,
    status,
    timerEndsAt,
    rank: 4,
    standings: [
      { rank: 1, team: "Team Nova", score: 2800 },
      { rank: 2, team: "Team Alpha", score: 2450 },
      { rank: 3, team: "Team Echo", score: 2100 },
      { rank: 4, team: "The Ghost Bytes", score: 1900, you: true },
      { rank: 5, team: "Team Bravo", score: 1700 },
      { rank: 6, team: "Team Delta", score: 1550 },
      { rank: 7, team: "Team Quasar", score: 1380 },
      { rank: 8, team: "Team Helix", score: 1240 },
    ],
  };
}
