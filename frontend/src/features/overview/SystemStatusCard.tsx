import { RefreshCw } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/ErrorState'
import { Spinner } from '../../components/ui/Spinner'
import { Button } from '../../components/ui/Button'
import { useHealth } from '../health/context'
import { cn } from '../../lib/cn'
import { formatClock, formatLatency, formatUptime } from '../../lib/format'
import type { ServiceCheck } from '../../types/api'

type Tone = 'default' | 'ok' | 'bad'

const TONES: Record<Tone, string> = {
  default: 'text-slate-200',
  ok: 'text-emerald-300',
  bad: 'text-rose-300',
}

function StatusRow({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: Tone
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-800/70 py-2 last:border-0 last:pb-0">
      <dt className="shrink-0 text-slate-400">{label}</dt>
      <dd className={cn('truncate text-right font-medium', TONES[tone])}>
        {value}
      </dd>
    </div>
  )
}

function checkLabel(check: ServiceCheck | null | undefined): {
  value: string
  tone: Tone
} {
  if (!check) return { value: 'not reported', tone: 'default' }
  if (check.status === 'ok') {
    return { value: `ok · ${formatLatency(check.latency_ms)}`, tone: 'ok' }
  }
  return { value: 'unavailable', tone: 'bad' }
}

/**
 * Live system status: every value comes from real health endpoints -
 * no demonstration data.
 */
export function SystemStatusCard({ className }: { className?: string }) {
  const { status, health, readiness, apiRoot, error, lastCheckedAt, refresh } =
    useHealth()

  const database = checkLabel(readiness?.checks.database)
  const redis = checkLabel(readiness?.checks.redis)

  return (
    <Card
      title="System status"
      description="Live responses from the Django API."
      className={className}
      actions={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void refresh()}
          aria-label="Refresh system status"
        >
          <RefreshCw className="size-3.5" aria-hidden />
        </Button>
      }
    >
      {status === 'checking' && !health && (
        <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
          <Spinner label="Fetching backend status" />
          Fetching backend status…
        </div>
      )}

      {status === 'offline' && (
        <ErrorState
          message={
            error ??
            'The backend could not be reached. The rest of the interface keeps working.'
          }
          onRetry={() => void refresh()}
        />
      )}

      {health && (
        <dl className="text-sm">
          <StatusRow
            label="API"
            value={`online · ${health.service}`}
            tone="ok"
          />
          <StatusRow label="Version" value={health.version} />
          <StatusRow
            label="Environment"
            value={apiRoot?.environment ?? 'unknown'}
          />
          <StatusRow label="Uptime" value={formatUptime(health.uptime_seconds)} />
          <StatusRow label="Database" value={database.value} tone={database.tone} />
          <StatusRow label="Redis" value={redis.value} tone={redis.tone} />
          <StatusRow
            label="Last checked"
            value={lastCheckedAt ? formatClock(lastCheckedAt) : '—'}
          />
        </dl>
      )}
    </Card>
  )
}
