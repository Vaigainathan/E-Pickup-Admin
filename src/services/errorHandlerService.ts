/**
 * Error Handling Service
 * Provides centralized error handling with user-friendly messages
 */

export interface ErrorInfo {
  code: string;
  message: string;
  details?: string;
  severity: 'error' | 'warning' | 'info';
  action?: string;
  retryable: boolean;
}

export interface NetworkError extends Error {
  status?: number;
  statusText?: string;
  response?: any;
}

class ErrorHandlerService {
  private errorMessages: Record<string, ErrorInfo> = {
    // Authentication errors
    'AUTHENTICATION_FAILED': {
      code: 'AUTHENTICATION_FAILED',
      message: 'Login failed. Please check your credentials and try again.',
      severity: 'error',
      retryable: true,
      action: 'Please verify your email and password'
    },
    'TOKEN_EXPIRED': {
      code: 'TOKEN_EXPIRED',
      message: 'Your session has expired. Please log in again.',
      severity: 'warning',
      retryable: true,
      action: 'Click here to log in again'
    },
    'INVALID_CREDENTIALS': {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password. Please try again.',
      severity: 'error',
      retryable: true,
      action: 'Please check your credentials'
    },
    'ADMIN_ACCESS_DENIED': {
      code: 'ADMIN_ACCESS_DENIED',
      message: 'Access denied. Admin email not authorized.',
      severity: 'error',
      retryable: false,
      action: 'Contact system administrator'
    },
    'INSUFFICIENT_ADMIN_ROLE': {
      code: 'INSUFFICIENT_ADMIN_ROLE',
      message: "You don't have access to perform this action.",
      severity: 'error',
      retryable: false,
      action: 'Contact a super admin if you need access'
    },
    'ADMIN_SIGNUP_DISABLED': {
      code: 'ADMIN_SIGNUP_DISABLED',
      message: 'Admin self-registration is not available.',
      severity: 'error',
      retryable: false,
      action: 'Contact a super admin to create your account'
    },
    'ACCOUNT_DISABLED': {
      code: 'ACCOUNT_DISABLED',
      message: 'This admin account has been disabled.',
      severity: 'error',
      retryable: false,
      action: 'Contact a super admin'
    },

    // Network errors
    'NETWORK_ERROR': {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed. Please check your internet connection.',
      severity: 'error',
      retryable: true,
      action: 'Try again'
    },
    'TIMEOUT': {
      code: 'TIMEOUT',
      message: 'Request timed out. The server is taking too long to respond.',
      severity: 'error',
      retryable: true,
      action: 'Try again'
    },
    'SERVER_ERROR': {
      code: 'SERVER_ERROR',
      message: 'Server error occurred. Please try again later.',
      severity: 'error',
      retryable: true,
      action: 'Try again in a few minutes'
    },

    // Validation errors
    'VALIDATION_ERROR': {
      code: 'VALIDATION_ERROR',
      message: 'Please check your input and try again.',
      severity: 'warning',
      retryable: true,
      action: 'Fix the highlighted fields'
    },
    'REQUIRED_FIELD': {
      code: 'REQUIRED_FIELD',
      message: 'This field is required.',
      severity: 'warning',
      retryable: true,
      action: 'Please fill in this field'
    },

    // Permission errors
    'FORBIDDEN': {
      code: 'FORBIDDEN',
      message: 'You do not have permission to perform this action.',
      severity: 'error',
      retryable: false,
      action: 'Contact your administrator'
    },
    'UNAUTHORIZED': {
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource.',
      severity: 'error',
      retryable: true,
      action: 'Please log in'
    },

    // Data errors
    'NOT_FOUND': {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
      severity: 'error',
      retryable: false,
      action: 'Please refresh the page'
    },
    'USE_MARKETPLACE_HELP': {
      code: 'USE_MARKETPLACE_HELP',
      message: 'This is a marketplace order ticket. Handle it under Marketplace → Help.',
      severity: 'info',
      retryable: false,
    },
    'SNAPSHOT_EXISTS': {
      code: 'SNAPSHOT_EXISTS',
      message: 'A marketplace restore snapshot already exists. Use force only if you intend to overwrite it.',
      severity: 'warning',
      retryable: false,
    },
    'SNAPSHOT_MISSING': {
      code: 'SNAPSHOT_MISSING',
      message: 'No marketplace snapshot is available to restore this customer.',
      severity: 'error',
      retryable: false,
    },
    'DUPLICATE_ENTRY': {
      code: 'DUPLICATE_ENTRY',
      message: 'This item already exists.',
      severity: 'warning',
      retryable: true,
      action: 'Please use a different value'
    },

    // Rate limiting
    'RATE_LIMIT_EXCEEDED': {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait before trying again.',
      severity: 'warning',
      retryable: true,
      action: 'Wait a moment and try again'
    },

    // Default error
    'UNKNOWN_ERROR': {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      severity: 'error',
      retryable: true,
      action: 'Try again or contact support'
    }
  };

