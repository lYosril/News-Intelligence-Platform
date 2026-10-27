import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { BriefingsPage } from '../pages/BriefingsPage'
import { EntitiesPage } from '../pages/EntitiesPage'
import { KnowledgeGraphPage } from '../pages/KnowledgeGraphPage'
import { NewsFeedPage } from '../pages/NewsFeedPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { OverviewPage } from '../pages/OverviewPage'
import { TopicsPage } from '../pages/TopicsPage'
import { TrendsPage } from '../pages/TrendsPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'news-feed', element: <NewsFeedPage /> },
      { path: 'topics', element: <TopicsPage /> },
      { path: 'entities', element: <EntitiesPage /> },
      { path: 'trends', element: <TrendsPage /> },
      { path: 'knowledge-graph', element: <KnowledgeGraphPage /> },
      { path: 'briefings', element: <BriefingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

/** Application routes. */
export function AppRouter() {
  return <RouterProvider router={router} />
}
