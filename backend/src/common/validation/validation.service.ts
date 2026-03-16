import { Injectable } from '@nestjs/common';
import * as DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class ValidationService {
  // Phone number validation (Indian format)
  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  // Email validation
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // PAN number validation
  isValidPanNumber(pan: string): boolean {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  }

  // Aadhaar number validation
  isValidAadhaarNumber(aadhaar: string): boolean {
    const aadhaarRegex = /^[2-9]{1}[0-9]{11}$/;
    return aadhaarRegex.test(aadhaar);
  }

  // Amount validation
  isValidAmount(amount: number): boolean {
    return amount > 0 && amount <= 1000000; // Max 10 lakhs
  }

  // UPI ID validation
  isValidUpiId(upiId: string): boolean {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/;
    return upiRegex.test(upiId);
  }

  // Account number validation
  isValidAccountNumber(accountNumber: string): boolean {
    const accountRegex = /^[0-9]{9,18}$/;
    return accountRegex.test(accountNumber);
  }

  // IFSC code validation
  isValidIfscCode(ifsc: string): boolean {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc);
  }

  // Pincode validation
  isValidPincode(pincode: string): boolean {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  }

  // Name validation
  isValidName(name: string): boolean {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name);
  }

  // Password strength validation
  isStrongPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // OTP validation
  isValidOtp(otp: string): boolean {
    const otpRegex = /^[0-9]{4,8}$/;
    return otpRegex.test(otp);
  }

  // Validate biller parameters
  validateBillerParameters(
    billerCode: string,
    parameters: Record<string, any>
  ): boolean {
    // This would be customized based on biller requirements
    switch (billerCode) {
      case 'ELECTRICITY':
        return parameters.customerId && parameters.accountNumber;
      case 'MOBILE':
        return parameters.mobileNumber;
      case 'DTH':
        return parameters.customerId;
      default:
        return true;
    }
  }

  // Sanitize input - Remove ALL HTML/script tags and dangerous content
  sanitizeInput(input: string): string {
    if (!input) return '';

    // Use DOMPurify to remove all HTML tags and dangerous content
    const sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [], // No attributes allowed
      KEEP_CONTENT: true, // Keep text content
    });

    return sanitized.trim();
  }

  // Sanitize HTML - Allow only safe HTML tags (for rich text content)
  sanitizeHtml(html: string): string {
    if (!html) return '';

    // Allow only safe HTML tags for rich text
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'b',
        'i',
        'em',
        'strong',
        'a',
        'p',
        'br',
        'ul',
        'ol',
        'li',
      ],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false,
    });

    return sanitized;
  }

  // Sanitize JSON input - Remove dangerous keys and values
  sanitizeJson(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = {};
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

    for (const [key, value] of Object.entries(obj)) {
      // Skip dangerous keys
      if (dangerousKeys.includes(key.toLowerCase())) {
        continue;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      }
      // Recursively sanitize objects
      else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeJson(value);
      }
      // Keep primitive values as-is
      else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Validate transaction amount limits
  validateTransactionLimits(amount: number, userType: string): boolean {
    const limits = {
      individual: { min: 1, max: 100000 },
      business: { min: 1, max: 1000000 },
    };

    const limit = limits[userType] || limits.individual;
    return amount >= limit.min && amount <= limit.max;
  }
}
