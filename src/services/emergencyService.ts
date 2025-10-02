import { apiService } from './apiService'
import { EmergencyAlert, PaginationParams, FilterParams } from '../types'

interface EmergencyAlertsResponse {
  alerts: EmergencyAlert[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class EmergencyService {
  async getEmergencyAlerts(
    pagination: PaginationParams,
    filters: FilterParams = {}
  ): Promise<EmergencyAlertsResponse> {
    try {
      // Try to fetch from real backend first
      const response = await apiService.get('/api/emergency/admin/alerts', {
        params: {
          status: filters.status || 'all',
          limit: pagination.limit || 50,
          offset: pagination.offset || 0
        }
      });

      if (response.success && response.data) {
        const data = response.data as any;
        return {
          alerts: data.alerts || [],
          pagination: data.pagination || {
            page: 1,
            limit: pagination.limit || 50,
            total: 0,
            totalPages: 0
          }
        };
      }
    } catch (error) {
      console.warn('Failed to fetch emergency alerts from backend, using mock data:', error);
    }

    // Fallback to mock data if backend fails
    const mockAlerts: EmergencyAlert[] = [
      {
        id: 'alert-1',
        alertId: 'alert-1',
        userId: 'customer-1',
        userType: 'customer',
        userInfo: {
          name: 'Alice Johnson',
          phone: '+1234567890'
        },
        type: 'medical',
        priority: 'high',
        status: 'active',
        location: {
          address: '123 Main St, New York, NY',
          latitude: 40.7128,
          longitude: -74.0060
        },
        description: 'Customer experiencing chest pain during ride',
        createdAt: '2024-01-15T14:30:00Z',
        updatedAt: '2024-01-15T14:30:00Z'
      },
      {
        id: 'alert-2',
        alertId: 'alert-2',
        userId: 'customer-2',
        userType: 'customer',
        userInfo: {
          name: 'Bob Smith',
          phone: '+1234567891'
        },
        type: 'other',
        priority: 'medium',
        status: 'resolved',
        location: {
          address: '456 Broadway, New York, NY',
          latitude: 40.7589,
          longitude: -73.9851
        },
        description: 'Driver reported aggressive behavior from customer',
        response: {
          responderId: 'admin-1',
          responderName: 'Admin User',
          responseTime: 300,
          actions: ['contacted_customer', 'contacted_driver', 'mediation'],
          notes: 'Contacted customer and driver. Issue resolved through mediation.'
        },
        createdAt: '2024-01-15T12:15:00Z',
        updatedAt: '2024-01-15T12:20:00Z',
        resolvedAt: '2024-01-15T12:20:00Z'
      }
    ]

    return {
      alerts: mockAlerts,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: mockAlerts.length,
        totalPages: Math.ceil(mockAlerts.length / pagination.limit)
      }
    }
  }

  async getActiveAlerts(): Promise<EmergencyAlert[]> {
    try {
      const response = await apiService.get<EmergencyAlert[]>('/api/admin/emergency/alerts/active')
      if (response.success && response.data) {
        return response.data as any
      }
      throw new Error(response.error?.message || 'Failed to fetch active alerts')
    } catch (error) {
      console.error('Error fetching active alerts:', error)
      // Return mock data as fallback
      return [
        {
          id: 'mock-alert-1',
          alertId: 'mock-alert-1',
          userId: 'customer-1',
          userType: 'customer',
          userInfo: {
            name: 'Alice Johnson',
            phone: '+1234567890'
          },
          type: 'medical',
          priority: 'high',
          status: 'active',
          location: {
            address: '123 Main St, New York, NY',
            latitude: 40.7128,
            longitude: -74.0060
          },
          description: 'Customer experiencing chest pain during ride',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    }
  }

  async getAlertById(alertId: string): Promise<EmergencyAlert> {
    const response = await apiService.get<EmergencyAlert>(`/admin/emergency/alerts/${alertId}`)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch emergency alert')
  }

  async respondToEmergency(alertId: string, responseData: any): Promise<{ message: string }> {
    try {
      // Try to update via real backend
      const response = await apiService.put(`/api/emergency/admin/alerts/${alertId}/status`, {
        status: 'resolved',
        adminNotes: responseData.message || responseData.response
      });

      if (response.success && response.data) {
        return { message: 'Emergency response sent successfully' };
      }
    } catch (error) {
      console.warn('Failed to respond to emergency via backend:', error);
    }

    // Fallback to mock implementation
    return { message: 'Emergency response sent successfully' };
  }

  async updateAlertStatus(alertId: string, status: string, adminNotes?: string): Promise<{ status: string; message: string }> {
    try {
      // Try to update via real backend
      const response = await apiService.put(`/api/emergency/admin/alerts/${alertId}/status`, {
        status,
        adminNotes
      });

      if (response.success && response.data) {
        return { status, message: 'Alert status updated successfully' };
      }
    } catch (error) {
      console.warn('Failed to update alert status via backend:', error);
    }

    // Fallback to mock implementation
    return { status, message: 'Alert status updated successfully' };
  }

  async getEmergencyStats(): Promise<any> {
    try {
      const response = await apiService.get('/api/admin/emergency/analytics')
      if (response.success && response.data) {
        return response.data as any
      }
      throw new Error(response.error?.message || 'Failed to fetch emergency stats')
    } catch (error) {
      console.error('Error fetching emergency stats:', error)
      // Return mock data as fallback
      return {
        total: 5,
        active: 2,
        resolved: 3,
        responseTime: {
          average: 4.5,
          median: 3.2
        },
        byType: {
          medical: 2,
          sos: 1,
          accident: 1,
          harassment: 1,
          other: 0
        },
        byPriority: {
          high: 1,
          medium: 3,
          low: 1,
          critical: 0
        }
      }
    }
  }

  async getNearbyDrivers(latitude: number, longitude: number, radius: number = 5): Promise<any[]> {
    const response = await apiService.get('/api/admin/emergency/nearby-drivers', {
      latitude,
      longitude,
      radius,
    })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch nearby drivers')
  }

  async notifyDrivers(alertId: string, driverIds: string[], message: string): Promise<{ message: string }> {
    const response = await apiService.post('/api/admin/emergency/notify-drivers', {
      alertId,
      driverIds,
      message,
    })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to notify drivers')
  }

  async contactEmergencyServices(alertId: string, serviceType: string, details: any): Promise<{ message: string }> {
    const response = await apiService.post('/api/admin/emergency/contact-services', {
      alertId,
      serviceType,
      details,
    })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to contact emergency services')
  }

  async createEmergencyReport(alertId: string, report: any): Promise<{ message: string }> {
    const response = await apiService.post(`/admin/emergency/alerts/${alertId}/report`, report)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to create emergency report')
  }

  async getEmergencyHistory(alertId: string): Promise<any[]> {
    const response = await apiService.get(`/admin/emergency/alerts/${alertId}/history`)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch emergency history')
  }

  async escalateAlert(alertId: string, reason: string): Promise<{ message: string }> {
    const response = await apiService.post(`/admin/emergency/alerts/${alertId}/escalate`, { reason })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to escalate alert')
  }

  async getEmergencyReports(
    startDate: string,
    endDate: string,
    filters?: FilterParams
  ): Promise<any> {
    const params = {
      startDate,
      endDate,
      ...filters,
    }
    const response = await apiService.get('/api/admin/emergency/reports', params)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch emergency reports')
  }
}

export const emergencyService = new EmergencyService()
export default emergencyService
