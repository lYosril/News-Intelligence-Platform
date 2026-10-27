/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Django API, as seen from the browser. */
  readonly VITE_API_BASE_URL?: string
  /** Vite dev server bind address (e.g. 0.0.0.0 inside Docker). */
  readonly VITE_HOST?: string
  /** Vite dev server port. */
  readonly VITE_PORT?: string
}
