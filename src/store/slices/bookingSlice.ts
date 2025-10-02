import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Booking, FilterParams, PaginationParams } from '../../types'
import { bookingService } from '../../services/bookingService'

interface BookingState {
  bookings: Booking[]
  activeBookings: Booking[]
  selectedBooking: Booking | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: FilterParams
}

const initialState: BookingState = {
  bookings: [],
  activeBookings: [],
  selectedBooking: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
}

// Async thunks
export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (params: { pagination: PaginationParams; filters: FilterParams }, { rejectWithValue }) => {
    try {
      const response = await bookingService.getBookings(params.pagination)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchActiveBookings = createAsyncThunk(
  'bookings/fetchActiveBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await bookingService.getActiveBookings()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchBookingById = createAsyncThunk(
  'bookings/fetchBookingById',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await bookingService.getBookingById(bookingId)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateBookingStatus = createAsyncThunk(
  'bookings/updateBookingStatus',
  async (data: { bookingId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await bookingService.updateBookingStatus(data.bookingId, data.status)
      return { bookingId: data.bookingId, ...response }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const interveneBooking = createAsyncThunk(
  'bookings/interveneBooking',
  async (data: { bookingId: string; action: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await bookingService.interveneBooking(data.bookingId, data.action, data.reason)
      return { bookingId: data.bookingId, ...response }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setSelectedBooking: (state, action: PayloadAction<Booking | null>) => {
      state.selectedBooking = action.payload
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
    updateBookingInList: (state, action: PayloadAction<Booking>) => {
      const index = state.bookings.findIndex(booking => booking.id === action.payload.id)
      if (index !== -1) {
        state.bookings[index] = action.payload
      }
      const activeIndex = state.activeBookings.findIndex(booking => booking.id === action.payload.id)
      if (activeIndex !== -1) {
        state.activeBookings[activeIndex] = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false
        state.bookings = action.payload.bookings
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Fetch Active Bookings
      .addCase(fetchActiveBookings.fulfilled, (state, action) => {
        state.activeBookings = action.payload
      })
      // Fetch Booking by ID
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedBooking = action.payload
        state.error = null
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Update Booking Status
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(booking => booking.id === action.payload.bookingId)
        if (index !== -1 && state.bookings[index]) {
          state.bookings[index]!.status = action.payload.status as any
        }
        const activeIndex = state.activeBookings.findIndex(booking => booking.id === action.payload.bookingId)
        if (activeIndex !== -1 && state.activeBookings[activeIndex]) {
          state.activeBookings[activeIndex]!.status = action.payload.status as any
        }
        if (state.selectedBooking?.id === action.payload.bookingId) {
          state.selectedBooking.status = action.payload.status as any
        }
      })
  },
})

export const {
  setSelectedBooking,
  setFilters,
  setPagination,
  clearError,
  updateBookingInList,
} = bookingSlice.actions

export default bookingSlice.reducer
