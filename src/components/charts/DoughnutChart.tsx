import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { ChartCard } from "./ChartCard";

ChartJS.register(ArcElement, Tooltip);

interface Datum {
  label: string;
  value: number;
  color: string;
}

interface Props {
  title: string;
  subtitle?: string;
  accent: string;
  data: Datum[];
  size?: number;
  formatValue?: (v: number) => string;
}

export function DoughnutChart({
  title,
  subtitle,
  accent,
  data,
  size = 180,
  formatValue,
}: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <ChartCard title={title} subtitle={subtitle} accent={accent}>
        <p className="pt-6 text-center text-[13px] font-semibold" style={{ color: "var(--fg-muted)" }}>
          No data yet.
        </p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={title} subtitle={subtitle} accent={accent}>
      <div className="flex items-center gap-6">
        <div className="shrink-0" style={{ width: size, height: size }}>
          <Doughnut
            data={{
              labels: data.map((d) => d.label),
              datasets: [
                {
                  data: data.map((d) => d.value),
                  backgroundColor: data.map((d) => d.color),
                  borderWidth: 0,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              cutout: "60%",
              plugins: {
                tooltip: {
                  backgroundColor: "var(--surface)",
                  titleColor: "var(--fg)",
                  bodyColor: "var(--fg-muted)",
                  borderColor: "var(--border-soft)",
                  borderWidth: 1,
                  cornerRadius: 12,
                  padding: 10,
                  callbacks: {
                    label: (ctx) => {
                      const val = ctx.parsed as number;
                      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
                      return `${ctx.label}: ${formatValue ? formatValue(val) : val} (${pct}%)`;
                    },
                  },
                },
              },
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.color }}
              />
              <span className="text-[12px] font-semibold" style={{ color: "var(--fg-muted)" }}>
                {d.label}
              </span>
              <span className="ml-auto text-[13px] font-extrabold tabular-nums" style={{ color: "var(--fg)" }}>
                {formatValue ? formatValue(d.value) : d.value}
              </span>
            </div>
          ))}
          <div className="mt-1 flex items-center gap-2 border-t pt-2" style={{ borderColor: "var(--border-soft)" }}>
            <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
              Total
            </span>
            <span className="ml-auto text-[15px] font-extrabold tabular-nums" style={{ color: accent }}>
              {formatValue ? formatValue(total) : total}
            </span>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
