export type DriverCountLabel = 'Registered drivers' | 'In selected period'

export interface NormalizedDriverAnalytics {
  totalDrivers: number
  activeDrivers: number
  verifiedDrivers: number
  averageRating: number | null
  countLabel: DriverCountLabel
}

function readNumber(source: Record<string, unknown> | undefined, ...keys: string[]): number | undefined {
  if (!source) return undefined
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value
    }
  }
  return undefined
}

/**
 * Normalizes driver analytics API payloads (flat, nested metrics, or snake_case).
 */
export function normalizeDriverAnalytics(raw: unknown): NormalizedDriverAnalytics {
  const root = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const metrics =
    (root.metrics && typeof root.metrics === 'object' ? root.metrics : null) ??
    (root.drivers && typeof root.drivers === 'object' ? root.drivers : null) ??
    root

  const metricsObj = metrics as Record<string, unknown>

  const periodCount = readNumber(
    metricsObj,
    'driversInPeriod',
    'newDrivers',
    'registeredInPeriod',
    'driversRegistered',
  )
  const fleetCount = readNumber(
    metricsObj,
    'totalDrivers',
    'total',
    'registeredDrivers',
    'fleetTotal',
    'allTimeTotal',
  )

  let totalDrivers = 0
  let countLabel: DriverCountLabel = 'In selected period'

  if (fleetCount !== undefined && periodCount === undefined) {
    totalDrivers = fleetCount
    countLabel = 'Registered drivers'
  } else if (periodCount !== undefined && fleetCount === undefined) {
    totalDrivers = periodCount
    countLabel = 'In selected period'
  } else if (fleetCount !== undefined) {
    totalDrivers = fleetCount
    countLabel =
      typeof root.scope === 'string' && root.scope === 'period' ? 'In selected period' : 'Registered drivers'
  }

  const scopeField = root.scope ?? metricsObj.scope
  if (scopeField === 'period' || scopeField === 'dateRange') {
    countLabel = 'In selected period'
    if (periodCount !== undefined) {
      totalDrivers = periodCount
    }
  } else if (scopeField === 'fleet' || scopeField === 'allTime') {
    countLabel = 'Registered drivers'
    if (fleetCount !== undefined) {
      totalDrivers = fleetCount
    }
  }

  const activeDrivers = readNumber(metricsObj, 'activeDrivers', 'active') ?? 0
  const verifiedDrivers = readNumber(metricsObj, 'verifiedDrivers', 'verified') ?? 0
  const averageRating = readNumber(metricsObj, 'averageRating', 'avgRating') ?? null

  return {
    totalDrivers,
    activeDrivers,
    verifiedDrivers,
    averageRating,
    countLabel,
  }
}
