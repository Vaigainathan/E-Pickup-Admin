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
      const [revenueData, driverData, bookingData, systemData] = await Promise.all([
        this.getRevenueAnalytics(startDate, endDate),
        this.getDriverAnalytics(startDate, endDate),
        this.getBookingAnalytics(startDate, endDate),
        this.getSystemAnalytics(startDate, endDate)
      ]);

      return {
        overview: {
          totalBookings: bookingData.totalBookings || 0,
          totalRevenue: revenueData.totalRevenue || 0,
          activeDrivers: driverData.activeDrivers || 0,
          activeCustomers: bookingData.activeCustomers || 0,
          averageRating: driverData.averageRating || 0,
          completionRate: bookingData.completionRate || 0
        } as any,
        bookings: {
          total: bookingData.totalBookings || 0,
          completed: bookingData.completedBookings || 0,
          cancelled: bookingData.cancelledBookings || 0,
          active: bookingData.activeBookings || 0,
          scheduled: 0
        } as any,
        revenue: {
          total: revenueData.totalRevenue || 0,
          today: revenueData.todayRevenue || 0,
          thisWeek: (revenueData.averageDailyRevenue || 0) * 7,
          thisMonth: revenueData.totalRevenue || 0,
          averagePerBooking: bookingData.averageBookingValue || 0
        },
        drivers: {
          total: driverData.totalDrivers || 0,
          active: driverData.activeDrivers || 0,
          verified: driverData.verifiedDrivers || 0,
          pending: driverData.pendingVerification || 0,
          pendingVerification: driverData.pendingVerification || 0,
          averageRating: driverData.averageRating || 0
        } as any,
        customers: {
          total: bookingData.totalCustomers || 0,
          active: bookingData.activeCustomers || 0,
          newThisMonth: bookingData.newCustomers || 0,
          averageRating: 4.8
        },
        performance: {
          averageResponseTime: systemData.averageResponseTime || 0,
          averageTripDuration: bookingData.averageTripDuration || 0,
          averageDistance: bookingData.averageDistance || 0,
          peakHours: bookingData.peakHours || []
        }
      } as any;
    } catch (error) {
      console.error('Error getting analytics:', error);
      // Return fallback data if API fails
      return {
        overview: {
          totalBookings: 0,
          totalRevenue: 0,
          activeDrivers: 0,
          activeCustomers: 0,
          averageRating: 0,
          completionRate: 0
        } as any,
        bookings: {
          total: 0,
          completed: 0,
          cancelled: 0,
          active: 0,
          scheduled: 0
        } as any,
        revenue: {
          total: 0,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          averagePerBooking: 0
        },
        drivers: {
          total: 0,
          active: 0,
          verified: 0,
          pending: 0,
          pendingVerification: 0,
          averageRating: 0
        } as any,
        customers: {
          total: 0,
          active: 0,
          newThisMonth: 0,
          averageRating: 0
        },
        performance: {
          averageResponseTime: 0,
          averageTripDuration: 0,
          averageDistance: 0,
          peakHours: []
        }
      } as any;
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
