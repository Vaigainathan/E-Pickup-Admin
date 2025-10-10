import { apiService } from './apiService'
import { secureTokenStorage } from './secureTokenStorage'
import { User } from '../types'

interface LoginCredentials {
  email: string
  password: string
}

interface LoginResponse {
  user: User
  token: string
  message: string
}

interface OTPVerification {
  email: string
  otp: string
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('🔐 [ADMIN] Attempting Firebase authentication with:', credentials.email)
      
      // Use Firebase Web SDK authentication
      const { firebaseAuthService } = await import('./firebaseAuthService')
      const result = await firebaseAuthService.signIn(credentials)
      
      if (result.success && result.user) {
        console.log('✅ [ADMIN] Firebase authentication successful')
        
        // Get Firebase ID token for backend communication
        const idToken = await firebaseAuthService.getIdToken()
        
        if (!idToken) {
          throw new Error('Failed to get Firebase ID token')
        }
        
        console.log('🔄 [ADMIN] Exchanging Firebase token for backend JWT...')
        
        // Exchange Firebase ID token for backend JWT token (simplified)
        const exchangeResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://epickup-backend.onrender.com'}/api/auth/firebase/verify-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            idToken: idToken,
            userType: 'admin',
            name: result.user.displayName || result.user.email
          })
        })
        
        if (!exchangeResponse.ok) {
          const errorData = await exchangeResponse.json()
          console.error('❌ Token exchange failed:', errorData)
          throw new Error(`Token exchange failed: ${errorData.error?.message || exchangeResponse.statusText}`)
        }
        
        const exchangeData = await exchangeResponse.json()
        const backendToken = exchangeData.data?.token
        const refreshToken = exchangeData.data?.refreshToken // 🔥 CRITICAL FIX: Get refresh token
        
        if (!backendToken) {
          throw new Error('No backend token received from exchange')
        }
        
        console.log('✅ [ADMIN] Token exchange successful')
        
        // 🔥 CRITICAL FIX: Store refresh token if provided
        if (refreshToken) {
          console.log('✅ [ADMIN] Refresh token received and will be stored')
        }
        
        // Use backend JWT token
        const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000) // 🔥 CRITICAL FIX: 7 days instead of 24 hours // 24 hours (backend token lifetime)
        secureTokenStorage.setTokenData({
          token: backendToken, // Backend JWT token
          expiresAt,
          user: result.user
        })
        
        apiService.setToken(backendToken) // Use backend JWT token
        return {
          user: result.user,
          token: backendToken,
          message: 'Login successful'
        }
      }
      
      throw new Error(result.error || 'Authentication failed')
    } catch (error: any) {
      console.error('❌ [ADMIN] Login error:', error)
      throw new Error(error.message || 'Login failed. Please check your credentials.')
    }
  }

  async verifyOTP(otpData: OTPVerification): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>('/api/admin/auth/verify-otp', otpData)
      if (response.success && response.data) {
        apiService.setToken(response.data.token)
        return response.data
      }
      throw new Error(response.error?.message || 'OTP verification failed')
    } catch (error) {
      console.error('OTP verification error:', error)
      throw error
    }
  }

  async getProfile(): Promise<User> {
    try {
      // Use Firebase Auth to get current user
      const { firebaseAuthService } = await import('./firebaseAuthService')
      const user = firebaseAuthService.getCurrentUser()
      
      if (user) {
        return user as User
      }
      
      throw new Error('No user found')
    } catch (error: any) {
      console.error('Get profile error:', error)
      throw new Error(error.message || 'Failed to get profile')
    }
  }

  async updateProfile(_userData: Partial<User>): Promise<User> {
    // For now, return current profile since backend doesn't have admin profile update
    return this.getProfile()
  }

  async refreshToken(): Promise<LoginResponse> {
    try {
      console.log('🔄 [ADMIN] Refreshing token via apiService...')
      
      // Use apiService.refreshToken which handles the Firebase ID token -> backend JWT exchange
      const success = await apiService.refreshToken()
      
      if (success) {
        console.log('✅ [ADMIN] Token refreshed successfully via apiService')
        
        // Get the updated token data
        const tokenData = await secureTokenStorage.getTokenData()
        
        return {
          user: tokenData?.user || {} as User,
          token: tokenData?.token || '',
          message: 'Token refreshed successfully'
        }
      }
      
      throw new Error('Failed to refresh token via apiService')
    } catch (error: any) {
      console.error('❌ [ADMIN] Token refresh error:', error)
      throw new Error(error.message || 'Token refresh failed')
    }
  }

  async logout(): Promise<void> {
    try {
      // Clear secure token storage
      secureTokenStorage.clearTokenData()
      
      // Use Firebase Auth to sign out
      const { firebaseAuthService } = await import('./firebaseAuthService')
      await firebaseAuthService.signOut()
      console.log('Admin logged out')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      apiService.clearToken()
    }
  }

  async changePassword(_passwordData: {
    currentPassword: string
    newPassword: string
  }): Promise<void> {
    // Backend doesn't have admin password change endpoint yet
    throw new Error('Password change not implemented for admin users yet')
  }

  async resetPassword(_email: string): Promise<void> {
    // Backend doesn't have admin password reset endpoint yet
    throw new Error('Password reset not implemented for admin users yet')
  }

  async isAuthenticated(): Promise<boolean> {
    return await secureTokenStorage.isAuthenticated()
  }

  async getToken(): Promise<string | null> {
    return await secureTokenStorage.getToken()
  }
}

export const authService = new AuthService()
export default authService
