export type AdminRole = 'super_admin' | 'support'

export const SUPER_ADMIN_ROUTES = [
  '/admin-management',
  '/settings',
  '/analytics',
] as const

export function isSuperAdmin(role: AdminRole | string | undefined | null): boolean {
  return role === 'super_admin'
}

export function canAccessRoute(role: AdminRole | string | undefined | null, path: string): boolean {
  if (!role) return false
  if (isSuperAdmin(role)) return true
  return !SUPER_ADMIN_ROUTES.some((r) => path === r || path.startsWith(`${r}/`))
}

export const ACCESS_DENIED_MESSAGE =
  "You don't have access to this page. Contact a super admin if you need access."
