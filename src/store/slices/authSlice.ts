import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { User, AuthState } from '../../types'
import { firebaseAuthService, AdminUser } from '../../services/firebaseAuthService'
import { secureTokenStorage } from '../../services/secureTokenStorage'

const initialState: AuthState = {
  isAuthenticated: false, // Will be set after async check
  user: null, // Will be set after async check
  token: null, // Will be set after async check
  loading: false, // Start with false, will be set to true during initialization
  error: null,
}

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const isAuthenticated = await secureTokenStorage.isAuthenticated()
      const user = await secureTokenStorage.getCurrentUser()
      const token = await secureTokenStorage.getToken()
      
      return { isAuthenticated, user, token }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const loginAdmin = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // First authenticate with Firebase
      const response = await firebaseAuthService.signIn(credentials)
      if (!response.success || !response.user) {
        return rejectWithValue(response.error || 'Login failed')
      }

      // Get Firebase ID token
      const idToken = await firebaseAuthService.getIdToken()
      if (!idToken) {
        return rejectWithValue('Failed to get Firebase ID token')
      }

      // Simplified token validation - let backend handle detailed validation
      // This prevents client-side validation errors from breaking the login flow
      let finalToken = idToken
      
      try {
        // Basic token format check only
        if (!idToken || typeof idToken !== 'string' || idToken.length < 10) {
          return rejectWithValue('Invalid token provided')
        }
        
        // Try to refresh token if it might be expired (but don't fail if it's not)
        try {
          const refreshedToken = await firebaseAuthService.getIdToken(true)
          if (refreshedToken && refreshedToken !== idToken) {
            console.log('🔄 Token refreshed, using new token')
            finalToken = refreshedToken
          }
        } catch (refreshError) {
          console.log('⚠️ Token refresh failed, using original token:', refreshError)
          // Continue with original token - let backend handle validation
        }
      } catch (tokenError) {
        console.error('Token validation error:', tokenError)
        return rejectWithValue('Token validation failed')
      }

      // Send ID token to backend for verification and JWT generation
      const backendResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://epickup-backend.onrender.com'}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: finalToken })
      })

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json()
        return rejectWithValue(errorData.error?.message || 'Backend authentication failed')
      }

      const backendData = await backendResponse.json()
      
      return { 
        user: response.user, 
        token: backendData.data.token,
        backendUser: backendData.data.user
      }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const signupAdmin = createAsyncThunk(
  'auth/signup',
  async (signupData: { email: string; password: string; displayName: string; role: AdminUser['role'] }, { rejectWithValue }) => {
    try {
      const response = await firebaseAuthService.signUp(signupData)
      if (response.success && response.user) {
        return { user: response.user, token: await firebaseAuthService.getIdToken() }
      } else {
        return rejectWithValue(response.error || 'Signup failed')
      }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await firebaseAuthService.resetPassword(email)
      if (response.success) {
        return { message: 'Password reset email sent successfully' }
      } else {
        return rejectWithValue(response.error || 'Password reset failed')
      }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = firebaseAuthService.getCurrentUser()
      if (user) {
        return user
      } else {
        return rejectWithValue('No user found')
      }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = await firebaseAuthService.getIdToken(true)
      if (token) {
        await secureTokenStorage.updateToken(token)
        return { token }
      } else {
        return rejectWithValue('Failed to refresh token')
      }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const logoutAdmin = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await firebaseAuthService.signOut()
      return {}
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.error = null
      secureTokenStorage.clearTokenData()
    },
    clearError: (state) => {
      state.error = null
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      // Initialize auth state
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = action.payload.isAuthenticated
        state.user = action.payload.user
        state.token = action.payload.token
        state.error = null
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.error = action.payload as string
      })
      // Login
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        
        // Standardize user object structure
        const standardizedUser: User = {
          uid: action.payload.user.uid,
          id: action.payload.user.uid,
          email: action.payload.user.email,
          name: action.payload.user.displayName || action.payload.user.name,
          displayName: action.payload.user.displayName || action.payload.user.name,
          role: action.payload.user.role,
          idToken: action.payload.token,
          refreshToken: action.payload.token,
          lastLogin: new Date().toISOString(),
          createdAt: action.payload.user.createdAt || new Date().toISOString()
        }
        
        state.user = standardizedUser
        state.token = action.payload.token
        state.error = null
        
        // Store in secure storage
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        secureTokenStorage.setTokenData({
          token: action.payload.token,
          expiresAt,
          user: standardizedUser
        })
        
        // IMPORTANT: Set the backend JWT token in apiService
        import('../../services/apiService').then(({ apiService }) => {
          apiService.setToken(action.payload.token, true)
          console.log('✅ [AUTH] Backend JWT token set in apiService')
        })
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Signup
      .addCase(signupAdmin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signupAdmin.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = {
          uid: action.payload.user.uid,
          id: action.payload.user.uid,
          email: action.payload.user.email,
          name: action.payload.user.displayName,
          displayName: action.payload.user.displayName,
          role: action.payload.user.role,
          idToken: action.payload.user.idToken,
          refreshToken: action.payload.user.refreshToken,
          lastLogin: new Date().toISOString(),
          createdAt: action.payload.user.createdAt
        } as User
        state.token = action.payload.token
        state.error = null
      })
      .addCase(signupAdmin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Logout
      .addCase(logoutAdmin.pending, (state) => {
        state.loading = true
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.error = null
      })
      .addCase(logoutAdmin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = {
          uid: action.payload.uid,
          id: action.payload.uid,
          email: action.payload.email,
          name: action.payload.displayName,
          displayName: action.payload.displayName,
          role: action.payload.role,
          idToken: action.payload.idToken,
          refreshToken: action.payload.refreshToken,
          lastLogin: new Date().toISOString(),
          createdAt: action.payload.createdAt
        } as User
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isAuthenticated = false
        state.token = null
        secureTokenStorage.clearTokenData()
      })
      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token
        // Keep existing user data when refreshing token
        if (state.user) {
          state.user.idToken = action.payload.token
        }
        state.isAuthenticated = true
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuthenticated = false
        state.token = null
        state.user = null
        secureTokenStorage.clearTokenData()
      })
  },
})

export const { logout, clearError, setAuthenticated } = authSlice.actions

// Additional actions for profile management
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: { name?: string; email?: string; phone?: string }, { rejectWithValue }) => {
    try {
      // This would call an API to update profile
      return profileData
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData: { currentPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      // This would call an API to change password
      // For now, simulate API call
      if (passwordData.currentPassword && passwordData.newPassword) {
        return { message: 'Password changed successfully' }
      } else {
        throw new Error('Invalid password data')
      }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export default authSlice.reducer
