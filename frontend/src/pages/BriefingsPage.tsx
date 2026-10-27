import { PlaceholderPage } from '../components/PlaceholderPage'

export function BriefingsPage() {
  return (
    <PlaceholderPage
      title="AI Briefings"
      description="Evidence-grounded news briefings generated from stored articles."
      comingSoon={[
        'Briefing generation grounded in cited articles',
        'Configurable time ranges and topics',
        'Every claim traceable back to its sources',
      ]}
    />
  )
}
