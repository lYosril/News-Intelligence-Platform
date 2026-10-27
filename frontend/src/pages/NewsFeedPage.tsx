import { PlaceholderPage } from '../components/PlaceholderPage'

export function NewsFeedPage() {
  return (
    <PlaceholderPage
      title="News Feed"
      description="The searchable, deduplicated article stream will live here."
      comingSoon={[
        'RSS feed and news API connectors (Milestone 2)',
        'Normalised article storage with deduplication',
        'Filtering by source, date, language and sentiment',
      ]}
    />
  )
}
