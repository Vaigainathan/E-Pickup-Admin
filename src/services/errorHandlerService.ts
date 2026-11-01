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
    'EMAIL_BELONGS_TO_OTHER_ROLE': {
      code: 'EMAIL_BELONGS_TO_OTHER_ROLE',
      message: 'This email is already used by another ePickup account.',
      severity: 'error',
      retryable: false,
    },

    // Rate limiting
    'RATE_LIMIT_EXCEEDED': {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait before trying again.',
      severity: 'warning',
      retryable: true,
      action: 'Wait a moment and try again'
    },

    'CANCEL_NOT_ALLOWED': {
      code: 'CANCEL_NOT_ALLOWED',
      message: 'This order cannot be cancelled in its current state.',
      severity: 'error',
      retryable: false,
      action: 'Check order status or use Booking Management for the linked trip'
    },
    'INVALID_ACTION': {
      code: 'INVALID_ACTION',
      message: 'That intervention action is not supported.',
      severity: 'error',
      retryable: false,
    },
    'INVALID_STATUS': {
      code: 'INVALID_STATUS',
      message: 'That booking status is not allowed.',
      severity: 'warning',
      retryable: true,
    },
    'INVALID_TRANSITION': {
      code: 'INVALID_TRANSITION',
      message: 'That status change is not allowed for this order or booking.',
      severity: 'error',
      retryable: false,
    },
    'USE_ORDER_ACTIONS': {
      code: 'USE_ORDER_ACTIONS',
      message: 'Use Marketplace order actions for this booking instead of generic status edits.',
      severity: 'info',
      retryable: false,
    },
    'UPDATE_BOOKING_STATUS_ERROR': {
      code: 'UPDATE_BOOKING_STATUS_ERROR',
      message: 'Could not update booking status. Try again or contact support.',
      severity: 'error',
      retryable: true,
      action: 'Try again'
    },
    'BOOKING_INTERVENTION_ERROR': {
      code: 'BOOKING_INTERVENTION_ERROR',
      message: 'Could not complete booking intervention. Try again or contact support.',
      severity: 'error',
      retryable: true,
    },
    'BOOKING_ACTIVE': {
      code: 'BOOKING_ACTIVE',
      message: 'This booking is still active — cancel or reassign it instead.',
      severity: 'warning',
      retryable: false,
    },
    'CANCEL_ORDER_ERROR': {
      code: 'CANCEL_ORDER_ERROR',
      message: 'Could not cancel this marketplace order.',
      severity: 'error',
      retryable: true,
    },
    'HTTP_400': {
      code: 'HTTP_400',
      message: 'The request was invalid. Please check your input and try again.',
      severity: 'warning',
      retryable: true,
    },
    'HTTP_409': {
      code: 'HTTP_409',
      message: 'This action is not allowed in the current state.',
      severity: 'error',
      retryable: false,
    },
    'HTTP_422': {
      code: 'HTTP_422',
      message: 'The request could not be processed. Please check the details and try again.',
      severity: 'warning',
      retryable: true,
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

    const apiErrorPayload = error.response?.data?.error ?? error.response?.error;
    const apiCode =
      (typeof apiErrorPayload?.code === 'string' && apiErrorPayload.code) ||
      (typeof error?.code === 'string' && error.code.startsWith('HTTP_') ? null : error?.code) ||
      null;

    if (apiCode && this.errorMessages[apiCode]) {
      return { ...this.errorMessages[apiCode]! };
    }

    if (error?.code && this.errorMessages[error.code]) {
      return { ...this.errorMessages[error.code]! };
    }

    // HTTP status errors (after known API codes)
    if (error.status) {
      const httpKey = `HTTP_${error.status}`;
      if (this.errorMessages[httpKey]) {
        return { ...this.errorMessages[httpKey]! };
      }
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

    // API response errors (unknown code)
    if (apiErrorPayload?.code && this.errorMessages[apiErrorPayload.code]) {
      return { ...this.errorMessages[apiErrorPayload.code]! };
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
    const wrongCredentials: ErrorInfo = {
      code: 'INVALID_CREDENTIALS',
      message: 'Wrong email or password.',
      severity: 'error',
      retryable: true,
    }

    const firebaseErrorMap: Record<string, ErrorInfo> = {
      'auth/user-not-found': wrongCredentials,
      'auth/wrong-password': wrongCredentials,
      'auth/invalid-credential': wrongCredentials,
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
        message: 'Too many attempts. Try again later.',
        severity: 'warning',
        retryable: true,
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
    const httpKey = `HTTP_${status}`;
    if (this.errorMessages[httpKey]) {
      return { ...this.errorMessages[httpKey]! };
    }
    const readable =
      status >= 500
        ? 'Something went wrong on the server. Please try again later.'
        : status >= 400
          ? 'The request could not be completed. Please check the details and try again.'
          : `Request failed (${status}${statusText ? `: ${statusText}` : ''}).`;
    return {
      code: httpKey,
      message: readable,
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

function extractServerMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const e = error as Record<string, unknown>;
  if (typeof e.serverMessage === 'string' && e.serverMessage.trim()) {
    return e.serverMessage.trim();
  }
  if (typeof e.message === 'string' && e.name === 'ApiRequestError') {
    // Already formatted by resolveErrorMessage
    return undefined;
  }
  const response = e.response as { data?: { error?: { message?: string } }; error?: { message?: string } } | undefined;
  const fromResponse =
    response?.data?.error?.message ||
    response?.error?.message ||
    (typeof e.apiMessage === 'string' ? e.apiMessage : undefined);
  if (typeof fromResponse === 'string' && fromResponse.trim()) {
    return fromResponse.trim();
  }
  if (typeof e.message === 'string' && !e.message.startsWith('Request failed with status')) {
    return e.message.trim();
  }
  return undefined;
}

/** User-facing message; appends backend detail when present and distinct from the mapped copy. */
export function resolveErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && (error as Error).name === 'ApiRequestError') {
    return (error as Error).message;
  }
  const serverMessage = extractServerMessage(error);
  const info = errorHandlerService.handleError(error);
  if (!serverMessage) {
    return info.message;
  }
  const normalizedServer = serverMessage.replace(/\s+/g, ' ').trim();
  const normalizedFriendly = info.message.replace(/\s+/g, ' ').trim();
  if (
    normalizedServer === normalizedFriendly ||
    normalizedFriendly.includes(normalizedServer)
  ) {
    return info.message;
  }
  return `${info.message} (${normalizedServer})`;
}

export function mapError(error: unknown): string {
  return resolveErrorMessage(error);
}

export function mapErrorCode(error: unknown): string {
  const e = error as { code?: string; response?: { data?: { error?: { code?: string } } } };
  const apiCode = e.response?.data?.error?.code;
  if (typeof apiCode === 'string' && apiCode) {
    return apiCode;
  }
  if (typeof e.code === 'string' && e.code && !e.code.startsWith('HTTP_')) {
    return e.code;
  }
  return errorHandlerService.handleError(error).code;
}

export default errorHandlerService;
