import { apiService } from './apiService'
import { realTimeService } from './realTimeService'
import { emergencyService } from './emergencyService'
import { Driver, Booking, EmergencyAlert, SupportTicket, SystemHealth, Customer } from '../types'

interface AdminServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: string
  }
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  timestamp?: string
}



class ComprehensiveAdminService {
  private isInitialized = false
  private realTimeListeners: Map<string, () => void> = new Map()
  private cleanupFunctions: (() => void)[] = []

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize real-time service with timeout and graceful fallback
      try {
        const connectPromise = realTimeService.connect()
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Real-time service connection timeout')), 10000)
        })
        
        await Promise.race([connectPromise, timeoutPromise])
        console.log('✅ Real-time service connected successfully')
      } catch (rtError) {
        console.error('⚠️ Real-time service connection failed:', rtError)
        console.log('⚠️ Continuing without real-time service...')
        // Don't fail initialization if real-time service fails
      }
      
      this.isInitialized = true
      console.log('✅ Comprehensive Admin Service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Comprehensive Admin Service:', error)
      
      // Clean up on initialization failure
      this.cleanup()
      
      // Don't throw error - let the app continue with limited functionality
      console.log('⚠️ Admin service initialization failed, continuing with limited functionality')
      this.isInitialized = true // Mark as initialized to prevent retry loops
    }
  }

  cleanup(): void {
    console.log('🧹 Cleaning up Comprehensive Admin Service...')
    
    // Clean up real-time listeners
    this.realTimeListeners.forEach((unsubscribe, key) => {
      try {
        unsubscribe()
        console.log(`✅ Cleaned up listener: ${key}`)
      } catch (error) {
        console.error(`❌ Error cleaning up listener ${key}:`, error)
      }
    })
    this.realTimeListeners.clear()
    
    // Clean up other resources
    this.cleanupFunctions.forEach((cleanup, index) => {
      try {
        cleanup()
        console.log(`✅ Cleaned up resource: ${index}`)
      } catch (error) {
        console.error(`❌ Error cleaning up resource ${index}:`, error)
      }
    })
    this.cleanupFunctions = []
    
    // Disconnect real-time service
    try {
      realTimeService.disconnect()
      console.log('✅ Real-time service disconnected')
    } catch (error) {
      console.error('❌ Error disconnecting real-time service:', error)
    }
    
    this.isInitialized = false
    console.log('✅ Comprehensive Admin Service cleanup completed')
  }

  // Driver Management
  async deleteDriver(driverId: string): Promise<AdminServiceResponse> {
    try {
      // Validate driver ID
      if (!driverId || typeof driverId !== 'string' || driverId.length < 3) {
        throw new Error('Invalid driver ID provided')
      }

      // Sanitize driver ID
      const sanitizedDriverId = driverId.trim().replace(/[^a-zA-Z0-9-_]/g, '')
      if (sanitizedDriverId !== driverId) {
        throw new Error('Driver ID contains invalid characters')
      }

      console.log(`🗑️ Deleting driver: ${sanitizedDriverId}`)
      const response = await apiService.delete(`/api/admin/drivers/${sanitizedDriverId}`)
      
      if (response.success) {
        console.log('✅ Driver deleted successfully')
        return {
          success: true,
          message: 'Driver deleted successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: 'DELETE_DRIVER_ERROR',
          message: response.error?.message || 'Failed to delete driver'
        }
      }
    } catch (error) {
      console.error('❌ Error deleting driver:', error)
      return {
        success: false,
        error: {
          code: 'DELETE_DRIVER_ERROR',
          message: 'Failed to delete driver'
        }
      }
    }
  }

  async banDriver(driverId: string, reason?: string): Promise<AdminServiceResponse> {
    try {
      console.log(`🚫 Banning driver: ${driverId}`)
      const response = await apiService.put(`/api/admin/drivers/${driverId}/ban`, { reason })
      
      if (response.success) {
        console.log('✅ Driver banned successfully')
        return {
          success: true,
          message: 'Driver banned successfully',
          data: response.data
        }
      }
      
      return {
        success: false,
        error: {
          code: 'BAN_DRIVER_ERROR',
          message: response.error?.message || 'Failed to ban driver'
        }
      }
    } catch (error) {
      console.error('❌ Error banning driver:', error)
      return {
        success: false,
        error: {
          code: 'BAN_DRIVER_ERROR',
          message: 'Failed to ban driver'
        }
      }
    }
  }

  // Sync driver verification status
  async syncDriverStatus(driverId: string): Promise<AdminServiceResponse<any>> {
    try {
      console.log(`🔄 Syncing verification status for driver: ${driverId}`)
      const response = await apiService.post(`/api/admin/drivers/${driverId}/sync-status`)
      
      if (response.success) {
        console.log('✅ Driver verification status synced successfully')
        return {
          success: true,
          data: response.data,
          message: 'Driver verification status synced successfully'
        }
      } else {
        console.error('❌ Failed to sync driver status:', response.error)
        return {
          success: false,
          error: {
            code: 'SYNC_STATUS_ERROR',
            message: 'Failed to sync driver verification status'
          }
        }
      }
    } catch (error) {
      console.error('❌ Error syncing driver status:', error)
      return {
        success: false,
        error: {
          code: 'SYNC_STATUS_ERROR',
          message: 'Failed to sync driver verification status'
        }
      }
    }
  }

  async getDrivers(page: number = 1, limit: number = 50): Promise<AdminServiceResponse<Driver[]>> {
    try {
      // Validate pagination parameters
      const validatedPage = Math.max(1, Math.floor(page))
      const validatedLimit = Math.max(1, Math.min(100, Math.floor(limit)))
      
      console.log(`🌐 Fetching drivers from backend (page: ${validatedPage}, limit: ${validatedLimit})...`)
      const response = await apiService.get('/api/admin/drivers', {
        page: validatedPage,
        limit: validatedLimit
      })
      
      if (response.success && response.data) {
        console.log('✅ Drivers fetched successfully')
        // The backend now returns normalized verification data
        return {
          success: true,
          data: (response.data as Driver[]) || [],
          message: 'Drivers fetched successfully',
          pagination: {
            page: validatedPage,
            limit: validatedLimit,
            total: Array.isArray(response.data) ? response.data.length : 0,
            hasMore: Array.isArray(response.data) ? response.data.length === validatedLimit : false
          },
          timestamp: new Date().toISOString()
        }
      }
      
      return {
        success: false,
        error: {
          code: response.error?.code || 'FETCH_DRIVERS_ERROR',
          message: 'Failed to fetch drivers',
        },
      }
      
    } catch (error) {
      console.error('❌ Error fetching drivers:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_DRIVERS_ERROR',
          message: 'Failed to fetch drivers'
        }
      }
    }
  }

  // Get pending driver verifications
  async getPendingVerifications(): Promise<AdminServiceResponse<Driver[]>> {
    try {
      console.log('🌐 Fetching pending verifications from backend...')
      const response = await apiService.get('/api/admin/drivers/pending')
      
      if (response.success && response.data) {
        console.log('✅ Pending verifications fetched successfully')
        // The backend now returns normalized verification data
        return {
          success: true,
          data: (response.data as Driver[]) || [],
          message: 'Pending verifications fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: response.error?.code || 'FETCH_PENDING_VERIFICATIONS_ERROR',
          message: 'Failed to fetch pending verifications',
        },
      }
      
    } catch (error) {
      console.error('❌ Error fetching pending verifications:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_PENDING_VERIFICATIONS_ERROR',
          message: 'Failed to fetch pending verifications'
        }
      }
    }
  }

  // Booking Management
  async getBookings(params?: {
    limit?: number
    offset?: number
    sourceType?: 'parcel' | 'marketplace' | ''
    status?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<AdminServiceResponse<Booking[]>> {
    try {
      console.log('🌐 Fetching bookings from backend...')
      const response = await apiService.get('/api/admin/bookings', {
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
        sourceType: params?.sourceType || undefined,
        status: params?.status || undefined,
        dateFrom: params?.dateFrom || undefined,
        dateTo: params?.dateTo || undefined,
      })
      
      if (response.success && response.data) {
        console.log('✅ Bookings fetched successfully')
        const data = response.data
        const list = Array.isArray(data) ? data : (data as { bookings?: Booking[] }).bookings || []
        return {
          success: true,
          data: list,
          message: 'Bookings fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: response.error?.code || 'FETCH_BOOKINGS_ERROR',
          message: 'Failed to fetch bookings',
        },
      }
      
    } catch (error) {
      console.error('❌ Error fetching bookings:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_BOOKINGS_ERROR',
          message: 'Failed to fetch bookings'
        }
      }
    }
  }

  // Emergency Alerts Management
  async getEmergencyAlerts(): Promise<AdminServiceResponse<EmergencyAlert[]>> {
    try {
      console.log('🌐 Fetching emergency alerts from backend...')
      const response = await apiService.get('/api/admin/emergency-alerts')
      
      if (response.success && response.data) {
        console.log('✅ Emergency alerts fetched successfully')
        return {
          success: true,
          data: (response.data as EmergencyAlert[]) || [],
          message: 'Emergency alerts fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: response.error?.code || 'FETCH_EMERGENCY_ALERTS_ERROR',
          message: 'Failed to fetch emergency alerts',
        },
      }
      
    } catch (error) {
      console.error('❌ Error fetching emergency alerts:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_EMERGENCY_ALERTS_ERROR',
          message: 'Failed to fetch emergency alerts'
        }
      }
    }
  }


  async verifyDriver(driverId: string, status: 'approved' | 'rejected', reason?: string): Promise<AdminServiceResponse> {
    try {
      console.log('🌐 Verifying driver...', { driverId, status, reason })
      const response = await apiService.post(`/api/admin/drivers/${driverId}/verify`, {
        status,
        reason
      })
      
      if (response.success) {
        console.log('✅ Driver verification successful')
        return {
          success: true,
          message: 'Driver verification successful'
        }
      }
      
      throw new Error(response.error?.message || 'Failed to verify driver')
      
    } catch (error) {
      console.error('❌ Error verifying driver:', error)
      return {
        success: false,
        error: {
          code: 'VERIFY_DRIVER_ERROR',
          message: 'Failed to verify driver'
        }
      }
    }
  }





  // Customer Management
  async getCustomers(): Promise<AdminServiceResponse<Customer[]>> {
    try {
      console.log('🌐 Fetching customers from backend...')
      const response = await apiService.get('/api/admin/customers')
      
      if (response.success && response.data) {
        console.log(`✅ Customers fetched successfully - ${(response.data as Customer[])?.length || 0} customers`)
        return {
          success: true,
          data: (response.data as Customer[]) || [],
          message: 'Customers fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: response.error?.code || 'FETCH_CUSTOMERS_ERROR',
          message: 'Failed to fetch customers',
        },
      }
      
    } catch (error) {
      console.error('❌ Error fetching customers:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_CUSTOMERS_ERROR',
          message: 'Failed to fetch customers'
        }
      }
    }
  }

  // Support Tickets
  async getSupportTickets(): Promise<AdminServiceResponse<SupportTicket[]>> {
    try {
      console.log('🌐 Fetching support tickets from backend...')
      const response = await apiService.get('/api/admin/support/tickets')
      
      if (response.success && response.data) {
        console.log('✅ Support tickets fetched successfully')
      return {
        success: true,
        data: (response.data as SupportTicket[]) || [],
        message: 'Support tickets fetched successfully'
      }
      }
      
      return {
        success: false,
        error: {
          code: response.error?.code || 'FETCH_SUPPORT_ERROR',
          message: 'Failed to fetch support tickets',
        },
      }
      
    } catch (error) {
      console.error('❌ Error fetching support tickets:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_SUPPORT_ERROR',
          message: 'Failed to fetch support tickets'
        }
      }
    }
  }



  // System Health
  async getSystemHealth(): Promise<AdminServiceResponse<SystemHealth>> {
    try {
      console.log('🌐 Fetching system health from backend...')
      const response = await apiService.get('/api/admin/system/health')
      
      if (response.success && response.data) {
        console.log('✅ System health fetched successfully')
        const healthData = response.data as any
        
        // Transform backend data to frontend format
        const systemHealth: SystemHealth = {
          status: healthData.status || 'healthy',
          services: healthData.services || {
            api: true,
            database: true,
            websocket: true,
            firebase: true
          },
          servicesList: healthData.servicesList || [
            { name: 'API', status: 'healthy', lastCheck: new Date().toISOString() },
            { name: 'Database', status: 'healthy', lastCheck: new Date().toISOString() },
            { name: 'WebSocket', status: 'healthy', lastCheck: new Date().toISOString() },
            { name: 'Firebase', status: 'healthy', lastCheck: new Date().toISOString() }
          ],
          uptime: healthData.uptime || 0,
          lastCheck: healthData.timestamp || new Date().toISOString()
        }
        
        return {
          success: true,
          data: systemHealth,
          message: 'System health fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: response.error?.code || 'FETCH_SYSTEM_HEALTH_ERROR',
          message: 'Failed to fetch system health',
        },
      }
      
    } catch (error) {
      console.error('❌ Error fetching system health:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_SYSTEM_ERROR',
          message: 'Failed to fetch system health'
        }
      }
    }
  }

  // Revenue Summary
  async getRevenueSummary(): Promise<AdminServiceResponse<any>> {
    try {
      console.log('💰 Fetching revenue summary from backend...')
      const response = await apiService.get('/api/admin/revenue/summary')
      
      if (response.success && response.data) {
        console.log('✅ Revenue summary fetched successfully')
        return {
          success: true,
          data: response.data,
          message: 'Revenue summary fetched successfully',
          timestamp: new Date().toISOString()
        }
      }
      
      console.log('⚠️ Revenue API failed:', response.error?.message)
      return {
        success: false,
        error: {
          code: 'FETCH_REVENUE_ERROR',
          message: response.error?.message || 'Failed to fetch revenue summary'
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching revenue summary:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_REVENUE_ERROR',
          message: 'Failed to fetch revenue summary'
        }
      }
    }
  }

  async getTotalRevenue(filters?: {
    startDate?: string
    endDate?: string
    driverId?: string
    paymentMethod?: string
  }): Promise<AdminServiceResponse<any>> {
    try {
      console.log('💰 Fetching total revenue from backend...')
      const queryParams = new URLSearchParams()
      if (filters?.startDate) queryParams.append('startDate', filters.startDate)
      if (filters?.endDate) queryParams.append('endDate', filters.endDate)
      if (filters?.driverId) queryParams.append('driverId', filters.driverId)
      if (filters?.paymentMethod) queryParams.append('paymentMethod', filters.paymentMethod)

      const response = await apiService.get(`/api/admin/revenue/total?${queryParams.toString()}`)
      
      if (response.success && response.data) {
        console.log('✅ Total revenue fetched successfully')
        return {
          success: true,
          data: response.data,
          message: 'Total revenue fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: 'FETCH_TOTAL_REVENUE_ERROR',
          message: response.error?.message || 'Failed to fetch total revenue'
        }
      }
    } catch (error) {
      console.error('❌ Error fetching total revenue:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_TOTAL_REVENUE_ERROR',
          message: 'Failed to fetch total revenue'
        }
      }
    }
  }

  async getRevenueTrends(
    startDate?: string,
    endDate?: string
  ): Promise<AdminServiceResponse<any>> {
    try {
      console.log('💰 Fetching revenue trends from backend...')
      const queryParams = new URLSearchParams()
      if (startDate) queryParams.append('startDate', startDate)
      if (endDate) queryParams.append('endDate', endDate)

      const response = await apiService.get(`/api/admin/revenue/trends?${queryParams.toString()}`)
      
      if (response.success && response.data) {
        console.log('✅ Revenue trends fetched successfully')
        return {
          success: true,
          data: response.data,
          message: 'Revenue trends fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: 'FETCH_REVENUE_TRENDS_ERROR',
          message: response.error?.message || 'Failed to fetch revenue trends'
        }
      }
    } catch (error) {
      console.error('❌ Error fetching revenue trends:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_REVENUE_TRENDS_ERROR',
          message: 'Failed to fetch revenue trends'
        }
      }
    }
  }

  async getRealMoneyRevenue(
    startDate?: string,
    endDate?: string
  ): Promise<AdminServiceResponse<any>> {
    try {
      console.log('💰 Fetching real money revenue from backend...')
      const queryParams = new URLSearchParams()
      if (startDate) queryParams.append('startDate', startDate)
      if (endDate) queryParams.append('endDate', endDate)

      const response = await apiService.get(`/api/admin/revenue/real-money?${queryParams.toString()}`)
      
      if (response.success && response.data) {
        console.log('✅ Real money revenue fetched successfully')
        return {
          success: true,
          data: response.data,
          message: 'Real money revenue fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: 'FETCH_REAL_MONEY_REVENUE_ERROR',
          message: response.error?.message || 'Failed to fetch real money revenue'
        }
      }
    } catch (error) {
      console.error('❌ Error fetching real money revenue:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_REAL_MONEY_REVENUE_ERROR',
          message: 'Failed to fetch real money revenue'
        }
      }
    }
  }

  async getRevenueByPeriod(
    startDate: string,
    endDate: string,
    period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<AdminServiceResponse<any>> {
    try {
      console.log('💰 Fetching revenue by period from backend...')
      const queryParams = new URLSearchParams()
      queryParams.append('startDate', startDate)
      queryParams.append('endDate', endDate)
      queryParams.append('period', period)

      const response = await apiService.get(`/api/admin/revenue/period?${queryParams.toString()}`)
      
      if (response.success && response.data) {
        console.log('✅ Revenue by period fetched successfully')
        return {
          success: true,
          data: response.data,
          message: 'Revenue by period fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: 'FETCH_REVENUE_BY_PERIOD_ERROR',
          message: response.error?.message || 'Failed to fetch revenue by period'
        }
      }
    } catch (error) {
      console.error('❌ Error fetching revenue by period:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_REVENUE_BY_PERIOD_ERROR',
          message: 'Failed to fetch revenue by period'
        }
      }
    }
  }

  async getRevenueByDriver(driverId?: string): Promise<AdminServiceResponse<any>> {
    try {
      console.log('💰 Fetching revenue by driver from backend...')
      const url = driverId 
        ? `/api/admin/revenue/driver/${driverId}`
        : '/api/admin/revenue/driver'
      
      const response = await apiService.get(url)
      
      if (response.success && response.data) {
        console.log('✅ Revenue by driver fetched successfully')
        return {
          success: true,
          data: response.data,
          message: 'Revenue by driver fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: 'FETCH_REVENUE_BY_DRIVER_ERROR',
          message: response.error?.message || 'Failed to fetch revenue by driver'
        }
      }
    } catch (error) {
      console.error('❌ Error fetching revenue by driver:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_REVENUE_BY_DRIVER_ERROR',
          message: 'Failed to fetch revenue by driver'
        }
      }
    }
  }

  async getDriverEarnings(
    driverId: string,
    filters?: {
      startDate?: string
      endDate?: string
      period?: 'all' | 'daily' | 'weekly' | 'monthly'
    }
  ): Promise<AdminServiceResponse<any>> {
    try {
      console.log('💰 Fetching driver earnings from backend...')
      const queryParams = new URLSearchParams()
      if (filters?.startDate) queryParams.append('startDate', filters.startDate)
      if (filters?.endDate) queryParams.append('endDate', filters.endDate)
      if (filters?.period) queryParams.append('period', filters.period)

      const response = await apiService.get(`/api/admin/drivers/${driverId}/earnings?${queryParams.toString()}`)
      
      if (response.success && response.data) {
        console.log('✅ Driver earnings fetched successfully')
        return {
          success: true,
          data: response.data,
          message: 'Driver earnings fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: 'FETCH_DRIVER_EARNINGS_ERROR',
          message: response.error?.message || 'Failed to fetch driver earnings'
        }
      }
    } catch (error) {
      console.error('❌ Error fetching driver earnings:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_DRIVER_EARNINGS_ERROR',
          message: 'Failed to fetch driver earnings'
        }
      }
    }
  }

  async getDriverWallet(driverId: string): Promise<AdminServiceResponse<any>> {
    try {
      console.log('💰 Fetching driver wallet from backend...')
      const response = await apiService.get(`/api/admin/drivers/${driverId}/wallet`)
      
      if (response.success && response.data) {
        console.log('✅ Driver wallet fetched successfully')
        return {
          success: true,
          data: response.data,
          message: 'Driver wallet fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: 'FETCH_DRIVER_WALLET_ERROR',
          message: response.error?.message || 'Failed to fetch driver wallet'
        }
      }
    } catch (error) {
      console.error('❌ Error fetching driver wallet:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_DRIVER_WALLET_ERROR',
          message: 'Failed to fetch driver wallet'
        }
      }
    }
  }

  async getRevenueStats(startDate?: string, endDate?: string): Promise<AdminServiceResponse<any>> {
    try {
      console.log('💰 Fetching revenue statistics from backend...')
      const response = await apiService.get('/api/admin/revenue/stats', {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      
      const stats = (response as { stats?: unknown }).stats
        ?? (response.data as { stats?: unknown })?.stats
        ?? response.data

      if (response.success && stats) {
        console.log('✅ Revenue statistics fetched successfully')
        return {
          success: true,
          data: stats,
          message: 'Revenue statistics fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: 'FETCH_REVENUE_STATS_ERROR',
          message: response.error?.message || 'Failed to fetch revenue statistics'
        }
      }
    } catch (error) {
      console.error('❌ Error fetching revenue statistics:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_REVENUE_STATS_ERROR',
          message: 'Failed to fetch revenue statistics'
        }
      }
    }
  }

  // Real-time Updates
  setupRealTimeListeners(): void {
    try {
      // Set up real-time event handlers
      realTimeService.setEventHandlers({
        onDriverUpdate: (driver) => {
          console.log('📱 Real-time driver update received:', driver)
          // Emit custom event for components to listen to
          window.dispatchEvent(new CustomEvent('driverUpdate', { detail: driver }))
        },
        onBookingUpdate: (booking) => {
          console.log('📦 Real-time booking update received:', booking)
          window.dispatchEvent(new CustomEvent('bookingUpdate', { detail: booking }))
        },
        onEmergencyAlert: (alert) => {
          console.log('🚨 Real-time emergency alert received:', alert)
          window.dispatchEvent(new CustomEvent('emergencyAlert', { detail: alert }))
        },
        onNotification: (notification) => {
          console.log('🔔 Real-time notification received:', notification)
          window.dispatchEvent(new CustomEvent('adminNotification', { detail: notification }))
        }
      })

      // Subscribe to real-time updates
      realTimeService.subscribeToDriverUpdates()
      realTimeService.subscribeToBookingUpdates()
      realTimeService.subscribeToEmergencyAlerts()
      realTimeService.subscribeToSystemUpdates()

      console.log('✅ Real-time listeners setup successfully')
      
    } catch (error) {
      console.error('❌ Error setting up real-time listeners:', error)
    }
  }

  // Fallback method to get pending verifications from Firestore

  async getDriverDocuments(driverId: string): Promise<AdminServiceResponse<any>> {
    try {
      const response = await apiService.get(`/api/admin/drivers/${driverId}/documents`)
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: 'Documents retrieved from backend API',
        }
      }
      return {
        success: false,
        error: {
          code: response.error?.code || 'DOCUMENTS_FETCH_ERROR',
          message: 'Failed to fetch driver documents',
        },
      }
    } catch (error) {
      console.error('Error fetching driver documents:', error)
      return {
        success: false,
        error: {
          code: 'DOCUMENTS_FETCH_ERROR',
          message: 'Failed to fetch driver documents',
        },
      }
    }
  }

  // Real-time status synchronization
  async syncDriverVerificationStatus(driverId: string): Promise<AdminServiceResponse> {
    try {
      console.log(`🔄 Syncing verification status for driver: ${driverId}`)
      
      const response = await apiService.post(`/api/admin/drivers/${driverId}/sync-status`)
      
      if (response.success) {
        console.log('✅ Driver status synced successfully')
        return {
          success: true,
          data: response.data,
          message: 'Driver verification status synchronized successfully'
        }
      } else {
        console.error('❌ Sync failed:', response.error)
        return {
          success: false,
          error: {
            code: 'SYNC_STATUS_ERROR',
            message: 'Failed to sync verification status'
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error syncing status:', error)
      return {
        success: false,
        error: {
          code: 'SYNC_STATUS_ERROR',
          message: 'Failed to sync verification status'
        }
      }
    }
  }

  // Test document access from Firebase Storage
  async testDocumentAccess(driverId: string): Promise<AdminServiceResponse<any>> {
    try {
      console.log(`🔍 Testing document access for driver: ${driverId}`)
      
      const response = await apiService.get(`/api/admin/test-document-access/${driverId}`)
      
      if (response.success && response.data) {
        console.log('🔍 Document access test results:', response.data)
        return {
          success: true,
          data: response.data,
          message: 'Document access test completed'
        }
      } else {
        console.error('❌ Document access test failed:', response.error)
        return {
          success: false,
          error: {
            code: 'DOCUMENT_ACCESS_TEST_ERROR',
            message: 'Failed to test document access'
          }
        }
      }
    } catch (error) {
      console.error('❌ Document access test error:', error)
      return {
        success: false,
        error: {
          code: 'DOCUMENT_ACCESS_TEST_ERROR',
          message: 'Failed to test document access'
        }
      }
    }
  }

  // Sync all drivers verification status
  async syncAllDriversStatus(): Promise<AdminServiceResponse<any>> {
    try {
      console.log('🔄 Syncing verification status for all drivers...')
      
      const response = await apiService.post('/api/admin/sync-all-drivers-status')
      
      if (response.success && response.data) {
        console.log('✅ All drivers status synced:', response.data)
        return {
          success: true,
          data: response.data,
          message: 'All drivers status synchronized successfully'
        }
      } else {
        console.error('❌ Sync all drivers failed:', response.error)
        return {
          success: false,
          error: {
            code: 'SYNC_ALL_DRIVERS_ERROR',
            message: 'Failed to sync all drivers status'
          }
        }
      }
    } catch (error) {
      console.error('❌ Sync all drivers error:', error)
      return {
        success: false,
        error: {
          code: 'SYNC_ALL_DRIVERS_ERROR',
          message: 'Failed to sync all drivers status'
        }
      }
    }
  }

  // Get comprehensive verification statistics
  async getVerificationStatistics(): Promise<AdminServiceResponse<any>> {
    try {
      console.log('📊 Fetching verification statistics...')
      
      const response = await apiService.get('/api/admin/verification/stats')
      
      if (response.success && response.data) {
        console.log('✅ Verification statistics fetched successfully')
        return {
          success: true,
          data: response.data,
          message: 'Verification statistics fetched successfully'
        }
      } else {
        console.error('❌ Failed to fetch verification statistics:', response.error)
        return {
          success: false,
          error: {
            code: 'FETCH_VERIFICATION_STATS_ERROR',
            message: 'Failed to fetch verification statistics'
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching verification statistics:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_VERIFICATION_STATS_ERROR',
          message: 'Failed to fetch verification statistics'
        }
      }
    }
  }

  async verifyDriverDocument(
    driverId: string, 
    documentType: string, 
    status: 'verified' | 'rejected', 
    notes?: string
  ): Promise<AdminServiceResponse> {
    try {
      console.log(`📄 Verifying document: ${documentType} for driver: ${driverId}`)
      
      // Use backend API for proper verification
      const response = await apiService.post(`/api/admin/drivers/${driverId}/documents/${documentType}/verify`, {
        status,
        comments: notes || `Document ${status} by admin`,
        rejectionReason: status === 'rejected' ? notes || 'Document rejected by admin' : null
      })
      
      if (response.success) {
        console.log(`✅ Document ${documentType} ${status} successfully via backend API`)
        return {
          success: true,
          message: `Document ${status} successfully`,
          data: response.data
        }
      }
      return {
        success: false,
        error: {
          code: response.error?.code || 'VERIFY_DOCUMENT_ERROR',
          message: 'Failed to verify document',
        },
      }
    } catch (error) {
      console.error('❌ Error verifying document:', error)
      return {
        success: false,
        error: {
          code: 'VERIFY_DOCUMENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to verify document'
        }
      }
    }
  }

  async approveDriver(driverId: string, adminNotes?: string): Promise<AdminServiceResponse> {
    try {
      console.log(`✅ Approving driver: ${driverId}`)
      
      // Use backend API for proper verification
      const response = await apiService.post(`/api/admin/drivers/${driverId}/verify`, {
        status: 'approved',
        comments: adminNotes || 'Driver approved by admin'
      })
      
      if (response.success) {
        console.log(`✅ Driver ${driverId} approved successfully via backend API`)
        return {
          success: true,
          message: 'Driver approved successfully',
          data: response.data
        }
      }
      return {
        success: false,
        error: {
          code: response.error?.code || 'APPROVE_DRIVER_ERROR',
          message: 'Failed to approve driver',
        },
      }
    } catch (error) {
      console.error('❌ Error approving driver:', error)
      return {
        success: false,
        error: {
          code: 'APPROVE_DRIVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to approve driver'
        }
      }
    }
  }

  async rejectDriver(driverId: string, reason: string): Promise<AdminServiceResponse> {
    try {
      console.log(`❌ Rejecting driver: ${driverId}`)
      
      // Use backend API for proper verification
      const response = await apiService.post(`/api/admin/drivers/${driverId}/verify`, {
        status: 'rejected',
        reason: reason,
        comments: `Driver rejected: ${reason}`
      })
      
      if (response.success) {
        console.log(`❌ Driver ${driverId} rejected successfully via backend API`)
        return {
          success: true,
          message: 'Driver rejected successfully',
          data: response.data
        }
      }
      return {
        success: false,
        error: {
          code: response.error?.code || 'REJECT_DRIVER_ERROR',
          message: 'Failed to reject driver',
        },
      }
    } catch (error) {
      console.error('❌ Error rejecting driver:', error)
      return {
        success: false,
        error: {
          code: 'REJECT_DRIVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to reject driver'
        }
      }
    }
  }

  async discoverAllDriverDocuments(driverId: string): Promise<AdminServiceResponse<any>> {
    const response = await apiService.get(`/api/admin/drivers/${driverId}/documents`)
    if (!response.success || !response.data) {
      return {
        success: false,
        error: {
          code: response.error?.code || 'DOCUMENTS_FETCH_ERROR',
          message: 'Failed to fetch driver documents',
        },
      }
    }
    const responseData = response.data as any
    const documents = responseData.documents || {}
    const transformedDocuments: Record<string, any> = {}
    Object.entries(documents).forEach(([key, doc]: [string, any]) => {
      if (doc?.url) {
        transformedDocuments[key] = {
          url: doc.url,
          fileName: `${key}.jpg`,
          uploadedAt: doc.uploadedAt || new Date().toISOString(),
          size: 0,
          contentType: 'image/jpeg',
          folder: 'documents',
          fullPath: `drivers/${driverId}/documents/${key}`,
          status: doc.status || 'pending',
          verified: doc.verified || false,
          verificationNotes: '',
          documentType: key,
        }
      }
    })
    return {
      success: true,
      data: {
        driverId,
        driverName: responseData.driverName || 'Unknown Driver',
        documents: transformedDocuments,
        folderStructure: { documents: Object.keys(transformedDocuments).length },
        totalDocuments: Object.keys(transformedDocuments).length,
        totalFolders: 1,
        source: 'api',
      },
      message: 'Documents loaded from API',
    }
  }

  async respondToEmergency(_alertId: string, _response: any): Promise<AdminServiceResponse> {
    return {
      success: false,
      error: {
        code: 'NOT_SUPPORTED',
        message: 'Emergency respond is not available in the admin API.',
      },
    }
  }

  async updateEmergencyStatus(
    alertId: string,
    status: 'acknowledged' | 'resolved',
    note?: string,
  ): Promise<AdminServiceResponse> {
    try {
      await emergencyService.updateAlertStatus(alertId, status, note)
      return { success: true, message: 'Emergency alert updated' }
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || 'UPDATE_ALERT_STATUS_ERROR'
      return {
        success: false,
        error: {
          code,
          message: error instanceof Error ? error.message : 'Failed to update emergency alert',
        },
      }
    }
  }

  // ✅ NEW: Cancellation management methods
  async getCancellations(filters?: {
    reason?: string;
    driverId?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    cancelledAtStage?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminServiceResponse<any[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.reason) queryParams.append('reason', filters.reason);
      if (filters?.driverId) queryParams.append('driverId', filters.driverId);
      if (filters?.customerId) queryParams.append('customerId', filters.customerId);
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.cancelledAtStage) queryParams.append('cancelledAtStage', filters.cancelledAtStage);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.offset) queryParams.append('offset', filters.offset.toString());

      const response = await apiService.get(`/api/admin/bookings/cancellations?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        const responseData = response.data as { cancellations?: any[]; pagination?: any };
        return {
          success: true,
          data: responseData.cancellations || [],
          pagination: responseData.pagination
        };
      }

      return {
        success: false,
        error: {
          code: 'GET_CANCELLATIONS_ERROR',
          message: response.error?.message || 'Failed to get cancellations'
        }
      };
    } catch (error) {
      console.error('❌ Error getting cancellations:', error);
      return {
        success: false,
        error: {
          code: 'GET_CANCELLATIONS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get cancellations'
        }
      };
    }
  }

  async getCancellationDetails(bookingId: string): Promise<AdminServiceResponse<any>> {
    try {
      const response = await apiService.get(`/api/admin/bookings/${bookingId}/cancellation-details`);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: false,
        error: {
          code: 'GET_CANCELLATION_DETAILS_ERROR',
          message: response.error?.message || 'Failed to get cancellation details'
        }
      };
    } catch (error) {
      console.error('❌ Error getting cancellation details:', error);
      return {
        success: false,
        error: {
          code: 'GET_CANCELLATION_DETAILS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get cancellation details'
        }
      };
    }
  }

  async getCancellationAnalytics(timeRange?: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }): Promise<AdminServiceResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      if (timeRange?.startDate) queryParams.append('startDate', timeRange.startDate);
      if (timeRange?.endDate) queryParams.append('endDate', timeRange.endDate);
      if (timeRange?.groupBy) queryParams.append('groupBy', timeRange.groupBy);

      const response = await apiService.get(`/api/admin/analytics/cancellations?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: false,
        error: {
          code: 'GET_CANCELLATION_ANALYTICS_ERROR',
          message: response.error?.message || 'Failed to get cancellation analytics'
        }
      };
    } catch (error) {
      console.error('❌ Error getting cancellation analytics:', error);
      return {
        success: false,
        error: {
          code: 'GET_CANCELLATION_ANALYTICS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get cancellation analytics'
        }
      };
    }
  }

}

export const comprehensiveAdminService = new ComprehensiveAdminService()
export default comprehensiveAdminService
