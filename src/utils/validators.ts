// Input validation utilities
export const validateDriverId = (driverId: string): boolean => {
  return /^[a-zA-Z0-9_-]+$/.test(driverId) && driverId.length > 0 && driverId.length <= 100;
};

export const validateDocumentType = (documentType: string): boolean => {
  const allowedTypes = [
    'drivingLicense', 'aadhaarCard', 'bikeInsurance', 'rcBook', 'profilePhoto'
  ];
  return allowedTypes.includes(documentType);
};

export const validateRejectionReason = (reason: string): boolean => {
  return reason.trim().length >= 10 && reason.trim().length <= 500;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const validateFileType = (fileName: string, allowedTypes: string[]): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
};

export const validateFileSize = (fileSize: number, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
};

// Document verification validation
export const validateDocumentVerification = (data: {
  documentType: string;
  status: string;
  rejectionReason?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!validateDocumentType(data.documentType)) {
    errors.push('Invalid document type');
  }

  if (!['verified', 'rejected'].includes(data.status)) {
    errors.push('Status must be either "verified" or "rejected"');
  }

  if (data.status === 'rejected' && (!data.rejectionReason || !validateRejectionReason(data.rejectionReason))) {
    errors.push('Rejection reason is required and must be between 10-500 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Driver data validation
export const validateDriverData = (driver: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!driver.id || !validateDriverId(driver.id)) {
    errors.push('Invalid driver ID');
  }

  if (driver.personalInfo?.email && !validateEmail(driver.personalInfo.email)) {
    errors.push('Invalid email format');
  }

  if (driver.personalInfo?.phone && !validatePhoneNumber(driver.personalInfo.phone)) {
    errors.push('Invalid phone number format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
