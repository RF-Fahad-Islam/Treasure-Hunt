import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  active: boolean;
}

const COLORS = [
  "var(--color-brand-green)",
  "var(--color-brand-gold)",
  "var(--color-brand-blue)",
  "var(--color-brand-red)",
  "#a855f7",
  "#f97316",
];

interface Piece {
  id: number;
  x: number;
  color: string;
  rotation: number;
  delay: number;
  size: number;
}

export function Confetti({ active }: Props) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) return;
    const arr: Piece[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      delay: Math.random() * 0.3,
      size: 6 + Math.random() * 8,
    }));
    setPieces(arr);
    const timer = setTimeout(() => setPieces([]), 4000);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
          {pieces.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: -20, x: `${p.x}vw`, rotate: 0 }}
              animate={{
                opacity: [1, 1, 0],
                y: ["0vh", "100vh"],
                rotate: p.rotation * 3,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2.5,
                delay: p.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute rounded-sm"
              style={{
                width: p.size,
                height: p.size * 0.6,
                background: p.color,
                left: 0,
                top: 0,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
