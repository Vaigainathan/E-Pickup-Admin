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
    // filters: FilterParams = {} // Removed unused parameter
  ): Promise<BookingsResponse> {
    // Mock data for temporary use - in production, this would query the backend
    const mockBookings: any[] = [
      {
        id: 'booking-1',
        customerId: 'customer-1',
        driverId: 'driver-1',
        customerName: 'Alice Johnson' as any,
        driverName: 'John Doe',
        pickupLocation: {
          address: '123 Main St, New York, NY',
          latitude: 40.7128,
          longitude: -74.0060
        },
        dropoffLocation: {
          address: '456 Broadway, New York, NY',
          latitude: 40.7589,
          longitude: -73.9851
        },
        status: 'delivered',
        fare: {
          baseFare: 5.00,
          distanceFare: 20.50,
          totalFare: 25.50,
          currency: 'USD'
        },
        distance: 5.2,
        duration: 18,
        scheduledTime: '2024-01-15T10:30:00Z',
        actualPickupTime: '2024-01-15T10:35:00Z',
        actualDropoffTime: '2024-01-15T10:53:00Z',
        paymentMethod: 'card',
        paymentStatus: 'completed',
        rating: 5,
        notes: 'Great service!',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:53:00Z'
      },
      {
        id: 'booking-2',
        customerId: 'customer-2',
        driverId: 'driver-1',
        customerName: 'Bob Smith' as any,
        driverName: 'John Doe',
        pickupLocation: {
          address: '789 Park Ave, New York, NY',
          latitude: 40.7505,
          longitude: -73.9934
        },
        dropoffLocation: {
          address: '321 5th Ave, New York, NY',
          latitude: 40.7505,
          longitude: -73.9934
        },
        status: 'in_transit',
        fare: {
          baseFare: 5.00,
          distanceFare: 13.75,
          totalFare: 18.75,
          currency: 'USD'
        },
        distance: 3.8,
        duration: 0,
        scheduledTime: '2024-01-15T14:00:00Z',
        actualPickupTime: '2024-01-15T14:05:00Z',
        actualDropoffTime: null,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        rating: null,
        notes: '',
        createdAt: '2024-01-15T13:45:00Z',
        updatedAt: '2024-01-15T14:05:00Z'
      }
    ]

    return {
      bookings: mockBookings,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: mockBookings.length,
        totalPages: Math.ceil(mockBookings.length / pagination.limit)
      }
    } as any
  }

  async getActiveBookings(): Promise<Booking[]> {
    // Mock data for active bookings
    return [
      {
        id: 'booking-2',
        customerId: 'customer-2',
        driverId: 'driver-1',
        customerName: 'Bob Smith' as any,
        driverName: 'John Doe',
        pickupLocation: {
          address: '789 Park Ave, New York, NY',
          latitude: 40.7505,
          longitude: -73.9934
        },
        dropoffLocation: {
          address: '321 5th Ave, New York, NY',
          latitude: 40.7505,
          longitude: -73.9934
        },
        status: 'in_transit',
        fare: {
          baseFare: 5.00,
          distanceFare: 13.75,
          totalFare: 18.75,
          currency: 'USD'
        },
        distance: 3.8,
        duration: 0,
        scheduledTime: '2024-01-15T14:00:00Z',
        actualPickupTime: '2024-01-15T14:05:00Z',
        actualDropoffTime: null,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        rating: null,
        notes: '',
        createdAt: '2024-01-15T13:45:00Z',
        updatedAt: '2024-01-15T14:05:00Z'
      } as any
    ] as any
  }

  async getBookingById(bookingId: string): Promise<Booking> {
    // Mock data for specific booking
    return {
      id: bookingId,
      customerId: 'customer-1',
      driverId: 'driver-1',
      customerName: 'Alice Johnson' as any,
      driverName: 'John Doe',
      pickupLocation: {
        address: '123 Main St, New York, NY',
        latitude: 40.7128,
        longitude: -74.0060
      },
      dropoffLocation: {
        address: '456 Broadway, New York, NY',
        latitude: 40.7589,
        longitude: -73.9851
      },
      status: 'delivered' as any,
      fare: {
        baseFare: 5.00,
        distanceFare: 20.50,
        totalFare: 25.50,
        currency: 'USD'
      },
      distance: 5.2,
      duration: 18,
      scheduledTime: '2024-01-15T10:30:00Z',
      actualPickupTime: '2024-01-15T10:35:00Z',
      actualDropoffTime: '2024-01-15T10:53:00Z',
      paymentMethod: 'card',
      paymentStatus: 'completed',
      rating: 5,
      notes: 'Great service!',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:53:00Z'
    } as any
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<{ status: string; message: string }> {
    const response = await apiService.put(`/admin/bookings/${bookingId}/status`, { status })
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
    const response = await apiService.post(`/admin/bookings/${bookingId}/intervene`, {
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
}

export const bookingService = new BookingService()
export default bookingService
