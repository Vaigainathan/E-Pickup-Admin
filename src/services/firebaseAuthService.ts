import {  
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  updateProfile,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { customClaimsService } from './customClaimsService';

export interface AdminUser {
  uid: string;
  id: string; // Alias for uid for backward compatibility
  email: string;
  name: string; // Alias for displayName for backward compatibility
  displayName: string;
  role: 'super_admin';
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
  isEmailVerified: boolean;
  idToken?: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  displayName: string;
  role: 'super_admin'; // All admins are super_admin
}

class FirebaseAuthService {
  constructor() {
    // Listen to auth state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // Store user data in secure storage (async but don't await to avoid blocking)
        this.storeUserData(user).catch(error => {
          console.error('❌ [ADMIN] Error storing user data:', error);
        });
      } else {
        // Clear user data from secure storage
        this.clearUserData();
      }
    });
  }

  /**
   * Sign in with email and password using Firebase Auth
   */
  async signIn(credentials: LoginCredentials): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      console.log('🔐 [ADMIN] Attempting Firebase authentication:', credentials.email);
      
      // Use Firebase Auth v9+ syntax
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const user = userCredential.user;
      
      if (!user) {
        throw new Error('No user returned from authentication');
      }

      console.log('✅ [ADMIN] Firebase authentication successful');
      
      // Create basic admin user object - let backend handle the full user data
      const basicAdminUser: AdminUser = {
        uid: user.uid,
        id: user.uid,
        email: user.email!,
        name: user.displayName || 'Admin User',
        displayName: user.displayName || 'Admin User',
        role: 'super_admin',
        permissions: ['all'],
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isEmailVerified: user.emailVerified
      };
      
      return {
        success: true,
        user: basicAdminUser
      };

    } catch (error: any) {
      console.error('❌ [ADMIN] Sign in error:', error);
      
      const errorMessage = this.getErrorMessage(error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Create new admin user
   */
  async signUp(signupData: SignupData): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      console.log('📝 [ADMIN] Creating new admin user:', signupData.email);

      const result = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
      
      // Update user profile
      await updateProfile(result.user, {
        displayName: signupData.displayName
      });

      // Create admin user document via backend API instead of direct Firestore write
      const adminUser: AdminUser = {
        uid: result.user.uid,
        id: result.user.uid, // Alias for uid
        email: result.user.email!,
        name: signupData.displayName, // Alias for displayName
        displayName: signupData.displayName,
        role: signupData.role,
        permissions: this.getPermissionsForRole(signupData.role),
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isEmailVerified: result.user.emailVerified
      };

      // Create admin user document in Firestore directly (Firebase handles permissions)
      try {
        const idToken = await result.user.getIdToken();
        console.log('📝 Creating admin user document in Firestore...');
        
        // Use Firebase Admin SDK via backend to create admin user document
        const createResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://epickup-backend.onrender.com'}/api/admin/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}` // Use Firebase ID token directly
          },
          body: JSON.stringify({
            displayName: signupData.displayName,
            role: signupData.role
          })
        });

        console.log(`📋 Backend response status: ${createResponse.status}`);

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          console.error('❌ Admin user creation failed:', errorData);
          throw new Error(`Admin user creation failed: ${errorData.error?.message || createResponse.statusText}`);
        }

        const createData = await createResponse.json();
        console.log('✅ Admin user created successfully:', createData);
        
        // Store the backend JWT token if provided
        if (createData.data?.token) {
          const { secureTokenStorage } = await import('./secureTokenStorage');
          await secureTokenStorage.setTokenData({
            token: createData.data.token,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            user: createData.data.user
          });
          
          // Set token in API service
          const { apiService } = await import('./apiService');
          apiService.setToken(createData.data.token);
          
          console.log('✅ Backend JWT token stored and set in API service');
        }
        
        // Update adminUser with backend data if available
        if (createData.data) {
          Object.assign(adminUser, createData.data);
        }
        
      } catch (backendError: any) {
        console.error('❌ Admin user creation failed:', backendError);
        
        // Check if it's a network error (backend not running)
        if (backendError.message && (backendError.message.includes('Failed to fetch') || backendError.message.includes('NetworkError'))) {
          throw new Error('Backend server is not running. Please start the backend server and try again.');
        }
        
        // Check if it's a permission error
        if (backendError.message && (backendError.message.includes('permission') || backendError.message.includes('PERMISSION_DENIED'))) {
          throw new Error('Insufficient permissions to create admin user. Please check Firebase configuration.');
        }
        
        // For other errors, throw them instead of silently continuing
        const errorMessage = backendError.message || backendError.toString() || 'Unknown error';
        throw new Error(`Admin creation failed: ${errorMessage}`);
      }
      
      console.log('✅ [ADMIN] Admin user created successfully');
      
      return {
        success: true,
        user: adminUser
      };

    } catch (error: any) {
      console.error('❌ [ADMIN] Sign up error:', error);
      
      const errorMessage = this.getErrorMessage(error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      console.log('👋 [ADMIN] Signing out user...');
      
      // Clear custom claims cache
      customClaimsService.clearClaims();
      
      await signOut(auth);
      this.clearUserData();
      
      console.log('✅ [ADMIN] User signed out successfully');
    } catch (error: any) {
      console.error('❌ [ADMIN] Error signing out:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 [ADMIN] Sending password reset email to:', email);

      await sendPasswordResetEmail(auth, email);
      
      console.log('✅ [ADMIN] Password reset email sent successfully');
      
      return {
        success: true
      };

    } catch (error: any) {
      console.error('❌ [ADMIN] Password reset error:', error);
      
      const errorMessage = this.getErrorMessage(error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get current user from secure storage
   */
  getCurrentUser(): AdminUser | null {
    try {
      const { secureTokenStorage } = require('./secureTokenStorage');
      return secureTokenStorage.getCurrentUser();
    } catch (error) {
      console.error('❌ [ADMIN] Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated using secure storage
   */
  isAuthenticated(): boolean {
    try {
      const { secureTokenStorage } = require('./secureTokenStorage');
      return secureTokenStorage.isAuthenticated();
    } catch (error) {
      console.error('❌ [ADMIN] Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Get Firebase ID token
   */
  async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    try {
      // Get current Firebase user
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        const token = await currentUser.getIdToken(forceRefresh);
        return token;
      }
      
      console.log('❌ [ADMIN] No Firebase user found');
      return null;
    } catch (error) {
      console.error('❌ [ADMIN] Error getting Firebase token:', error);
      return null;
    }
  }

  /**
   * Get admin user data from Firestore using v9+ syntax
   */
  private async getAdminUserData(uid: string): Promise<AdminUser> {
    try {
      const userDocRef = doc(db, 'adminUsers', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as AdminUser;
        
        // Update last login
        const updatedUser = {
          ...userData,
          id: userData.uid, // Ensure id is set
          name: userData.displayName, // Ensure name is set
          lastLogin: new Date().toISOString()
        };
        
        await setDoc(userDocRef, updatedUser, { merge: true });
        
        // Also sync to users collection
        await setDoc(doc(db, 'users', uid), updatedUser, { merge: true });
        
        return updatedUser;
      } else {
        // Try to find admin user in users collection
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', uid), where('userType', '==', 'admin'));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty && querySnapshot.docs.length > 0) {
          const userData = querySnapshot.docs[0]?.data() as AdminUser;
          if (userData) {
            const updatedUser = {
              ...userData,
              id: userData.uid,
              name: userData.displayName,
              lastLogin: new Date().toISOString()
            };
            
            // Sync to adminUsers collection
            await setDoc(doc(db, 'adminUsers', uid), updatedUser, { merge: true });
            
            return updatedUser;
          }
        }
        
        // If admin user doesn't exist, create it
        console.log('🔧 [ADMIN] Admin user not found, creating new admin user...');
        return await this.createAdminUserFromFirebase(uid);
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error getting admin user data:', error);
      throw error;
    }
  }

  /**
   * Create admin user from Firebase Auth data
   */
  private async createAdminUserFromFirebase(uid: string): Promise<AdminUser> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No Firebase user found');
      }

      const adminUserData: AdminUser = {
        uid: uid,
        id: uid,
        email: currentUser.email!,
        name: currentUser.displayName || 'EPickup Admin',
        displayName: currentUser.displayName || 'EPickup Admin',
        role: 'super_admin',
        permissions: ['all'],
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isEmailVerified: currentUser.emailVerified
      };

      // Store in both collections
      await setDoc(doc(db, 'adminUsers', uid), adminUserData);
      await setDoc(doc(db, 'users', uid), adminUserData);

      console.log('✅ [ADMIN] Created new admin user:', uid);
      return adminUserData;
    } catch (error) {
      console.error('❌ [ADMIN] Error creating admin user:', error);
      throw error;
    }
  }

  /**
   * Store user data securely
   */
  private async storeUserData(user: User): Promise<void> {
    try {
      const adminUser = await this.getAdminUserData(user.uid);
      const idToken = await user.getIdToken();
      
      // Use secure storage instead of localStorage
      const { secureTokenStorage } = await import('./secureTokenStorage');
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      if (secureTokenStorage) {
        secureTokenStorage.setTokenData({
          token: idToken,
          expiresAt,
          user: adminUser
        });
      }
      
      console.log('💾 [ADMIN] User data stored securely');
    } catch (error) {
      console.error('❌ [ADMIN] Error storing user data:', error);
    }
  }

  /**
   * Clear user data from secure storage
   */
  private clearUserData(): void {
    try {
      // Use secure storage clear method
      const { secureTokenStorage } = require('./secureTokenStorage');
      secureTokenStorage.clearTokenData();
      
      console.log('🗑️ [ADMIN] User data cleared from secure storage');
    } catch (error) {
      console.error('❌ [ADMIN] Error clearing user data:', error);
    }
  }

  /**
   * Get permissions for role
   */
  private getPermissionsForRole(_role: AdminUser['role']): string[] {
    // All admins have full access (only super_admin role needed)
    return ['all'];
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    const errorCode = error.code;
    
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No admin account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-disabled':
        return 'This admin account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/email-already-in-use':
        return 'An admin account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/timeout':
        return 'Request timed out. Please try again.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;
