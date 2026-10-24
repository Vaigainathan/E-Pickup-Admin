const MENU_ROUTES: { path: string; title: string }[] = [
  { path: '/dashboard', title: 'Dashboard' },
  { path: '/drivers', title: 'Driver Management' },
  { path: '/customers', title: 'Customer Management' },
  { path: '/bookings', title: 'Booking Management' },
  { path: '/live-tracking', title: 'Live Tracking' },
  { path: '/emergency', title: 'Emergency Services' },
  { path: '/support', title: 'Support Tickets' },
  { path: '/monitoring', title: 'System Monitoring' },
  { path: '/marketplace/shops', title: 'Shops' },
  { path: '/marketplace/orders', title: 'Orders' },
  { path: '/marketplace/help', title: 'Help' },
  { path: '/revenue', title: 'Revenue' },
  { path: '/analytics', title: 'Analytics' },
  { path: '/admin-management', title: 'Admin Management' },
  { path: '/settings', title: 'Settings' },
]

const DETAIL_ROUTES: { pattern: RegExp; title: string }[] = [
  { pattern: /^\/marketplace\/shops\/[^/]+$/, title: 'Shops' },
  { pattern: /^\/marketplace\/orders\/[^/]+$/, title: 'Orders' },
  { pattern: /^\/customers\/[^/]+$/, title: 'Customer Management' },
]

/**
 * Resolves AppBar title: detail routes first, then longest matching menu prefix.
 */
export function getPageTitle(pathname: string): string {
  for (const { pattern, title } of DETAIL_ROUTES) {
    if (pattern.test(pathname)) {
      return title
    }
  }

  const sorted = [...MENU_ROUTES].sort((a, b) => b.path.length - a.path.length)
  for (const { path, title } of sorted) {
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      return title
    }
  }

  return 'Dashboard'
}
