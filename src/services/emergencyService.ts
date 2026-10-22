import { apiService } from './apiService'
import { EmergencyAlert, PaginationParams, FilterParams } from '../types'
import { mapError } from './errorHandlerService'
import { ApiRequestError } from './apiService'

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
    const response = await apiService.get('/api/admin/emergency-alerts', {
      status: filters.status || 'all',
      limit: pagination.limit || 50,
      offset: pagination.offset || 0,
      page: pagination.page,
    })

    if (response.success && response.data) {
      const data = response.data as any
      const alerts = data.alerts ?? (Array.isArray(data) ? data : [])
      return {
        alerts,
        pagination: data.pagination || {
          page: pagination.page,
          limit: pagination.limit,
          total: alerts.length,
          totalPages: 1,
        },
      }
    }

    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async getActiveAlerts(): Promise<EmergencyAlert[]> {
    const response = await apiService.get<EmergencyAlert[]>('/api/admin/emergency/alerts/active')
    if (response.success && response.data) {
      const data = response.data as any
      return Array.isArray(data) ? data : data.alerts || []
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async getEmergencyStats(): Promise<any> {
    const response = await apiService.get('/api/admin/emergency/analytics')
    if (response.success && response.data) return response.data
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async getNearbyDrivers(latitude: number, longitude: number, radiusKm?: number): Promise<any> {
    const response = await apiService.get('/api/admin/emergency/nearby-drivers', {
      latitude,
      longitude,
      radiusKm,
    })
    if (response.success && response.data) return response.data
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async notifyDrivers(payload: Record<string, unknown>): Promise<any> {
    const response = await apiService.post('/api/admin/emergency/notify-drivers', payload)
    if (response.success) return response.data
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async updateAlertStatus(
    alertId: string,
    status: 'acknowledged' | 'resolved',
    note?: string,
  ): Promise<unknown> {
    const response = await apiService.put(`/api/admin/emergency/alerts/${alertId}/status`, {
      status,
      note,
    })
    if (response.success) {
      return response.data
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async contactServices(payload: Record<string, unknown>): Promise<any> {
    const response = await apiService.post('/api/admin/emergency/contact-services', payload)
    if (response.success) return response.data
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }
}

export const emergencyService = new EmergencyService()
export default emergencyService
