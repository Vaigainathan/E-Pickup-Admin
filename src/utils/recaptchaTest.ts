/**
 * reCAPTCHA Integration Test Utility
 * Tests the reCAPTCHA service functionality
 */

import { recaptchaService } from '../services/recaptchaService';

export class RecaptchaTest {
  /**
   * Test reCAPTCHA service initialization
   */
  static async testInitialization(): Promise<boolean> {
    try {
      console.log('🧪 Testing reCAPTCHA initialization...');
      
      const status = recaptchaService.getStatus();
      console.log('📊 reCAPTCHA Status:', status);
      
      if (!status.siteKey) {
        console.error('❌ reCAPTCHA Site Key not configured');
        return false;
      }
      
      if (!status.loaded) {
        console.warn('⚠️ reCAPTCHA not loaded, attempting to load...');
        await recaptchaService.loadScript();
      }
      
      console.log('✅ reCAPTCHA initialization test passed');
      return true;
    } catch (error: any) {
      console.error('❌ reCAPTCHA initialization test failed:', error.message);
      return false;
    }
  }

  /**
   * Test reCAPTCHA token generation
   */
  static async testTokenGeneration(): Promise<boolean> {
    try {
      console.log('🧪 Testing reCAPTCHA token generation...');
      
      const token = await recaptchaService.execute('test', 5000);
      
      if (!token || token.length === 0) {
        console.error('❌ Empty token received');
        return false;
      }
      
      console.log('✅ Token generated successfully:', { hasToken: !!token });
      return true;
    } catch (error: any) {
      console.error('❌ Token generation test failed:', error.message);
      return false;
    }
  }

  /**
   * Test reCAPTCHA token verification
   */
  static async testTokenVerification(): Promise<boolean> {
    try {
      console.log('🧪 Testing reCAPTCHA token verification...');
      
      // Generate a token first
      const token = await recaptchaService.execute('test', 5000);
      
      if (!token) {
        console.error('❌ No token to verify');
        return false;
      }
      
      // Verify the token
      const verification = await recaptchaService.verifyToken(token);
      
      if (verification.success) {
        console.log('✅ Token verification successful:', {
          score: verification.score,
          action: verification.action
        });
        return true;
      } else {
        console.warn('⚠️ Token verification failed:', verification.error);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Token verification test failed:', error.message);
      return false;
    }
  }

  /**
   * Run all reCAPTCHA tests
   */
  static async runAllTests(): Promise<{
    initialization: boolean;
    tokenGeneration: boolean;
    tokenVerification: boolean;
    overall: boolean;
  }> {
    console.log('🚀 Starting reCAPTCHA Integration Tests...\n');
    
    const results = {
      initialization: false,
      tokenGeneration: false,
      tokenVerification: false,
      overall: false
    };
    
    // Test 1: Initialization
    results.initialization = await this.testInitialization();
    console.log('');
    
    // Test 2: Token Generation
    if (results.initialization) {
      results.tokenGeneration = await this.testTokenGeneration();
      console.log('');
    }
    
    // Test 3: Token Verification
    if (results.tokenGeneration) {
      results.tokenVerification = await this.testTokenVerification();
      console.log('');
    }
    
    // Overall result
    results.overall = results.initialization && results.tokenGeneration && results.tokenVerification;
    
    // Summary
    console.log('📋 Test Results Summary:');
    console.log(`  Initialization: ${results.initialization ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Token Generation: ${results.tokenGeneration ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Token Verification: ${results.tokenVerification ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Overall: ${results.overall ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return results;
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).RecaptchaTest = RecaptchaTest;
}
