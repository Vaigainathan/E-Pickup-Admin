import { apiService } from './apiService'
import { Driver, PaginationParams, FilterParams } from '../types'
import { mapError } from './errorHandlerService'

interface DriversResponse {
  drivers: Driver[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class DriverService {
  async getDrivers(
    pagination: PaginationParams,
    filters: FilterParams = {}
  ): Promise<DriversResponse> {
    const response = await apiService.get('/api/admin/drivers', {
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
    })

    if (response.success && response.data) {
      return response.data as DriversResponse
    }

    throw new Error(mapError(response.error || response))
  }

  async getDriverById(driverId: string): Promise<Driver> {
    const response = await apiService.get(`/api/admin/drivers/${driverId}`)
    if (response.success && response.data) {
      return response.data as Driver
    }
    throw new Error(mapError(response.error || response))
  }

  async getPendingVerifications(): Promise<Driver[]> {
    const response = await apiService.get('/api/admin/drivers/pending')
    if (response.success && response.data) {
      return response.data as Driver[]
    }
    throw new Error(mapError(response.error || response))
  }

  async verifyDriver(
    driverId: string,
    status: 'verified' | 'rejected',
    reason?: string
  ): Promise<{ status: string; message: string }> {
    const response = await apiService.post(`/api/admin/drivers/${driverId}/verify`, {
      status,
      reason,
    })

    if (response.success && response.data) {
      return response.data as { status: string; message: string }
    }
    throw new Error(mapError(response.error || response))
  }

  async updateDriverStatus(driverId: string, status: string): Promise<{ status: string; message: string }> {
    const response = await apiService.put(`/api/admin/drivers/${driverId}/status`, { status })
    if (response.success && response.data) {
      return response.data as { status: string; message: string }
    }
    throw new Error(mapError(response.error || response))
  }

  async getDriverDocuments(driverId: string): Promise<any> {
    const response = await apiService.get(`/api/admin/drivers/${driverId}/documents`)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(mapError(response.error || response))
  }

  async verifyDocument(
    driverId: string,
    documentType: string,
    status: 'verified' | 'rejected',
    reason?: string
  ): Promise<{ status: string; message: string }> {
    const response = await apiService.post(`/api/admin/drivers/${driverId}/documents/${documentType}/verify`, {
      status,
      comments: reason,
    })
    if (response.success && response.data) {
      return response.data as { status: string; message: string }
    }
    throw new Error(mapError(response.error || response))
  }

  async bulkVerifyDrivers(
    driverIds: string[],
    status: 'verified' | 'rejected',
    reason?: string
  ): Promise<{ verifiedDrivers: string[]; message: string }> {
    const response = await apiService.post('/api/admin/drivers/bulk-verify', {
      driverIds,
      status,
      reason,
    })
    if (response.success && response.data) {
      return response.data as { verifiedDrivers: string[]; message: string }
    }
    throw new Error(mapError(response.error || response))
  }

  async getDriverAnalytics(): Promise<any> {
    const response = await apiService.get('/api/admin/drivers/analytics')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(mapError(response.error || response))
  }

  async suspendDriver(driverId: string, reason: string): Promise<{ message: string }> {
    const response = await apiService.put(`/api/admin/drivers/${driverId}/suspend`, { reason })
    if (response.success && response.data) {
      return response.data as { message: string }
    }
    throw new Error(mapError(response.error || response))
  }

  async unsuspendDriver(driverId: string): Promise<{ message: string }> {
    const response = await apiService.put(`/api/admin/drivers/${driverId}/unsuspend`)
    if (response.success && response.data) {
      return response.data as { message: string }
    }
    throw new Error(mapError(response.error || response))
  }

  async getDriverEarnings(driverId: string, period?: string): Promise<any> {
    const params = period ? { period } : {}
    const response = await apiService.get(`/api/admin/drivers/${driverId}/earnings`, params)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(mapError(response.error || response))
  }

  async updateDriverEarnings(
    driverId: string,
    earnings: { total: number; thisMonth: number; lastMonth: number }
  ): Promise<{ message: string }> {
    const response = await apiService.put(`/api/admin/drivers/${driverId}/earnings`, earnings)
    if (response.success && response.data) {
      return response.data as { message: string }
    }
    throw new Error(mapError(response.error || response))
  }
}

export const driverService = new DriverService()
export default driverService
