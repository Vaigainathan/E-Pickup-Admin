export type AnalyticsTimeRangeKey = '7d' | '30d' | '90d'

export function deriveTimeRangeKey(startIso: string, endIso: string): AnalyticsTimeRangeKey {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime()
  const days = ms / (24 * 60 * 60 * 1000)
  if (days <= 8) return '7d'
  if (days <= 35) return '30d'
  return '90d'
}
