import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { EmergencyAlert, FilterParams, PaginationParams } from '../../types'
import { emergencyService } from '../../services/emergencyService'

interface EmergencyState {
  alerts: EmergencyAlert[]
  activeAlerts: EmergencyAlert[]
  selectedAlert: EmergencyAlert | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: FilterParams
  stats: {
    total: number
    active: number
    resolved: number
    critical: number
  }
}

const initialState: EmergencyState = {
  alerts: [],
  activeAlerts: [],
  selectedAlert: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
  stats: {
    total: 0,
    active: 0,
    resolved: 0,
    critical: 0,
  },
}

// Async thunks
export const fetchEmergencyAlerts = createAsyncThunk(
  'emergency/fetchAlerts',
  async (params: { pagination: PaginationParams; filters: FilterParams }, { rejectWithValue }) => {
    try {
      const response = await emergencyService.getEmergencyAlerts(params.pagination, params.filters)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchActiveAlerts = createAsyncThunk(
  'emergency/fetchActiveAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await emergencyService.getActiveAlerts()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchAlertById = createAsyncThunk(
  'emergency/fetchAlertById',
  async (alertId: string, { rejectWithValue }) => {
    try {
      const response = await emergencyService.getAlertById(alertId)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const respondToEmergency = createAsyncThunk(
  'emergency/respondToEmergency',
  async (data: { alertId: string; response: any }, { rejectWithValue }) => {
    try {
      const response = await emergencyService.respondToEmergency(data.alertId, data.response)
      return { alertId: data.alertId, ...response }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateAlertStatus = createAsyncThunk(
  'emergency/updateAlertStatus',
  async (data: { alertId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await emergencyService.updateAlertStatus(data.alertId, data.status)
      return { alertId: data.alertId, ...response }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchEmergencyStats = createAsyncThunk(
  'emergency/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await emergencyService.getEmergencyStats()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    setSelectedAlert: (state, action: PayloadAction<EmergencyAlert | null>) => {
      state.selectedAlert = action.payload
    },
    setFilters: (state, action: PayloadAction<FilterParams>) => {
      state.filters = action.payload
    },
    setPagination: (state, action: PayloadAction<PaginationParams>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    clearError: (state) => {
      state.error = null
    },
    addNewAlert: (state, action: PayloadAction<EmergencyAlert>) => {
      state.alerts.unshift(action.payload)
      state.activeAlerts.unshift(action.payload)
      state.stats.total += 1
      state.stats.active += 1
      if (action.payload.priority === 'critical') {
        state.stats.critical += 1
      }
    },
    updateAlertInList: (state, action: PayloadAction<EmergencyAlert>) => {
      const index = state.alerts.findIndex(alert => alert.id === action.payload.id)
      if (index !== -1) {
        state.alerts[index] = action.payload
      }
      const activeIndex = state.activeAlerts.findIndex(alert => alert.id === action.payload.id)
      if (activeIndex !== -1) {
        if (action.payload.status === 'resolved') {
          state.activeAlerts.splice(activeIndex, 1)
          state.stats.active -= 1
          state.stats.resolved += 1
        } else {
          state.activeAlerts[activeIndex] = action.payload
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Emergency Alerts
      .addCase(fetchEmergencyAlerts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEmergencyAlerts.fulfilled, (state, action) => {
        state.loading = false
        state.alerts = action.payload.alerts
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchEmergencyAlerts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Fetch Active Alerts
      .addCase(fetchActiveAlerts.fulfilled, (state, action) => {
        state.activeAlerts = action.payload
      })
      // Fetch Alert by ID
      .addCase(fetchAlertById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAlertById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedAlert = action.payload
        state.error = null
      })
      .addCase(fetchAlertById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Respond to Emergency
      .addCase(respondToEmergency.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(alert => alert.id === action.payload.alertId)
        if (index !== -1 && state.alerts[index]) {
state.alerts[index]!.response = (action.payload as any).response
state.alerts[index]!.status = 'responded'
        }
        if (state.selectedAlert?.id === action.payload.alertId) {
          state.selectedAlert.response = (action.payload as any).response
          state.selectedAlert.status = 'responded'
        }
      })
      // Update Alert Status
      .addCase(updateAlertStatus.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(alert => alert.id === action.payload.alertId)
        if (index !== -1 && state.alerts[index]) {
          state.alerts[index]!.status = action.payload.status as any
        }
        if (state.selectedAlert?.id === action.payload.alertId) {
          state.selectedAlert.status = action.payload.status as any
        }
      })
      // Fetch Emergency Stats
      .addCase(fetchEmergencyStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const {
  setSelectedAlert,
  setFilters,
  setPagination,
  clearError,
  addNewAlert,
  updateAlertInList,
} = emergencySlice.actions

export default emergencySlice.reducer
