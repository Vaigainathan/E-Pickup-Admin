import { ApiResponse } from '../types'
import { secureTokenStorage } from './secureTokenStorage'

const API_BASE_URL = import.meta.env.VITE_API_URL

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL environment variable is required')
}

class ApiService {
  private baseURL: string
  private token: string | null = null
  private refreshInterval: ReturnType<typeof setInterval> | null = null
  private isRefreshing: boolean = false
  private refreshPromise: Promise<string | null> | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    this.initializeToken()
  }

  private async initializeToken() {
    try {
      this.token = await secureTokenStorage.getToken()
      this.startTokenRefresh()
    } catch (error) {
      console.error('Failed to initialize token:', error)
    }
  }

  async setToken(token: string, isBackendToken: boolean = false) {
    this.token = token
    console.log('🔑 [API] Token set:', { 
      tokenLength: token.length, 
      isBackendToken,
      tokenPreview: token.substring(0, 20) + '...'
    })
    
    // Update secure storage if user data exists
    try {
      const user = await secureTokenStorage.getCurrentUser()
      if (user) {
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        await secureTokenStorage.setTokenData({
          token,
          expiresAt,
          user,
          isBackendToken
        })
        console.log('✅ [API] Token stored in secure storage')
      }
    } catch (error) {
      console.error('❌ [API] Failed to update token in secure storage:', error)
    }
  }

  clearToken() {
    this.token = null
    secureTokenStorage.clearTokenData()
    this.stopTokenRefresh()
  }

  private startTokenRefresh() {
    // Prevent multiple refresh intervals
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
    
    // Refresh token every 50 minutes (tokens expire in 1 hour)
    this.refreshInterval = setInterval(async () => {
      if (this.token && !this.isRefreshing) {
        try {
          await this.refreshToken()
          console.log('🔄 Token refreshed automatically')
        } catch (error) {
          console.error('❌ Automatic token refresh failed:', error)
          this.clearToken()
        }
      }
    }, 50 * 60 * 1000) // 50 minutes
  }

  private stopTokenRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }

         private async request<T>(
           endpoint: string,
           options: any = {},
           isRetry: boolean = false
         ): Promise<ApiResponse<T>> {
           const url = `${this.baseURL}${endpoint}`
           
           // Create AbortController for timeout
           const controller = new AbortController()
           const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
           
           const config: any = {
             headers: {
               'Content-Type': 'application/json',
               ...(this.token && this.token.length > 10 && { Authorization: `Bearer ${this.token}` }),
               ...options.headers,
             },
             signal: controller.signal,
             ...options,
           }
           
           // Log token status for debugging
           if (this.token) {
             console.log('🔑 [API] Making request with token:', {
               endpoint,
               tokenLength: this.token.length,
               tokenPreview: this.token.substring(0, 20) + '...'
             })
           } else {
             console.log('⚠️ [API] Making request without token:', endpoint)
           }

           try {
             const response = await fetch(url, config)
             clearTimeout(timeoutId) // Clear timeout on successful response
             
             // Check if response is ok before trying to parse JSON
             if (!response.ok) {
               // Handle token expiration more gracefully
               if (response.status === 401 && !isRetry) {
                 console.log('🔄 [API] Token expired, attempting refresh...')
                 try {
                   const newToken = await this.refreshToken()
                   if (newToken) {
                     console.log('✅ [API] Token refreshed, retrying request...')
                     // Retry the request with new token
                     return this.request<T>(endpoint, options, true)
                   } else {
                     throw new Error('Token refresh returned null')
                   }
                 } catch (refreshError) {
                   console.error('❌ [API] Token refresh failed:', refreshError)
                   // Clear invalid token
                   this.clearToken()
                   throw new Error('Authentication failed. Please login again.')
                 }
               }
               
               let errorMessage = 'Request failed'
               try {
                 const errorData = await response.json()
                 errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`
               } catch (parseError) {
                 errorMessage = `HTTP ${response.status}: ${response.statusText}`
               }
               throw new Error(errorMessage)
             }

             const data = await response.json()
             return data
           } catch (error: any) {
             clearTimeout(timeoutId) // Clear timeout on error
             
             // Handle timeout errors gracefully
             if (error.name === 'AbortError') {
               throw new Error('Request timeout - please try again')
             }
             
             // Handle network errors gracefully
             if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
               throw new Error('Network error - please check your connection')
             }
             
             console.error('API Request Error:', error)
             throw error
           }
         }

  private async refreshToken(): Promise<string | null> {
    // Prevent concurrent refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = this.performTokenRefresh()

    try {
      const result = await this.refreshPromise
      return result
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      console.log('🔄 [API] Starting token refresh process...')
      
      // Get fresh Firebase ID token
      const { firebaseAuthService } = await import('./firebaseAuthService')
      const firebaseToken = await firebaseAuthService.getIdToken(true)
      
      if (!firebaseToken) {
        throw new Error('Failed to get fresh Firebase token')
      }

      console.log('🔄 [API] Got fresh Firebase token, exchanging for backend JWT...')
      
      // Exchange Firebase token for backend JWT
      const backendResponse = await fetch(`${this.baseURL}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: firebaseToken })
      })

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json()
        throw new Error(`Backend token exchange failed: ${errorData.error?.message || backendResponse.statusText}`)
      }

      const backendData = await backendResponse.json()
      const backendJWT = backendData.data?.token
      
      if (!backendJWT) {
        throw new Error('No backend JWT received from exchange')
      }

      await this.setToken(backendJWT, true)
      console.log('✅ [API] Backend JWT refreshed successfully')
      return backendJWT
    } catch (error) {
      console.error('❌ [API] Token refresh error:', error)
      throw error
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return this.request<T>(url.pathname + url.search, {
      method: 'GET',
    })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: any = {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Upload failed')
      }

      return data
    } catch (error: any) {
      console.error('Upload Error:', error)
      throw error
    }
  }
}

export const apiService = new ApiService()
export default apiService
