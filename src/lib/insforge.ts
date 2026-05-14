import { createClient } from "@supabase/supabase-js";

/**
 * InsForge is Supabase-compatible — use @supabase/supabase-js directly.
 *
 * Credentials come from .env.local (never committed).
 * Vite exposes VITE_* vars to the client bundle at build time.
 */
const url = import.meta.env.VITE_INSFORGE_URL as string;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string;

if (!url || !anonKey) {
  throw new Error(
    "Missing InsForge credentials. Check .env.local for VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY."
  );
}

export const insforge = createClient(url, anonKey, {
  auth: {
    // We manage sessions manually (no Supabase Auth for teams/leaders)
    persistSession: false,
    autoRefreshToken: false,
  },
});
