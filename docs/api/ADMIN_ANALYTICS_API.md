# Admin Analytics API Documentation

## Overview

The Admin Analytics API provides comprehensive endpoints for transaction analysis, revenue reporting, and business intelligence. All endpoints are protected and require JWT authentication.

**Base URL:** `/admin/analytics`

**Authentication:** Bearer Token (JWT)

```
Authorization: Bearer <your_jwt_token>
```

---

## Table of Contents

1. [Enums and Constants](#enums-and-constants)
2. [Get Transactions](#1-get-transactions)
3. [Get Transaction by ID](#2-get-transaction-by-id)
4. [Dashboard Analytics](#3-dashboard-analytics)
5. [Revenue Overview](#4-revenue-overview)
6. [Revenue by Type](#5-revenue-by-type)
7. [Revenue by Category](#6-revenue-by-category)
8. [Revenue by Status](#7-revenue-by-status)
9. [Revenue by Payment Method](#8-revenue-by-payment-method)
10. [Time Series Data](#9-time-series-data)
11. [Top Customers](#10-top-customers)
12. [Quick Stats](#11-quick-stats)
13. [Filter Options](#12-filter-options)
14. [Error Handling](#error-handling)
15. [TypeScript Interfaces](#typescript-interfaces)

---

## Enums and Constants

### Transaction Types
| Value | Description |
|-------|-------------|
| `recharge` | Mobile/DTH recharges |
| `bill_payment` | Utility bill payments |
| `transfer` | Money transfers |
| `refund` | Refunded transactions |
| `cashback` | Cashback rewards |
| `withdrawal` | Wallet withdrawals |
| `deposit` | Wallet deposits |

### Transaction Categories
| Value | Description |
|-------|-------------|
| `mobile_recharge` | Mobile prepaid recharge |
| `dth_recharge` | DTH/Satellite TV recharge |
| `broadband_recharge` | Broadband internet recharge |
| `electricity_bill` | Electricity bill payment |
| `water_bill` | Water bill payment |
| `gas_bill` | Gas bill payment |
| `credit_card_bill` | Credit card bill payment |
| `loan_repayment` | Loan EMI payment |
| `insurance_premium` | Insurance premium payment |
| `fastag_recharge` | FASTag recharge |
| `upi_transfer` | UPI money transfer |
| `bank_transfer` | Bank account transfer |
| `wallet_transfer` | Wallet to wallet transfer |
| `cashback_earned` | Cashback credited |
| `refund_received` | Refund credited |
| `wallet_topup` | Wallet top-up |
| `withdrawal_to_bank` | Withdrawal to bank |

### Transaction Statuses
| Value | Description | Color (suggested) |
|-------|-------------|-------------------|
| `pending` | Transaction initiated | Yellow |
| `processing` | Being processed | Blue |
| `success` | Completed successfully | Green |
| `failed` | Transaction failed | Red |
| `cancelled` | Cancelled by user | Gray |
| `refunded` | Refunded to user | Purple |

### Payment Methods
| Value | Description |
|-------|-------------|
| `wallet` | WyaparPay Wallet |
| `upi` | UPI Payment |
| `card` | Credit/Debit Card |
| `net_banking` | Net Banking |
| `bank_transfer` | Direct Bank Transfer |

### Time Periods
| Value | Description |
|-------|-------------|
| `daily` | Group by day |
| `weekly` | Group by week |
| `monthly` | Group by month |
| `yearly` | Group by year |

---

## 1. Get Transactions

Retrieve paginated list of transactions with comprehensive filtering options.

### Endpoint
```
GET /admin/analytics/transactions
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (min: 1) |
| `limit` | number | No | 20 | Items per page (min: 1, max: 100) |
| `type` | string | No | - | Single transaction type filter |
| `types` | string | No | - | Multiple types (comma-separated) |
| `status` | string | No | - | Single status filter |
| `statuses` | string | No | - | Multiple statuses (comma-separated) |
| `category` | string | No | - | Single category filter |
| `categories` | string | No | - | Multiple categories (comma-separated) |
| `paymentMethod` | string | No | - | Payment method filter |
| `startDate` | string | No | - | Start date (ISO format: YYYY-MM-DD) |
| `endDate` | string | No | - | End date (ISO format: YYYY-MM-DD) |
| `minAmount` | number | No | - | Minimum transaction amount |
| `maxAmount` | number | No | - | Maximum transaction amount |
| `userId` | string | No | - | Filter by specific user ID |
| `search` | string | No | - | Search by transaction ID, gateway ref, UPI ref |
| `sortBy` | string | No | createdAt | Sort field: createdAt, amount, totalAmount, status, type, category |
| `sortOrder` | string | No | DESC | Sort order: ASC or DESC |

### Example Request
```bash
curl -X GET "https://api.wyaparpay.com/admin/analytics/transactions?page=1&limit=20&status=success&startDate=2024-01-01&endDate=2024-01-31&sortBy=amount&sortOrder=DESC" \
  -H "Authorization: Bearer <token>"
```

### Example Response
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "userName": "John Doe",
      "userPhone": "+919876543210",
      "type": "recharge",
      "category": "mobile_recharge",
      "status": "success",
      "paymentMethod": "wallet",
      "amount": 199.00,
      "fee": 0.00,
      "totalAmount": 199.00,
      "currency": "INR",
      "gatewayRef": "GW123456789",
      "upiRef": null,
      "description": "Mobile recharge for 9876543210",
      "customerRef": "9876543210",
      "failureReason": null,
      "metadata": {
        "mobileNumber": "9876543210",
        "operator": "JIO",
        "circle": "Karnataka"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "processedAt": "2024-01-15T10:30:05.000Z",
      "completedAt": "2024-01-15T10:30:10.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1543,
    "totalPages": 78,
    "hasNext": true,
    "hasPrevious": false
  },
  "filters": {
    "applied": {
      "status": "success",
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "available": {
      "types": ["recharge", "bill_payment", "transfer", "refund", "cashback", "withdrawal", "deposit"],
      "statuses": ["pending", "processing", "success", "failed", "cancelled", "refunded"],
      "categories": ["mobile_recharge", "dth_recharge", "..."],
      "paymentMethods": ["wallet", "upi", "card", "net_banking", "bank_transfer"]
    }
  }
}
```

---

## 2. Get Transaction by ID

Retrieve detailed information about a specific transaction.

### Endpoint
```
GET /admin/analytics/transactions/:id
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Transaction ID |

### Example Request
```bash
curl -X GET "https://api.wyaparpay.com/admin/analytics/transactions/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>"
```

### Example Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "userName": "John Doe",
  "userPhone": "+919876543210",
  "type": "recharge",
  "category": "mobile_recharge",
  "status": "success",
  "paymentMethod": "wallet",
  "amount": 199.00,
  "fee": 0.00,
  "totalAmount": 199.00,
  "currency": "INR",
  "gatewayRef": "GW123456789",
  "upiRef": null,
  "description": "Mobile recharge for 9876543210",
  "customerRef": "9876543210",
  "failureReason": null,
  "metadata": {
    "mobileNumber": "9876543210",
    "operator": "JIO",
    "circle": "Karnataka",
    "planName": "Unlimited Combo"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "processedAt": "2024-01-15T10:30:05.000Z",
  "completedAt": "2024-01-15T10:30:10.000Z"
}
```

### Error Response (404)
```json
{
  "statusCode": 404,
  "message": "Transaction with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

---

## 3. Dashboard Analytics

Get complete analytics data for admin dashboard in a single call.

### Endpoint
```
GET /admin/analytics/dashboard
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | string | No | - | Start date (ISO format) |
| `endDate` | string | No | - | End date (ISO format) |

### Example Request
```bash
curl -X GET "https://api.wyaparpay.com/admin/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

### Example Response
```json
{
  "overview": {
    "totalRevenue": 1250000.00,
    "totalTransactions": 5432,
    "successfulTransactions": 5100,
    "failedTransactions": 232,
    "pendingTransactions": 100,
    "averageTransactionValue": 245.10,
    "totalFees": 12500.00,
    "successRate": 93.89,
    "periodComparison": {
      "previousPeriodRevenue": 1100000.00,
      "revenueChange": 150000.00,
      "revenueChangePercent": 13.64
    }
  },
  "revenueByType": [
    {
      "type": "recharge",
      "totalAmount": 750000.00,
      "transactionCount": 3500,
      "successCount": 3400,
      "failedCount": 100,
      "averageAmount": 214.29,
      "percentageOfTotal": 60.00
    }
  ],
  "revenueByCategory": [
    {
      "category": "mobile_recharge",
      "totalAmount": 500000.00,
      "transactionCount": 2500,
      "successCount": 2450,
      "averageAmount": 200.00,
      "percentageOfTotal": 40.00
    }
  ],
  "revenueByStatus": [
    {
      "status": "success",
      "totalAmount": 1200000.00,
      "transactionCount": 5100,
      "percentageOfTotal": 93.89
    }
  ],
  "revenueByPaymentMethod": [
    {
      "paymentMethod": "wallet",
      "totalAmount": 800000.00,
      "transactionCount": 4000,
      "averageAmount": 200.00,
      "percentageOfTotal": 64.00
    }
  ],
  "timeSeries": [
    {
      "date": "2024-01-01",
      "label": "01 Jan",
      "totalAmount": 45000.00,
      "transactionCount": 180,
      "successCount": 170,
      "failedCount": 10,
      "fees": 450.00
    }
  ],
  "topCustomers": [
    {
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "userName": "John Doe",
      "userPhone": "+919876543210",
      "userEmail": "john@example.com",
      "totalTransactions": 150,
      "totalAmount": 35000.00,
      "successfulTransactions": 148,
      "lastTransactionDate": "2024-01-31T15:30:00.000Z"
    }
  ],
  "recentTransactions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "userName": "John Doe",
      "type": "recharge",
      "status": "success",
      "amount": 199.00,
      "createdAt": "2024-01-31T18:45:00.000Z"
    }
  ]
}
```

---

## 4. Revenue Overview

Get summary metrics for revenue analysis.

### Endpoint
```
GET /admin/analytics/revenue/overview
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Start date (ISO format) |
| `endDate` | string | No | End date (ISO format) |

### Example Request
```bash
curl -X GET "https://api.wyaparpay.com/admin/analytics/revenue/overview?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

### Example Response
```json
{
  "totalRevenue": 1250000.00,
  "totalTransactions": 5432,
  "successfulTransactions": 5100,
  "failedTransactions": 232,
  "pendingTransactions": 100,
  "averageTransactionValue": 245.10,
  "totalFees": 12500.00,
  "successRate": 93.89,
  "periodComparison": {
    "previousPeriodRevenue": 1100000.00,
    "revenueChange": 150000.00,
    "revenueChangePercent": 13.64
  }
}
```

---

## 5. Revenue by Type

Get revenue breakdown grouped by transaction type.

### Endpoint
```
GET /admin/analytics/revenue/by-type
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Start date (ISO format) |
| `endDate` | string | No | End date (ISO format) |

### Example Response
```json
[
  {
    "type": "recharge",
    "totalAmount": 750000.00,
    "transactionCount": 3500,
    "successCount": 3400,
    "failedCount": 100,
    "averageAmount": 214.29,
    "percentageOfTotal": 60.00
  },
  {
    "type": "bill_payment",
    "totalAmount": 350000.00,
    "transactionCount": 1200,
    "successCount": 1150,
    "failedCount": 50,
    "averageAmount": 291.67,
    "percentageOfTotal": 28.00
  }
]
```

---

## 6. Revenue by Category

Get revenue breakdown grouped by transaction category.

### Endpoint
```
GET /admin/analytics/revenue/by-category
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Start date (ISO format) |
| `endDate` | string | No | End date (ISO format) |

### Example Response
```json
[
  {
    "category": "mobile_recharge",
    "totalAmount": 500000.00,
    "transactionCount": 2500,
    "successCount": 2450,
    "averageAmount": 200.00,
    "percentageOfTotal": 40.00
  },
  {
    "category": "electricity_bill",
    "totalAmount": 250000.00,
    "transactionCount": 800,
    "successCount": 780,
    "averageAmount": 312.50,
    "percentageOfTotal": 20.00
  }
]
```

---

## 7. Revenue by Status

Get transaction breakdown grouped by status.

### Endpoint
```
GET /admin/analytics/revenue/by-status
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Start date (ISO format) |
| `endDate` | string | No | End date (ISO format) |

### Example Response
```json
[
  {
    "status": "success",
    "totalAmount": 1200000.00,
    "transactionCount": 5100,
    "percentageOfTotal": 93.89
  },
  {
    "status": "failed",
    "totalAmount": 45000.00,
    "transactionCount": 232,
    "percentageOfTotal": 4.27
  },
  {
    "status": "pending",
    "totalAmount": 5000.00,
    "transactionCount": 100,
    "percentageOfTotal": 1.84
  }
]
```

---

## 8. Revenue by Payment Method

Get revenue breakdown grouped by payment method.

### Endpoint
```
GET /admin/analytics/revenue/by-payment-method
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Start date (ISO format) |
| `endDate` | string | No | End date (ISO format) |

### Example Response
```json
[
  {
    "paymentMethod": "wallet",
    "totalAmount": 800000.00,
    "transactionCount": 4000,
    "averageAmount": 200.00,
    "percentageOfTotal": 64.00
  },
  {
    "paymentMethod": "upi",
    "totalAmount": 350000.00,
    "transactionCount": 1400,
    "averageAmount": 250.00,
    "percentageOfTotal": 28.00
  }
]
```

---

## 9. Time Series Data

Get time series data for charts and graphs.

### Endpoint
```
GET /admin/analytics/revenue/time-series
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | string | No | - | Start date (ISO format) |
| `endDate` | string | No | - | End date (ISO format) |
| `period` | string | No | daily | Time period: daily, weekly, monthly, yearly |
| `type` | string | No | - | Filter by transaction type |
| `category` | string | No | - | Filter by category |

### Example Request
```bash
curl -X GET "https://api.wyaparpay.com/admin/analytics/revenue/time-series?startDate=2024-01-01&endDate=2024-01-31&period=daily" \
  -H "Authorization: Bearer <token>"
```

### Example Response
```json
[
  {
    "date": "2024-01-01",
    "label": "01 Jan",
    "totalAmount": 45000.00,
    "transactionCount": 180,
    "successCount": 170,
    "failedCount": 10,
    "fees": 450.00
  },
  {
    "date": "2024-01-02",
    "label": "02 Jan",
    "totalAmount": 52000.00,
    "transactionCount": 210,
    "successCount": 200,
    "failedCount": 10,
    "fees": 520.00
  }
]
```

---

## 10. Top Customers

Get top customers ranked by transaction volume.

### Endpoint
```
GET /admin/analytics/customers/top
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 10 | Number of customers to return |
| `startDate` | string | No | - | Start date (ISO format) |
| `endDate` | string | No | - | End date (ISO format) |

### Example Response
```json
[
  {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "userName": "John Doe",
    "userPhone": "+919876543210",
    "userEmail": "john@example.com",
    "totalTransactions": 150,
    "totalAmount": 35000.00,
    "successfulTransactions": 148,
    "lastTransactionDate": "2024-01-31T15:30:00.000Z"
  },
  {
    "userId": "456e7890-f12c-34d5-b678-901234567890",
    "userName": "Jane Smith",
    "userPhone": "+919876543211",
    "userEmail": "jane@example.com",
    "totalTransactions": 120,
    "totalAmount": 28000.00,
    "successfulTransactions": 118,
    "lastTransactionDate": "2024-01-30T12:15:00.000Z"
  }
]
```

---

## 11. Quick Stats

Get quick statistics for dashboard widgets (today, this week, this month).

### Endpoint
```
GET /admin/analytics/quick-stats
```

### Example Response
```json
{
  "today": {
    "totalRevenue": 45000.00,
    "totalTransactions": 180,
    "successfulTransactions": 172,
    "failedTransactions": 8,
    "pendingTransactions": 0,
    "averageTransactionValue": 261.63,
    "totalFees": 450.00,
    "successRate": 95.56
  },
  "thisWeek": {
    "totalRevenue": 285000.00,
    "totalTransactions": 1150,
    "successfulTransactions": 1100,
    "failedTransactions": 45,
    "pendingTransactions": 5,
    "averageTransactionValue": 259.09,
    "totalFees": 2850.00,
    "successRate": 95.65
  },
  "thisMonth": {
    "totalRevenue": 1250000.00,
    "totalTransactions": 5432,
    "successfulTransactions": 5100,
    "failedTransactions": 232,
    "pendingTransactions": 100,
    "averageTransactionValue": 245.10,
    "totalFees": 12500.00,
    "successRate": 93.89
  }
}
```

---

## 12. Filter Options

Get available filter options for building UI dropdowns.

### Endpoint
```
GET /admin/analytics/filter-options
```

### Example Response
```json
{
  "types": [
    { "value": "recharge", "label": "Recharge" },
    { "value": "bill_payment", "label": "Bill Payment" },
    { "value": "transfer", "label": "Transfer" },
    { "value": "refund", "label": "Refund" },
    { "value": "cashback", "label": "Cashback" },
    { "value": "withdrawal", "label": "Withdrawal" },
    { "value": "deposit", "label": "Deposit" }
  ],
  "statuses": [
    { "value": "pending", "label": "Pending" },
    { "value": "processing", "label": "Processing" },
    { "value": "success", "label": "Success" },
    { "value": "failed", "label": "Failed" },
    { "value": "cancelled", "label": "Cancelled" },
    { "value": "refunded", "label": "Refunded" }
  ],
  "categories": [
    { "value": "mobile_recharge", "label": "Mobile Recharge" },
    { "value": "dth_recharge", "label": "DTH Recharge" },
    { "value": "electricity_bill", "label": "Electricity Bill" }
  ],
  "paymentMethods": [
    { "value": "wallet", "label": "Wallet" },
    { "value": "upi", "label": "UPI" },
    { "value": "card", "label": "Card" },
    { "value": "net_banking", "label": "Net Banking" },
    { "value": "bank_transfer", "label": "Bank Transfer" }
  ],
  "periods": [
    { "value": "daily", "label": "Daily" },
    { "value": "weekly", "label": "Weekly" },
    { "value": "monthly", "label": "Monthly" },
    { "value": "yearly", "label": "Yearly" }
  ]
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

### Validation Error Example
```json
{
  "statusCode": 400,
  "message": [
    "page must be a positive number",
    "limit must not be greater than 100"
  ],
  "error": "Bad Request"
}
```

---

## TypeScript Interfaces

Use these interfaces in your frontend application:

```typescript
// Enums
export enum TransactionType {
  RECHARGE = 'recharge',
  BILL_PAYMENT = 'bill_payment',
  TRANSFER = 'transfer',
  REFUND = 'refund',
  CASHBACK = 'cashback',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum TransactionCategory {
  MOBILE_RECHARGE = 'mobile_recharge',
  DTH_RECHARGE = 'dth_recharge',
  BROADBAND_RECHARGE = 'broadband_recharge',
  ELECTRICITY_BILL = 'electricity_bill',
  WATER_BILL = 'water_bill',
  GAS_BILL = 'gas_bill',
  CREDIT_CARD_BILL = 'credit_card_bill',
  LOAN_REPAYMENT = 'loan_repayment',
  INSURANCE_PREMIUM = 'insurance_premium',
  FASTAG_RECHARGE = 'fastag_recharge',
  UPI_TRANSFER = 'upi_transfer',
  BANK_TRANSFER = 'bank_transfer',
  WALLET_TRANSFER = 'wallet_transfer',
  CASHBACK_EARNED = 'cashback_earned',
  REFUND_RECEIVED = 'refund_received',
  WALLET_TOPUP = 'wallet_topup',
  WITHDRAWAL_TO_BANK = 'withdrawal_to_bank',
}

export enum PaymentMethod {
  WALLET = 'wallet',
  UPI = 'upi',
  CARD = 'card',
  NET_BANKING = 'net_banking',
  BANK_TRANSFER = 'bank_transfer',
}

export enum TimePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

// Interfaces
export interface TransactionListItem {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  type: TransactionType;
  category: TransactionCategory;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string;
  gatewayRef?: string;
  upiRef?: string;
  description?: string;
  customerRef?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: string; // ISO date string
  processedAt?: string;
  completedAt?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedTransactionResponse {
  data: TransactionListItem[];
  pagination: Pagination;
  filters: {
    applied: Record<string, any>;
    available: {
      types: string[];
      statuses: string[];
      categories: string[];
      paymentMethods: string[];
    };
  };
}

export interface RevenueOverview {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  averageTransactionValue: number;
  totalFees: number;
  successRate: number;
  periodComparison?: {
    previousPeriodRevenue: number;
    revenueChange: number;
    revenueChangePercent: number;
  };
}

export interface RevenueByType {
  type: TransactionType;
  totalAmount: number;
  transactionCount: number;
  successCount: number;
  failedCount: number;
  averageAmount: number;
  percentageOfTotal: number;
}

export interface RevenueByCategory {
  category: TransactionCategory;
  totalAmount: number;
  transactionCount: number;
  successCount: number;
  averageAmount: number;
  percentageOfTotal: number;
}

export interface RevenueByStatus {
  status: TransactionStatus;
  totalAmount: number;
  transactionCount: number;
  percentageOfTotal: number;
}

export interface RevenueByPaymentMethod {
  paymentMethod: PaymentMethod;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  percentageOfTotal: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  label: string;
  totalAmount: number;
  transactionCount: number;
  successCount: number;
  failedCount: number;
  fees: number;
}

export interface TopCustomer {
  userId: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  lastTransactionDate: string;
}

export interface DashboardAnalytics {
  overview: RevenueOverview;
  revenueByType: RevenueByType[];
  revenueByCategory: RevenueByCategory[];
  revenueByStatus: RevenueByStatus[];
  revenueByPaymentMethod: RevenueByPaymentMethod[];
  timeSeries: TimeSeriesDataPoint[];
  topCustomers: TopCustomer[];
  recentTransactions: TransactionListItem[];
}

export interface QuickStats {
  today: RevenueOverview;
  thisWeek: RevenueOverview;
  thisMonth: RevenueOverview;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterOptions {
  types: FilterOption[];
  statuses: FilterOption[];
  categories: FilterOption[];
  paymentMethods: FilterOption[];
  periods: FilterOption[];
}

// Query Parameters Interface
export interface AdminTransactionQueryParams {
  page?: number;
  limit?: number;
  type?: TransactionType;
  types?: TransactionType[];
  status?: TransactionStatus;
  statuses?: TransactionStatus[];
  category?: TransactionCategory;
  categories?: TransactionCategory[];
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  userId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'amount' | 'totalAmount' | 'status' | 'type' | 'category';
  sortOrder?: 'ASC' | 'DESC';
}

export interface RevenueAnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  period?: TimePeriod;
  type?: TransactionType;
  category?: TransactionCategory;
}
```

---

## Example Usage (React/Next.js)

```typescript
// api/admin-analytics.ts
import axios from 'axios';
import type { 
  PaginatedTransactionResponse, 
  DashboardAnalytics,
  AdminTransactionQueryParams 
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: `${API_BASE}/admin/analytics`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminAnalyticsApi = {
  // Get transactions with filters
  getTransactions: async (params: AdminTransactionQueryParams) => {
    const response = await api.get<PaginatedTransactionResponse>('/transactions', { params });
    return response.data;
  },

  // Get dashboard analytics
  getDashboard: async (startDate?: string, endDate?: string) => {
    const response = await api.get<DashboardAnalytics>('/dashboard', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Get quick stats
  getQuickStats: async () => {
    const response = await api.get('/quick-stats');
    return response.data;
  },

  // Get filter options
  getFilterOptions: async () => {
    const response = await api.get('/filter-options');
    return response.data;
  },
};
```

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:
- **100 requests per minute** per user
- **1000 requests per hour** per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706745600
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-02-01 | Initial release with all endpoints |

---

## Support

For API support, contact: api-support@wyaparpay.com
