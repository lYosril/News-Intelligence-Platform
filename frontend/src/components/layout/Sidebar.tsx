import { NavLink } from 'react-router-dom'
import {
  Boxes,
  LayoutDashboard,
  Network,
  Newspaper,
  Sparkles,
  Tags,
  TrendingUp,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

/** Primary navigation - matches the routes in src/app/router.tsx. */
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/news-feed', label: 'News Feed', icon: Newspaper },
  { to: '/topics', label: 'Topics', icon: Tags },
  { to: '/entities', label: 'Entities', icon: Boxes },
  { to: '/trends', label: 'Trends', icon: TrendingUp },
  { to: '/knowledge-graph', label: 'Knowledge Graph', icon: Network },
  { to: '/briefings', label: 'AI Briefings', icon: Sparkles },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

/** Fixed sidebar: always visible on large screens, a drawer below. */
export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        id="app-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-800 bg-slate-950 transition-transform duration-200 ease-out lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4 lg:hidden">
            <span className="text-sm font-semibold text-slate-200">
              Navigation
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto p-3">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100',
                  )
                }
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
            Milestone 1 · Foundation build
          </div>
        </div>
      </aside>
    </>
  )
}
