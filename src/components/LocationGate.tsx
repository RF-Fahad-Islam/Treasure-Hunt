import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Position {
  lat: number;
  lng: number;
  accuracy: number | null;
}

interface Props {
  children: ReactNode;
  onLocationGranted: (pos: Position) => void;
}

type State = "requesting" | "denied" | "granted";

export function LocationGate({ children, onLocationGranted }: Props) {
  const [state, setState] = useState<State>("requesting");

  const requestLocation = () => {
    setState("requesting");
    if (!navigator.geolocation) {
      setState("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState("granted");
        onLocationGranted({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => {
        setState("denied");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <>
      {children}
      <AnimatePresence>
        {state !== "granted" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
              className="w-full max-w-sm rounded-3xl p-8 text-center"
              style={{ background: "var(--surface)" }}
            >
              {state === "requesting" && (
                <>
                  <div className="mb-4 text-5xl">📍</div>
                  <h2 className="mb-2 text-[20px] font-extrabold" style={{ color: "var(--fg)" }}>
                    Location Required
                  </h2>
                  <p className="mb-6 text-[14px] font-semibold leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                    This treasure hunt uses real-time GPS tracking. Please allow location access to continue.
                  </p>
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-3xl"
                  >
                    ⏳
                  </motion.div>
                </>
              )}
              {state === "denied" && (
                <>
                  <div className="mb-4 text-5xl">🚫</div>
                  <h2 className="mb-2 text-[20px] font-extrabold" style={{ color: "var(--color-brand-red)" }}>
                    Location Access Denied
                  </h2>
                  <p className="mb-2 text-[14px] font-semibold leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                    You must enable location services to participate in the treasure hunt.
                  </p>
                  <p className="mb-6 text-[12px] font-bold leading-relaxed" style={{ color: "var(--fg-muted)", opacity: 0.6 }}>
                    Enable location in your browser settings, then tap Retry.
                  </p>
                  <button
                    onClick={requestLocation}
                    className="btn-press ripple btn-primary w-full"
                  >
                    🔄 Retry
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
