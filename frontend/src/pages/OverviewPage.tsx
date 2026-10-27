import { PageHeader } from '../components/PageHeader'
import { KpiCard } from '../features/overview/KpiCard'
import { PlaceholderChart } from '../features/overview/PlaceholderChart'
import { SystemStatusCard } from '../features/overview/SystemStatusCard'

const KPIS = [
  {
    label: 'Articles ingested',
    footnote: 'Populated once ingestion ships (Milestone 2).',
  },
  {
    label: 'Active sources',
    footnote: 'RSS feeds and news APIs connect in Milestone 2.',
  },
  {
    label: 'Trending topics',
    footnote: 'Topic discovery runs after articles are stored.',
  },
  {
    label: 'Briefings generated',
    footnote: 'Evidence-grounded briefings arrive in a later milestone.',
  },
]

/** Overview: live system status + clearly labelled metric placeholders. */
export function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="Foundation build: the system status panel is live, while every metric and chart below is a labelled placeholder with no data behind it."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} footnote={kpi.footnote} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <SystemStatusCard className="lg:col-span-1" />
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <PlaceholderChart
            title="Article volume"
            hint="No articles have been ingested yet."
          />
          <PlaceholderChart
            title="Topic momentum"
            hint="Topics appear once NLP analysis runs."
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <PlaceholderChart
          title="Sentiment over time"
          hint="Sentiment analysis is not implemented yet."
        />
        <PlaceholderChart
          title="Entity mentions"
          hint="Entity extraction arrives in a later milestone."
        />
      </div>
    </>
  )
}
