import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/PageHeader'

export function NotFoundPage() {
  return (
    <>
      <PageHeader
        title="Page not found"
        description="That route does not exist in this build."
      />
      <EmptyState
        title="404 - nothing to show here"
        description="Check the address, or head back to the overview."
      >
        <div className="flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
          >
            Back to overview
          </Link>
        </div>
      </EmptyState>
    </>
  )
}
