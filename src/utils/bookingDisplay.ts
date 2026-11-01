export const ARRIVED_UNVERIFIED_NOTE = 'arrived_unverified'

export function formatBookingStatusLabel(
  status: string,
  notes?: string | null,
): string {
  if (status === 'driver_arrived' && notes === ARRIVED_UNVERIFIED_NOTE) {
    return 'Arrived (location not verified)'
  }
  return (status || 'unknown').replace(/_/g, ' ')
}

export function lastDriverArrivedNote(
  statusUpdates?: Array<{ status: string; notes?: string | null }>,
): string | null | undefined {
  if (!statusUpdates?.length) return undefined
  for (let i = statusUpdates.length - 1; i >= 0; i -= 1) {
    const entry = statusUpdates[i]
    if (entry?.status === 'driver_arrived') {
      return entry.notes
    }
  }
  return undefined
}

export function formatBookingTimelineTime(timestamp: unknown): string {
  if (timestamp == null) return '—'
  if (typeof timestamp === 'string') {
    const d = new Date(timestamp)
    return Number.isNaN(d.getTime()) ? timestamp : d.toLocaleString()
  }
  if (typeof timestamp === 'object' && timestamp !== null && '_seconds' in timestamp) {
    const sec = (timestamp as { _seconds: number })._seconds
    return new Date(sec * 1000).toLocaleString()
  }
  return String(timestamp)
}
