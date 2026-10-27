import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  children: ReactNode
}

const VARIANTS: Record<string, string> = {
  primary:
    'bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400 disabled:hover:bg-cyan-500',
  secondary:
    'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:hover:bg-slate-800',
  ghost:
    'text-slate-400 hover:bg-slate-800 hover:text-slate-100 disabled:hover:bg-transparent',
}

const SIZES: Record<string, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
}

/** Accessible button with a consistent focus ring (from global styles). */
export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg transition-colors disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
