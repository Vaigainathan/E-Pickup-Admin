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

class DriverService {
  async getDrivers(
    pagination: PaginationParams,
    filters: FilterParams = {}
  ): Promise<DriversResponse> {
    try {
      const response = await apiService.get('/api/admin/drivers', {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      
      if (response.success && response.data) {
        return response.data as DriversResponse;
      }
      
      // Fallback to mock data if API fails
      const mockDrivers: any[] = [
      {
        id: 'driver-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        profilePicture: '',
        isVerified: true,
        isActive: true,
        rating: 4.8,
        totalTrips: 150,
        joinedDate: '2024-01-15',
        vehicle: {
          type: 'car',
          model: 'Toyota Camry',
          year: 2020,
          color: 'White',
          plateNumber: 'ABC123'
        },
        documents: {
          license: { verifiedAt: '2024-01-01T00:00:00Z', expiryDate: '2025-12-31' },
          insurance: { verifiedAt: '2024-01-01T00:00:00Z', expiryDate: '2025-06-30' },
          registration: { verifiedAt: '2024-01-01T00:00:00Z', expiryDate: '2025-03-15' }
        },
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'New York, NY',
          timestamp: new Date().toISOString()
        },
        status: 'verified',
        earnings: {
          total: 1850.00,
          thisMonth: 1850.00,
          lastMonth: 1650.00
        }
      },
      {
        id: 'driver-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        profilePicture: '',
        isVerified: false,
        isActive: true,
        rating: 0,
        totalTrips: 0,
        joinedDate: '2024-01-20',
        vehicle: {
          type: 'car',
          model: 'Honda Civic',
          year: 2019,
          color: 'Blue',
          plateNumber: 'XYZ789'
        },
        documents: {
          license: { verifiedAt: null, expiryDate: '2025-08-15' } as any,
          insurance: { verifiedAt: null, expiryDate: '2025-04-20' } as any,
          registration: { verifiedAt: null, expiryDate: '2025-01-10' } as any
        } as any,
        location: {
          latitude: 40.7589,
          longitude: -73.9851,
          address: 'Manhattan, NY',
          timestamp: new Date().toISOString()
        },
        status: 'pending',
        earnings: {
          total: 0,
          thisMonth: 0,
          lastMonth: 0
        }
      }
    ]

      return {
        drivers: mockDrivers,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: mockDrivers.length,
          totalPages: Math.ceil(mockDrivers.length / pagination.limit)
        }
      };
    } catch (error) {
      console.error('Error fetching drivers:', error);
      // Return empty result on error
      return {
        drivers: [],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  async getDriverById(driverId: string): Promise<Driver> {
    // Mock data for temporary use
    const mockDriver: any = {
      id: driverId,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      profilePicture: '',
      isVerified: true,
      isActive: true,
      rating: 4.8,
      totalTrips: 150,
      joinedDate: '2024-01-15',
      vehicle: {
        type: 'car',
        model: 'Toyota Camry',
        year: 2020,
        color: 'White',
        plateNumber: 'ABC123'
      },
        documents: {
          license: { verified: true, expiryDate: '2025-12-31' },
          insurance: { verified: true, expiryDate: '2025-06-30' },
          registration: { verified: true, expiryDate: '2025-03-15' }
        } as any,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'New York, NY',
          timestamp: new Date().toISOString()
        },
        status: 'verified',
        earnings: {
          total: 1850.00,
          thisMonth: 1850.00,
          lastMonth: 1650.00
        }
    }
    return mockDriver
  }

  async getPendingVerifications(): Promise<Driver[]> {
    try {
      const response = await apiService.get('/api/admin/drivers/pending');
      
      if (response.success && response.data) {
        return response.data as Driver[];
      }
      
      // Fallback to mock data if API fails
      return [
      {
        id: 'driver-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        profilePicture: '',
        isVerified: false,
        isActive: true,
        rating: 0,
        totalTrips: 0,
        joinedDate: '2024-01-20',
        vehicle: {
          type: 'car',
          model: 'Honda Civic',
          year: 2019,
          color: 'Blue',
          plateNumber: 'XYZ789'
        },
        documents: {
          license: { verifiedAt: null, expiryDate: '2025-08-15' } as any,
          insurance: { verifiedAt: null, expiryDate: '2025-04-20' } as any,
          registration: { verifiedAt: null, expiryDate: '2025-01-10' } as any
        } as any,
        location: {
          latitude: 40.7589,
          longitude: -73.9851,
          address: 'Manhattan, NY',
          timestamp: new Date().toISOString()
        },
        status: 'pending',
        earnings: {
          total: 0,
          thisMonth: 0,
          lastMonth: 0
        }
      }
    ] as any;
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      return [];
    }
  }

  async verifyDriver(
    driverId: string,
    status: 'verified' | 'rejected',
    reason?: string
  ): Promise<{ status: string; message: string }> {
    try {
      const response = await apiService.post(`/api/admin/drivers/${driverId}/verify`, {
        status,
        reason,
      });
      
      if (response.success && response.data) {
        return response.data as { status: string; message: string };
      }
      
      throw new Error(response.error?.message || 'Failed to verify driver');
    } catch (error) {
      console.error('Error verifying driver:', error);
      throw error;
    }
  }

  async updateDriverStatus(driverId: string, status: string): Promise<{ status: string; message: string }> {
    const response = await apiService.put(`/api/admin/drivers/${driverId}/status`, { status })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to update driver status')
  }

  async getDriverDocuments(driverId: string): Promise<any> {
    const response = await apiService.get(`/api/admin/drivers/${driverId}/documents`)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch driver documents')
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
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to verify document')
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
    throw new Error(response.error?.message || 'Failed to bulk verify drivers')
  }

  async getDriverAnalytics(): Promise<any> {
    const response = await apiService.get('/api/admin/drivers/analytics')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.error?.message || 'Failed to fetch driver analytics')
  }

  async suspendDriver(driverId: string, reason: string): Promise<{ message: string }> {
    const response = await apiService.put(`/api/admin/drivers/${driverId}/suspend`, { reason })
    if (response.success && response.data) {
      return response.data as { message: string }
    }
    throw new Error(response.error?.message || 'Failed to suspend driver')
  }

  async unsuspendDriver(driverId: string): Promise<{ message: string }> {
    const response = await apiService.put(`/api/admin/drivers/${driverId}/unsuspend`)
    if (response.success && response.data) {
      return response.data as { message: string }
    }
    throw new Error(response.error?.message || 'Failed to unsuspend driver')
  }

  async getDriverEarnings(driverId: string, period?: string): Promise<any> {
    const params = period ? { period } : {}
    const response = await apiService.get(`/api/admin/drivers/${driverId}/earnings`, params)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch driver earnings')
  }

  async updateDriverEarnings(
    driverId: string,
    earnings: { total: number; thisMonth: number; lastMonth: number }
  ): Promise<{ message: string }> {
    const response = await apiService.put(`/api/admin/drivers/${driverId}/earnings`, earnings)
    if (response.success && response.data) {
      return response.data as { message: string }
    }
    throw new Error(response.error?.message || 'Failed to update driver earnings')
  }
}

export const driverService = new DriverService()
export default driverService
