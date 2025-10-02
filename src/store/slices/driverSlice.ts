import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Driver, FilterParams, PaginationParams } from '../../types'
import { driverService } from '../../services/driverService'

interface DriverState {
  drivers: Driver[]
  selectedDriver: Driver | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: FilterParams
  verificationQueue: Driver[]
}

const initialState: DriverState = {
  drivers: [],
  selectedDriver: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
  verificationQueue: [],
}

// Async thunks
export const fetchDrivers = createAsyncThunk(
  'drivers/fetchDrivers',
  async (params: { pagination: PaginationParams; filters: FilterParams }, { rejectWithValue }) => {
    try {
      const response = await driverService.getDrivers(params.pagination, params.filters)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchDriverById = createAsyncThunk(
  'drivers/fetchDriverById',
  async (driverId: string, { rejectWithValue }) => {
    try {
      const response = await driverService.getDriverById(driverId)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const verifyDriver = createAsyncThunk(
  'drivers/verifyDriver',
  async (data: { driverId: string; status: 'verified' | 'rejected'; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await driverService.verifyDriver(data.driverId, data.status, data.reason)
      return { driverId: data.driverId, ...response }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateDriverStatus = createAsyncThunk(
  'drivers/updateDriverStatus',
  async (data: { driverId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await driverService.updateDriverStatus(data.driverId, data.status)
      return { driverId: data.driverId, ...response }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchVerificationQueue = createAsyncThunk(
  'drivers/fetchVerificationQueue',
  async (_, { rejectWithValue }) => {
    try {
      const response = await driverService.getPendingVerifications()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const bulkVerifyDrivers = createAsyncThunk(
  'drivers/bulkVerifyDrivers',
  async (data: { driverIds: string[]; status: 'verified' | 'rejected'; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await driverService.bulkVerifyDrivers(data.driverIds, data.status, data.reason)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const driverSlice = createSlice({
  name: 'drivers',
  initialState,
  reducers: {
    setSelectedDriver: (state, action: PayloadAction<Driver | null>) => {
      state.selectedDriver = action.payload
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
    updateDriverInList: (state, action: PayloadAction<Driver>) => {
      const index = state.drivers.findIndex(driver => driver.id === action.payload.id)
      if (index !== -1) {
        state.drivers[index] = action.payload
      }
    },
    removeDriverFromQueue: (state, action: PayloadAction<string>) => {
      state.verificationQueue = state.verificationQueue.filter(driver => driver.id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Drivers
      .addCase(fetchDrivers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.loading = false
        state.drivers = action.payload.drivers
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Fetch Driver by ID
      .addCase(fetchDriverById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDriverById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedDriver = action.payload
        state.error = null
      })
      .addCase(fetchDriverById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Verify Driver
      .addCase(verifyDriver.fulfilled, (state, action) => {
        const index = state.drivers.findIndex(driver => driver.id === action.payload.driverId)
        if (index !== -1 && state.drivers[index]) {
          state.drivers[index]!.status = action.payload.status as any
        }
        if (state.selectedDriver?.id === action.payload.driverId) {
          state.selectedDriver.status = action.payload.status as any
        }
        state.verificationQueue = state.verificationQueue.filter(driver => driver.id !== action.payload.driverId)
      })
      // Update Driver Status
      .addCase(updateDriverStatus.fulfilled, (state, action) => {
        const index = state.drivers.findIndex(driver => driver.id === action.payload.driverId)
        if (index !== -1 && state.drivers[index]) {
          state.drivers[index]!.status = action.payload.status as any
        }
        if (state.selectedDriver?.id === action.payload.driverId) {
          state.selectedDriver.status = action.payload.status as any
        }
      })
      // Fetch Verification Queue
      .addCase(fetchVerificationQueue.fulfilled, (state, action) => {
        state.verificationQueue = action.payload
      })
      // Bulk Verify Drivers
      .addCase(bulkVerifyDrivers.fulfilled, (state, action) => {
        action.payload.verifiedDrivers.forEach((driverId: string) => {
          const index = state.drivers.findIndex(driver => driver.id === driverId)
          if (index !== -1 && state.drivers[index]) {
            state.drivers[index]!.status = 'verified' as any
          }
          state.verificationQueue = state.verificationQueue.filter(driver => driver.id !== driverId)
        })
      })
  },
})

export const {
  setSelectedDriver,
  setFilters,
  setPagination,
  clearError,
  updateDriverInList,
  removeDriverFromQueue,
} = driverSlice.actions

export default driverSlice.reducer
