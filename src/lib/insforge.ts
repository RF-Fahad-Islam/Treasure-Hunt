import { createClient } from "@insforge/sdk";

const baseUrl = import.meta.env.VITE_INSFORGE_URL as string;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string;

if (!baseUrl || !anonKey) {
  throw new Error(
    "Missing InsForge credentials. Check .env.local for VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY."
  );
}

export const insforge = createClient({ baseUrl, anonKey });
