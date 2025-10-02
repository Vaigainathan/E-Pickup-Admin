import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  memoryUsage?: number;
  timestamp: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      
      // Log performance metrics
      const metrics: PerformanceMetrics = {
        componentName,
        renderTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
        timestamp: Date.now()
      };

      // Log slow renders
      if (renderTime > 100) {
        console.warn(`🐌 Slow render detected in ${componentName}:`, metrics);
      }

      // Log performance data
      console.log(`📊 Performance metrics for ${componentName}:`, metrics);

      // Send to analytics service (if available)
      if (window.gtag) {
        window.gtag('event', 'component_render', {
          component_name: componentName,
          render_time: renderTime,
          render_count: renderCount.current
        });
      }
    };
  });

  // Monitor memory usage with cleanup
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    
    const checkMemoryUsage = () => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = memory.totalJSHeapSize / 1024 / 1024;
        
        if (usedMB > 100) { // Warn if using more than 100MB
          console.warn(`⚠️ High memory usage in ${componentName}:`, {
            used: `${usedMB.toFixed(2)}MB`,
            total: `${totalMB.toFixed(2)}MB`,
            limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
          });
        }
      }
    };

    intervalId = setInterval(checkMemoryUsage, 30000); // Check every 30 seconds
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current
  };
};
