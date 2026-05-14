import { Navigate, Routes, Route } from "react-router-dom";
import { useSession } from "@/store/authStore";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import LandingPage from "@/pages/Landing";
import LoginPage from "@/pages/Login";
import TeamDashboardPage from "@/pages/TeamDashboard";
import SpotLeaderPage from "@/pages/SpotLeader";
import AdminPage from "@/pages/Admin";
import ResultsPage from "@/pages/Results";

/**
 * If already logged in and tries to visit /login,
 * redirect them to their role's dashboard.
 */
function LoginGate() {
  const session = useSession();
  if (!session) return <LoginPage />;
  const map = { team: "/team", "spot-leader": "/spot-leader", admin: "/admin" } as const;
  return <Navigate to={map[session.role]} replace />;
}

/**
 * Application router — all routes defined here.
 *
 * Route map:
 *   /              → Landing page (public)
 *   /login         → Login / role selector (redirects if already authed)
 *   /team          → Team dashboard (team role only)
 *   /spot-leader   → Spot leader panel (spot-leader role only)
 *   /admin         → Admin dashboard (admin role only)
 *   /results       → Final results / podium (public)
 *   *              → Redirect to /
 */
export function Router() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginGate />} />

      <Route
        path="/team"
        element={
          <ProtectedRoute role="team">
            <TeamDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/spot-leader"
        element={
          <ProtectedRoute role="spot-leader">
            <SpotLeaderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminPage />
          </ProtectedRoute>
        }
      />

      <Route path="/results" element={<ResultsPage />} />

      {/* Catch-all → landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
