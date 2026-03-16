/**
 * SMS Provider Interface (Strategy Pattern)
 * 
 * Defines the contract for all SMS provider implementations.
 * Allows easy switching between different SMS providers without changing client code.
 * 
 * SOLID Principles:
 * - Interface Segregation: Clean, focused interface
 * - Dependency Inversion: Depend on abstraction, not concrete implementations
 * - Open/Closed: Open for extension (new providers), closed for modification
 */

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  errorMessage?: string;
  providerData?: Record<string, unknown>;
}

export interface SmsProviderConfig {
  apiKey?: string;
  apiUrl?: string;
  senderId?: string;
  [key: string]: unknown;
}

/**
 * SMS Provider Interface (Strategy Pattern)
 * 
 * Each provider implementation handles its own API format and response parsing.
 * This allows adding new providers without modifying existing code.
 */
export interface ISmsProvider {
  /**
   * Get provider name for identification and logging
   */
  getProviderName(): string;

  /**
   * Check if provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Send SMS to a phone number
   * @param to - Phone number in provider-specific format
   * @param message - SMS message content
   * @returns Promise with send result
   */
  sendSms(to: string, message: string): Promise<SmsSendResult>;

  /**
   * Format phone number for this provider
   * Each provider may have different phone number format requirements
   */
  formatPhoneNumber(phone: string): string;

  /**
   * Validate phone number format for this provider
   */
  isValidPhoneNumber(phone: string): boolean;
}

