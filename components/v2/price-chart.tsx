"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function PriceTrendChart({
  data,
  positive,
}: {
  data: { date: string; close: number }[]
  positive: boolean
}) {
  const colour = positive ? "#008f9d" : "#d92352"
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
        <defs>
          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colour} stopOpacity={0.18} />
            <stop offset="100%" stopColor={colour} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          minTickGap={28}
          tickFormatter={(v: string) =>
            new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
          }
        />
        <YAxis
          domain={["dataMin - 2", "dataMax + 2"]}
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          width={52}
          tickFormatter={(v: number) => `$${v.toFixed(0)}`}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e2e8f0" }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, "Close"]}
          labelFormatter={(v: string) =>
            new Date(v).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          }
        />
        <Area type="monotone" dataKey="close" stroke={colour} strokeWidth={2} fill="url(#priceFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
