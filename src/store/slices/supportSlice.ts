import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { SupportTicket, FilterParams, PaginationParams } from '../../types'
import { supportService } from '../../services/supportService'

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
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
  stats: {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  },
}

// Async thunks
export const fetchSupportTickets = createAsyncThunk(
  'support/fetchTickets',
  async (params: { pagination: PaginationParams; filters: FilterParams }, { rejectWithValue }) => {
    try {
      const response = await supportService.getSupportTickets(params.pagination)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchTicketById = createAsyncThunk(
  'support/fetchTicketById',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const response = await supportService.getTicketById(ticketId)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateTicketStatus = createAsyncThunk(
  'support/updateTicketStatus',
  async (data: { ticketId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await supportService.updateTicketStatus(data.ticketId, data.status)
      return { ticketId: data.ticketId, ...response }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const assignTicket = createAsyncThunk(
  'support/assignTicket',
  async (data: { ticketId: string; assignedTo: string }, { rejectWithValue }) => {
    try {
      const response = await supportService.assignTicket(data.ticketId, data.assignedTo)
      return { ticketId: data.ticketId, ...response }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const sendMessage = createAsyncThunk(
  'support/sendMessage',
  async (data: { ticketId: string; message: string; attachments?: string[] }, { rejectWithValue }) => {
    try {
      const response = await supportService.sendMessage(data.ticketId, data.message, data.attachments)
      return { ticketId: data.ticketId, ...response }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchSupportStats = createAsyncThunk(
  'support/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await supportService.getSupportStats()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
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
      const index = state.tickets.findIndex(ticket => ticket.id === action.payload.id)
      if (index !== -1) {
        state.tickets[index] = action.payload
      }
      if (state.selectedTicket?.id === action.payload.id) {
        state.selectedTicket = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Support Tickets
      .addCase(fetchSupportTickets.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSupportTickets.fulfilled, (state, action) => {
        state.loading = false
        state.tickets = action.payload.tickets
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchSupportTickets.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Fetch Ticket by ID
      .addCase(fetchTicketById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedTicket = action.payload
        state.error = null
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Update Ticket Status
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        const index = state.tickets.findIndex(ticket => ticket.id === action.payload.ticketId)
        if (index !== -1 && state.tickets[index]) {
          state.tickets[index]!.status = action.payload.status as any
        }
        if (state.selectedTicket?.id === action.payload.ticketId) {
          state.selectedTicket.status = action.payload.status as any
        }
      })
      // Assign Ticket
      .addCase(assignTicket.fulfilled, (state, action) => {
        const index = state.tickets.findIndex(ticket => ticket.id === action.payload.ticketId)
        if (index !== -1 && state.tickets[index]) {
          state.tickets[index]!.assignedTo = action.payload.assignedTo
        }
        if (state.selectedTicket?.id === action.payload.ticketId) {
          state.selectedTicket.assignedTo = action.payload.assignedTo
        }
      })
      // Send Message
      .addCase(sendMessage.fulfilled, (state, action) => {
        if (state.selectedTicket?.id === action.payload.ticketId) {
          state.selectedTicket.messages.push(action.payload.message)
        }
      })
      // Fetch Support Stats
      .addCase(fetchSupportStats.fulfilled, (state, action) => {
        state.stats = action.payload
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
