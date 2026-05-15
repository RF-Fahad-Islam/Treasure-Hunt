import { createClient } from "@insforge/sdk";

const baseUrl = import.meta.env.VITE_INSFORGE_URL as string;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string;

if (!baseUrl || !anonKey) {
  console.warn(
    "⚠️ Missing InsForge credentials. Backend features will not work. \n" +
    "Add VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY to your environment variables."
  );
}

if (!baseUrl || !anonKey) {
  console.warn("⚠️ InsForge credentials not found. Using fallback mode.");
}

export const insforge = createClient({ 
  baseUrl: baseUrl || "", 
  anonKey: anonKey || "" 
});
