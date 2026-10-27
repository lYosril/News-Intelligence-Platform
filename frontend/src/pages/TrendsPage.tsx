import { PlaceholderPage } from '../components/PlaceholderPage'

export function TrendsPage() {
  return (
    <PlaceholderPage
      title="Trends"
      description="Emerging-story detection and topic frequency forecasting."
      comingSoon={[
        'Emerging trend detection from publication velocity',
        'Forecasting of topic frequency over time',
        'Comparison windows (24h, 7d, 30d)',
      ]}
    />
  )
}
