import { apiService } from './apiService'
import { AnalyticsData, TimeSeriesData } from '../types'

class AnalyticsService {
  async getAnalytics(
    startDate: string,
    endDate: string,
    // metrics?: string[] // Removed unused parameter
  ): Promise<AnalyticsData> {
    try {
      // Get real analytics data from backend
      // ✅ FIX: Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        this.getRevenueAnalytics(startDate, endDate).catch(() => ({ totalRevenue: 0, todayRevenue: 0, averageDailyRevenue: 0 })),
        this.getDriverAnalytics(startDate, endDate).catch(() => ({ totalDrivers: 0, activeDrivers: 0, verifiedDrivers: 0, pendingVerification: 0, averageRating: 0 })),
        this.getBookingAnalytics(startDate, endDate).catch(() => ({ totalBookings: 0, completedBookings: 0, cancelledBookings: 0, activeBookings: 0, activeCustomers: 0, totalCustomers: 0, newCustomers: 0, averageBookingValue: 0, completionRate: 0, averageTripDuration: 0, averageDistance: 0, peakHours: [] })),
        this.getSystemAnalytics(startDate, endDate).catch(() => ({ averageResponseTime: 0 }))
      ]);

      const revenueData = results[0].status === 'fulfilled' ? results[0].value : { totalRevenue: 0, todayRevenue: 0, averageDailyRevenue: 0 }
      const driverData = results[1].status === 'fulfilled' ? results[1].value : { totalDrivers: 0, activeDrivers: 0, verifiedDrivers: 0, pendingVerification: 0, averageRating: 0 }
      const bookingData = results[2].status === 'fulfilled' ? results[2].value : { totalBookings: 0, completedBookings: 0, cancelledBookings: 0, activeBookings: 0, activeCustomers: 0, totalCustomers: 0, newCustomers: 0, averageBookingValue: 0, completionRate: 0, averageTripDuration: 0, averageDistance: 0, peakHours: [] }
      const systemData = results[3].status === 'fulfilled' ? results[3].value : { averageResponseTime: 0 }

      return {
        period: `${startDate} to ${endDate}`,
        dateRange: { start: startDate, end: endDate },
        users: {
          total: (driverData.totalDrivers || 0) + (bookingData.totalCustomers || 0),
          drivers: driverData.totalDrivers || 0,
          customers: bookingData.totalCustomers || 0,
          growth: 0
        },
        bookings: {
          total: bookingData.totalBookings || 0,
          completed: bookingData.completedBookings || 0,
          active: bookingData.activeBookings || 0,
          completionRate: `${bookingData.completionRate || 0}%`
        },
        revenue: {
          total: revenueData.totalRevenue || 0,
          averagePerBooking: `${revenueData.totalRevenue > 0 && bookingData.totalBookings > 0 ? (revenueData.totalRevenue / bookingData.totalBookings).toFixed(2) : 0}`,
          driverEarnings: 0,
          platformCommission: 0
        },
        trends: {
          bookings: [],
          revenue: [],
          drivers: []
        }
      } as AnalyticsData;
    } catch (error) {
      console.error('Error getting analytics:', error);
      // ✅ FIX: Return properly structured fallback data
      return {
        period: `${startDate} to ${endDate}`,
        dateRange: { start: startDate, end: endDate },
        users: {
          total: 0,
          drivers: 0,
          customers: 0,
          growth: 0
        },
        bookings: {
          total: 0,
          completed: 0,
          active: 0,
          completionRate: '0%'
        },
        revenue: {
          total: 0,
          averagePerBooking: '0',
          driverEarnings: 0,
          platformCommission: 0
        },
        trends: {
          bookings: [],
          revenue: [],
          drivers: []
        }
      } as AnalyticsData;
    }
  }

  async getDriverAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/drivers', { startDate, endDate })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch driver analytics')
  }

  async getBookingAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/bookings', { startDate, endDate })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch booking analytics')
  }

  async getRevenueAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/revenue', { startDate, endDate })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch revenue analytics')
  }

  async getSystemAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/system', { startDate, endDate })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch system analytics')
  }

  async getEmergencyAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/emergency', { startDate, endDate })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch emergency analytics')
  }

  async getSupportAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/support', { startDate, endDate })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch support analytics')
  }

  async getUserAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/users', { startDate, endDate })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch user analytics')
  }

  async getGeographicAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/geographic', { startDate, endDate })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch geographic analytics')
  }

  async getPerformanceAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/performance', { startDate, endDate })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch performance analytics')
  }

  async getTrendAnalysis(metric: string, period: string = '30d'): Promise<TimeSeriesData[]> {
    const response = await apiService.get<TimeSeriesData[]>('/api/admin/analytics/trends', { metric, period })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch trend analysis')
  }

  async getComparativeAnalysis(
    metric: string,
    startDate1: string,
    endDate1: string,
    startDate2: string,
    endDate2: string
  ): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/compare', {
      metric,
      startDate1,
      endDate1,
      startDate2,
      endDate2,
    })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch comparative analysis')
  }

  async getKPIReport(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/kpi', { startDate, endDate })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch KPI report')
  }

  async exportAnalytics(
    startDate: string,
    endDate: string,
    format: 'csv' | 'xlsx' | 'pdf' = 'csv',
    metrics?: string[]
  ): Promise<Blob> {
    const params: any = { startDate, endDate, format }
    if (metrics) params.metrics = metrics.join(',')

    const response = await fetch(`${apiService['baseURL']}/admin/analytics/export?${new URLSearchParams(params)}`, {
      headers: {
        'Authorization': `Bearer ${apiService['token']}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to export analytics')
    }

    return response.blob()
  }

  async getRealTimeMetrics(): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/realtime')
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch real-time metrics')
  }

  async getCustomReport(
    reportId: string,
    parameters?: Record<string, any>
  ): Promise<any> {
    const response = await apiService.post(`/admin/analytics/reports/${reportId}`, parameters)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch custom report')
  }

  async createCustomReport(reportConfig: any): Promise<{ reportId: string; message: string }> {
    const response = await apiService.post('/api/admin/analytics/reports', reportConfig)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to create custom report')
  }

  async getReportTemplates(): Promise<any[]> {
    const response = await apiService.get<any[]>('/api/admin/analytics/reports/templates')
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch report templates')
  }
}

export const analyticsService = new AnalyticsService()
export default analyticsService
