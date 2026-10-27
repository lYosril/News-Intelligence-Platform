/** Format a uptime value (seconds) as a compact human string. */
export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${Math.floor(seconds % 60)}s`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

/** Format a latency in milliseconds, tolerating null. */
export function formatLatency(ms: number | null): string {
  if (ms === null) return '—'
  return ms < 1 ? '<1 ms' : `${ms} ms`
}

/** Format a Date as a local wall-clock time (HH:MM:SS). */
export function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour12: false })
}
