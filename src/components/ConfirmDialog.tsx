import { motion, AnimatePresence } from "motion/react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="w-full max-w-sm rounded-3xl p-6"
            style={{ background: "var(--surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 text-center text-4xl">
              {destructive ? "⚠️" : "❓"}
            </div>
            <h2 className="mb-2 text-center text-[18px] font-extrabold" style={{ color: "var(--fg)" }}>
              {title}
            </h2>
            <p className="mb-6 text-center text-[14px] font-semibold leading-relaxed" style={{ color: "var(--fg-muted)" }}>
              {message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="btn-press ripple flex-1 rounded-2xl py-3 text-[13px] font-extrabold uppercase tracking-wide"
                style={{
                  background: "var(--border-soft)",
                  color: "var(--fg-muted)",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="btn-press ripple flex-1 rounded-2xl py-3 text-[13px] font-extrabold uppercase tracking-wide text-white"
                style={{
                  background: destructive ? "var(--color-brand-red)" : "var(--color-brand-green)",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? "⏳" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
