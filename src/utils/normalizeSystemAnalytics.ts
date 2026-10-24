export interface NormalizedSystemAnalytics {
  uptimeSeconds?: number
  responseTimeMs?: number
  errorRatePercent?: number
}

export function normalizeSystemAnalytics(raw: unknown): NormalizedSystemAnalytics {
  const root = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const systemMetrics =
    (root.systemMetrics && typeof root.systemMetrics === 'object' ? root.systemMetrics : root) as Record<
      string,
      unknown
    >
  const server =
    systemMetrics.server && typeof systemMetrics.server === 'object'
      ? (systemMetrics.server as Record<string, unknown>)
      : undefined
  const api =
    systemMetrics.api && typeof systemMetrics.api === 'object'
      ? (systemMetrics.api as Record<string, unknown>)
      : undefined

  const uptimeSeconds =
    typeof server?.uptime === 'number'
      ? server.uptime
      : typeof root.uptime === 'number'
        ? root.uptime
        : undefined

  const responseTimeMs = typeof api?.responseTime === 'number' ? api.responseTime : undefined
  const errorRatePercent = typeof api?.errorRate === 'number' ? api.errorRate : undefined

  return { uptimeSeconds, responseTimeMs, errorRatePercent }
}

export function formatUptimeSeconds(seconds: number | undefined): string {
  if (seconds === undefined || seconds < 0) {
    return '—'
  }
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) {
    return `${days}d ${hours}h`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
