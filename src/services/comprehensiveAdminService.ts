import { apiService } from './apiService'
import { db, storage } from '../config/firebase'
import { realTimeService } from './realTimeService'
import { Driver, Booking, EmergencyAlert, SupportTicket, SystemHealth, Customer } from '../types'
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  Unsubscribe,
  // Timestamp // Removed unused import 
} from 'firebase/firestore'
import { 
  ref, 
  getDownloadURL, 
  listAll, 
  getMetadata 
} from 'firebase/storage'

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
      
      // Fallback to Firestore if API fails
      console.log('⚠️ API failed, fetching from Firestore...')
      return await this.getDriversFromFirestore()
      
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
      
      // Fallback to Firestore if API fails
      console.log('⚠️ API failed, fetching from Firestore...')
      return await this.getPendingVerificationsFromFirestore()
      
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
  async getBookings(): Promise<AdminServiceResponse<Booking[]>> {
    try {
      console.log('🌐 Fetching bookings from backend...')
      const response = await apiService.get('/api/admin/bookings')
      
      if (response.success && response.data) {
        console.log('✅ Bookings fetched successfully')
        return {
          success: true,
          data: (response.data as Booking[]) || [],
          message: 'Bookings fetched successfully'
        }
      }
      
      // Fallback to Firestore if API fails
      console.log('⚠️ API failed, fetching from Firestore...')
      return await this.getBookingsFromFirestore()
      
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
      
      // Fallback to Firestore if API fails
      console.log('⚠️ API failed, fetching from Firestore...')
      return await this.getEmergencyAlertsFromFirestore()
      
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

  private async getDriversFromFirestore(): Promise<AdminServiceResponse<Driver[]>> {
    try {
      const driversQuery = query(
        collection(db, 'users'),
        where('userType', '==', 'driver')
      )
      const driversSnapshot = await getDocs(driversQuery)
      
      const drivers: Driver[] = []
      
      for (const doc of driversSnapshot.docs) {
        const data = doc.data()
        
        // Get verification request for this driver to get actual document URLs
        // ✅ FIX: Remove 'pending' filter to get all documents (including verified ones)
        const verificationQuery = query(
          collection(db, 'documentVerificationRequests'),
          where('driverId', '==', doc.id),
          orderBy('createdAt', 'desc'),
          limit(1)
        )
        const verificationSnapshot = await getDocs(verificationQuery)
        
        let documents = {
          drivingLicense: { url: '', status: 'pending' as 'pending' | 'verified' | 'rejected', uploadedAt: '', verified: false },
          aadhaarCard: { url: '', status: 'pending' as 'pending' | 'verified' | 'rejected', uploadedAt: '', verified: false },
          bikeInsurance: { url: '', status: 'pending' as 'pending' | 'verified' | 'rejected', uploadedAt: '', verified: false },
          rcBook: { url: '', status: 'pending' as 'pending' | 'verified' | 'rejected', uploadedAt: '', verified: false },
          profilePhoto: { url: '', status: 'pending' as 'pending' | 'verified' | 'rejected', uploadedAt: '', verified: false }
        }
        
        // If there's a verification request, use those document URLs
        if (!verificationSnapshot.empty) {
          const verificationData = verificationSnapshot.docs[0]?.data()
          const verificationDocs = verificationData?.documents || {}
          
          documents = {
            drivingLicense: {
              url: verificationDocs.drivingLicense?.downloadURL || verificationDocs.driving_license?.downloadURL || '',
              status: (verificationDocs.drivingLicense?.verificationStatus || verificationDocs.driving_license?.verificationStatus || 'pending') as 'pending' | 'verified' | 'rejected',
              uploadedAt: verificationDocs.drivingLicense?.uploadedAt || verificationDocs.driving_license?.uploadedAt || '',
              verified: (verificationDocs.drivingLicense?.verificationStatus || verificationDocs.driving_license?.verificationStatus) === 'verified'
            },
            aadhaarCard: {
              url: verificationDocs.aadhaarCard?.downloadURL || verificationDocs.aadhaar_card?.downloadURL || '',
              status: (verificationDocs.aadhaarCard?.verificationStatus || verificationDocs.aadhaar_card?.verificationStatus || 'pending') as 'pending' | 'verified' | 'rejected',
              uploadedAt: verificationDocs.aadhaarCard?.uploadedAt || verificationDocs.aadhaar_card?.uploadedAt || '',
              verified: (verificationDocs.aadhaarCard?.verificationStatus || verificationDocs.aadhaar_card?.verificationStatus) === 'verified'
            },
            bikeInsurance: {
              url: verificationDocs.bikeInsurance?.downloadURL || verificationDocs.bike_insurance?.downloadURL || '',
              status: (verificationDocs.bikeInsurance?.verificationStatus || verificationDocs.bike_insurance?.verificationStatus || 'pending') as 'pending' | 'verified' | 'rejected',
              uploadedAt: verificationDocs.bikeInsurance?.uploadedAt || verificationDocs.bike_insurance?.uploadedAt || '',
              verified: (verificationDocs.bikeInsurance?.verificationStatus || verificationDocs.bike_insurance?.verificationStatus) === 'verified'
            },
            rcBook: {
              url: verificationDocs.rcBook?.downloadURL || verificationDocs.rc_book?.downloadURL || '',
              status: (verificationDocs.rcBook?.verificationStatus || verificationDocs.rc_book?.verificationStatus || 'pending') as 'pending' | 'verified' | 'rejected',
              uploadedAt: verificationDocs.rcBook?.uploadedAt || verificationDocs.rc_book?.uploadedAt || '',
              verified: (verificationDocs.rcBook?.verificationStatus || verificationDocs.rc_book?.verificationStatus) === 'verified'
            },
            profilePhoto: {
              url: verificationDocs.profilePhoto?.downloadURL || verificationDocs.profile_photo?.downloadURL || '',
              status: (verificationDocs.profilePhoto?.verificationStatus || verificationDocs.profile_photo?.verificationStatus || 'pending') as 'pending' | 'verified' | 'rejected',
              uploadedAt: verificationDocs.profilePhoto?.uploadedAt || verificationDocs.profile_photo?.uploadedAt || '',
              verified: (verificationDocs.profilePhoto?.verificationStatus || verificationDocs.profile_photo?.verificationStatus) === 'verified'
            }
          }
        } else {
          // ✅ FIX: Fallback to user collection documents - check BOTH driver.documents and root documents
          const driverDocs = data.driver?.documents || {}
          const userDocs = data.documents || {}
          
          // Helper function to get document data from multiple possible locations
          const getDocData = (docType: string, altKeys: string[] = []) => {
            // Check driver.documents first
            let doc = driverDocs[docType]
            if (doc && (doc.url || doc.downloadURL)) {
              return {
                url: doc.url || doc.downloadURL || '',
                status: (doc.status || doc.verificationStatus || 'pending') as 'pending' | 'verified' | 'rejected',
                uploadedAt: doc.uploadedAt || doc.uploadDate || '',
                verified: doc.verified === true || doc.status === 'verified' || doc.verificationStatus === 'verified'
              }
            }
            
            // Check alternative keys in driver.documents
            for (const altKey of altKeys) {
              doc = driverDocs[altKey]
              if (doc && (doc.url || doc.downloadURL)) {
                return {
                  url: doc.url || doc.downloadURL || '',
                  status: (doc.status || doc.verificationStatus || 'pending') as 'pending' | 'verified' | 'rejected',
                  uploadedAt: doc.uploadedAt || doc.uploadDate || '',
                  verified: doc.verified === true || doc.status === 'verified' || doc.verificationStatus === 'verified'
                }
              }
            }
            
            // Check root documents
            doc = userDocs[docType]
            if (doc && (doc.url || doc.downloadURL)) {
              return {
                url: doc.url || doc.downloadURL || '',
                status: (doc.status || doc.verificationStatus || 'pending') as 'pending' | 'verified' | 'rejected',
                uploadedAt: doc.uploadedAt || doc.uploadDate || '',
                verified: doc.verified === true || doc.status === 'verified' || doc.verificationStatus === 'verified'
              }
            }
            
            // Check alternative keys in root documents
            for (const altKey of altKeys) {
              doc = userDocs[altKey]
              if (doc && (doc.url || doc.downloadURL)) {
                return {
                  url: doc.url || doc.downloadURL || '',
                  status: (doc.status || doc.verificationStatus || 'pending') as 'pending' | 'verified' | 'rejected',
                  uploadedAt: doc.uploadedAt || doc.uploadDate || '',
                  verified: doc.verified === true || doc.status === 'verified' || doc.verificationStatus === 'verified'
                }
              }
            }
            
            // Return empty document
            return {
              url: '',
              status: 'pending' as 'pending' | 'verified' | 'rejected',
              uploadedAt: '',
              verified: false
            }
          }
          
          documents = {
            drivingLicense: getDocData('drivingLicense', ['driving_license', 'drivingLicence']),
            aadhaarCard: getDocData('aadhaarCard', ['aadhaar_card', 'aadhaar', 'aadharCard']),
            bikeInsurance: getDocData('bikeInsurance', ['bike_insurance', 'insurance']),
            rcBook: getDocData('rcBook', ['rc_book', 'rccard', 'registrationCertificate']),
            profilePhoto: getDocData('profilePhoto', ['profile_photo', 'photo'])
          }
        }
        
        drivers.push({
          id: doc.id,
          uid: data.uid || doc.id,
          driverId: data.driverId || doc.id,
          personalInfo: {
            name: data.personalInfo?.name || data.name || 'Unknown',
            email: data.personalInfo?.email || data.email || '',
            phone: data.personalInfo?.phone || data.phone || '',
            dateOfBirth: data.personalInfo?.dateOfBirth || '',
            address: data.personalInfo?.address || ''
          },
          vehicleInfo: {
            make: data.vehicleInfo?.make || data.vehicle?.make || 'Unknown',
            model: data.vehicleInfo?.model || data.vehicle?.model || 'Unknown',
            year: data.vehicleInfo?.year || data.vehicle?.year || 2020,
            color: data.vehicleInfo?.color || data.vehicle?.color || 'Unknown',
            plateNumber: data.vehicleInfo?.plateNumber || data.vehicle?.plateNumber || 'Unknown'
          },
          documents,
          location: data.location || {
            latitude: 0,
            longitude: 0,
            address: 'Unknown',
            timestamp: new Date().toISOString()
          },
          isOnline: data.isOnline || false,
          isAvailable: data.isAvailable || false,
          rating: data.rating || 0,
          totalDeliveries: data.totalDeliveries || data.totalTrips || 0,
          earnings: data.earnings || {
            total: 0,
            thisMonth: 0,
            lastMonth: 0
          },
          // ✅ FIX: Check multiple status fields and document verification
          status: (() => {
            // Priority 1: Check driver.verificationStatus
            if (data.driver?.verificationStatus === 'approved' || data.driver?.verificationStatus === 'verified') {
              return 'verified'
            }
            if (data.driver?.verificationStatus === 'rejected') {
              return 'rejected'
            }
            
            // Priority 2: Check isVerified flag
            if (data.driver?.isVerified === true || data.isVerified === true) {
              return 'verified'
            }
            
            // Priority 3: Check if all documents are verified
            const driverDocs = data.driver?.documents || {}
            const docKeys = Object.keys(driverDocs)
            if (docKeys.length > 0) {
              const allVerified = docKeys.every(key => {
                const doc = driverDocs[key]
                return doc && (doc.verified === true || doc.status === 'verified' || doc.verificationStatus === 'verified')
              })
              if (allVerified) {
                return 'verified'
              }
            }
            
            return 'pending'
          })(),
          isVerified: data.driver?.verificationStatus === 'approved' || 
                     data.driver?.verificationStatus === 'verified' || 
                     data.driver?.isVerified === true ||
                     data.isVerified === true ||
                     false,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        } as Driver)
      }
      
      console.log('✅ Drivers fetched from Firestore successfully')
      return {
        success: true,
        data: drivers,
        message: 'Drivers fetched from Firestore successfully'
      }
      
    } catch (error) {
      console.error('❌ Error fetching drivers from Firestore:', error)
      return {
        success: false,
        error: {
          code: 'FIRESTORE_FETCH_ERROR',
          message: 'Failed to fetch drivers from Firestore'
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


  private async getBookingsFromFirestore(): Promise<AdminServiceResponse<Booking[]>> {
    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
      const bookingsSnapshot = await getDocs(bookingsQuery)
      
      // ✅ FIX: Collect driverIds that need info fetching
      const driverIdsToFetch = new Set<string>()
      const bookingsData: any[] = []
      
      bookingsSnapshot.forEach(doc => {
        const data = doc.data()
        bookingsData.push({ id: doc.id, data })
        
        // If driverId exists but driverInfo is missing, add to fetch list
        if (data.driverId && !data.driverInfo?.name) {
          driverIdsToFetch.add(data.driverId)
        }
      })
      
      // ✅ FIX: Fetch driver info in parallel for bookings missing driverInfo
      const driverInfoMap = new Map<string, any>()
      if (driverIdsToFetch.size > 0) {
        const driverFetchPromises = Array.from(driverIdsToFetch).map(async (driverId) => {
          try {
            const driverDocRef = doc(db, 'users', driverId)
            const driverDocSnapshot = await getDoc(driverDocRef)
            if (driverDocSnapshot.exists()) {
              const driverData = driverDocSnapshot.data()
              driverInfoMap.set(driverId, {
                name: driverData.name || 'Driver',
                phone: driverData.phone || '',
                rating: driverData.driver?.rating || 0,
                vehicleNumber: driverData.driver?.vehicleDetails?.vehicleNumber || '',
                vehicleModel: driverData.driver?.vehicleDetails?.vehicleModel || ''
              })
            }
          } catch (error) {
            console.warn(`⚠️ Failed to fetch driver info for ${driverId}:`, error)
          }
        })
        await Promise.all(driverFetchPromises)
      }
      
      const bookings: Booking[] = []
      bookingsData.forEach(({ id, data }) => {
        // Determine driverInfo - use from booking document, or fetch from map
        let driverInfo = undefined
        if (data.driverId) {
          if (data.driverInfo?.name) {
            // Use driverInfo from booking document
            driverInfo = {
              name: data.driverInfo.name,
              phone: data.driverInfo.phone || '',
              rating: data.driverInfo.rating || 0
            }
          } else if (driverInfoMap.has(data.driverId)) {
            // Use fetched driver info
            driverInfo = driverInfoMap.get(data.driverId)
          } else {
            // Fallback
            driverInfo = {
              name: 'Driver Assigned',
              phone: '',
              rating: 0
            }
          }
        }
        
        // Map the actual booking data structure to admin dashboard format
        bookings.push({
          id: id,
          bookingId: data.bookingId || id,
          customerId: data.customerId || '',
          driverId: data.driverId,
          // Map customer info from the actual data structure
          customerInfo: {
            name: data.pickup?.name || data.customerInfo?.name || 'Unknown Customer',
            phone: data.pickup?.phone || data.customerInfo?.phone || '',
            email: data.customerInfo?.email || ''
          },
          // Map sender and recipient contact information
          senderInfo: {
            name: data.pickup?.name || 'Sender',
            phone: data.pickup?.phone || '+91 9876543210'
          },
          recipientInfo: {
            name: data.dropoff?.name || 'Recipient',
            phone: data.dropoff?.phone || '+91 9876543210'
          },
          // ✅ FIX: Use enriched driverInfo
          driverInfo: driverInfo,
          // Map pickup location from actual data structure
          pickupLocation: {
            address: data.pickup?.address || data.pickupLocation?.address || 'No pickup address',
            latitude: data.pickup?.coordinates?.latitude || data.pickupLocation?.latitude || data.pickupLocation?.coordinates?.lat || 0,
            longitude: data.pickup?.coordinates?.longitude || data.pickupLocation?.longitude || data.pickupLocation?.coordinates?.lng || 0
          },
          // Map dropoff location from actual data structure
          dropoffLocation: {
            address: data.dropoff?.address || data.dropoffLocation?.address || 'No dropoff address',
            latitude: data.dropoff?.coordinates?.latitude || data.dropoffLocation?.latitude || data.dropoffLocation?.coordinates?.lat || 0,
            longitude: data.dropoff?.coordinates?.longitude || data.dropoffLocation?.longitude || data.dropoffLocation?.coordinates?.lng || 0
          },
          // Map package details from actual data structure
          packageDetails: {
            weight: data.package?.weight || data.packageDetails?.weight || 0,
            description: data.package?.description || data.packageDetails?.description || '',
            value: data.package?.value || data.packageDetails?.value || 0
          },
          status: data.status || 'pending',
          // Map fare from actual data structure (enhanced fare calculation service structure)
          fare: data.fare || data.pricing || {
            baseFare: 0,
            distanceFare: 0,
            totalFare: 0,
            currency: 'INR',
            commission: 0,
            driverNet: 0,
            companyRevenue: 0
          },
          paymentStatus: data.paymentStatus || 'pending',
          estimatedDuration: data.estimatedDuration,
          actualDuration: data.actualDuration,
          distance: data.distance,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          scheduledAt: data.scheduledAt?.toDate?.()?.toISOString(),
          completedAt: data.completedAt?.toDate?.()?.toISOString(),
          // Map photo verifications
          pickupVerification: data.pickupVerification ? {
            photoUrl: data.pickupVerification.photoUrl || '',
            verifiedAt: data.pickupVerification.verifiedAt?.toDate?.()?.toISOString() || data.pickupVerification.verifiedAt || '',
            verifiedBy: data.pickupVerification.verifiedBy || '',
            location: data.pickupVerification.location,
            notes: data.pickupVerification.notes
          } : undefined,
          deliveryVerification: data.deliveryVerification ? {
            photoUrl: data.deliveryVerification.photoUrl || '',
            verifiedAt: data.deliveryVerification.verifiedAt?.toDate?.()?.toISOString() || data.deliveryVerification.verifiedAt || '',
            verifiedBy: data.deliveryVerification.verifiedBy || '',
            location: data.deliveryVerification.location,
            notes: data.deliveryVerification.notes
          } : undefined
        } as any)
      })
      
      console.log('✅ Bookings fetched from Firestore successfully')
      return {
        success: true,
        data: bookings,
        message: 'Bookings fetched from Firestore successfully'
      }
      
    } catch (error) {
      console.error('❌ Error fetching bookings from Firestore:', error)
      return {
        success: false,
        error: {
          code: 'FIRESTORE_FETCH_ERROR',
          message: 'Failed to fetch bookings from Firestore'
        }
      }
    }
  }


  private async getEmergencyAlertsFromFirestore(): Promise<AdminServiceResponse<EmergencyAlert[]>> {
    try {
      const alertsQuery = query(
        collection(db, 'emergencyAlerts'),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const alertsSnapshot = await getDocs(alertsQuery)
      
      const alerts: EmergencyAlert[] = []
      alertsSnapshot.forEach(doc => {
        const data = doc.data()
        alerts.push({
          id: doc.id,
          alertId: data.alertId || doc.id,
          userId: data.userId || '',
          userType: data.userType || 'customer',
          userInfo: {
            name: data.userInfo?.name || data.reportedBy || 'Unknown',
            phone: data.userInfo?.phone || ''
          },
          type: data.type || 'other',
          priority: data.priority || 'medium',
          location: {
            address: data.location?.address || 'Unknown',
            latitude: data.location?.latitude || data.location?.coordinates?.lat || 0,
            longitude: data.location?.longitude || data.location?.coordinates?.lng || 0
          },
          description: data.description || '',
          status: data.status || 'active',
          bookingId: data.bookingId,
          response: data.response,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          resolvedAt: data.resolvedAt?.toDate?.()?.toISOString()
        })
      })
      
      console.log('✅ Emergency alerts fetched from Firestore successfully')
      return {
        success: true,
        data: alerts,
        message: 'Emergency alerts fetched from Firestore successfully'
      }
      
    } catch (error) {
      console.error('❌ Error fetching emergency alerts from Firestore:', error)
      return {
        success: false,
        error: {
          code: 'FIRESTORE_FETCH_ERROR',
          message: 'Failed to fetch emergency alerts from Firestore'
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
        console.log('✅ Customers fetched successfully')
        return {
          success: true,
          data: (response.data as Customer[]) || [],
          message: 'Customers fetched successfully'
        }
      }
      
      // Fallback to Firestore if API fails
      console.log('⚠️ API failed, fetching from Firestore...')
      return await this.getCustomersFromFirestore()
      
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
      
      // Fallback to Firestore
      console.log('⚠️ API failed, fetching from Firestore...')
      return await this.getSupportTicketsFromFirestore()
      
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

  private async getSupportTicketsFromFirestore(): Promise<AdminServiceResponse<SupportTicket[]>> {
    try {
      const ticketsQuery = query(
        collection(db, 'supportTickets'),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
      const ticketsSnapshot = await getDocs(ticketsQuery)
      
      const tickets: SupportTicket[] = []
      ticketsSnapshot.forEach(doc => {
        const data = doc.data()
        tickets.push({
          id: doc.id,
          ticketId: data.ticketId || doc.id,
          userId: data.userId || data.customerId || data.driverId || '',
          userType: data.userType || 'customer',
          userInfo: {
            name: data.userInfo?.name || '',
            email: data.userInfo?.email || '',
            phone: data.userInfo?.phone || ''
          },
          subject: data.subject || '',
          description: data.description || '',
          category: data.category || 'general',
          priority: data.priority || 'medium',
          status: data.status || 'open',
          assignedTo: data.assignedTo,
          messages: data.messages || [],
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          resolvedAt: data.resolvedAt?.toDate?.()?.toISOString()
        })
      })
      
      console.log('✅ Support tickets fetched from Firestore successfully')
      return {
        success: true,
        data: tickets,
        message: 'Support tickets fetched from Firestore successfully'
      }
      
    } catch (error) {
      console.error('❌ Error fetching support tickets from Firestore:', error)
      return {
        success: false,
        error: {
          code: 'FIRESTORE_FETCH_ERROR',
          message: 'Failed to fetch support tickets from Firestore'
        }
      }
    }
  }

  private async getCustomersFromFirestore(): Promise<AdminServiceResponse<Customer[]>> {
    try {
      const customersQuery = query(
        collection(db, 'users'),
        where('userType', '==', 'customer'),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
      const customersSnapshot = await getDocs(customersQuery)
      
      const customers: Customer[] = []
      customersSnapshot.forEach(doc => {
        const data = doc.data()
        customers.push({
          id: doc.id,
          name: data.name || data.personalInfo?.name || '',
          email: data.email || data.personalInfo?.email || '',
          phone: data.phone || data.personalInfo?.phone || '',
          personalInfo: {
            name: data.name || data.personalInfo?.name || '',
            email: data.email || data.personalInfo?.email || '',
            phone: data.phone || data.personalInfo?.phone || '',
            dateOfBirth: data.personalInfo?.dateOfBirth || '',
            address: data.personalInfo?.address || ''
          },
          accountStatus: data.accountStatus || 'active',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          bookingsCount: data.bookingsCount || 0,
          wallet: {
            balance: data.wallet?.balance || 0,
            transactions: data.wallet?.transactions || []
          }
        })
      })
      
      console.log('✅ Customers fetched from Firestore successfully')
      return {
        success: true,
        data: customers,
        message: 'Customers fetched from Firestore successfully'
      }
      
    } catch (error) {
      console.error('❌ Error fetching customers from Firestore:', error)
      return {
        success: false,
        error: {
          code: 'FIRESTORE_FETCH_ERROR',
          message: 'Failed to fetch customers from Firestore'
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
          services: healthData.services || [
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
      
      // Fallback to default healthy state
      console.log('⚠️ API failed, using default system health')
      return {
        success: true,
        data: {
          status: 'healthy',
          services: [
            { name: 'API', status: 'healthy', lastCheck: new Date().toISOString() },
            { name: 'Database', status: 'healthy', lastCheck: new Date().toISOString() },
            { name: 'WebSocket', status: 'healthy', lastCheck: new Date().toISOString() },
            { name: 'Firebase', status: 'healthy', lastCheck: new Date().toISOString() }
          ],
          uptime: 0,
          lastCheck: new Date().toISOString()
        },
        message: 'Using default system health'
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
  private async getPendingVerificationsFromFirestore(): Promise<AdminServiceResponse<Driver[]>> {
    try {
      console.log('🔥 Fetching pending verifications from Firestore...')
      
      // Get verification requests
      const verificationRequestsRef = collection(db, 'documentVerificationRequests')
      const q = query(
        verificationRequestsRef,
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'desc')
      )
      
      const snapshot = await getDocs(q)
      const pendingDrivers: Driver[] = []
      
      for (const docSnapshot of snapshot.docs) {
        const requestData = docSnapshot.data()
        
        // Get driver details
        const driverDocRef = doc(db, 'users', requestData.driverId)
        const driverDocSnapshot = await getDoc(driverDocRef)
        const driverDoc = driverDocSnapshot.exists() ? driverDocSnapshot.data() : null
        if (driverDoc) {
          const driverData = driverDoc
          
          // Process documents from verification request (this has the actual URLs)
          const documents = requestData.documents || {}
          
          pendingDrivers.push({
            id: requestData.driverId,
            uid: requestData.driverId,
            driverId: requestData.driverId,
            personalInfo: {
              name: requestData.driverName || (driverData as any).name || 'Unknown Driver',
              email: (driverData as any).email || '',
              phone: requestData.driverPhone || (driverData as any).phone || '',
              dateOfBirth: (driverData as any).dateOfBirth || '',
              address: (driverData as any).address || ''
            },
            vehicleInfo: {
              make: (driverData as any).vehicleInfo?.make || (driverData as any).vehicle?.make || 'Unknown',
              model: (driverData as any).vehicleInfo?.model || (driverData as any).vehicle?.model || 'Unknown',
              year: (driverData as any).vehicleInfo?.year || (driverData as any).vehicle?.year || 0,
              color: (driverData as any).vehicleInfo?.color || (driverData as any).vehicle?.color || 'Unknown',
              plateNumber: (driverData as any).vehicleInfo?.plateNumber || (driverData as any).vehicle?.plateNumber || 'Unknown'
            },
            documents: {
              drivingLicense: {
                url: documents.drivingLicense?.downloadURL || documents.driving_license?.downloadURL || '',
                status: documents.drivingLicense?.verificationStatus || documents.driving_license?.verificationStatus || 'pending',
                uploadedAt: documents.drivingLicense?.uploadedAt || documents.driving_license?.uploadedAt || '',
                verified: (documents.drivingLicense?.verificationStatus || documents.driving_license?.verificationStatus) === 'verified'
              },
              aadhaarCard: {
                url: documents.aadhaarCard?.downloadURL || documents.aadhaar_card?.downloadURL || '',
                status: documents.aadhaarCard?.verificationStatus || documents.aadhaar_card?.verificationStatus || 'pending',
                uploadedAt: documents.aadhaarCard?.uploadedAt || documents.aadhaar_card?.uploadedAt || '',
                verified: (documents.aadhaarCard?.verificationStatus || documents.aadhaar_card?.verificationStatus) === 'verified'
              },
              bikeInsurance: {
                url: documents.bikeInsurance?.downloadURL || documents.bike_insurance?.downloadURL || '',
                status: documents.bikeInsurance?.verificationStatus || documents.bike_insurance?.verificationStatus || 'pending',
                uploadedAt: documents.bikeInsurance?.uploadedAt || documents.bike_insurance?.uploadedAt || '',
                verified: (documents.bikeInsurance?.verificationStatus || documents.bike_insurance?.verificationStatus) === 'verified'
              },
              rcBook: {
                url: documents.rcBook?.downloadURL || documents.rc_book?.downloadURL || '',
                status: documents.rcBook?.verificationStatus || documents.rc_book?.verificationStatus || 'pending',
                uploadedAt: documents.rcBook?.uploadedAt || documents.rc_book?.uploadedAt || '',
                verified: (documents.rcBook?.verificationStatus || documents.rc_book?.verificationStatus) === 'verified'
              },
              profilePhoto: {
                url: documents.profilePhoto?.downloadURL || documents.profile_photo?.downloadURL || '',
                status: documents.profilePhoto?.verificationStatus || documents.profile_photo?.verificationStatus || 'pending',
                uploadedAt: documents.profilePhoto?.uploadedAt || documents.profile_photo?.uploadedAt || '',
                verified: (documents.profilePhoto?.verificationStatus || documents.profile_photo?.verificationStatus) === 'verified'
              }
            },
            location: (driverData as any).location ? {
              latitude: (driverData as any).location.latitude || 0,
              longitude: (driverData as any).location.longitude || 0,
              address: (driverData as any).location.address || 'Unknown',
              timestamp: (driverData as any).location.timestamp || new Date().toISOString()
            } : undefined,
            isOnline: (driverData as any).isOnline || false,
            isAvailable: (driverData as any).isAvailable || false,
            rating: (driverData as any).driver?.rating || 0,
            totalDeliveries: (driverData as any).driver?.totalTrips || 0,
            earnings: {
              total: (driverData as any).driver?.earnings?.total || 0,
              thisMonth: (driverData as any).driver?.earnings?.thisMonth || 0,
              lastMonth: (driverData as any).driver?.earnings?.lastMonth || 0
            },
            status: 'pending',
            isVerified: false,
            createdAt: (driverData as any).createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: requestData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          } as Driver)
        }
      }
      
      return {
        success: true,
        data: pendingDrivers,
        message: 'Pending verifications fetched from Firestore successfully'
      }
    } catch (error) {
      console.error('❌ Error fetching pending verifications from Firestore:', error)
      return {
        success: false,
        error: {
          code: 'FIRESTORE_FETCH_ERROR',
          message: 'Failed to fetch pending verifications from Firestore'
        }
      }
    }
  }

  // Enhanced method to get driver documents with proper debugging
  async getDriverDocuments(driverId: string): Promise<AdminServiceResponse<any>> {
    try {
      console.log(`📄 Fetching documents for driver: ${driverId}`)
      
      // First try backend API (most reliable)
      try {
        console.log('🌐 Attempting to fetch from backend API...')
        const response = await apiService.get(`/api/admin/drivers/${driverId}/documents`)
        
        if (response.success && response.data) {
          console.log('✅ Documents retrieved from backend API:', response.data)
          return {
            success: true,
            data: response.data,
            message: 'Documents retrieved from backend API'
          }
        } else {
          console.warn('⚠️ Backend API failed, falling back to Firestore:', response.error)
        }
      } catch (apiError) {
        console.warn('⚠️ Backend API error, falling back to Firestore:', apiError)
      }
      
      // Fallback to Firestore
      console.log('🔥 Falling back to Firestore...')
      
      // First, try to get from verification requests (most recent)
      const verificationQuery = query(
        collection(db, 'documentVerificationRequests'),
        where('driverId', '==', driverId),
        orderBy('requestedAt', 'desc'),
        limit(1)
      )
      const verificationSnapshot = await getDocs(verificationQuery)
      
      if (!verificationSnapshot.empty) {
        const verificationData = verificationSnapshot.docs[0]?.data()
        console.log('📋 Found verification request:', verificationData)
        
        const documents = verificationData?.documents || {}
        const processedDocuments = {
          drivingLicense: {
            url: documents.drivingLicense?.downloadURL || documents.driving_license?.downloadURL || '',
            status: (documents.drivingLicense?.verificationStatus || documents.driving_license?.verificationStatus || 'pending') as 'pending' | 'verified' | 'rejected',
            uploadedAt: documents.drivingLicense?.uploadedAt || documents.driving_license?.uploadedAt || '',
            verified: (documents.drivingLicense?.verificationStatus || documents.driving_license?.verificationStatus) === 'verified'
          },
          aadhaarCard: {
            url: documents.aadhaarCard?.downloadURL || documents.aadhaar_card?.downloadURL || '',
            status: (documents.aadhaarCard?.verificationStatus || documents.aadhaar_card?.verificationStatus || 'pending') as 'pending' | 'verified' | 'rejected',
            uploadedAt: documents.aadhaarCard?.uploadedAt || documents.aadhaar_card?.uploadedAt || '',
            verified: (documents.aadhaarCard?.verificationStatus || documents.aadhaar_card?.verificationStatus) === 'verified'
          },
          bikeInsurance: {
            url: documents.bikeInsurance?.downloadURL || documents.bike_insurance?.downloadURL || '',
            status: (documents.bikeInsurance?.verificationStatus || documents.bike_insurance?.verificationStatus || 'pending') as 'pending' | 'verified' | 'rejected',
            uploadedAt: documents.bikeInsurance?.uploadedAt || documents.bike_insurance?.uploadedAt || '',
            verified: (documents.bikeInsurance?.verificationStatus || documents.bike_insurance?.verificationStatus) === 'verified'
          },
          rcBook: {
            url: documents.rcBook?.downloadURL || documents.rc_book?.downloadURL || '',
            status: (documents.rcBook?.verificationStatus || documents.rc_book?.verificationStatus || 'pending') as 'pending' | 'verified' | 'rejected',
            uploadedAt: documents.rcBook?.uploadedAt || documents.rc_book?.uploadedAt || '',
            verified: (documents.rcBook?.verificationStatus || documents.rc_book?.verificationStatus) === 'verified'
          },
          profilePhoto: {
            url: documents.profilePhoto?.downloadURL || documents.profile_photo?.downloadURL || '',
            status: (documents.profilePhoto?.verificationStatus || documents.profile_photo?.verificationStatus || 'pending') as 'pending' | 'verified' | 'rejected',
            uploadedAt: documents.profilePhoto?.uploadedAt || documents.profile_photo?.uploadedAt || '',
            verified: (documents.profilePhoto?.verificationStatus || documents.profile_photo?.verificationStatus) === 'verified'
          }
        }
        
        console.log('📄 Processed documents from verification request:', processedDocuments)
        
        return {
          success: true,
          data: {
            documents: processedDocuments,
            source: 'verification_request',
            verificationRequestId: verificationSnapshot.docs[0]?.id
          },
          message: 'Documents retrieved from verification request'
        }
      }
      
      // Fallback: Get from user collection
      console.log('📋 No verification request found, checking user collection...')
      const userDocRef = doc(db, 'users', driverId)
      const userDocSnapshot = await getDoc(userDocRef)
      const userDoc = userDocSnapshot.exists() ? userDocSnapshot.data() : null
      
      if (userDoc) {
        const userDocs = (userDoc as any).driver?.documents || (userDoc as any).documents || {}
        console.log('📄 User documents found:', userDocs)
        
        const processedDocuments = {
          drivingLicense: {
            url: userDocs.drivingLicense?.url || userDocs.driving_license?.url || '',
            status: (userDocs.drivingLicense?.status || userDocs.driving_license?.status || 'pending') as 'pending' | 'verified' | 'rejected',
            uploadedAt: userDocs.drivingLicense?.uploadedAt || userDocs.driving_license?.uploadedAt || '',
            verified: userDocs.drivingLicense?.verified || false
          },
          aadhaarCard: {
            url: userDocs.aadhaar?.url || userDocs.aadhaarCard?.url || userDocs.aadhaar_card?.url || '',
            status: (userDocs.aadhaar?.status || userDocs.aadhaarCard?.status || userDocs.aadhaar_card?.status || 'pending') as 'pending' | 'verified' | 'rejected',
            uploadedAt: userDocs.aadhaar?.uploadedAt || userDocs.aadhaarCard?.uploadedAt || userDocs.aadhaar_card?.uploadedAt || '',
            verified: userDocs.aadhaar?.verified || userDocs.aadhaarCard?.verified || false
          },
          bikeInsurance: {
            url: userDocs.insurance?.url || userDocs.bikeInsurance?.url || userDocs.bike_insurance?.url || '',
            status: (userDocs.insurance?.status || userDocs.bikeInsurance?.status || userDocs.bike_insurance?.status || 'pending') as 'pending' | 'verified' | 'rejected',
            uploadedAt: userDocs.insurance?.uploadedAt || userDocs.bikeInsurance?.uploadedAt || userDocs.bike_insurance?.uploadedAt || '',
            verified: userDocs.insurance?.verified || userDocs.bikeInsurance?.verified || false
          },
          rcBook: {
            url: userDocs.rcBook?.url || userDocs.rc_book?.url || '',
            status: (userDocs.rcBook?.status || userDocs.rc_book?.status || 'pending') as 'pending' | 'verified' | 'rejected',
            uploadedAt: userDocs.rcBook?.uploadedAt || userDocs.rc_book?.uploadedAt || '',
            verified: userDocs.rcBook?.verified || false
          },
          profilePhoto: {
            url: userDocs.profilePhoto?.url || userDocs.profile_photo?.url || '',
            status: (userDocs.profilePhoto?.status || userDocs.profile_photo?.status || 'pending') as 'pending' | 'verified' | 'rejected',
            uploadedAt: userDocs.profilePhoto?.uploadedAt || userDocs.profile_photo?.uploadedAt || '',
            verified: userDocs.profilePhoto?.verified || false
          }
        }
        
        console.log('📄 Processed documents from user collection:', processedDocuments)
        
        return {
          success: true,
          data: {
            documents: processedDocuments,
            source: 'user_collection'
          },
          message: 'Documents retrieved from user collection'
        }
      }
      
      return {
        success: false,
        error: {
          code: 'NO_DOCUMENTS_FOUND',
          message: 'No documents found for this driver'
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching driver documents:', error)
      return {
        success: false,
        error: {
          code: 'DOCUMENTS_FETCH_ERROR',
          message: 'Failed to fetch driver documents'
        }
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

  // Debug method to check document flow
  async debugDriverDocuments(driverId: string): Promise<AdminServiceResponse<any>> {
    try {
      console.log(`🔍 Debug: Checking document flow for driver: ${driverId}`)
      
      // Try backend debug endpoint
      try {
        const response = await apiService.get(`/api/admin/debug/documents/${driverId}`)
        if (response.success && response.data) {
          console.log('🔍 Backend debug info:', response.data)
          return {
            success: true,
            data: response.data,
            message: 'Debug information retrieved from backend'
          }
        }
      } catch (apiError) {
        console.warn('⚠️ Backend debug failed:', apiError)
      }
      
      // Fallback to Firestore debug
      
      // Get driver info
      const driverDocRef = doc(db, 'users', driverId)
      const driverDocSnapshot = await getDoc(driverDocRef)
      const driverDoc = driverDocSnapshot.exists() ? driverDocSnapshot.data() : null
      
      // Get verification requests
      const verificationQuery = query(
        collection(db, 'documentVerificationRequests'),
        where('driverId', '==', driverId),
        orderBy('requestedAt', 'desc')
      )
      const verificationSnapshot = await getDocs(verificationQuery)
      
      // Get driver documents
      const driverDocsQuery = query(
        collection(db, 'driverDocuments'),
        where('driverId', '==', driverId)
      )
      const driverDocsSnapshot = await getDocs(driverDocsQuery)
      
      const debugInfo = {
        driverId,
        driverName: (driverDoc as any)?.name,
        driverPhone: (driverDoc as any)?.phone,
        verificationStatus: (driverDoc as any)?.driver?.verificationStatus,
        userCollectionDocuments: (driverDoc as any)?.driver?.documents || (driverDoc as any)?.documents || {},
        verificationRequests: verificationSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        driverDocumentsCollection: driverDocsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        timestamp: new Date().toISOString()
      }
      
      console.log('🔍 Firestore debug info:', debugInfo)
      
      return {
        success: true,
        data: debugInfo,
        message: 'Debug information retrieved from Firestore'
      }
      
    } catch (error) {
      console.error('❌ Debug error:', error)
      return {
        success: false,
        error: {
          code: 'DEBUG_ERROR',
          message: 'Failed to retrieve debug information'
        }
      }
    }
  }

  // Enhanced Firebase Document Verification Methods with Proper Folder Structure
  async getDriverDocumentsLegacy(driverId: string): Promise<AdminServiceResponse<any>> {
    try {
      console.log(`📄 Fetching documents for driver: ${driverId}`)
      
      // ✅ CRITICAL FIX: Get driver document from correct collection (users, not drivers)
      const driverDoc = await getDoc(doc(db, 'users', driverId))
      if (!driverDoc.exists()) {
        return {
          success: false,
          error: {
            code: 'DRIVER_NOT_FOUND',
            message: 'Driver not found'
          }
        }
      }
      
      const driverData = driverDoc.data()
      const documents: any = {}
      
      // ✅ CRITICAL FIX: Define document types matching backend structure
      const documentTypes = [
        { type: 'drivingLicense', folder: 'driving_license', patterns: ['driving_license', 'license', 'driving', 'dl'] },
        { type: 'bikeInsurance', folder: 'bike_insurance', patterns: ['bike_insurance', 'insurance', 'policy', 'coverage'] },
        { type: 'rcBook', folder: 'rc_book', patterns: ['rc_book', 'registration', 'rc', 'vehicle'] },
        { type: 'aadhaarCard', folder: 'aadhaar_card', patterns: ['aadhaar_card', 'identity', 'id', 'aadhar', 'pan'] },
        { type: 'profilePhoto', folder: 'profile_photo', patterns: ['profile_photo', 'profile', 'photo', 'picture'] }
      ]
      
      // Check each document type folder
      for (const docType of documentTypes) {
        try {
          const docTypeRef = ref(storage, `drivers/${driverId}/documents/${docType.folder}`)
          const listResult = await listAll(docTypeRef)
          
          if (listResult.items.length > 0) {
            // Get the most recent document (assuming multiple versions)
            const latestDoc = listResult.items.sort((a, b) => 
              b.name.localeCompare(a.name)
            )[0]
            
            const downloadURL = await getDownloadURL(latestDoc!)
            const metadata = await getMetadata(latestDoc!)
            
            documents[docType.type] = {
              url: downloadURL,
              fileName: latestDoc?.name || "unknown",
              uploadedAt: metadata.timeCreated,
              size: metadata.size,
              contentType: metadata.contentType,
              status: driverData?.driver?.documents?.[docType.type]?.status || driverData?.documents?.[docType.type]?.status || 'pending',
              verified: driverData?.driver?.documents?.[docType.type]?.verified || driverData?.documents?.[docType.type]?.verified || false,
              verificationNotes: driverData?.driver?.documents?.[docType.type]?.verificationNotes || driverData?.documents?.[docType.type]?.verificationNotes || '',
              folder: docType.folder,
              allVersions: listResult.items.map(item => ({
                name: item.name,
                path: item.fullPath
              }))
            }
          }
        } catch (folderError) {
          console.log(`⚠️ No documents found in ${docType.folder} folder for driver ${driverId}`)
        }
      }
      
      // ✅ CRITICAL FIX: Only check the correct storage path (no legacy needed)
      const correctPath = `drivers/${driverId}/documents`;
      
      try {
        console.log(`🔍 Checking correct path: ${correctPath}`);
        const legacyDocumentsRef = ref(storage, correctPath)
        const legacyListResult = await listAll(legacyDocumentsRef)
        
        for (const itemRef of legacyListResult.items) {
          const fileName = itemRef.name
          const downloadURL = await getDownloadURL(itemRef)
          const metadata = await getMetadata(itemRef)
          
          // Determine document type from filename for legacy documents
          let docType = 'other'
          for (const docTypeConfig of documentTypes) {
            if (docTypeConfig.patterns.some(pattern => 
              fileName.toLowerCase().includes(pattern)
            )) {
              docType = docTypeConfig.type
              break
            }
          }
          
          // Only add if we don't already have this document type
          if (!documents[docType]) {
            documents[docType] = {
              url: downloadURL,
              fileName: fileName,
              uploadedAt: metadata.timeCreated,
              size: metadata.size,
              contentType: metadata.contentType,
              status: driverData?.driver?.documents?.[docType]?.status || driverData?.documents?.[docType]?.status || 'pending',
              verified: driverData?.driver?.documents?.[docType]?.verified || driverData?.documents?.[docType]?.verified || false,
              verificationNotes: driverData?.driver?.documents?.[docType]?.verificationNotes || driverData?.documents?.[docType]?.verificationNotes || '',
              folder: 'documents',
              isLegacy: false,
              sourcePath: correctPath
            }
          }
        }
        
        console.log(`✅ Found ${legacyListResult.items.length} documents in correct path: ${correctPath}`);
      } catch (pathError) {
        console.log(`⚠️ No documents found in correct path: ${correctPath}`);
      }
      
      // Fallback to Firestore document data if no storage documents found
      if (Object.keys(documents).length === 0 && driverData?.documents) {
        console.log('📄 Using Firestore document data as fallback')
        Object.assign(documents, driverData.documents)
      }
      
      console.log(`✅ Fetched ${Object.keys(documents).length} documents for driver ${driverId}`)
      return {
        success: true,
        data: {
          driverId,
          driverName: driverData?.personalInfo?.name || driverData?.name || 'Unknown',
          documents,
          folderStructure: {
            basePath: `drivers/${driverId}`,
            documentTypes: documentTypes.map(dt => dt.folder)
          }
        },
        message: 'Driver documents fetched successfully'
      }
    } catch (error) {
      console.error('❌ Error fetching driver documents:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_DOCUMENTS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch driver documents'
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
      } else {
        console.error('❌ Backend API failed, falling back to Firestore')
        
        // Fallback to Firestore update
        const driverRef = doc(db, 'users', driverId)
        const driverDoc = await getDoc(driverRef)
        
        if (!driverDoc.exists()) {
          return {
            success: false,
            error: {
              code: 'DRIVER_NOT_FOUND',
              message: 'Driver not found'
            }
          }
        }
        
        const driverData = driverDoc.data()
        const documents = driverData.driver?.documents || driverData.documents || {}
        
        // Update specific document
        const documentKey = documentType === 'aadhaar' ? 'aadhaarCard' : 
                           documentType === 'insurance' ? 'bikeInsurance' : 
                           documentType === 'rc' ? 'rcBook' : 
                           documentType === 'profile' ? 'profilePhoto' : documentType
        
        if (documents[documentKey]) {
          documents[documentKey] = {
            ...documents[documentKey],
            status: status,
            verificationStatus: status, // Add verificationStatus field for consistency
            verified: status === 'verified',
            verifiedAt: new Date(),
            verifiedBy: 'admin',
            verificationComments: notes || null
          }
          
          // Update driver's documents
          await updateDoc(driverRef, {
            'driver.documents': documents,
            updatedAt: new Date()
          })
          
          // Check if all documents are verified
          const allDocuments = ['drivingLicense', 'aadhaarCard', 'bikeInsurance', 'rcBook', 'profilePhoto']
          const verifiedDocuments = allDocuments.filter(doc => 
            documents[doc]?.status === 'verified' || documents[doc]?.verified === true
          )
          
          // Update overall verification status
          let overallStatus = 'pending'
          if (verifiedDocuments.length === allDocuments.length) {
            overallStatus = 'verified'
          } else if (documents[documentKey]?.status === 'rejected') {
            overallStatus = 'rejected'
          } else {
            overallStatus = 'pending_verification'
          }
          
          await updateDoc(driverRef, {
            'driver.verificationStatus': overallStatus,
            'driver.lastDocumentVerified': documentType,
            'driver.lastDocumentVerifiedAt': new Date(),
            updatedAt: new Date()
          })
          
          console.log(`✅ Document ${documentType} ${status} successfully via Firestore fallback`)
          return {
            success: true,
            message: `Document ${status} successfully (via Firestore)`,
            data: {
              documentType,
              status,
              overallStatus,
              verifiedDocuments: verifiedDocuments.length,
              totalDocuments: allDocuments.length
            }
          }
        } else {
          return {
            success: false,
            error: {
              code: 'DOCUMENT_NOT_FOUND',
              message: 'Document not found for this driver'
            }
          }
        }
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
      } else {
        console.error('❌ Backend API failed, falling back to Firestore')
        
        // Fallback to Firestore update
        const driverRef = doc(db, 'users', driverId)
        
        await updateDoc(driverRef, {
          'driver.verificationStatus': 'verified',
          'driver.approvedAt': new Date(),
          'driver.approvedBy': 'admin',
          'driver.adminNotes': adminNotes || '',
          'driver.isVerified': true,
          updatedAt: new Date()
        })
        
        console.log(`✅ Driver ${driverId} approved successfully via Firestore fallback`)
        return {
          success: true,
          message: 'Driver approved successfully (via Firestore)'
        }
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
      } else {
        console.error('❌ Backend API failed, falling back to Firestore')
        
        // Fallback to Firestore update
        const driverRef = doc(db, 'users', driverId)
        
        await updateDoc(driverRef, {
          'driver.verificationStatus': 'rejected',
          'driver.rejectedAt': new Date(),
          'driver.rejectedBy': 'admin',
          'driver.rejectionReason': reason,
          'driver.isVerified': false,
          updatedAt: new Date()
        })
        
        console.log(`❌ Driver ${driverId} rejected successfully via Firestore fallback`)
        return {
          success: true,
          message: 'Driver rejected successfully (via Firestore)'
        }
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

  // Comprehensive document discovery method
  async discoverAllDriverDocuments(driverId: string): Promise<AdminServiceResponse<any>> {
    try {
      console.log(`🔍 Discovering all documents for driver: ${driverId}`)
      
      // First try the normalized API endpoint
      try {
        console.log(`🌐 Calling API: /api/admin/drivers/${driverId}/documents`)
        const response = await apiService.get(`/api/admin/drivers/${driverId}/documents`)
        console.log(`📡 API Response for driver ${driverId}:`, response)
        
        if (response.success && response.data) {
          console.log('✅ Documents retrieved from normalized API:', response.data)
          
          // Transform the normalized data to match UI expectations
          const responseData = response.data as any
          const documents = responseData.documents || {}
          console.log(`📄 Raw documents from API:`, documents)
          
          const transformedDocuments: any = {}
          
          Object.entries(documents).forEach(([key, doc]: [string, any]) => {
            console.log(`📄 Processing document ${key}:`, doc)
            if (doc.url) {
              transformedDocuments[key] = {
                url: doc.url,
                fileName: `${key}.jpg`, // Default filename
                uploadedAt: doc.uploadedAt || new Date().toISOString(),
                size: 0, // Unknown size from API
                contentType: 'image/jpeg', // Default content type
                folder: 'documents',
                fullPath: `drivers/${driverId}/documents/${key}`,
                status: doc.status || 'pending',
                verified: doc.verified || false,
                verificationNotes: '',
                documentType: key
              }
            } else {
              console.log(`⚠️ Document ${key} has no URL:`, doc)
            }
          })
          
          console.log(`📄 Transformed documents:`, transformedDocuments)
          
          return {
            success: true,
            data: {
              driverId,
              driverName: responseData.driverName || 'Unknown Driver',
              documents: transformedDocuments,
              folderStructure: { documents: Object.keys(transformedDocuments).length },
              totalDocuments: Object.keys(transformedDocuments).length,
              totalFolders: 1,
              source: 'normalized_api'
            },
            message: 'Documents discovered via normalized API'
          }
        }
      } catch (apiError) {
        console.warn('⚠️ Normalized API failed, falling back to Firestore:', apiError)
      }
      
      // Fallback to Firestore
      
      // Get driver data from Firestore (users collection)
      const driverDocRef = doc(db, 'users', driverId)
      const driverDocSnapshot = await getDoc(driverDocRef)
      if (!driverDocSnapshot.exists()) {
        return {
          success: false,
          error: {
            code: 'DRIVER_NOT_FOUND',
            message: 'Driver not found'
          }
        }
      }
      
      const driverData = driverDocSnapshot.data()
      const allDocuments: any = {}
      const folderStructure: any = {}
      
      // Define all possible folder structures - updated to match actual storage paths
      const possibleFolders = [
        'documents', 'license', 'insurance', 'registration', 'identity', 
        'vehicle', 'medical', 'background', 'verification', 'uploads',
        'files', 'attachments', 'proofs', 'certificates'
      ]
      
      // ✅ CRITICAL FIX: No legacy paths needed - only use correct structure
      
      // Check each possible folder
      for (const folder of possibleFolders) {
        try {
          const folderRef = ref(storage, `drivers/${driverId}/${folder}`)
          const listResult = await listAll(folderRef)
          
          if (listResult.items.length > 0) {
            folderStructure[folder] = listResult.items.length
            
            for (const itemRef of listResult.items) {
              const fileName = itemRef.name
              const downloadURL = await getDownloadURL(itemRef)
              const metadata = await getMetadata(itemRef)
              
              // Determine document type from filename and folder
              let docType = this.determineDocumentType(fileName, folder)
              
              // Create unique key for multiple documents of same type
              const docKey = allDocuments[docType] ? `${docType}_${Date.now()}` : docType
              
              allDocuments[docKey] = {
                url: downloadURL,
                fileName: fileName,
                uploadedAt: metadata.timeCreated,
                size: metadata.size,
                contentType: metadata.contentType,
                folder: folder,
                fullPath: itemRef.fullPath,
                status: driverData?.documents?.[docType]?.status || 'pending',
                verified: driverData?.documents?.[docType]?.verified || false,
                verificationNotes: driverData?.documents?.[docType]?.verificationNotes || '',
                documentType: docType
              }
            }
          }
        } catch (folderError) {
          // Folder doesn't exist or is empty, continue
          console.log(`📁 Folder ${folder} not found or empty for driver ${driverId}`)
        }
      }
      
      // ✅ CRITICAL FIX: Legacy path checks removed - only use correct structure
      
      // Also check for any files directly in the driver folder
      try {
        const driverFolderRef = ref(storage, `drivers/${driverId}`)
        const driverListResult = await listAll(driverFolderRef)
        
        for (const itemRef of driverListResult.items) {
          if (!itemRef.name.includes('/')) { // Direct files, not in subfolders
            const fileName = itemRef.name
            const downloadURL = await getDownloadURL(itemRef)
            const metadata = await getMetadata(itemRef)
            
            const docType = this.determineDocumentType(fileName, 'root')
            const docKey = allDocuments[docType] ? `${docType}_${Date.now()}` : docType
            
            allDocuments[docKey] = {
              url: downloadURL,
              fileName: fileName,
              uploadedAt: metadata.timeCreated,
              size: metadata.size,
              contentType: metadata.contentType,
              folder: 'root',
              fullPath: itemRef.fullPath,
              status: driverData?.documents?.[docType]?.status || 'pending',
              verified: driverData?.documents?.[docType]?.verified || false,
              verificationNotes: driverData?.documents?.[docType]?.verificationNotes || '',
              documentType: docType
            }
          }
        }
      } catch (rootError) {
        console.log('📁 No direct files in driver root folder')
      }
      
      console.log(`✅ Discovered ${Object.keys(allDocuments).length} documents across ${Object.keys(folderStructure).length} folders`)
      return {
        success: true,
        data: {
          driverId,
          driverName: driverData?.personalInfo?.name || driverData?.name || 'Unknown',
          documents: allDocuments,
          folderStructure,
          totalDocuments: Object.keys(allDocuments).length,
          totalFolders: Object.keys(folderStructure).length
        },
        message: 'All driver documents discovered successfully'
      }
    } catch (error) {
      console.error('❌ Error discovering driver documents:', error)
      return {
        success: false,
        error: {
          code: 'DISCOVER_DOCUMENTS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to discover driver documents'
        }
      }
    }
  }

  // Helper method to determine document type from filename and folder
  private determineDocumentType(fileName: string, folder: string): string {
    const fileNameLower = fileName.toLowerCase()
    const folderLower = folder.toLowerCase()
    
    // Document type patterns - updated to match actual storage structure
    const patterns = {
      drivingLicense: ['license', 'driving', 'dl', 'dl_', 'driving_license'],
      bikeInsurance: ['insurance', 'policy', 'coverage', 'ins_', 'policy_', 'bike_insurance'],
      rcBook: ['registration', 'rc', 'vehicle', 'reg_', 'rc_', 'vehicle_', 'rc_book'],
      aadhaarCard: ['identity', 'id', 'aadhar', 'aadhaar', 'pan', 'passport', 'voter', 'id_', 'aadhaar_card'],
      profilePhoto: ['photo', 'picture', 'image', 'profile', 'photo_', 'picture_', 'image_', 'profile_photo'],
      medical: ['medical', 'health', 'fitness', 'medical_', 'health_', 'fitness_'],
      background: ['background', 'police', 'verification', 'bg_', 'police_', 'verification_'],
      address: ['address', 'proof', 'residence', 'address_', 'proof_', 'residence_'],
      bank: ['bank', 'account', 'statement', 'bank_', 'account_', 'statement_']
    }
    
    // Check folder name first
    for (const [docType, typePatterns] of Object.entries(patterns)) {
      if (typePatterns.some(pattern => folderLower.includes(pattern))) {
        return docType
      }
    }
    
    // Check filename patterns
    for (const [docType, typePatterns] of Object.entries(patterns)) {
      if (typePatterns.some(pattern => fileNameLower.includes(pattern))) {
        return docType
      }
    }
    
    // Check file extension for images
    if (fileNameLower.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return 'photo'
    }
    
    // Check file extension for PDFs
    if (fileNameLower.match(/\.(pdf)$/)) {
      return 'document'
    }
    
    return 'other'
  }

  // Real-time driver updates
  subscribeToDriverUpdates(callback: (drivers: Driver[]) => void): Unsubscribe {
    const driversRef = collection(db, 'drivers')
    const q = query(driversRef, orderBy('createdAt', 'desc'))
    
    return onSnapshot(q, (snapshot) => {
      const drivers: Driver[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        drivers.push({
          id: doc.id,
          ...data,
          personalInfo: {
            name: data?.personalInfo?.name || data?.name || 'Driver',
            email: data?.personalInfo?.email || data?.email || '',
            phone: data?.personalInfo?.phone || data?.phone || '',
            dateOfBirth: data?.personalInfo?.dateOfBirth || data?.dateOfBirth || '',
            address: data?.personalInfo?.address || data?.address || ''
          },
          vehicleInfo: {
            make: data?.vehicleInfo?.make || data?.vehicle?.make || 'Unknown',
            model: data?.vehicleInfo?.model || data?.vehicle?.model || 'Unknown',
            year: data?.vehicleInfo?.year || data?.vehicle?.year || new Date().getFullYear(),
            color: data?.vehicleInfo?.color || data?.vehicle?.color || 'Unknown',
            plateNumber: data?.vehicleInfo?.plateNumber || data?.vehicle?.plateNumber || 'Unknown'
          },
          createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        } as Driver)
      })
      
      callback(drivers)
    })
  }


  async respondToEmergency(alertId: string, response: any): Promise<AdminServiceResponse> {
    try {
      console.log(`🚨 Responding to emergency alert: ${alertId}`)
      
      const alertRef = doc(db, 'emergencyAlerts', alertId)
      await updateDoc(alertRef, {
        status: 'responded',
        response: response,
        updatedAt: new Date()
      })
      
      console.log(`✅ Emergency alert ${alertId} responded successfully`)
      return {
        success: true,
        data: response,
        message: 'Emergency response recorded successfully'
      }
    } catch (error) {
      console.error('❌ Error responding to emergency:', error)
      return {
        success: false,
        error: {
          code: 'RESPOND_EMERGENCY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to respond to emergency'
        }
      }
    }
  }

  async updateEmergencyStatus(alertId: string, status: string): Promise<AdminServiceResponse> {
    try {
      console.log(`🚨 Updating emergency status: ${alertId} to ${status}`)
      
      const alertRef = doc(db, 'emergencyAlerts', alertId)
      const updateData: any = {
        status: status,
        updatedAt: new Date()
      }
      
      if (status === 'resolved') {
        updateData.resolvedAt = new Date()
      }
      
      await updateDoc(alertRef, updateData)
      
      console.log(`✅ Emergency alert ${alertId} status updated to ${status}`)
      return {
        success: true,
        message: 'Emergency status updated successfully'
      }
    } catch (error) {
      console.error('❌ Error updating emergency status:', error)
      return {
        success: false,
        error: {
          code: 'UPDATE_EMERGENCY_STATUS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update emergency status'
        }
      }
    }
  }

  // Real-time emergency alerts
  subscribeToEmergencyAlerts(callback: (alerts: any[]) => void): Unsubscribe {
    const alertsRef = collection(db, 'emergencyAlerts')
    const q = query(alertsRef, orderBy('createdAt', 'desc'))
    
    return onSnapshot(q, (snapshot) => {
      const alerts: any[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        alerts.push({
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        })
      })
      
      callback(alerts)
    })
  }

}

export const comprehensiveAdminService = new ComprehensiveAdminService()
export default comprehensiveAdminService

