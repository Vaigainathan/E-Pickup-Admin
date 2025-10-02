/**
 * CSRF Token Utility
 * Provides CSRF protection for forms
 */

// Generate a random CSRF token
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Store CSRF token in session storage
export const storeCSRFToken = (token: string): void => {
  sessionStorage.setItem('csrf_token', token)
}

// Get CSRF token from session storage
export const getCSRFToken = (): string | null => {
  return sessionStorage.getItem('csrf_token')
}

// Validate CSRF token
export const validateCSRFToken = (token: string): boolean => {
  const storedToken = getCSRFToken()
  return storedToken === token
}

// Clear CSRF token
export const clearCSRFToken = (): void => {
  sessionStorage.removeItem('csrf_token')
}
