/**
 * Performance Monitoring Service
 * Tracks app performance metrics and bundle size
 */

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  apiResponseTime: number;
}

class PerformanceService {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0,
    apiResponseTime: 0
  };

  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring() {
    // Monitor page load performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        this.measurePageLoad();
        this.measureMemoryUsage();
      });

      // Monitor API response times
      this.observeApiPerformance();
    }
  }

  /**
   * Measure page load time
   */
  private measurePageLoad() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      console.log(`📊 Page load time: ${this.metrics.loadTime}ms`);
    } catch (error) {
      console.warn('Failed to measure page load time:', error);
    }
  }

  /**
   * Measure memory usage
   */
  private measureMemoryUsage() {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        
        console.log(`📊 Memory usage: ${this.metrics.memoryUsage.toFixed(2)}MB`);
      }
    } catch (error) {
      console.warn('Failed to measure memory usage:', error);
    }
  }

  /**
   * Monitor API performance
   */
  private observeApiPerformance() {
    // Override fetch to measure API response times
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        this.metrics.apiResponseTime = responseTime;
        console.log(`📊 API response time: ${responseTime.toFixed(2)}ms`);
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        console.log(`📊 API error response time: ${responseTime.toFixed(2)}ms`);
        throw error;
      }
    };
  }

  /**
   * Measure component render time
   */
  measureRenderTime(componentName: string, renderFn: () => void) {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    console.log(`📊 ${componentName} render time: ${renderTime.toFixed(2)}ms`);
    return renderTime;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): string {
    const metrics = this.getMetrics();
    
    return `
📊 Performance Report
====================
Page Load Time: ${metrics.loadTime.toFixed(2)}ms
Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB
API Response Time: ${metrics.apiResponseTime.toFixed(2)}ms
Bundle Size: ${metrics.bundleSize}KB

Performance Grade: ${this.getPerformanceGrade()}
    `.trim();
  }

  /**
   * Get performance grade based on metrics
   */
  private getPerformanceGrade(): string {
    const { loadTime, memoryUsage, apiResponseTime } = this.metrics;
    
    let score = 100;
    
    // Deduct points for slow load time
    if (loadTime > 3000) score -= 30;
    else if (loadTime > 2000) score -= 20;
    else if (loadTime > 1000) score -= 10;
    
    // Deduct points for high memory usage
    if (memoryUsage > 100) score -= 20;
    else if (memoryUsage > 50) score -= 10;
    
    // Deduct points for slow API responses
    if (apiResponseTime > 2000) score -= 20;
    else if (apiResponseTime > 1000) score -= 10;
    
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }

  /**
   * Log performance metrics
   */
  logMetrics() {
    console.log(this.getPerformanceReport());
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  /**
   * Clean up observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceService = new PerformanceService();
export default performanceService;
