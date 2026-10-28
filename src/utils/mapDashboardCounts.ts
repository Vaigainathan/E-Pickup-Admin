/** Matches GET /api/admin/dashboard/counts `data` (B-ADMIN-1). */
export interface DashboardCountsData {
  drivers?: { total?: number; online?: number; verified?: number }
  customers?: { total?: number }
  bookings?: { total?: number; active?: number; today?: number }
  shops?: { total?: number; approved?: number; pending?: number }
  marketplaceOrders?: { today?: number; active?: number }
}

/** Only fields with an exact API counterpart — used to override matching metric cards. */
export interface DashboardCountOverrides {
  driversTotal?: number
  driversVerified?: number
  customersTotal?: number
  bookingsActive?: number
}

export function mapDashboardCounts(data: DashboardCountsData): DashboardCountOverrides {
  const overrides: DashboardCountOverrides = {}
  if (typeof data.drivers?.total === 'number') overrides.driversTotal = data.drivers.total
  if (typeof data.drivers?.verified === 'number') overrides.driversVerified = data.drivers.verified
  if (typeof data.customers?.total === 'number') overrides.customersTotal = data.customers.total
  if (typeof data.bookings?.active === 'number') overrides.bookingsActive = data.bookings.active
  return overrides
}
