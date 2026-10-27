import { PlaceholderPage } from '../components/PlaceholderPage'

export function EntitiesPage() {
  return (
    <PlaceholderPage
      title="Entities"
      description="People, organisations, places and other entities extracted from the news."
      comingSoon={[
        'Named-entity extraction and linking',
        'Entity profiles with mention history',
        'Ranking by prominence and recent coverage',
      ]}
    />
  )
}
