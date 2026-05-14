import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSession } from "@/types";

/* ─── Store shape ─────────────────────────────────────────────── */

interface AuthState {
  session: AppSession | null;
  isLoading: boolean;
  error: string | null;

  setSession: (session: AppSession) => void;
  clearSession: () => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
}

/* ─── Zustand store with localStorage persistence ─────────────── */

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      isLoading: false,
      error: null,

      setSession: (session) => set({ session, error: null }),
      clearSession: () => set({ session: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: "th-auth-session", // localStorage key
      // Only persist the session, not transient state
      partialize: (state) => ({ session: state.session }),
    }
  )
);

/* ─── Convenience selector hooks ─────────────────────────────── */

export const useSession = () => useAuthStore((s) => s.session);
export const useIsLoggedIn = () => useAuthStore((s) => s.session !== null);
export const useRole = () => useAuthStore((s) => s.session?.role ?? null);
