import { PlaceholderPage } from '../components/PlaceholderPage'

export function KnowledgeGraphPage() {
  return (
    <PlaceholderPage
      title="Knowledge Graph"
      description="Relationships between entities, topics and articles as an explorable graph."
      comingSoon={[
        'Graph construction from co-occurrences and relations',
        'Interactive exploration of connected entities',
        'Path finding between stories and actors',
      ]}
    />
  )
}
