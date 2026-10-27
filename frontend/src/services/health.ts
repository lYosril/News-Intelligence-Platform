import { apiGet, type ApiGetOptions } from './apiClient'
import type {
  ApiRootResponse,
  HealthResponse,
  ReadinessResponse,
} from '../types/api'

/** GET /api/v1/health/ - liveness (must stay 200 while the process runs). */
export function fetchHealth(options?: ApiGetOptions): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/api/v1/health/', options)
}

/**
 * GET /api/v1/health/ready/ - dependency readiness.
 * 503 is a valid answer here (database down) and carries a useful body.
 */
export function fetchReadiness(
  options?: ApiGetOptions,
): Promise<ReadinessResponse> {
  return apiGet<ReadinessResponse>('/api/v1/health/ready/', {
    ...options,
    expectedStatuses: [200, 503],
  })
}

/** GET /api/v1/ - API metadata. */
export function fetchApiRoot(options?: ApiGetOptions): Promise<ApiRootResponse> {
  return apiGet<ApiRootResponse>('/api/v1/', options)
}
