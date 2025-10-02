/**
 * Secure Token Storage Service
 * Provides secure storage for authentication tokens with encryption
 */

interface TokenData {
  token: string | null;
  refreshToken?: string;
  expiresAt: number;
  user: any;
}

class SecureTokenStorage {
  private readonly TOKEN_KEY = 'epickup_admin_token';
  private readonly USER_KEY = 'epickup_admin_user';
  private readonly ENCRYPTION_KEY: string;

  constructor() {
    // Generate a dynamic encryption key based on browser fingerprint
    this.ENCRYPTION_KEY = this.generateDynamicKey();
  }

  private generateDynamicKey(): string {
    // Create a dynamic key based on browser characteristics
    const browserInfo = [
      navigator.userAgent,
      navigator.language,
      screen.width.toString(),
      screen.height.toString(),
      new Date().getTimezoneOffset().toString()
    ].join('|');
    
    // Create a hash of the browser info
    let hash = 0;
    for (let i = 0; i < browserInfo.length; i++) {
      const char = browserInfo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to a 32-character key
    return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
  }

  /**
   * Secure encryption for token data
   * Uses Web Crypto API for proper encryption
   */
  private async encrypt(data: string): Promise<string> {
    try {
      // Validate input data
      if (!data || typeof data !== 'string') {
        throw new Error('Invalid data format for encryption');
      }
      
      if (data.length === 0) {
        throw new Error('Cannot encrypt empty data');
      }
      
      // Use Web Crypto API for secure encryption
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate a random IV for each encryption
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Import encryption key
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.ENCRYPTION_KEY),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBuffer
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Secure decryption for token data
   * Uses Web Crypto API for proper decryption
   */
  private async decrypt(encryptedData: string): Promise<string> {
    try {
      // Use Web Crypto API for secure decryption
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      // Decode base64 data
      const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedBuffer = combined.slice(12);
      
      // Import decryption key
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.ENCRYPTION_KEY),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encryptedBuffer
      );
      
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption error:', error);
      // Fallback to base64 decoding
      try {
        return atob(encryptedData);
      } catch {
        return encryptedData;
      }
    }
  }

  /**
   * Store token data securely
   */
  async setTokenData(tokenData: TokenData): Promise<void> {
    try {
      const encryptedToken = await this.encrypt(JSON.stringify({
        token: tokenData.token,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt
      }));
      
      const encryptedUser = await this.encrypt(JSON.stringify(tokenData.user));
      
      localStorage.setItem(this.TOKEN_KEY, encryptedToken);
      localStorage.setItem(this.USER_KEY, encryptedUser);
      
      console.log('✅ Token data stored securely');
    } catch (error) {
      console.error('❌ Error storing token data:', error);
    }
  }

  /**
   * Get token data
   */
  async getTokenData(): Promise<TokenData | null> {
    try {
      const encryptedToken = localStorage.getItem(this.TOKEN_KEY);
      const encryptedUser = localStorage.getItem(this.USER_KEY);
      
      if (!encryptedToken || !encryptedUser) {
        return null;
      }

      const tokenData = JSON.parse(await this.decrypt(encryptedToken));
      const user = JSON.parse(await this.decrypt(encryptedUser));
      
      // Check if token is expired
      if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
        this.clearTokenData();
        return null;
      }

      return {
        ...tokenData,
        user
      };
    } catch (error) {
      console.error('❌ Error retrieving token data:', error);
      this.clearTokenData();
      return null;
    }
  }

  /**
   * Get current token
   */
  async getToken(): Promise<string | null> {
    const tokenData = await this.getTokenData();
    return tokenData?.token || null;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<any | null> {
    const tokenData = await this.getTokenData();
    return tokenData?.user || null;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const tokenData = await this.getTokenData();
    return !!(tokenData?.token && tokenData?.user);
  }

  /**
   * Clear all token data
   */
  clearTokenData(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('is_authenticated');
      
      console.log('✅ Token data cleared');
    } catch (error) {
      console.error('❌ Error clearing token data:', error);
    }
  }

  /**
   * Update token (for refresh scenarios)
   */
  async updateToken(newToken: string | null, expiresAt?: number): Promise<void> {
    try {
      const tokenData = await this.getTokenData();
      if (tokenData) {
        await this.setTokenData({
          ...tokenData,
          token: newToken,
          expiresAt: expiresAt || tokenData.expiresAt
        });
      }
    } catch (error) {
      console.error('❌ Error updating token:', error);
    }
  }

  /**
   * Check if token needs refresh (within 5 minutes of expiry)
   */
  async needsRefresh(): Promise<boolean> {
    const tokenData = await this.getTokenData();
    if (!tokenData?.expiresAt) return false;
    
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() > (tokenData.expiresAt - fiveMinutes);
  }
}

export const secureTokenStorage = new SecureTokenStorage();
export default secureTokenStorage;
