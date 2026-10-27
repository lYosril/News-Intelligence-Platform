import { PlaceholderPage } from '../components/PlaceholderPage'

export function TopicsPage() {
  return (
    <PlaceholderPage
      title="Topics"
      description="Discovered and clustered news topics with their evolution over time."
      comingSoon={[
        'Automatic topic discovery across ingested articles',
        'Topic timelines and related-article grouping',
        'Frequency forecasting for emerging topics',
      ]}
    />
  )
}
