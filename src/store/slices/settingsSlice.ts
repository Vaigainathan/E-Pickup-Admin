import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { settingsService } from '../../services/settingsService'

interface AdminSettings {
  notifications: boolean
  emailAlerts: boolean
  emergencyAlerts: boolean
  systemAlerts: boolean
  darkMode: boolean
  language: string
  timezone: string
}

interface SettingsState {
  settings: AdminSettings
  loading: boolean
  error: string | null
  lastUpdated: string | null
}

const initialState: SettingsState = {
  settings: {
    notifications: true,
    emailAlerts: true,
    emergencyAlerts: true,
    systemAlerts: true,
    darkMode: false,
    language: 'en',
    timezone: 'UTC',
  },
  loading: false,
  error: null,
  lastUpdated: null,
}

// Async thunks
export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const settings = await settingsService.getSettings()
      return settings
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch settings')
    }
  }
)

export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async (settings: Partial<AdminSettings>, { rejectWithValue }) => {
    try {
      const updatedSettings = await settingsService.updateSettings(settings)
      return updatedSettings
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update settings')
    }
  }
)

export const backupData = createAsyncThunk(
  'settings/backupData',
  async (_, { rejectWithValue }) => {
    try {
      const result = await settingsService.backupData()
      return result
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to backup data')
    }
  }
)

export const restoreData = createAsyncThunk(
  'settings/restoreData',
  async (backupId: string, { rejectWithValue }) => {
    try {
      const result = await settingsService.restoreData(backupId)
      return result
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to restore data')
    }
  }
)

export const clearCache = createAsyncThunk(
  'settings/clearCache',
  async (_, { rejectWithValue }) => {
    try {
      const result = await settingsService.clearCache()
      return result
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clear cache')
    }
  }
)

export const restartSystem = createAsyncThunk(
  'settings/restartSystem',
  async (_, { rejectWithValue }) => {
    try {
      const result = await settingsService.restartSystem()
      return result
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to restart system')
    }
  }
)

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<Partial<AdminSettings>>) => {
      state.settings = { ...state.settings, ...action.payload }
    },
    clearError: (state) => {
      state.error = null
    },
    resetSettings: (state) => {
      state.settings = initialState.settings
      state.error = null
      state.lastUpdated = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Settings
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false
        state.settings = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Update Settings
      .addCase(updateSettings.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading = false
        state.settings = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Backup Data
      .addCase(backupData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(backupData.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(backupData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Restore Data
      .addCase(restoreData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(restoreData.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(restoreData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Clear Cache
      .addCase(clearCache.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(clearCache.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(clearCache.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Restart System
      .addCase(restartSystem.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(restartSystem.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(restartSystem.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { setSettings, clearError, resetSettings } = settingsSlice.actions
export default settingsSlice.reducer
