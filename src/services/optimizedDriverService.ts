import { apiService } from './apiService'
import { Driver, PaginationParams, FilterParams } from '../types'

interface DriversResponse {
  drivers: Driver[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class OptimizedDriverService {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}_${JSON.stringify(params || {})}`
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (entry && this.isCacheValid(entry)) {
      return entry.data as T
    }
    if (entry) {
      this.cache.delete(key)
    }
    return null
  }

  private setCachedData<T>(key: string, data: T, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  private clearCache(): void {
    this.cache.clear()
  }

  async getDrivers(
    pagination: PaginationParams,
    filters: FilterParams = {}
  ): Promise<DriversResponse> {
    const cacheKey = this.getCacheKey('drivers', { pagination, filters })
    const cachedData = this.getCachedData<DriversResponse>(cacheKey)
    
    if (cachedData) {
      console.log('📦 Using cached drivers data')
      return cachedData
    }

    try {
      console.log('🌐 Fetching drivers from API...')
      const response = await apiService.get('/api/admin/drivers', {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      })
      
      if (response.success && response.data) {
        const result = response.data as DriversResponse
        this.setCachedData(cacheKey, result)
        console.log('✅ Drivers data cached successfully')
        return result
      }
      
      // Return empty result if API fails
      const emptyResult: DriversResponse = {
        drivers: [],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: 0,
          totalPages: 0
        }
      }
      
      console.log('⚠️ API failed, returning empty drivers list')
      return emptyResult
      
    } catch (error) {
      console.error('❌ Error fetching drivers:', error)
      
      // Return empty result on error
      const emptyResult: DriversResponse = {
        drivers: [],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: 0,
          totalPages: 0
        }
      }
      
      return emptyResult
    }
  }

  async getDriverById(driverId: string): Promise<Driver | null> {
    const cacheKey = this.getCacheKey('driver', { driverId })
    const cachedData = this.getCachedData<Driver>(cacheKey)
    
    if (cachedData) {
      console.log('📦 Using cached driver data')
      return cachedData
    }

    try {
      console.log('🌐 Fetching driver details from API...')
      const response = await apiService.get(`/api/admin/drivers/${driverId}`)
      
      if (response.success && response.data) {
        const driver = response.data as Driver
        this.setCachedData(cacheKey, driver)
        console.log('✅ Driver data cached successfully')
        return driver
      }
      
      console.log('⚠️ Driver not found')
      return null
      
    } catch (error) {
      console.error('❌ Error fetching driver:', error)
      return null
    }
  }

  async getPendingVerifications(): Promise<Driver[]> {
    const cacheKey = this.getCacheKey('pending_verifications')
    const cachedData = this.getCachedData<Driver[]>(cacheKey)
    
    if (cachedData) {
      console.log('📦 Using cached pending verifications')
      return cachedData
    }

    try {
      console.log('🌐 Fetching pending verifications from API...')
      const response = await apiService.get('/api/admin/drivers/pending')
      
      if (response.success && response.data) {
        const drivers = response.data as Driver[]
        this.setCachedData(cacheKey, drivers, 2 * 60 * 1000) // 2 minutes cache for pending
        console.log('✅ Pending verifications cached successfully')
        return drivers
      }
      
      console.log('⚠️ No pending verifications found')
      return []
      
    } catch (error) {
      console.error('❌ Error fetching pending verifications:', error)
      return []
    }
  }

  async verifyDriver(
    driverId: string,
    status: 'verified' | 'rejected',
    reason?: string
  ): Promise<{ status: string; message: string }> {
    try {
      console.log('🌐 Verifying driver...', { driverId, status, reason })
      const response = await apiService.post(`/api/admin/drivers/${driverId}/verify`, {
        status,
        reason,
      })
      
      if (response.success && response.data) {
        // Clear cache after successful verification
        this.clearCache()
        console.log('✅ Driver verification successful')
        return response.data as { status: string; message: string }
      }
      
      throw new Error(response.error?.message || 'Failed to verify driver')
      
    } catch (error) {
      console.error('❌ Error verifying driver:', error)
      throw error
    }
  }

  async updateDriverStatus(driverId: string, status: string): Promise<{ status: string; message: string }> {
    try {
      console.log('🌐 Updating driver status...', { driverId, status })
      const response = await apiService.put(`/api/admin/drivers/${driverId}/status`, { status })
      
      if (response.success && response.data) {
        // Clear cache after successful update
        this.clearCache()
        console.log('✅ Driver status updated successfully')
        return response.data as { status: string; message: string }
      }
      
      throw new Error(response.error?.message || 'Failed to update driver status')
      
    } catch (error) {
      console.error('❌ Error updating driver status:', error)
      throw error
    }
  }

  async getDriverDocuments(driverId: string): Promise<any> {
    const cacheKey = this.getCacheKey('driver_documents', { driverId })
    const cachedData = this.getCachedData<any>(cacheKey)
    
    if (cachedData) {
      console.log('📦 Using cached driver documents')
      return cachedData
    }

    try {
      console.log('🌐 Fetching driver documents...', { driverId })
      const response = await apiService.get(`/api/admin/drivers/${driverId}/documents`)
      
      if (response.success && response.data) {
        this.setCachedData(cacheKey, response.data)
        console.log('✅ Driver documents cached successfully')
        return response.data
      }
      
      throw new Error(response.error?.message || 'Failed to fetch driver documents')
      
    } catch (error) {
      console.error('❌ Error fetching driver documents:', error)
      throw error
    }
  }

  async verifyDocument(
    driverId: string,
    documentType: string,
    status: 'verified' | 'rejected',
    reason?: string
  ): Promise<{ status: string; message: string }> {
    try {
      console.log('🌐 Verifying document...', { driverId, documentType, status, reason })
      const response = await apiService.post(`/api/admin/drivers/${driverId}/documents/${documentType}/verify`, {
        status,
        comments: reason,
      })
      
      if (response.success && response.data) {
        // Clear cache after successful verification
        this.clearCache()
        console.log('✅ Document verification successful')
        return response.data as { status: string; message: string }
      }
      
      throw new Error(response.error?.message || 'Failed to verify document')
      
    } catch (error) {
      console.error('❌ Error verifying document:', error)
      throw error
    }
  }

  async bulkVerifyDrivers(
    driverIds: string[],
    status: 'verified' | 'rejected',
    reason?: string
  ): Promise<{ verifiedDrivers: string[]; message: string }> {
    try {
      console.log('🌐 Bulk verifying drivers...', { driverIds, status, reason })
      const response = await apiService.post('/api/admin/drivers/bulk-verify', {
        driverIds,
        status,
        reason,
      })
      
      if (response.success && response.data) {
        // Clear cache after successful bulk verification
        this.clearCache()
        console.log('✅ Bulk driver verification successful')
        return response.data as { verifiedDrivers: string[]; message: string }
      }
      
      throw new Error(response.error?.message || 'Failed to bulk verify drivers')
      
    } catch (error) {
      console.error('❌ Error bulk verifying drivers:', error)
      throw error
    }
  }

  async getDriverAnalytics(): Promise<any> {
    const cacheKey = this.getCacheKey('driver_analytics')
    const cachedData = this.getCachedData<any>(cacheKey)
    
    if (cachedData) {
      console.log('📦 Using cached driver analytics')
      return cachedData
    }

    try {
      console.log('🌐 Fetching driver analytics...')
      const response = await apiService.get('/api/admin/drivers/analytics')
      
      if (response.success && response.data) {
        this.setCachedData(cacheKey, response.data, 10 * 60 * 1000) // 10 minutes cache for analytics
        console.log('✅ Driver analytics cached successfully')
        return response.data
      }
      
      throw new Error(response.error?.message || 'Failed to fetch driver analytics')
      
    } catch (error) {
      console.error('❌ Error fetching driver analytics:', error)
      throw error
    }
  }

  // Utility methods
  clearAllCache(): void {
    this.clearCache()
    console.log('🗑️ All driver service cache cleared')
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const optimizedDriverService = new OptimizedDriverService()
export default optimizedDriverService
