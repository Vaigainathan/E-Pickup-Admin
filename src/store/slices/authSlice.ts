import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { User, AuthState } from '../../types'
import { firebaseAuthService } from '../../services/firebaseAuthService'
import { secureTokenStorage } from '../../services/secureTokenStorage'
import { API_BASE_URL } from '../../config/apiConfig'
import { mapError } from '../../services/errorHandlerService'

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
}

function buildUserFromBackend(firebaseUid: string, email: string | null, backendUser: any, token: string): User {
  const role = backendUser?.role === 'super_admin' || backendUser?.role === 'support'
    ? backendUser.role
    : 'support'
  const displayName = backendUser?.displayName || backendUser?.name || 'Admin User'
  return {
    uid: backendUser?.uid || firebaseUid,
    id: backendUser?.uid || firebaseUid,
    email: backendUser?.email ?? email,
    name: displayName,
    displayName,
    role,
    isActive: backendUser?.isActive !== false,
    idToken: token,
    refreshToken: token,
    lastLogin: new Date().toISOString(),
    createdAt: backendUser?.createdAt || new Date().toISOString(),
  }
}

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const isAuthenticated = await secureTokenStorage.isAuthenticated()
      const user = await secureTokenStorage.getCurrentUser()
      const token = await secureTokenStorage.getToken()
      return { isAuthenticated, user, token }
    } catch (error: unknown) {
      return rejectWithValue(mapError(error))
    }
  }
)

export const verifyAdminSession = createAsyncThunk(
  'auth/verifySession',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = await secureTokenStorage.getToken()
      if (!token) {
        return rejectWithValue(mapError({ code: 'UNAUTHORIZED' }))
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const err = { code: errorData.error?.code, status: response.status, response: { data: errorData } }
        if (response.status === 401) {
          dispatch(logout())
        }
        return rejectWithValue(mapError(err))
      }

      const data = await response.json()
      const backendUser = data.data?.user
      if (backendUser?.isActive === false) {
        await firebaseAuthService.signOut()
        dispatch(logout())
        return rejectWithValue(mapError({ code: 'ACCOUNT_DISABLED' }))
      }

      const existing = await secureTokenStorage.getCurrentUser()
      const newToken = data.data?.token || token
      const standardizedUser = buildUserFromBackend(
        existing?.uid || backendUser?.uid,
        existing?.email ?? backendUser?.email,
        backendUser,
        newToken
      )

      const expiresAt = Date.now() + 24 * 60 * 60 * 1000
      await secureTokenStorage.setTokenData({
        token: newToken,
        expiresAt,
        user: standardizedUser,
        isBackendToken: true,
      })

      const { apiService } = await import('../../services/apiService')
      await apiService.setToken(newToken, true)

      return { user: standardizedUser, token: newToken }
    } catch (error: unknown) {
      return rejectWithValue(mapError(error))
    }
  }
)

export const loginAdmin = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await firebaseAuthService.signIn(credentials)
      if (!response.success || !response.user) {
        return rejectWithValue(response.error || mapError({ code: 'AUTHENTICATION_FAILED' }))
      }

      let finalToken = await firebaseAuthService.getIdToken()
      if (!finalToken) {
        return rejectWithValue(mapError({ code: 'AUTHENTICATION_FAILED' }))
      }

      try {
        const refreshedToken = await firebaseAuthService.getIdToken(true)
        if (refreshedToken) finalToken = refreshedToken
      } catch {
        // use existing token
      }

      const backendResponse = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: finalToken }),
      })

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({}))
        const err = { code: errorData.error?.code, status: backendResponse.status, response: { data: errorData } }
        await firebaseAuthService.signOut()
        return rejectWithValue(mapError(err))
      }

      const backendData = await backendResponse.json()
      const backendUser = backendData.data?.user
      if (backendUser?.isActive === false) {
        await firebaseAuthService.signOut()
        return rejectWithValue(mapError({ code: 'ACCOUNT_DISABLED' }))
      }

      const jwt = backendData.data?.token
      if (!jwt) {
        return rejectWithValue(mapError({ code: 'AUTHENTICATION_FAILED' }))
      }

      return {
        firebaseUid: response.user.uid,
        email: response.user.email,
        token: jwt,
        backendUser,
      }
    } catch (error: unknown) {
      return rejectWithValue(mapError(error))
    }
  }
)

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await firebaseAuthService.resetPassword(email)
      if (response.success) {
        return { message: response.message }
      }
      return rejectWithValue(mapError({ code: 'UNKNOWN_ERROR' }))
    } catch (error: unknown) {
      return rejectWithValue(mapError(error))
    }
  }
)

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = firebaseAuthService.getCurrentUser()
      if (user) return user
      return rejectWithValue(mapError({ code: 'UNAUTHORIZED' }))
    } catch (error: unknown) {
      return rejectWithValue(mapError(error))
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
      }
      return rejectWithValue(mapError({ code: 'TOKEN_EXPIRED' }))
    } catch (error: unknown) {
      return rejectWithValue(mapError(error))
    }
  }
)

export const logoutAdmin = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await firebaseAuthService.signOut()
      return {}
    } catch (error: unknown) {
      return rejectWithValue(mapError(error))
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
      import('../../services/apiService').then(({ apiService }) => apiService.clearToken())
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
      .addCase(verifyAdminSession.fulfilled, (state, action) => {
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.loading = false
        state.error = null
      })
      .addCase(verifyAdminSession.rejected, (state, action) => {
        state.loading = false
        if (action.payload) state.error = action.payload as string
      })
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        const standardizedUser = buildUserFromBackend(
          action.payload.firebaseUid,
          action.payload.email,
          action.payload.backendUser,
          action.payload.token
        )
        state.user = standardizedUser
        state.token = action.payload.token
        state.error = null

        const expiresAt = Date.now() + 24 * 60 * 60 * 1000
        secureTokenStorage.setTokenData({
          token: action.payload.token,
          expiresAt,
          user: standardizedUser,
          isBackendToken: true,
        })

        import('../../services/apiService').then(({ apiService }) => {
          apiService.setToken(action.payload.token, true)
        })
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
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
          createdAt: action.payload.createdAt,
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
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token
        if (state.user) state.user.idToken = action.payload.token
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

export default authSlice.reducer
