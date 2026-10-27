import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchApiRoot, fetchHealth, fetchReadiness } from '../services/health'
import type {
  ApiRootResponse,
  HealthResponse,
  ReadinessResponse,
} from '../types/api'

export type ConnectionStatus = 'checking' | 'online' | 'offline'

export interface HealthState {
  /** High-level backend connectivity as seen from the browser. */
  status: ConnectionStatus
  health: HealthResponse | null
  readiness: ReadinessResponse | null
  apiRoot: ApiRootResponse | null
  /** User-presentable failure description when status is 'offline'. */
  error: string | null
  lastCheckedAt: Date | null
}

const INITIAL_STATE: HealthState = {
  status: 'checking',
  health: null,
  readiness: null,
  apiRoot: null,
  error: null,
  lastCheckedAt: null,
}

function describeFailure(result: PromiseSettledResult<unknown>): string {
  if (result.status === 'rejected') {
    const reason: unknown = result.reason
    if (reason instanceof Error && reason.message) return reason.message
  }
  return 'The backend could not be reached.'
}

/**
 * Poll the backend health endpoints.
 *
 * One polling cycle requests liveness, readiness and API metadata in
 * parallel. A failure of the liveness request marks the connection offline
 * while the UI keeps working - the app never depends on the backend being
 * up to render.
 */
export function useHealthCheck(
  intervalMs = 20_000,
): HealthState & { refresh: () => void } {
  const [state, setState] = useState<HealthState>(INITIAL_STATE)
  const activeRef = useRef(true)
  const inFlightRef = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    const controller = new AbortController()
    try {
      const [healthResult, readinessResult, rootResult] =
        await Promise.allSettled([
          fetchHealth({ signal: controller.signal }),
          fetchReadiness({ signal: controller.signal }),
          fetchApiRoot({ signal: controller.signal }),
        ])
      if (!activeRef.current) return

      const health =
        healthResult.status === 'fulfilled' ? healthResult.value : null
      setState({
        status: health ? 'online' : 'offline',
        health,
        readiness:
          readinessResult.status === 'fulfilled' ? readinessResult.value : null,
        apiRoot: rootResult.status === 'fulfilled' ? rootResult.value : null,
        error: health ? null : describeFailure(healthResult),
        lastCheckedAt: new Date(),
      })
    } finally {
      inFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    activeRef.current = true
    void refresh()
    const timer = window.setInterval(() => {
      void refresh()
    }, intervalMs)
    return () => {
      activeRef.current = false
      window.clearInterval(timer)
    }
  }, [refresh, intervalMs])

  return { ...state, refresh }
}
