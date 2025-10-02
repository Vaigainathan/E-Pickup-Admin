import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AnalyticsData } from '../../types'
import { analyticsService } from '../../services/analyticsService'

interface AnalyticsState {
  data: AnalyticsData | null
  loading: boolean
  error: string | null
  timeRange: {
    start: string
    end: string
  }
  selectedMetrics: string[]
}

const initialState: AnalyticsState = {
  data: null,
  loading: false,
  error: null,
  timeRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    end: new Date().toISOString(),
  },
  selectedMetrics: ['bookings', 'revenue', 'drivers'],
}

// Async thunks
export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async (params: { start: string; end: string; metrics?: string[] }, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getAnalytics(params.start, params.end)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchDriverAnalytics = createAsyncThunk(
  'analytics/fetchDriverAnalytics',
  async (params: { start: string; end: string }, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getDriverAnalytics(params.start, params.end)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchBookingAnalytics = createAsyncThunk(
  'analytics/fetchBookingAnalytics',
  async (params: { start: string; end: string }, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getBookingAnalytics(params.start, params.end)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchRevenueAnalytics = createAsyncThunk(
  'analytics/fetchRevenueAnalytics',
  async (params: { start: string; end: string }, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getRevenueAnalytics(params.start, params.end)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchSystemAnalytics = createAsyncThunk(
  'analytics/fetchSystemAnalytics',
  async (params: { start: string; end: string }, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getSystemAnalytics(params.start, params.end)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setTimeRange: (state, action: PayloadAction<{ start: string; end: string }>) => {
      state.timeRange = action.payload
    },
    setSelectedMetrics: (state, action: PayloadAction<string[]>) => {
      state.selectedMetrics = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    updateAnalyticsData: (state, action: PayloadAction<Partial<AnalyticsData>>) => {
      if (state.data) {
        state.data = { ...state.data, ...action.payload }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
        state.error = null
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Fetch Driver Analytics
      .addCase(fetchDriverAnalytics.fulfilled, (state, action) => {
        if (state.data) {
          state.data.users = { ...state.data.users, drivers: action.payload }
        }
      })
      // Fetch Booking Analytics
      .addCase(fetchBookingAnalytics.fulfilled, (state, action) => {
        if (state.data) {
          state.data.bookings = action.payload
        }
      })
      // Fetch Revenue Analytics
      .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => {
        if (state.data) {
          state.data.trends.revenue = action.payload
        }
      })
      // Fetch System Analytics
      .addCase(fetchSystemAnalytics.fulfilled, (_state, _action) => {
        // System analytics are now handled separately
      })
  },
})

export const {
  setTimeRange,
  setSelectedMetrics,
  clearError,
  updateAnalyticsData,
} = analyticsSlice.actions

export default analyticsSlice.reducer
