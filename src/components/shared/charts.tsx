"use client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/format";

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;
const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--popover-foreground)",
    boxShadow: "0 4px 16px rgb(0 0 0 / 0.08)",
  },
  labelStyle: { color: "var(--muted-foreground)", marginBottom: 4 },
  cursor: { fill: "var(--muted)", opacity: 0.5 },
};

export interface SeriesDef {
  key: string;
  label: string;
  color?: string;
}

export function MoneyAreaChart({ data, xKey, series, currency, height = 260 }: { data: Record<string, unknown>[]; xKey: string; series: SeriesDef[]; currency: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color ?? PALETTE[i]} stopOpacity={0.22} />
              <stop offset="100%" stopColor={s.color ?? PALETTE[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} width={64} tickFormatter={(v: number) => formatMoney(v, currency, { compact: true })} />
        <Tooltip {...tooltipStyle} formatter={(v) => formatMoney(Number(v), currency)} />
        {series.length > 1 ? <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12 }} /> : null}
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? PALETTE[i]}
            strokeWidth={2}
            animationDuration={500}
            fill={`url(#g-${s.key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({
  data,
  xKey,
  series,
  height = 240,
  money,
  stacked,
  layout = "horizontal",
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
  money?: string;
  stacked?: boolean;
  layout?: "horizontal" | "vertical";
}) {
  const fmt = (v: number) => (money ? formatMoney(v, money, { compact: true }) : String(v));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 8, right: 8, left: layout === "vertical" ? 8 : 0, bottom: 0 }}>
        <CartesianGrid vertical={layout === "vertical"} horizontal={layout === "horizontal"} stroke="var(--border)" />
        {layout === "horizontal" ? (
          <>
            <XAxis dataKey={xKey} {...axis} />
            <YAxis {...axis} width={money ? 64 : 32} tickFormatter={fmt} allowDecimals={false} />
          </>
        ) : (
          <>
            <XAxis type="number" {...axis} tickFormatter={fmt} allowDecimals={false} />
            <YAxis type="category" dataKey={xKey} {...axis} width={110} />
          </>
        )}
        <Tooltip {...tooltipStyle} formatter={(v) => (money ? formatMoney(Number(v), money) : String(v))} />
        {series.length > 1 ? <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12 }} /> : null}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color ?? PALETTE[i]}
            radius={stacked ? 0 : layout === "vertical" ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            stackId={stacked ? "a" : undefined}
            maxBarSize={36}
            animationDuration={500}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, height = 220 }: { data: { name: string; value: number; color?: string }[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none" animationDuration={500}>
              {data.map((d, i) => (
                <Cell key={d.name} fill={d.color ?? PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular">{total}</span>
          <span className="text-[11px] text-muted-foreground">total</span>
        </div>
      </div>
      <ul className="grid gap-1.5 text-[12.5px]">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: d.color ?? PALETTE[i % PALETTE.length] }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="ml-auto pl-3 font-medium tabular">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
