import { apiService } from './apiService'

export interface DriverDataEntry {
  id: string
  driverId: string
  driverInfo: {
    name: string
    email: string
    phone: string
  } | null
  vehicleDetails: {
    vehicleType: 'motorcycle' | 'electric'
    vehicleNumber: string
    vehicleMake: string
    vehicleModel: string
    vehicleYear: number
    vehicleColor: string
    licenseNumber: string
    licenseExpiry: string
    rcNumber: string
    insuranceNumber: string
    insuranceExpiry: string
  }
  status: 'pending_verification' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  reviewComments?: string
  rejectionReason?: string
  reviewHistory: Array<{
    action: 'approved' | 'rejected'
    timestamp: string
    reviewedBy: string
    rejectionReason?: string
    comments?: string
  }>
  documentVerification?: any
}

export interface DriverDataStats {
  total: number
  pending: number
  approved: number
  rejected: number
  recent: number
  approvalRate: number
}

export interface PaginationParams {
  limit?: number
  offset?: number
}

class DriverDataService {
  /**
   * Get all pending driver data entries for admin review
   */
  async getPendingEntries(params: PaginationParams = {}): Promise<{
    entries: DriverDataEntry[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }> {
    try {
      const response = await apiService.get('/api/admin/driver-data/pending', params)
      
      if (response.success && response.data) {
        return response.data as {
          entries: DriverDataEntry[]
          pagination: {
            total: number
            limit: number
            offset: number
            hasMore: boolean
          }
        }
      }
      
      throw new Error('Failed to fetch pending driver data entries')
    } catch (error) {
      console.error('Error fetching pending driver data entries:', error)
      throw error
    }
  }

  /**
   * Get a specific driver data entry by ID
   */
  async getDriverDataEntry(entryId: string): Promise<DriverDataEntry> {
    try {
      const response = await apiService.get(`/api/admin/driver-data/${entryId}`)
      
      if (response.success && response.data) {
        return (response.data as { entry: DriverDataEntry }).entry
      }
      
      throw new Error('Failed to fetch driver data entry')
    } catch (error) {
      console.error('Error fetching driver data entry:', error)
      throw error
    }
  }

  /**
   * Approve a driver data entry
   */
  async approveDriverDataEntry(entryId: string, reviewComments?: string): Promise<void> {
    try {
      const response = await apiService.post(`/api/admin/driver-data/${entryId}/approve`, {
        reviewComments
      })
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to approve driver data entry')
      }
    } catch (error) {
      console.error('Error approving driver data entry:', error)
      throw error
    }
  }

  /**
   * Reject a driver data entry
   */
  async rejectDriverDataEntry(entryId: string, rejectionReason: string, reviewComments?: string): Promise<void> {
    try {
      const response = await apiService.post(`/api/admin/driver-data/${entryId}/reject`, {
        rejectionReason,
        reviewComments
      })
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to reject driver data entry')
      }
    } catch (error) {
      console.error('Error rejecting driver data entry:', error)
      throw error
    }
  }

  /**
   * Get driver data entry statistics
   */
  async getDriverDataStats(): Promise<DriverDataStats> {
    try {
      const response = await apiService.get('/api/admin/driver-data/stats')
      
      if (response.success && response.data) {
        return response.data as DriverDataStats
      }
      
      throw new Error('Failed to fetch driver data statistics')
    } catch (error) {
      console.error('Error fetching driver data statistics:', error)
      throw error
    }
  }

  /**
   * Get driver data entries by status
   */
  async getDriverDataEntriesByStatus(status: 'pending_verification' | 'approved' | 'rejected', params: PaginationParams = {}): Promise<{
    entries: DriverDataEntry[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }> {
    try {
      const response = await apiService.get('/api/admin/driver-data/pending', {
        ...params,
        status
      })
      
      if (response.success && response.data) {
        return response.data as {
          entries: DriverDataEntry[]
          pagination: {
            total: number
            limit: number
            offset: number
            hasMore: boolean
          }
        }
      }
      
      throw new Error('Failed to fetch driver data entries')
    } catch (error) {
      console.error('Error fetching driver data entries:', error)
      throw error
    }
  }
}

export const driverDataService = new DriverDataService()
