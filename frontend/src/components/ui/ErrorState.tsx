import { WifiOff } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  /** User-presentable failure description (no stack traces). */
  message: string
  title?: string
  onRetry?: () => void
}

/** Inline error display with an optional retry action. */
export function ErrorState({
  message,
  title = 'Backend unreachable',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3.5"
    >
      <div className="flex gap-3">
        <WifiOff className="mt-0.5 size-5 shrink-0 text-rose-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-rose-300">{title}</h3>
          <p className="mt-1 text-sm break-words text-slate-400">{message}</p>
          {onRetry && (
            <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
              Retry now
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
