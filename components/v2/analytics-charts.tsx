"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"

const INK = "#0a0a0a"
const MUTED = "#00a7b8"
const POS = "#008f9d"
const NEG = "#d92352"

const axis = { fontSize: 11, fill: "#52525b" }
const tooltipStyle = {
  fontSize: 12,
  borderRadius: 6,
  border: "1.5px solid #0a0a0a",
  boxShadow: "3px 3px 0 rgba(10,10,10,.12)",
}

export function TopPerformersChart({
  data,
}: {
  data: { symbol: string; value: number; name: string }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e4e4e7" />
        <XAxis
          type="number"
          tick={axis}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v.toFixed(0)}%`}
        />
        <YAxis
          type="category"
          dataKey="symbol"
          width={64}
          tick={{ ...axis, fontFamily: "ui-monospace, monospace" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "#00e5ff", fillOpacity: 0.18 }}
          contentStyle={tooltipStyle}
          formatter={(v: number) => [`${v.toFixed(2)}%`, "Annualised return"]}
          labelFormatter={(label: string) => {
            const row = data.find((d) => d.symbol === label)
            return row ? `${row.symbol}, ${row.name}` : label
          }}
        />
        <Bar dataKey="value" radius={[0, 3, 3, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.value >= 0 ? POS : NEG} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CategoryPerformanceChart({
  data,
}: {
  data: { category: string; ret3y: number; ret5y: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e4e4e7" />
        <XAxis
          type="number"
          tick={axis}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v.toFixed(0)}%`}
        />
        <YAxis
          type="category"
          dataKey="category"
          width={165}
          tick={axis}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "#00e5ff", fillOpacity: 0.18 }}
          contentStyle={tooltipStyle}
          formatter={(v: number, n: string) => [
            `${v.toFixed(2)}%`,
            n === "ret3y" ? "Median 3Y" : "Median 5Y",
          ]}
        />
        <Bar dataKey="ret3y" fill="#ff3366" radius={[0, 2, 2, 0]} />
        <Bar dataKey="ret5y" fill={MUTED} radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ConsistencyScatter({
  data,
}: {
  data: { symbol: string; name: string; x: number; y: number; aum: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={420}>
      <ScatterChart margin={{ left: 8, right: 16, top: 8, bottom: 16 }}>
        <CartesianGrid stroke="#e4e4e7" />
        <XAxis
          type="number"
          dataKey="x"
          name="5Y"
          tick={axis}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v.toFixed(0)}%`}
          label={{ value: "5-year annualised return", position: "insideBottom", offset: -8, style: axis }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="3Y"
          tick={axis}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v.toFixed(0)}%`}
          label={{ value: "3-year", angle: -90, position: "insideLeft", style: axis }}
        />
        <ZAxis type="number" dataKey="aum" range={[20, 320]} />
        {/* Points on this line performed identically over both horizons. */}
        <ReferenceLine
          segment={[
            { x: -40, y: -40 },
            { x: 60, y: 60 },
          ]}
          stroke="#71717a"
          strokeDasharray="4 4"
        />
        <ReferenceLine x={0} stroke="#d4d4d8" />
        <ReferenceLine y={0} stroke="#d4d4d8" />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={tooltipStyle}
          formatter={(v: number, n: string) =>
            n === "aum" ? [`$${(v / 1e9).toFixed(2)}B`, "Assets"] : [`${v.toFixed(2)}%`, n]
          }
          labelFormatter={() => ""}
          content={({ payload }) => {
            const p = payload?.[0]?.payload as
              | { symbol: string; name: string; x: number; y: number; aum: number }
              | undefined
            if (!p) return null
            return (
              <div style={tooltipStyle} className="bg-white px-3 py-2">
                <div className="font-mono text-xs font-medium">{p.symbol}</div>
                <div className="max-w-[220px] text-xs text-slate-600">{p.name}</div>
                <div className="mt-1 text-xs tabular-nums">
                  3Y {p.y.toFixed(2)}% · 5Y {p.x.toFixed(2)}%
                </div>
                <div className="text-xs tabular-nums text-slate-500">
                  ${(p.aum / 1e9).toFixed(2)}B assets
                </div>
              </div>
            )
          }}
        />
        <Scatter data={data} fill={INK} fillOpacity={0.35} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
