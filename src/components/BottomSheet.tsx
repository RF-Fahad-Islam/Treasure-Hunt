import { type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoint?: string;
}

export function BottomSheet({ open, onClose, children, snapPoint = "85%" }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-end bg-black/50 backdrop-blur-sm touch-press"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 200 }}
            dragElastic={{ top: 0.05, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full overflow-hidden rounded-t-[28px] border-t border-black/5 shadow-2xl dark:border-white/10"
            style={{
              height: snapPoint,
              background: "var(--surface)",
              maxHeight: "95vh",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div
                className="h-1 w-10 rounded-full"
                style={{ background: "var(--border-strong)" }}
              />
            </div>

            <div className="h-full overflow-y-auto px-5 pb-8" style={{ overscrollBehavior: "contain" }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
