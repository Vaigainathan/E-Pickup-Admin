import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

export interface UserTraceabilityResult {
  firebaseUID: string
  roleBasedUID?: string
  phone: string
  roles: string[]
  userData: any
  foundInCollections: string[]
}

class UserTraceabilityService {
  /**
   * Find user by Firebase UID across all collections
   */
  async findByFirebaseUID(firebaseUID: string): Promise<UserTraceabilityResult | null> {
    try {
      console.log(`🔍 [TRACE] Searching for Firebase UID: ${firebaseUID}`)
      
      const result: UserTraceabilityResult = {
        firebaseUID,
        phone: '',
        roles: [],
        userData: null,
        foundInCollections: []
      }

      // Check adminUsers collection
      try {
        const adminDoc = await getDoc(doc(db, 'adminUsers', firebaseUID))
        if (adminDoc.exists()) {
          const adminData = adminDoc.data()
          result.userData = adminData
          result.roles.push('admin')
          result.foundInCollections.push('adminUsers')
          result.phone = adminData.phone || ''
          console.log(`✅ [TRACE] Found admin user: ${adminData.email}`)
        }
      } catch (error) {
        console.error('❌ [TRACE] Error checking adminUsers:', error)
      }

      // Check users collection
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUID))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          if (!result.userData) {
            result.userData = userData
          }
          result.roles.push(userData.userType || 'unknown')
          result.foundInCollections.push('users')
          result.phone = userData.phone || result.phone
          console.log(`✅ [TRACE] Found user: ${userData.name} (${userData.userType})`)
        }
      } catch (error) {
        console.error('❌ [TRACE] Error checking users:', error)
      }

      return result.foundInCollections.length > 0 ? result : null
    } catch (error) {
      console.error('❌ [TRACE] Error finding user by Firebase UID:', error)
      return null
    }
  }

  /**
   * Find user by role-based UID across all collections
   */
  async findByRoleBasedUID(roleBasedUID: string): Promise<UserTraceabilityResult | null> {
    try {
      console.log(`🔍 [TRACE] Searching for role-based UID: ${roleBasedUID}`)
      
      const result: UserTraceabilityResult = {
        firebaseUID: '',
        roleBasedUID,
        phone: '',
        roles: [],
        userData: null,
        foundInCollections: []
      }

      // Check users collection (role-based UID is used as document ID)
      try {
        const userDoc = await getDoc(doc(db, 'users', roleBasedUID))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          result.userData = userData
          result.roles.push(userData.userType || 'unknown')
          result.foundInCollections.push('users')
          result.phone = userData.phone || ''
          result.firebaseUID = userData.originalFirebaseUID || ''
          console.log(`✅ [TRACE] Found role-based user: ${userData.name} (${userData.userType})`)
        }
      } catch (error) {
        console.error('❌ [TRACE] Error checking users collection:', error)
      }

      return result.foundInCollections.length > 0 ? result : null
    } catch (error) {
      console.error('❌ [TRACE] Error finding user by role-based UID:', error)
      return null
    }
  }

  /**
   * Find user by phone number across all collections
   */
  async findByPhoneNumber(phoneNumber: string): Promise<UserTraceabilityResult[]> {
    try {
      console.log(`🔍 [TRACE] Searching for phone number: ${phoneNumber}`)
      
      const results: UserTraceabilityResult[] = []

      // Search in users collection by phone
      try {
        const usersQuery = query(
          collection(db, 'users'),
          where('phone', '==', phoneNumber)
        )
        const usersSnapshot = await getDocs(usersQuery)
        
        usersSnapshot.forEach((doc) => {
          const userData = doc.data()
          results.push({
            firebaseUID: userData.originalFirebaseUID || '',
            roleBasedUID: doc.id,
            phone: phoneNumber,
            roles: [userData.userType || 'unknown'],
            userData,
            foundInCollections: ['users']
          })
          console.log(`✅ [TRACE] Found user by phone: ${userData.name} (${userData.userType})`)
        })
      } catch (error) {
        console.error('❌ [TRACE] Error searching users by phone:', error)
      }

      // Search in adminUsers collection by phone
      try {
        const adminQuery = query(
          collection(db, 'adminUsers'),
          where('phone', '==', phoneNumber)
        )
        const adminSnapshot = await getDocs(adminQuery)
        
        adminSnapshot.forEach((doc) => {
          const adminData = doc.data()
          results.push({
            firebaseUID: doc.id,
            roleBasedUID: doc.id, // Admin uses Firebase UID as role-based UID
            phone: phoneNumber,
            roles: ['admin'],
            userData: adminData,
            foundInCollections: ['adminUsers']
          })
          console.log(`✅ [TRACE] Found admin by phone: ${adminData.email}`)
        })
      } catch (error) {
        console.error('❌ [TRACE] Error searching adminUsers by phone:', error)
      }

      return results
    } catch (error) {
      console.error('❌ [TRACE] Error finding user by phone number:', error)
      return []
    }
  }

  /**
   * Get comprehensive user traceability information
   */
  async getComprehensiveTraceability(identifier: string): Promise<{
    firebaseUID?: UserTraceabilityResult
    roleBasedUID?: UserTraceabilityResult
    phoneNumber?: UserTraceabilityResult[]
  }> {
    try {
      console.log(`🔍 [TRACE] Comprehensive search for: ${identifier}`)
      
      const result: any = {}

      // Try as Firebase UID
      const firebaseResult = await this.findByFirebaseUID(identifier)
      if (firebaseResult) {
        result.firebaseUID = firebaseResult
      }

      // Try as role-based UID
      const roleBasedResult = await this.findByRoleBasedUID(identifier)
      if (roleBasedResult) {
        result.roleBasedUID = roleBasedResult
      }

      // Try as phone number
      const phoneResults = await this.findByPhoneNumber(identifier)
      if (phoneResults.length > 0) {
        result.phoneNumber = phoneResults
      }

      return result
    } catch (error) {
      console.error('❌ [TRACE] Error in comprehensive traceability:', error)
      return {}
    }
  }
}

export const userTraceabilityService = new UserTraceabilityService()
export default userTraceabilityService
