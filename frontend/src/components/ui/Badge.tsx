import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone = 'slate' | 'cyan' | 'amber' | 'emerald' | 'rose'

const TONES: Record<BadgeTone, string> = {
  slate: 'border-slate-700 bg-slate-800/80 text-slate-300',
  cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  rose: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
}

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}

/** Small status/label chip. */
export function Badge({ tone = 'slate', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
