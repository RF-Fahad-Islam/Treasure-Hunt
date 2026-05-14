import { Backdrop } from "@/components/Backdrop";

/**
 * Spot Leader dashboard — placeholder skeleton.
 * Route: /spot-leader
 * Implemented in Phase 5 (Sub Problems 5.1 → 5.2)
 */
export default function SpotLeaderPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
        <p className="font-display text-xl font-extrabold text-[var(--fg-muted)]">
          Spot Leader Dashboard — Phase 5
        </p>
      </div>
    </div>
  );
}
