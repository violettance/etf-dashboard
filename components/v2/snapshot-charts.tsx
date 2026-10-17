"use client"

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const BAR = "#ff3366"
const BAR_MUTED = "#00a7b8"

export function CategoryMixChart({ data }: { data: { name: string; count: number }[] }) {
  if (data.length === 0) return null
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fontSize: 11, fill: "#475569" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "#00e5ff", fillOpacity: 0.18 }}
          contentStyle={{ fontSize: 12, borderRadius: 6, border: "1.5px solid #0a0a0a", boxShadow: "3px 3px 0 rgba(10,10,10,.12)" }}
          formatter={(value: number) => [`${value} funds`, ""]}
        />
        <Bar dataKey="count" radius={[0, 3, 3, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? BAR : BAR_MUTED} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function YieldHistogram({ data }: { data: { label: string; count: number }[] }) {
  if (data.every((d) => d.count === 0)) return null
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e2e8f0" }}
          formatter={(value: number) => [`${value} funds`, ""]}
        />
        <Bar dataKey="count" fill={BAR_MUTED} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
