import { apiService } from './apiService'
import { Booking, PaginationParams, FilterParams } from '../types'

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
  async getBookings(
    pagination: PaginationParams,
    filters: FilterParams = {}
  ): Promise<BookingsResponse> {
    // ✅ CRITICAL FIX: Use correct backend endpoint
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }
    
    const response = await apiService.get('/api/admin/bookings', params)
    if (response.success && response.data) {
      return response.data as BookingsResponse
    }
    throw new Error(response.error?.message || 'Failed to fetch bookings')
  }

  async getActiveBookings(): Promise<Booking[]> {
    // ✅ CRITICAL FIX: Use correct backend endpoint
    const response = await apiService.get('/api/admin/bookings/active')
    if (response.success && response.data) {
      return response.data as Booking[]
    }
    throw new Error(response.error?.message || 'Failed to fetch active bookings')
  }

  async getBookingById(bookingId: string): Promise<Booking> {
    // ✅ CRITICAL FIX: Use correct backend endpoint
    const response = await apiService.get(`/api/admin/bookings/${bookingId}`)
    if (response.success && response.data) {
      return response.data as Booking
    }
    throw new Error(response.error?.message || 'Failed to fetch booking details')
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<{ status: string; message: string }> {
    // ✅ CRITICAL FIX: Use correct backend endpoint
    const response = await apiService.put(`/api/admin/bookings/${bookingId}/status`, { status })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to update booking status')
  }

  async interveneBooking(
    bookingId: string,
    action: string,
    reason?: string
  ): Promise<{ action: string; message: string }> {
    // ✅ CRITICAL FIX: Use correct backend endpoint
    const response = await apiService.post(`/api/admin/bookings/${bookingId}/intervene`, {
      action,
      reason,
    })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to intervene in booking')
  }

  async getBookingTracking(bookingId: string): Promise<any> {
    const response = await apiService.get(`/admin/tracking/${bookingId}`)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch booking tracking')
  }

  async getBookingAnalytics(): Promise<any> {
    const response = await apiService.get('/api/admin/bookings/analytics')
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch booking analytics')
  }

  async cancelBooking(bookingId: string, reason: string): Promise<{ message: string }> {
    const response = await apiService.put(`/admin/bookings/${bookingId}/cancel`, { reason })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to cancel booking')
  }

  async reassignDriver(bookingId: string, driverId: string): Promise<{ message: string }> {
    const response = await apiService.put(`/admin/bookings/${bookingId}/reassign`, { driverId })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to reassign driver')
  }

  async adjustFare(bookingId: string, newFare: number, reason: string): Promise<{ message: string }> {
    const response = await apiService.put(`/admin/bookings/${bookingId}/adjust-fare`, {
      newFare,
      reason,
    })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to adjust fare')
  }

  async getBookingHistory(bookingId: string): Promise<any[]> {
    const response = await apiService.get(`/admin/bookings/${bookingId}/history`)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch booking history')
  }

  async sendNotificationToBooking(
    bookingId: string,
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ): Promise<{ message: string }> {
    const response = await apiService.post(`/admin/bookings/${bookingId}/notify`, {
      message,
      type,
    })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to send notification')
  }

  async getBookingReports(
    startDate: string,
    endDate: string,
    filters?: FilterParams
  ): Promise<any> {
    const params = {
      startDate,
      endDate,
      ...filters,
    }
    const response = await apiService.get('/api/admin/bookings/reports', params)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch booking reports')
  }

  async deleteBooking(bookingId: string, reason?: string): Promise<{ message: string }> {
    // ✅ CRITICAL FIX: Use correct backend endpoint
    const endpoint = reason 
      ? `/api/bookings/${bookingId}?reason=${encodeURIComponent(reason)}`
      : `/api/bookings/${bookingId}`
    const response = await apiService.delete(endpoint)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to delete booking')
  }
}

export const bookingService = new BookingService()
export default bookingService
