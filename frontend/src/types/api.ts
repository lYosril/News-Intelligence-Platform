/** Shared API payload types (mirror of the Django responses). */

export interface ServiceCheck {
  status: 'ok' | 'unavailable'
  latency_ms: number | null
}

/** GET /api/v1/health/ - liveness probe. */
export interface HealthResponse {
  status: 'ok'
  service: string
  version: string
  api_version: string
  timestamp: string
  uptime_seconds: number
}

/** GET /api/v1/health/ready/ - dependency readiness. */
export interface ReadinessResponse {
  status: 'ready' | 'degraded' | 'unavailable'
  version: string
  timestamp: string
  checks: {
    database: ServiceCheck
    redis: ServiceCheck
  }
}

/** GET /api/v1/ - API metadata. */
export interface ApiRootResponse {
  name: string
  description: string
  version: string
  api_version: string
  environment: string
  endpoints: Record<string, string>
  timestamp: string
}
