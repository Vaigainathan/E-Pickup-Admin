import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { SupportTicket, FilterParams, PaginationParams } from '../../types'
import { supportService } from '../../services/supportService'
import { mapError } from '../../services/errorHandlerService'

interface SupportState {
  tickets: SupportTicket[]
  selectedTicket: SupportTicket | null
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
    open: number
    inProgress: number
    resolved: number
    closed: number
  }
}

const initialState: SupportState = {
  tickets: [],
  selectedTicket: null,
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
  filters: {},
  stats: { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 },
}

export const fetchSupportTickets = createAsyncThunk(
  'support/fetchTickets',
  async (params: { pagination: PaginationParams; filters: FilterParams }, { rejectWithValue }) => {
    try {
      return await supportService.getSupportTickets(params.pagination)
    } catch (error: unknown) {
      return rejectWithValue(mapError(error))
    }
  }
)

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    setSelectedTicket: (state, action: PayloadAction<SupportTicket | null>) => {
      state.selectedTicket = action.payload
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
    addNewTicket: (state, action: PayloadAction<SupportTicket>) => {
      state.tickets.unshift(action.payload)
      state.stats.total += 1
      state.stats.open += 1
    },
    updateTicketInList: (state, action: PayloadAction<SupportTicket>) => {
      const index = state.tickets.findIndex((ticket) => ticket.id === action.payload.id)
      if (index !== -1) state.tickets[index] = action.payload
      if (state.selectedTicket?.id === action.payload.id) state.selectedTicket = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSupportTickets.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSupportTickets.fulfilled, (state, action) => {
        state.loading = false
        const tickets = Array.isArray(action.payload?.tickets) ? action.payload.tickets : []
        state.tickets = tickets
        state.pagination = action.payload?.pagination
          ? { ...state.pagination, ...action.payload.pagination }
          : state.pagination
        state.stats.total = tickets.length
        state.stats.open = tickets.filter((t) => t.status === 'open').length
        state.stats.inProgress = tickets.filter((t) => t.status === 'in_progress').length
        state.stats.resolved = tickets.filter((t) => t.status === 'resolved').length
        state.stats.closed = tickets.filter((t) => t.status === 'closed').length
        state.error = null
      })
      .addCase(fetchSupportTickets.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  setSelectedTicket,
  setFilters,
  setPagination,
  clearError,
  addNewTicket,
  updateTicketInList,
} = supportSlice.actions

export default supportSlice.reducer
