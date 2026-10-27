import { Badge } from '../../components/ui/Badge'

interface KpiCardProps {
  label: string
  footnote: string
  /** Always '—' until real metrics exist; never a fabricated number. */
  value?: string
}

/** Placeholder KPI tile - explicitly labelled, never invents numbers. */
export function KpiCard({ label, footnote, value = '—' }: KpiCardProps) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-400">{label}</h3>
        <Badge tone="amber">Placeholder</Badge>
      </div>
      <p
        className="mt-3 text-3xl font-semibold tracking-tight text-slate-100"
        aria-label={`${label}: no data yet`}
      >
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{footnote}</p>
    </article>
  )
}
