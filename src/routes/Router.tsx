import { useEffect } from "react";
import { Navigate, Routes, Route, useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { useSession, useAuthStore } from "@/store/authStore";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import LandingPage from "@/pages/Landing";
import LoginPage from "@/pages/Login";
import TeamDashboardPage from "@/pages/TeamDashboard";
import SpotLeaderPage from "@/pages/SpotLeader";
import AdminPage from "@/pages/Admin";
import ResultsPage from "@/pages/Results";
import MagicLoginPage from "@/pages/MagicLogin";

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
 * Validates the persisted session against the DB on mount.
 * If the session was deactivated elsewhere (another device, admin),
 * the user is redirected to login.
 */
function SessionGuard({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const checkSession = useAuthStore((s) => s.checkSession);
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) return;
    checkSession().then(() => {
      // If session was cleared by checkSession, redirect
      const currentSession = useAuthStore.getState().session;
      if (!currentSession) {
        navigate("/login", { replace: true });
      }
    });
  }, []);

  return <>{children}</>;
}

/**
 * Application router — all routes defined here.
 */
export function Router() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginGate /></PageTransition>} />

        <Route
          path="/team"
          element={
            <ProtectedRoute role="team">
              <SessionGuard>
                <PageTransition><TeamDashboardPage /></PageTransition>
              </SessionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/spot-leader"
          element={
            <ProtectedRoute role="spot-leader">
              <SessionGuard>
                <PageTransition><SpotLeaderPage /></PageTransition>
              </SessionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <SessionGuard>
                <PageTransition><AdminPage /></PageTransition>
              </SessionGuard>
            </ProtectedRoute>
          }
        />

        <Route path="/results" element={<PageTransition><ResultsPage /></PageTransition>} />

        <Route path="/magic-login/:token" element={<PageTransition><MagicLoginPage /></PageTransition>} />

        {/* Catch-all → landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}