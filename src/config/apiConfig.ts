const normalizeUrl = (url: string): string => url.trim().replace(/\/+$/, '')

const rawApiBaseUrl = (import.meta.env.VITE_API_URL || '').trim()

if (!rawApiBaseUrl) {
  throw new Error(
    'VITE_API_URL is required. Set it to your Railway backend public URL (for example: https://<service>.up.railway.app).'
  )
}

export const API_BASE_URL = normalizeUrl(rawApiBaseUrl)

const rawSocketUrl = (import.meta.env.VITE_SOCKET_URL || rawApiBaseUrl).trim()
export const SOCKET_BASE_URL = normalizeUrl(rawSocketUrl)
