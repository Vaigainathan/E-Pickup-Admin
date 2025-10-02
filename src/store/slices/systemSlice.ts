import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { SystemMetrics } from '../../types'
import { systemService } from '../../services/systemService'

interface SystemState {
  metrics: SystemMetrics | null
  health: {
    status: 'healthy' | 'warning' | 'critical'
    services: {
      api: boolean
      database: boolean
      websocket: boolean
      firebase: boolean
    }
    uptime: number
    lastCheck: string
  }
  loading: boolean
  error: string | null
  logs: any[]
  connectedUsers: {
    total: number
    customers: number
    drivers: number
    admins: number
  }
}

const initialState: SystemState = {
  metrics: null,
  health: {
    status: 'healthy',
    services: {
      api: true,
      database: true,
      websocket: true,
      firebase: true,
    },
    uptime: 0,
    lastCheck: new Date().toISOString(),
  },
  loading: false,
  error: null,
  logs: [],
  connectedUsers: {
    total: 0,
    customers: 0,
    drivers: 0,
    admins: 0,
  },
}

// Async thunks
export const fetchSystemHealth = createAsyncThunk(
  'system/fetchHealth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await systemService.getSystemHealth()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchSystemMetrics = createAsyncThunk(
  'system/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await systemService.getSystemMetrics()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchSystemLogs = createAsyncThunk(
  'system/fetchLogs',
  async (params: { limit?: number; level?: string }, { rejectWithValue }) => {
    try {
      const response = await systemService.getSystemLogs(params.limit, params.level)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchConnectedUsers = createAsyncThunk(
  'system/fetchConnectedUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await systemService.getConnectedUsers()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateMetrics: (state, action: PayloadAction<SystemMetrics>) => {
      state.metrics = action.payload
    },
    updateHealth: (state, action: PayloadAction<Partial<SystemState['health']>>) => {
      state.health = { ...state.health, ...action.payload }
    },
    addLog: (state, action: PayloadAction<any>) => {
      state.logs.unshift(action.payload)
      if (state.logs.length > 1000) {
        state.logs = state.logs.slice(0, 1000)
      }
    },
    updateConnectedUsers: (state, action: PayloadAction<SystemState['connectedUsers']>) => {
      state.connectedUsers = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch System Health
      .addCase(fetchSystemHealth.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSystemHealth.fulfilled, (state, action) => {
        state.loading = false
        state.health = action.payload
        state.error = null
      })
      .addCase(fetchSystemHealth.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.health.status = 'critical'
      })
      // Fetch System Metrics
      .addCase(fetchSystemMetrics.fulfilled, (state, action) => {
        state.metrics = action.payload
      })
      // Fetch System Logs
      .addCase(fetchSystemLogs.fulfilled, (state, action) => {
        state.logs = action.payload
      })
      // Fetch Connected Users
      .addCase(fetchConnectedUsers.fulfilled, (state, action) => {
        state.connectedUsers = action.payload
      })
  },
})

export const {
  clearError,
  updateMetrics,
  updateHealth,
  addLog,
  updateConnectedUsers,
} = systemSlice.actions

export default systemSlice.reducer
