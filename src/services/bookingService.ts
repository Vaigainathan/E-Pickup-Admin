import { apiService } from './apiService'
import { Booking, PaginationParams, FilterParams } from '../types'
import { mapError } from './errorHandlerService'
import { ApiRequestError } from './apiService'

interface BookingsResponse {
  bookings: Booking[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class BookingService {
  async getBookings(pagination: PaginationParams, filters: FilterParams = {}): Promise<BookingsResponse> {
    const params = { page: pagination.page, limit: pagination.limit, ...filters }
    const response = await apiService.get('/api/admin/bookings', params)
    if (response.success && response.data) {
      return response.data as BookingsResponse
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async getActiveBookings(): Promise<Booking[]> {
    const response = await apiService.get('/api/admin/bookings/active')
    if (response.success && response.data) {
      const data = response.data as any
      return Array.isArray(data) ? data : data.bookings || []
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async getBookingById(bookingId: string): Promise<Booking> {
    const response = await apiService.get(`/api/admin/bookings/${bookingId}`)
    if (response.success && response.data) {
      return response.data as Booking
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<{ status: string; message: string }> {
    const response = await apiService.put(`/api/admin/bookings/${bookingId}/status`, { status })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async interveneBooking(
    bookingId: string,
    action: 'reassign_driver' | 'cancel_booking' | 'update_fare' | 'send_notification',
    reason: string,
    details?: {
      newDriverId?: string
      newFare?: number
      notificationMessage?: string
    }
  ): Promise<{ action: string; message: string; data?: any }> {
    const response = await apiService.post(`/api/admin/bookings/${bookingId}/intervene`, {
      action,
      reason,
      ...details,
    })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async deleteBooking(bookingId: string, reason?: string): Promise<{ message: string }> {
    const response = await apiService.delete(`/api/admin/bookings/${bookingId}`, reason ? { reason } : undefined)
    if (response.success) {
      return (response.data as any) || { message: 'Booking deleted' }
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }
}

export const bookingService = new BookingService()
export default bookingService
