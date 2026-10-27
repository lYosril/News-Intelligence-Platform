import { ArrowRight, Inbox } from 'lucide-react'
import { EmptyState } from './ui/EmptyState'
import { PageHeader } from './PageHeader'

interface PlaceholderPageProps {
  title: string
  description: string
  /** Bullet points describing what the screen will eventually show. */
  comingSoon: string[]
}

/**
 * Standard shell page for features that arrive in later milestones.
 * Deliberately shows no fabricated data.
 */
export function PlaceholderPage({
  title,
  description,
  comingSoon,
}: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={<Inbox className="size-7" />}
        title="Not implemented yet"
        description="This screen exists as part of the Milestone 1 application shell. It will render real data once the corresponding backend capability ships."
      >
        <ul className="mx-auto max-w-md space-y-2 text-left text-sm text-slate-400">
          {comingSoon.map((item) => (
            <li key={item} className="flex gap-2">
              <ArrowRight
                className="mt-0.5 size-3.5 shrink-0 text-cyan-400"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </EmptyState>
      <p className="mt-4 text-center text-xs text-slate-500">
        No mock or demonstration data is shown on this page.
      </p>
    </>
  )
}
