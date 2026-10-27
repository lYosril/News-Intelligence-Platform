import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  description?: ReactNode
  /** Rendered on the right side of the card header. */
  actions?: ReactNode
  /** Element to render (defaults to <section>). */
  as?: 'section' | 'article' | 'div'
}

/** Panel with an optional header, used across the dashboard. */
export function Card({
  title,
  description,
  actions,
  as: Tag = 'section',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-xl border border-slate-800 bg-slate-900/60 p-5',
        className,
      )}
      {...rest}
    >
      {(title || description || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </Tag>
  )
}
