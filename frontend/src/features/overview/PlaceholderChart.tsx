import { Activity } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'

interface PlaceholderChartProps {
  title: string
  hint: string
}

/** Chart frame that clearly states there is no data behind it yet. */
export function PlaceholderChart({ title, hint }: PlaceholderChartProps) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-200">{title}</h3>
        <Badge tone="slate">No data</Badge>
      </div>
      <div className="mt-4 flex min-h-36 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-800 bg-slate-950/50 px-4 py-6 text-center">
        <Activity className="size-6 text-slate-600" aria-hidden />
        <p className="text-sm text-slate-500">{hint}</p>
        <p className="text-xs text-slate-600">
          Charting activates when real data arrives.
        </p>
      </div>
    </section>
  )
}
