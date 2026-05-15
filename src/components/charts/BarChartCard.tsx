import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { ChartCard } from "./ChartCard";

import { resolveBrandColor } from "@/utils/colors";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface Datum {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  accent: string;
  data: Datum[];
  height?: number;
  formatValue?: (v: number) => string;
}

const FALLBACK_COLORS = [
  "var(--color-brand-blue)",
  "var(--color-brand-green)",
  "var(--color-brand-gold)",
  "var(--color-brand-red)",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
];

export function BarChartCard({
  title,
  subtitle,
  accent,
  data,
  height = 220,
  formatValue,
}: Props) {
  if (data.length === 0) {
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
      <div style={{ height }}>
        <Bar
          data={{
            labels: data.map((d) => d.label),
            datasets: [
              {
                data: data.map((d) => d.value),
                backgroundColor: data.map(
                  (d, i) => resolveBrandColor(d.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length])
                ),
                borderRadius: 8,
                borderSkipped: false,
              },
            ],
          }}
          options={{
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
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
                  label: (ctx) =>
                    formatValue ? formatValue(ctx.parsed.x as number) : `${ctx.parsed.x}`,
                },
              },
            },
            scales: {
              x: {
                display: false,
                beginAtZero: true,
              },
              y: {
                ticks: {
                  color: "var(--fg-muted)",
                  font: { size: 11, weight: "bold" },
                },
                grid: { display: false },
              },
            },
          }}
        />
      </div>
    </ChartCard>
  );
}
