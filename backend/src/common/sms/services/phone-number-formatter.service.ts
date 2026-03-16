/**
 * Phone Number Formatter Service (Single Responsibility Principle)
 * 
 * Handles all phone number formatting logic.
 * Separated from SMS service to follow SRP.
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class PhoneNumberFormatter {
  /**
   * Format phone number to standard international format
   * Returns: +91XXXXXXXXXX
   */
  toInternationalFormat(phone: string): string | null {
    if (!phone) {
      return null;
    }

    // Remove spaces and special characters except +
    let formatted = phone.replace(/[\s\-\(\)]/g, '');

    // If doesn't start with +, assume Indian number and add +91
    if (!formatted.startsWith('+')) {
      // If starts with 0, remove it
      if (formatted.startsWith('0')) {
        formatted = formatted.substring(1);
      }
      // Add +91 for Indian numbers
      formatted = `+91${formatted}`;
    }

    // Validate: should be 10-15 digits after country code
    const digitsOnly = formatted.replace(/\+/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return null;
    }

    return formatted;
  }

  /**
   * Format phone number without country code prefix
   * Returns: 91XXXXXXXXXX (for providers that don't accept +)
   */
  toNumericFormat(phone: string): string {
    if (!phone) {
      return '';
    }

    // Remove spaces and special characters except +
    let formatted = phone.replace(/[\s\-\(\)]/g, '');

    // Remove + if present
    if (formatted.startsWith('+')) {
      formatted = formatted.substring(1);
    }

    // If starts with 0, remove it
    if (formatted.startsWith('0')) {
      formatted = formatted.substring(1);
    }

    // If doesn't start with 91, add it (for Indian numbers)
    if (!formatted.startsWith('91')) {
      formatted = `91${formatted}`;
    }

    return formatted;
  }

  /**
   * Validate phone number format
   */
  isValid(phone: string): boolean {
    const international = this.toInternationalFormat(phone);
    return international !== null;
  }
}

