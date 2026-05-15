import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/store/authStore";
import type { Role } from "@/types";

interface Props {
  children: ReactNode;
  /** If provided, only this role can access the route. Otherwise any logged-in user. */
  role?: Role;
  /** Where to redirect if not authenticated. Default: /login */
  redirectTo?: string;
}

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * Usage in Router.tsx:
 *   <Route path="/team" element={
 *     <ProtectedRoute role="team"><TeamDashboardPage /></ProtectedRoute>
 *   } />
 */
export function ProtectedRoute({
  children,
  role,
  redirectTo = "/login",
}: Props) {
  const session = useSession();

  // Not logged in at all
  if (!session) return <Navigate to={redirectTo} replace />;

  // Wrong role
  if (role && session.role !== role) {
    // Redirect to their own dashboard instead of login
    const dashMap: Record<Role, string> = {
      team: "/team",
      "spot-leader": "/spot-leader",
      admin: "/admin",
    };
    return <Navigate to={dashMap[session.role]} replace />;
  }

  return <>{children}</>;
}
