import type { ReactNode } from 'react'
import { HealthContext } from './context'
import { useHealthCheck } from '../../hooks/useHealthCheck'

interface HealthProviderProps {
  children: ReactNode
}

/** Provides the polled backend health state to the whole application. */
export function HealthProvider({ children }: HealthProviderProps) {
  const health = useHealthCheck(20_000)
  return (
    <HealthContext.Provider value={health}>{children}</HealthContext.Provider>
  )
}
