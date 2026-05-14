import { Backdrop } from "@/components/Backdrop";

/**
 * Team Dashboard — placeholder skeleton.
 * Route: /team
 * Implemented in Phase 4 (Sub Problems 4.1 → 4.3)
 */
export default function TeamDashboardPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
        <p className="font-display text-xl font-extrabold text-[var(--fg-muted)]">
          Team Dashboard — Phase 4
        </p>
      </div>
    </div>
  );
}
