import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { EnterLobbyForm } from "./EnterLobbyForm";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LobbyModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full pointer-events-auto relative max-h-[90vh] overflow-y-auto rounded-[32px] no-scrollbar"
            >
              {/* Close Button - Responsive position */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white transition-all active:scale-90"
              >
                <X size={20} />
              </button>

              {/* The Form */}
              <EnterLobbyForm />
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

