// Global type declarations

// Google Analytics gtag
declare global {
  interface Window {
    gtag?: (command: string, action: string, parameters?: any) => void;
  }
  
  // Node.js process for build-time environment variables
  const process: {
    env: {
      NODE_ENV: string;
      [key: string]: string | undefined;
    };
  };
  
  // Node.js types
  namespace NodeJS {
    interface Timeout {
      ref(): Timeout;
      unref(): Timeout;
    }
  }
}

// Performance API extensions - extending the built-in Performance interface
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

// Export empty object to make this a module
export {};
