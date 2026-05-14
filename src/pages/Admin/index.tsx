import { Backdrop } from "@/components/Backdrop";

/**
 * Admin dashboard — placeholder skeleton.
 * Route: /admin
 * Implemented in Phase 3 (Sub Problems 3.1 → 3.2)
 */
export default function AdminPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
        <p className="font-display text-xl font-extrabold text-[var(--fg-muted)]">
          Admin Dashboard — Phase 3
        </p>
      </div>
    </div>
  );
}
