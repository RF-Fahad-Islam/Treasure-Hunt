import { Router } from "@/routes/Router";

/**
 * App root — delegates to Router.
 * All page content lives in src/pages/.
 * All route definitions live in src/routes/Router.tsx.
 */
export default function App() {
  return <Router />;
}
