export function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="surface-card relative min-w-0 p-4 sm:p-5">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
        {value}
      </div>
      {note && <div className="mt-2 text-xs leading-relaxed text-slate-500">{note}</div>}
    </div>
  )
}
