import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "@/pages/Landing";
import LoginPage from "@/pages/Login";
import TeamDashboardPage from "@/pages/TeamDashboard";
import SpotLeaderPage from "@/pages/SpotLeader";
import AdminPage from "@/pages/Admin";
import ResultsPage from "@/pages/Results";

/**
 * Application router — all routes defined here.
 *
 * Protected routes (Phase 1+) will be wrapped in a <ProtectedRoute>
 * component once auth is wired. For now all routes are open.
 *
 * Route map:
 *   /              → Landing page
 *   /login         → Login / role selector
 *   /team          → Team dashboard (auth-protected, Phase 4)
 *   /spot-leader   → Spot leader panel (auth-protected, Phase 5)
 *   /admin         → Admin dashboard (auth-protected, Phase 3)
 *   /results       → Final results / podium (Phase 9)
 *   *              → Redirect to /
 */
export function Router() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/team" element={<TeamDashboardPage />} />
      <Route path="/spot-leader" element={<SpotLeaderPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/results" element={<ResultsPage />} />
      {/* Catch-all — redirect unknown routes to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
