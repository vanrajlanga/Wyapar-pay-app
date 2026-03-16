/**
 * Recharge Types
 * Types for mobile recharge, DTH, and bill payments
 */

export type RechargeType = 'mobile_recharge' | 'dth_recharge' | 'bill_payment';

export interface Operator {
  code: string;
  name: string;
  logo?: string;
  isActive?: boolean;
  operatorId?: string; // KWIKAPI operator ID from database
  serviceType?: string;
  amountMinimum?: number;
  amountMaximum?: number;
}

export interface Circle {
  id: string;
  operatorCode: string;
  operatorName: string;
  circleCode: string;
  circleName: string;
  stateCode: string;
  isActive: boolean;
}

export interface OperatorDetectionResult {
  operatorCode: string;
  operatorName: string;
  circleCode?: string;
  circleName?: string;
  operatorId?: string; // KWIKAPI operator ID
  creditBalance?: string;
}

export type PlanCategory =
  | 'POPULAR'
  | 'DATA'
  | 'UNLIMITED'
  | 'ROAMING'
  | 'VALIDITY'
  | 'TALKTIME'
  | 'popular'
  | 'data'
  | 'unlimited'
  | 'roaming'
  | 'validity'
  | 'talktime';

export interface RechargePlan {
  id: string;
  operatorCode: string;
  circleCode?: string;
  amount: number;
  validity: string; // Changed from number to string (e.g., "28 days", "1 month")
  data?: string;
  calling?: string;
  sms?: string;
  description: string; // Made required
  category: PlanCategory;
  benefits?: string[];
  isPopular?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  warnings?: string[];
  canProceed?: boolean;
}

export interface RechargeRequest {
  mobileNumber: string;
  operatorCode: string;
  circleCode: string;
  planId?: string;
  amount: number;
  paymentMethod: 'wallet' | 'card' | 'upi';
}

export interface RechargeResponse {
  success: boolean;
  transactionId: string;
  message: string;
  mobileNumber: string;
  operator: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  timestamp?: string;
}

export interface RechargeTransaction {
  id: string;
  userId: string;
  type: 'recharge' | 'bill_payment';
  amount: number;
  fee?: number;
  totalAmount: number;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  description: string;
  metadata: {
    mobileNumber?: string;
    operatorCode?: string;
    circleCode?: string;
    planId?: string;
    billerId?: string;
    accountNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  accountNumber: string;
  type: RechargeType;
  nickname?: string;
  operatorCode?: string;
  operatorName?: string; // Added for display
  circleCode?: string;
  lastRechargeAmount?: number;
  lastRechargeDate?: string;
  rechargeCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface AddFavoriteRequest {
  accountNumber: string;
  type: RechargeType;
  nickname?: string;
  operatorCode?: string;
  circleCode?: string;
}

// UI State Types
export interface RechargeFormData {
  mobileNumber: string;
  operatorCode: string;
  operatorName: string;
  circleCode: string;
  circleName: string;
  planId?: string; // Added for plan selection
  planName?: string; // Added for plan display
  selectedPlan?: RechargePlan;
  amount: number;
  paymentMethod: 'wallet' | 'card' | 'upi';
}

export interface RechargeState {
  // Current recharge data
  formData: RechargeFormData | null;

  // Operators & circles
  operators: Operator[];
  circles: Circle[];
  detectedOperator: OperatorDetectionResult | null;

  // Plans
  plans: RechargePlan[];
  selectedCategory: PlanCategory;

  // Validation
  validationResult: ValidationResult | null;

  // Transaction
  currentTransaction: RechargeResponse | null;
  transactionHistory: RechargeTransaction[];

  // Favorites
  favorites: Favorite[];

  // Loading states
  isDetecting: boolean;
  isLoadingPlans: boolean;
  isValidating: boolean;
  isProcessing: boolean;
  isLoadingHistory: boolean;
  isLoadingFavorites: boolean;

  // Error states
  error: string | null;
}
