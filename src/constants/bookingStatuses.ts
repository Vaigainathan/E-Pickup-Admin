/** Keep in sync with backend COMPLETED_BOOKING_STATUSES (bookingStatuses.js). */
export const DELETABLE_BOOKING_STATUSES = ['completed', 'cancelled', 'rejected'] as const

const DELETABLE_SET = new Set<string>(DELETABLE_BOOKING_STATUSES)

export function isBookingDeletable(status: string | undefined | null): boolean {
  return DELETABLE_SET.has(status || '')
}
