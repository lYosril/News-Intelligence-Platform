import { createContext, useContext } from 'react'
import type { HealthState } from '../../hooks/useHealthCheck'

export interface HealthContextValue extends HealthState {
  refresh: () => void
}

/**
 * Shared health state so the connection indicator (top bar) and the system
 * status card (overview) report from a single polling cycle.
 */
export const HealthContext = createContext<HealthContextValue | null>(null)

export function useHealth(): HealthContextValue {
  const context = useContext(HealthContext)
  if (context === null) {
    throw new Error('useHealth() must be used inside <HealthProvider>.')
  }
  return context
}
