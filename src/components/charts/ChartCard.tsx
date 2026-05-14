import { motion } from "motion/react";

interface Props {
  title: string;
  subtitle?: string;
  accent: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, accent, children, className = "" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card flex flex-col gap-4 p-5 ${className}`}
      style={{ background: "var(--surface)" }}
    >
      <div>
        <h3 className="text-[13px] font-extrabold uppercase tracking-[0.18em]" style={{ color: accent }}>
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-[12px] font-semibold" style={{ color: "var(--fg-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </motion.div>
  );
}
