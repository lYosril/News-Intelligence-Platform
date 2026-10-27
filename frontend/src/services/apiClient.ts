/**
 * Small typed fetch wrapper for the Django API.
 *
 * The base URL comes from `VITE_API_BASE_URL` (see frontend/.env.example).
 * When it is empty the client calls the same origin the page was served from.
 * Failures are translated into `ApiError` with a message that is safe to
 * show to users: no stack traces, no internal details.
 */

const configuredBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(
  /\/+$/,
  '',
)

/** Base URL used to build request URLs (may be '' for same-origin calls). */
export const API_BASE_URL = configuredBase

/** Human-readable API location for error messages. */
export const API_DISPLAY_URL =
  configuredBase || (typeof window !== 'undefined' ? window.location.origin : '')

export class ApiError extends Error {
  readonly status?: number
  readonly body?: unknown

  constructor(
    message: string,
    options: { status?: number; body?: unknown; cause?: unknown } = {},
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined)
    this.name = 'ApiError'
    this.status = options.status
    this.body = options.body
  }
}

export interface ApiGetOptions {
  /** External abort signal (component unmount, superseded request). */
  signal?: AbortSignal
  /** Per-request timeout in milliseconds (default 8000). */
  timeoutMs?: number
  /** HTTP statuses treated as success (default [200]). */
  expectedStatuses?: number[]
}

/**
 * Perform a GET request and parse the JSON response.
 *
 * @throws {ApiError} on network failure, timeout, unexpected status or
 *   non-JSON payload. The message is user-presentable.
 */
export async function apiGet<T>(
  path: string,
  options: ApiGetOptions = {},
): Promise<T> {
  const { signal, timeoutMs = 8000, expectedStatuses = [200] } = options
  const controller = new AbortController()
  const timer = window.setTimeout(
    () => controller.abort(new DOMException('timeout', 'TimeoutError')),
    timeoutMs,
  )
  const onExternalAbort = () => controller.abort(signal?.reason)
  signal?.addEventListener('abort', onExternalAbort, { once: true })

  const url = `${API_BASE_URL}${path}`

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    const text = await response.text()
    let payload: unknown = null
    if (text.length > 0) {
      try {
        payload = JSON.parse(text)
      } catch {
        payload = null
      }
    }

    if (!expectedStatuses.includes(response.status)) {
      throw new ApiError(
        `The backend responded with status ${response.status}.`,
        { status: response.status, body: payload },
      )
    }
    if (payload === null) {
      throw new ApiError('The backend returned an unreadable response.', {
        status: response.status,
      })
    }
    return payload as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (signal?.aborted) {
      throw new ApiError('The request was cancelled.', { cause: error })
    }
    if (controller.signal.aborted) {
      throw new ApiError(
        `The backend did not answer within ${Math.round(timeoutMs / 1000)}s (${API_DISPLAY_URL}).`,
        { cause: error },
      )
    }
    throw new ApiError(
      `Could not reach the backend at ${API_DISPLAY_URL}.`,
      { cause: error },
    )
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener('abort', onExternalAbort)
  }
}
