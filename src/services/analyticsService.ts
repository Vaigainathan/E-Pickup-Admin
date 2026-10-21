import { apiService } from './apiService'
import { AnalyticsData } from '../types'
import { mapError } from './errorHandlerService'
import { ApiRequestError } from './apiService'

class AnalyticsService {
  async getAnalytics(startDate: string, endDate: string): Promise<AnalyticsData> {
    const [revenueData, driverData, bookingData] = await Promise.all([
      this.getRevenueAnalytics(startDate, endDate),
      this.getDriverAnalytics(startDate, endDate),
      this.getBookingAnalytics(startDate, endDate),
    ])

    return {
      period: `${startDate} to ${endDate}`,
      dateRange: { start: startDate, end: endDate },
      users: {
        total: (driverData.totalDrivers || 0) + (bookingData.totalCustomers || 0),
        drivers: driverData.totalDrivers || 0,
        customers: bookingData.totalCustomers || 0,
        growth: 0,
      },
      bookings: {
        total: bookingData.totalBookings || 0,
        completed: bookingData.completedBookings || 0,
        active: bookingData.activeBookings || 0,
        completionRate: `${bookingData.completionRate || 0}%`,
      },
      revenue: {
        total: revenueData.totalRevenue || 0,
        averagePerBooking: `${revenueData.totalRevenue > 0 && bookingData.totalBookings > 0 ? (revenueData.totalRevenue / bookingData.totalBookings).toFixed(2) : 0}`,
        driverEarnings: 0,
        platformCommission: 0,
      },
      trends: { bookings: [], revenue: [], drivers: [] },
    } as AnalyticsData
  }

  async getDriverAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/drivers', { startDate, endDate })
    if (response.success && response.data) return response.data
    throw new ApiRequestError(response.error?.code || 'UNKNOWN_ERROR', mapError({ code: response.error?.code }))
  }

  async getBookingAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/bookings', { startDate, endDate })
    if (response.success && response.data) return response.data
    throw new ApiRequestError(response.error?.code || 'UNKNOWN_ERROR', mapError({ code: response.error?.code }))
  }

  async getRevenueAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/revenue', { startDate, endDate })
    if (response.success && response.data) return response.data
    throw new ApiRequestError(response.error?.code || 'UNKNOWN_ERROR', mapError({ code: response.error?.code }))
  }

  async getSystemAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/system', { startDate, endDate })
    if (response.success && response.data) return response.data
    throw new ApiRequestError(response.error?.code || 'UNKNOWN_ERROR', mapError({ code: response.error?.code }))
  }

  async getEmergencyAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/emergency', { startDate, endDate })
    if (response.success && response.data) return response.data
    throw new ApiRequestError(response.error?.code || 'UNKNOWN_ERROR', mapError({ code: response.error?.code }))
  }

  async getSupportAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/support', { startDate, endDate })
    if (response.success && response.data) return response.data
    throw new ApiRequestError(response.error?.code || 'UNKNOWN_ERROR', mapError({ code: response.error?.code }))
  }
}

export const analyticsService = new AnalyticsService()
export default analyticsService
