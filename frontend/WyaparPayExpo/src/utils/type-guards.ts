/**
 * Type Guards
 * Runtime type checking utilities
 */

import type { UserData as User } from '../types/user';
import type { Transaction } from '../types/transaction';

/**
 * Type guard for User object
 */
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'email' in obj &&
    'phone' in obj &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).name === 'string' &&
    typeof (obj as any).email === 'string' &&
    typeof (obj as any).phone === 'string'
  );
}

/**
 * Type guard for Transaction object
 */
export function isTransaction(obj: unknown): obj is Transaction {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'type' in obj &&
    'amount' in obj &&
    'status' in obj &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).type === 'string' &&
    typeof (obj as any).amount === 'number' &&
    typeof (obj as any).status === 'string'
  );
}

/**
 * Type guard for API response
 */
export function isApiResponse<T>(
  obj: unknown
): obj is { success: boolean; data?: T; message?: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    typeof (obj as any).success === 'boolean'
  );
}
