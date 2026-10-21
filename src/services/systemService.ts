import { apiService } from './apiService'
import { SystemMetrics } from '../types'
import { mapError } from './errorHandlerService'
import { ApiRequestError } from './apiService'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  services: {
    api: boolean
    database: boolean
    websocket: boolean
    firebase: boolean
  }
  uptime: number
  lastCheck: string
}

interface ConnectedUsers {
  total: number
  customers: number
  drivers: number
  admins: number
}

class SystemService {
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiService.get<SystemHealth>('/api/admin/system/health')
    if (response.success && response.data) {
      return response.data as SystemHealth
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const response = await apiService.get<SystemMetrics>('/api/admin/system/metrics')
    if (response.success && response.data) {
      return response.data as SystemMetrics
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async getSystemLogs(params?: { limit?: number; level?: string }): Promise<any[]> {
    const response = await apiService.get<any[]>('/api/admin/system/logs', params)
    if (response.success && response.data) {
      return response.data as any[]
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async getConnectedUsers(): Promise<ConnectedUsers> {
    const response = await apiService.get<ConnectedUsers>('/api/admin/system/users/online')
    if (response.success && response.data) {
      return response.data as ConnectedUsers
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async restartSystem(serviceName?: string): Promise<{ message: string }> {
    const response = await apiService.post('/api/admin/system/restart', { service: serviceName })
    if (response.success) return { message: 'System restart initiated' }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async clearCache(cacheType?: string): Promise<{ message: string }> {
    const response = await apiService.post('/api/admin/system/clear-cache', { cacheType })
    if (response.success) return { message: 'Cache cleared' }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }
}

export const systemService = new SystemService()
export default systemService
