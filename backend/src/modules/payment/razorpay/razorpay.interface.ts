// Razorpay Order Creation Request
export interface RazorpayOrderRequest {
  amount: number; // Amount in paise (₹299 = 29900)
  currency: string; // Default: INR
  receipt: string; // Transaction ID or unique receipt ID
  notes?: Record<string, any>; // Additional metadata
}

// Razorpay Order Response
export interface RazorpayOrderResponse {
  id: string; // order_xxxxx
  entity: string; // "order"
  amount: number; // Amount in paise
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, any>;
  created_at: number; // Unix timestamp
}

// Razorpay Payment Verification
export interface RazorpayPaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Razorpay Payment Details
export interface RazorpayPaymentDetails {
  id: string; // pay_xxxxx
  entity: string; // "payment"
  amount: number; // Amount in paise
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: 'card' | 'netbanking' | 'wallet' | 'emi' | 'upi';
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null; // UPI ID
  email: string;
  contact: string;
  notes: Record<string, any>;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  created_at: number; // Unix timestamp
}

// Razorpay Refund Request
export interface RazorpayRefundRequest {
  amount?: number; // Amount in paise (optional - full refund if not provided)
  speed?: 'normal' | 'optimum';
  notes?: Record<string, any>;
  receipt?: string;
}

// Razorpay Refund Response
export interface RazorpayRefundResponse {
  id: string; // rfnd_xxxxx
  entity: string; // "refund"
  amount: number;
  currency: string;
  payment_id: string;
  notes: Record<string, any>;
  receipt: string | null;
  acquirer_data: {
    arn: string;
  };
  created_at: number;
  batch_id: string | null;
  status: 'pending' | 'processed' | 'failed';
  speed_processed: string;
  speed_requested: string;
}

// Razorpay Webhook Event
export interface RazorpayWebhookEvent {
  entity: string; // "event"
  account_id: string;
  event: string; // "payment.captured", "payment.failed", etc.
  contains: string[];
  payload: {
    payment: {
      entity: RazorpayPaymentDetails;
    };
    order?: {
      entity: RazorpayOrderResponse;
    };
  };
  created_at: number;
}

// Razorpay Error Response
export interface RazorpayError {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: Record<string, any>;
  };
}
