import { Backdrop } from "@/components/Backdrop";

/**
 * Results / podium page — placeholder skeleton.
 * Route: /results
 * Implemented in Phase 9 (gamification polish)
 */
export default function ResultsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
        <p className="font-display text-xl font-extrabold text-[var(--fg-muted)]">
          Results &amp; Podium — Phase 9
        </p>
      </div>
    </div>
  );
}
