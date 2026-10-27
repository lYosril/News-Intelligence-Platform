import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  children?: ReactNode
}

/** Neutral empty state for screens without data yet. */
export function EmptyState({
  title,
  description,
  icon,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center">
      {icon && (
        <div className="mb-3 text-slate-500" aria-hidden>
          {icon}
        </div>
      )}
      <h2 className="text-base font-semibold text-slate-200">{title}</h2>
      {description && (
        <p className="mt-2 max-w-xl text-sm text-slate-400">{description}</p>
      )}
      {children && <div className="mt-5 w-full">{children}</div>}
    </div>
  )
}
