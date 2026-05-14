import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSession } from "@/types";
import { validateSession, deactivateSession } from "@/services/auth";

/* ─── Store shape ─────────────────────────────────────────────── */

interface AuthState {
  session: AppSession | null;
  isLoading: boolean;
  error: string | null;

  setSession: (session: AppSession) => void;
  clearSession: () => Promise<void>;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  checkSession: () => Promise<void>;
}

/* ─── Zustand store with localStorage persistence ─────────────── */

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false,
      error: null,

      setSession: (session) => set({ session, error: null }),
      clearSession: async () => {
        const { session } = get();
        if (session && "sessionToken" in session) {
          try {
            await deactivateSession((session as any).sessionToken);
          } catch { /* ignore */ }
        }
        set({ session: null });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      checkSession: async () => {
        const { session } = get();
        if (!session || !("sessionToken" in session)) return;
        const token = (session as any).sessionToken as string;
        const valid = await validateSession(token);
        if (!valid) {
          set({ session: null });
        }
      },
    }),
    {
      name: "th-auth-session",
      partialize: (state) => ({ session: state.session }),
    }
  )
);

/* ─── Convenience selector hooks ─────────────────────────────── */

export const useSession = () => useAuthStore((s) => s.session);
export const useIsLoggedIn = () => useAuthStore((s) => s.session !== null);
export const useRole = () => useAuthStore((s) => s.session?.role ?? null);