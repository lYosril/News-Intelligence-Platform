import { RefreshCw } from 'lucide-react'
import { useHealth } from '../../features/health/context'
import { cn } from '../../lib/cn'
import { formatClock } from '../../lib/format'

const STATUS_PRESENTATION = {
  checking: { dot: 'bg-slate-400', label: 'Checking backend…' },
  online: { dot: 'bg-emerald-400', label: 'Backend online' },
  offline: { dot: 'bg-rose-400', label: 'Backend offline' },
} as const

/** Top-bar indicator driven by the real /api/v1/health/ request. */
export function ConnectionIndicator() {
  const { status, lastCheckedAt, error, refresh } = useHealth()
  const presentation = STATUS_PRESENTATION[status]

  const title =
    error ??
    (lastCheckedAt
      ? `Last checked at ${formatClock(lastCheckedAt)}`
      : 'Waiting for the first health check…')

  return (
    <div className="flex items-center gap-1.5">
      <span
        role="status"
        title={title}
        className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300"
      >
        <span
          className={cn('size-2 rounded-full', presentation.dot)}
          aria-hidden
        />
        <span className="hidden sm:inline">{presentation.label}</span>
        <span className="sr-only sm:hidden">{presentation.label}</span>
      </span>
      <button
        type="button"
        onClick={() => void refresh()}
        aria-label="Refresh backend status"
        title="Refresh backend status"
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
      >
        <RefreshCw
          className={cn('size-4', status === 'checking' && 'animate-spin')}
          aria-hidden
        />
      </button>
    </div>
  )
}
