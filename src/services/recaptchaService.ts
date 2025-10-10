/**
 * reCAPTCHA Service for Admin Dashboard
 * Handles reCAPTCHA v3 token generation and verification
 * Updated for Firebase v12+ and latest reCAPTCHA best practices
 */

// Extend Window interface for reCAPTCHA v3
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { 
        action: string;
        timeout?: number;
      }) => Promise<string>;
      getResponse?: (widgetId?: number) => string;
      reset?: (widgetId?: number) => void;
    };
  }
}

class RecaptchaService {
  private siteKey: string;

  constructor() {
    this.siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
    
    if (!this.siteKey) {
      console.warn('⚠️ reCAPTCHA Site Key not found in environment variables');
    }
  }

  /**
   * Check if reCAPTCHA is loaded
   */
  private checkRecaptchaLoaded(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.grecaptcha !== 'undefined' && 
           !!this.siteKey;
  }

  /**
   * Execute reCAPTCHA v3 and get token (Latest API)
   */
  async execute(action: string = 'login', timeout: number = 10000): Promise<string> {
    try {
      if (!this.checkRecaptchaLoaded()) {
        throw new Error('reCAPTCHA not loaded or site key missing');
      }

      console.log(`🔍 [RECAPTCHA] Executing reCAPTCHA v3 for action: ${action}`);

      return new Promise((resolve, reject) => {
        // Set timeout for reCAPTCHA execution
        const timeoutId = setTimeout(() => {
          reject(new Error('reCAPTCHA execution timeout'));
        }, timeout);

        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(this.siteKey, { 
            action,
            timeout: timeout 
          })
            .then((token: string) => {
              clearTimeout(timeoutId);
              if (token && token.length > 0) {
                console.log(`✅ [RECAPTCHA] Token generated successfully for action: ${action}`);
                resolve(token);
              } else {
                reject(new Error('Empty token received from reCAPTCHA'));
              }
            })
            .catch((error: any) => {
              clearTimeout(timeoutId);
              console.error('❌ [RECAPTCHA] Token generation failed:', error);
              reject(new Error(`reCAPTCHA execution failed: ${error.message || 'Unknown error'}`));
            });
        });
      });

    } catch (error: any) {
      console.error('❌ [RECAPTCHA] Service error:', error);
      throw new Error(`reCAPTCHA service error: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Verify reCAPTCHA token on backend (Latest API)
   */
  async verifyToken(token: string): Promise<{ success: boolean; score?: number; error?: string; action?: string }> {
    try {
      console.log('🔍 [RECAPTCHA] Verifying token on backend...');

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://epickup-backend.onrender.com'}/api/auth/verify-recaptcha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          timestamp: Date.now() // Add timestamp for better tracking
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Backend verification failed: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ [RECAPTCHA] Token verified successfully (score: ${result.score}, action: ${result.action})`);
      } else {
        console.log(`❌ [RECAPTCHA] Token verification failed: ${result.error}`);
      }

      return result;

    } catch (error: any) {
      console.error('❌ [RECAPTCHA] Verification error:', error);
      return {
        success: false,
        error: error.message || 'Verification failed'
      };
    }
  }

  /**
   * Get reCAPTCHA status
   */
  getStatus(): { loaded: boolean; siteKey: string | null } {
    return {
      loaded: this.checkRecaptchaLoaded(),
      siteKey: this.siteKey || null
    };
  }

  /**
   * Load reCAPTCHA script dynamically (if not already loaded)
   */
  async loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.checkRecaptchaLoaded()) {
        resolve();
        return;
      }

      if (typeof window === 'undefined') {
        reject(new Error('Window object not available'));
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="recaptcha"]');
      if (existingScript) {
        // Wait for script to load
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA script')));
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('✅ [RECAPTCHA] Script loaded successfully');
        resolve();
      };
      
      script.onerror = () => {
        console.error('❌ [RECAPTCHA] Failed to load script');
        reject(new Error('Failed to load reCAPTCHA script'));
      };

      document.head.appendChild(script);
    });
  }
}

// Export singleton instance
export const recaptchaService = new RecaptchaService();
export default recaptchaService;
