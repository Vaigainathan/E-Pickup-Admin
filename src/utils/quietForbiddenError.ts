import { ApiRequestError } from '../services/apiService'

/** Support must not see error banners for forbidden money/admin endpoints. */
export function isQuietForbiddenError(err: unknown, role: string | undefined | null): boolean {
  if (role === 'support' && err instanceof ApiRequestError && err.status === 403) {
    return true
  }
  return false
}

export function isQuietForbiddenResponse(
  role: string | undefined | null,
  errorCode?: string,
  status?: number,
): boolean {
  if (role !== 'support') return false
  if (status === 403) return true
  if (errorCode === 'FORBIDDEN') return true
  return false
}
