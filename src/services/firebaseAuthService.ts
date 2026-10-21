import {
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../config/firebase'
import { customClaimsService } from './customClaimsService'
import { mapError } from './errorHandlerService'
import type { AdminRole } from '../config/roleAccess'

export interface AdminUser {
  uid: string
  id: string
  email: string
  name: string
  displayName: string
  role: AdminRole
  permissions: string[]
  lastLogin?: string
  createdAt: string
  isEmailVerified: boolean
  isActive?: boolean
  idToken?: string
  refreshToken?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

const PASSWORD_RESET_GENERIC =
  'If an account exists for this email, we sent password reset instructions.'

class FirebaseAuthService {
  constructor() {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        this.clearUserData()
      }
    })
  }

  async signIn(credentials: LoginCredentials): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      try {
        const { recaptchaService } = await import('./recaptchaService')
        const recaptchaStatus = recaptchaService.getStatus()
        if (recaptchaStatus.loaded && recaptchaStatus.siteKey) {
          const recaptchaToken = await recaptchaService.execute('login', 8000)
          const verification = await recaptchaService.verifyToken(recaptchaToken)
          if (!verification.success) {
            console.warn('reCAPTCHA verification failed:', verification.error)
          }
        }
      } catch (recaptchaError: unknown) {
        console.warn('reCAPTCHA skipped:', recaptchaError)
      }

      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
      const user = userCredential.user
      if (!user) {
        return { success: false, error: mapError({ code: 'AUTHENTICATION_FAILED' }) }
      }

      const basicAdminUser: AdminUser = {
        uid: user.uid,
        id: user.uid,
        email: user.email!,
        name: user.displayName || 'Admin User',
        displayName: user.displayName || 'Admin User',
        role: 'support',
        permissions: [],
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isEmailVerified: user.emailVerified,
      }

      return { success: true, user: basicAdminUser }
    } catch (error: unknown) {
      console.error('Sign in error:', error)
      return { success: false, error: mapError(error) }
    }
  }

  async signOut(): Promise<void> {
    customClaimsService.clearClaims()
    await signOut(auth)
    this.clearUserData()
  }

  async resetPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true, message: PASSWORD_RESET_GENERIC }
    } catch (error: unknown) {
      console.error('Password reset error:', error)
      return { success: true, message: PASSWORD_RESET_GENERIC }
    }
  }

  getCurrentUser(): AdminUser | null {
    try {
      const { secureTokenStorage } = require('./secureTokenStorage')
      return secureTokenStorage.getCurrentUser()
    } catch {
      return null
    }
  }

  isAuthenticated(): boolean {
    try {
      const { secureTokenStorage } = require('./secureTokenStorage')
      return secureTokenStorage.isAuthenticated()
    } catch {
      return false
    }
  }

  async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    try {
      const currentUser = auth.currentUser
      if (currentUser) {
        return await currentUser.getIdToken(forceRefresh)
      }
      return null
    } catch (error) {
      console.error('Error getting Firebase token:', error)
      return null
    }
  }

  private clearUserData(): void {
    try {
      const { secureTokenStorage } = require('./secureTokenStorage')
      secureTokenStorage.clearTokenData()
    } catch (error) {
      console.error('Error clearing user data:', error)
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService()
export default firebaseAuthService
