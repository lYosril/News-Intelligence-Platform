import { Menu, Radar } from 'lucide-react'
import { ConnectionIndicator } from './ConnectionIndicator'

interface TopbarProps {
  navOpen: boolean
  onMenuClick: () => void
}

/** Application branding + backend connection indicator. */
export function Topbar({ navOpen, onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-expanded={navOpen}
        aria-controls="app-sidebar"
        aria-label="Toggle navigation menu"
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-sky-600 text-slate-950"
          aria-hidden
        >
          <Radar className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-slate-100">
            News Intelligence
          </p>
          <p className="hidden truncate text-[11px] text-slate-500 sm:block">
            Platform · foundation build
          </p>
        </div>
      </div>

      <div className="ml-auto">
        <ConnectionIndicator />
      </div>
    </header>
  )
}