  /**
   * Handle and format errors
   */
  handleError(error: any): ErrorInfo {
    console.error('Error caught by error handler:', error);

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return this.errorMessages.NETWORK_ERROR!;
    }

    // HTTP status errors
    if (error.status) {
      switch (error.status) {
        case 401:
          return this.errorMessages.UNAUTHORIZED!;
        case 403:
          return this.errorMessages.FORBIDDEN!;
        case 404:
          return this.errorMessages.NOT_FOUND!;
        case 408:
          return this.errorMessages.TIMEOUT!;
        case 429:
          return this.errorMessages.RATE_LIMIT_EXCEEDED!;
        case 500:
        case 502:
        case 503:
        case 504:
          return this.errorMessages.SERVER_ERROR!;
        default:
          return this.createCustomError(error.status, error.statusText);
      }
    }

    // API response errors
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      const errorCode = apiError.code || 'UNKNOWN_ERROR';
      
      if (this.errorMessages[errorCode]) {
        return { ...this.errorMessages[errorCode]! };
      }
    }

    if (error?.code && this.errorMessages[error.code]) {
      return { ...this.errorMessages[error.code]! };
    }

    // Firebase Auth errors
    if (error.code?.startsWith('auth/')) {
      return this.handleFirebaseError(error);
    }

    if (typeof error === 'string') {
      const known = this.errorMessages[error];
      if (known) return { ...known };
    }

    return { ...this.errorMessages.UNKNOWN_ERROR! };
  }

  /**
   * Handle Firebase Auth specific errors
   */
  private handleFirebaseError(error: any): ErrorInfo {
    const firebaseErrorMap: Record<string, ErrorInfo> = {
      'auth/user-not-found': {
        code: 'USER_NOT_FOUND',
        message: 'No admin account found with this email address.',
        severity: 'error',
        retryable: true,
        action: 'Please check your email address'
      },
      'auth/wrong-password': {
        code: 'INVALID_CREDENTIALS',
        message: 'Incorrect password. Please try again.',
        severity: 'error',
        retryable: true,
        action: 'Please check your password'
      },
      'auth/invalid-email': {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email address format.',
        severity: 'warning',
        retryable: true,
        action: 'Please enter a valid email address'
      },
      'auth/user-disabled': {
        code: 'ACCOUNT_DISABLED',
        message: 'This admin account has been disabled.',
        severity: 'error',
        retryable: false,
        action: 'Contact system administrator'
      },
      'auth/too-many-requests': {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many failed attempts. Please try again later.',
        severity: 'warning',
        retryable: true,
        action: 'Wait a few minutes before trying again'
      },
      'auth/network-request-failed': {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your internet connection.',
        severity: 'error',
        retryable: true,
        action: 'Check your connection and try again'
      }
    };

    return firebaseErrorMap[error.code] || this.errorMessages.UNKNOWN_ERROR!;
  }

  /**
   * Create custom error for HTTP status codes
   */
  private createCustomError(status: number, statusText: string): ErrorInfo {
    return {
      code: `HTTP_${status}`,
      message: `Request failed with status ${status}: ${statusText}`,
      severity: 'error',
      retryable: status >= 500,
      action: status >= 500 ? 'Try again later' : 'Please check your request'
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: any): string {
    const errorInfo = this.handleError(error);
    return errorInfo.message;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: any): boolean {
    const errorInfo = this.handleError(error);
    return errorInfo.retryable;
  }

  /**
   * Get error severity
   */
  getErrorSeverity(error: any): 'error' | 'warning' | 'info' {
    const errorInfo = this.handleError(error);
    return errorInfo.severity;
  }

  /**
   * Get suggested action
   */
  getSuggestedAction(error: any): string | undefined {
    const errorInfo = this.handleError(error);
    return errorInfo.action;
  }

  /**
   * Format error for logging
   */
  formatForLogging(error: any): string {
    const errorInfo = this.handleError(error);
    return `[${errorInfo.code}] ${errorInfo.message}${errorInfo.details ? ` - ${errorInfo.details}` : ''}`;
  }

  /**
   * Create error boundary error info
   */
  createErrorBoundaryError(error: Error, _errorInfo?: any): ErrorInfo {
    return {
      code: 'REACT_ERROR_BOUNDARY',
      message: 'Something went wrong. Please refresh the page and try again.',
      details: error.message,
      severity: 'error',
      retryable: true,
      action: 'Refresh the page'
    };
  }
}

export const errorHandlerService = new ErrorHandlerService();

/** User-facing message only — never exposes raw server/Firebase text */
export function mapError(error: unknown): string {
  return errorHandlerService.handleError(error).message;
}

export function mapErrorCode(error: unknown): string {
  return errorHandlerService.handleError(error).code;
}

export default errorHandlerService;
