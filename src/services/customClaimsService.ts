import { auth } from '../config/firebase'

export interface CustomClaims {
  role: string
  roleBasedUID: string
  phone: string
  appType: string
  verified: boolean
}

class CustomClaimsService {
  private claims: CustomClaims | null = null
  private lastRefresh: number = 0
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get custom claims from Firebase Auth token
   */
  async getCustomClaims(forceRefresh: boolean = false): Promise<CustomClaims | null> {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        console.log('❌ [CLAIMS] No current user found')
        return null
      }

      // Check if we need to refresh claims
      const now = Date.now()
      if (!forceRefresh && this.claims && (now - this.lastRefresh) < this.REFRESH_INTERVAL) {
        console.log('✅ [CLAIMS] Using cached claims')
        return this.claims
      }

      console.log('🔄 [CLAIMS] Fetching fresh custom claims...')
      
      // Force refresh the ID token to get latest claims
      const idTokenResult = await currentUser.getIdTokenResult(true)
      const customClaims = idTokenResult.claims as unknown as CustomClaims

      if (customClaims && customClaims.roleBasedUID) {
        this.claims = customClaims
        this.lastRefresh = now
        console.log('✅ [CLAIMS] Custom claims fetched successfully:', {
          role: customClaims.role,
          roleBasedUID: customClaims.roleBasedUID,
          appType: customClaims.appType,
          verified: customClaims.verified
        })
        return customClaims
      } else {
        console.warn('⚠️ [CLAIMS] No custom claims found in token')
        return null
      }
    } catch (error) {
      console.error('❌ [CLAIMS] Error fetching custom claims:', error)
      return null
    }
  }

  /**
   * Get role-based UID for storage operations
   */
  async getRoleBasedUID(): Promise<string | null> {
    const claims = await this.getCustomClaims()
    return claims?.roleBasedUID || null
  }

  /**
   * Get user role
   */
  async getUserRole(): Promise<string | null> {
    const claims = await this.getCustomClaims()
    return claims?.role || null
  }

  /**
   * Check if user is verified
   */
  async isVerified(): Promise<boolean> {
    const claims = await this.getCustomClaims()
    return claims?.verified || false
  }

  /**
   * Get phone number from claims
   */
  async getPhoneNumber(): Promise<string | null> {
    const claims = await this.getCustomClaims()
    return claims?.phone || null
  }

  /**
   * Clear cached claims (useful for logout)
   */
  clearClaims(): void {
    this.claims = null
    this.lastRefresh = 0
    console.log('🗑️ [CLAIMS] Claims cache cleared')
  }

  /**
   * Check if claims are available and valid
   */
  async hasValidClaims(): Promise<boolean> {
    const claims = await this.getCustomClaims()
    return !!(claims && claims.roleBasedUID && claims.role)
  }
}

export const customClaimsService = new CustomClaimsService()
export default customClaimsService
