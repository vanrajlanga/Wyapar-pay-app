/**
 * Admin Analytics Controller
 * API endpoints for admin dashboard analytics and transaction management
 */

import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { AdminAnalyticsService } from './admin-analytics.service';
import {
  AdminTransactionQueryDto,
  RevenueAnalyticsQueryDto,
  AnalyticsSummaryQueryDto,
  TopServicesQueryDto,
  TimePeriod,
  PaginatedTransactionResponse,
  RevenueOverview,
  RevenueByType,
  RevenueByCategory,
  RevenueByStatus,
  RevenueByPaymentMethod,
  TimeSeriesDataPoint,
  TopCustomer,
  DashboardAnalytics,
  TransactionListItem,
  AnalyticsSummaryResponse,
  TopServicesResponse,
  TimeSeriesResponse,
} from './dto/admin-analytics.dto';

@ApiTags('Admin Analytics')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiBearerAuth()
export class AdminAnalyticsController {
  private readonly logger = new Logger(AdminAnalyticsController.name);

  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  /**
   * Get paginated transactions with filters
   */
  @Get('transactions')
  @ApiOperation({ 
    summary: 'Get all transactions with filters',
    description: 'Retrieve paginated transactions with comprehensive filter options for admin analysis'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Paginated transaction list with applied filters' 
  })
  async getTransactions(
    @Query() query: AdminTransactionQueryDto,
  ): Promise<PaginatedTransactionResponse> {
    this.logger.log(`Getting transactions with filters: ${JSON.stringify(query)}`);
    return this.analyticsService.getTransactions(query);
  }

  /**
   * Get single transaction by ID
   */
  @Get('transactions/:id')
  @ApiOperation({ 
    summary: 'Get transaction details',
    description: 'Retrieve detailed information about a specific transaction'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Transaction details' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Transaction not found' 
  })
  async getTransactionById(
    @Param('id') id: string,
  ): Promise<TransactionListItem> {
    this.logger.log(`Getting transaction by ID: ${id}`);
    const transaction = await this.analyticsService.getTransactionById(id);
    
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    
    return transaction;
  }

  /**
   * Get complete dashboard analytics
   */
  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Get dashboard analytics',
    description: 'Retrieve comprehensive analytics data for admin dashboard including overview, breakdowns, and trends'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Complete dashboard analytics data' 
  })
  async getDashboardAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<DashboardAnalytics> {
    this.logger.log(`Getting dashboard analytics from ${startDate} to ${endDate}`);
    return this.analyticsService.getDashboardAnalytics(startDate, endDate);
  }

  /**
   * Get revenue overview
   */
  @Get('revenue/overview')
  @ApiOperation({ 
    summary: 'Get revenue overview',
    description: 'Retrieve summary of revenue metrics including totals, averages, and success rates'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Revenue overview metrics' 
  })
  async getRevenueOverview(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<RevenueOverview> {
    this.logger.log(`Getting revenue overview from ${startDate} to ${endDate}`);
    return this.analyticsService.getRevenueOverview(startDate, endDate);
  }

  /**
   * Get revenue breakdown by transaction type
   */
  @Get('revenue/by-type')
  @ApiOperation({ 
    summary: 'Get revenue by transaction type',
    description: 'Retrieve revenue breakdown grouped by transaction types (recharge, bill_payment, transfer, etc.)'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Revenue grouped by type' 
  })
  async getRevenueByType(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<RevenueByType[]> {
    this.logger.log(`Getting revenue by type from ${startDate} to ${endDate}`);
    return this.analyticsService.getRevenueByType(startDate, endDate);
  }

  /**
   * Get revenue breakdown by category
   */
  @Get('revenue/by-category')
  @ApiOperation({ 
    summary: 'Get revenue by category',
    description: 'Retrieve revenue breakdown grouped by transaction categories (mobile_recharge, electricity_bill, etc.)'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Revenue grouped by category' 
  })
  async getRevenueByCategory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<RevenueByCategory[]> {
    this.logger.log(`Getting revenue by category from ${startDate} to ${endDate}`);
    return this.analyticsService.getRevenueByCategory(startDate, endDate);
  }

  /**
   * Get revenue breakdown by status
   */
  @Get('revenue/by-status')
  @ApiOperation({ 
    summary: 'Get revenue by status',
    description: 'Retrieve transaction breakdown grouped by status (success, failed, pending, etc.)'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Revenue grouped by status' 
  })
  async getRevenueByStatus(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<RevenueByStatus[]> {
    this.logger.log(`Getting revenue by status from ${startDate} to ${endDate}`);
    return this.analyticsService.getRevenueByStatus(startDate, endDate);
  }

  /**
   * Get revenue breakdown by payment method
   */
  @Get('revenue/by-payment-method')
  @ApiOperation({ 
    summary: 'Get revenue by payment method',
    description: 'Retrieve revenue breakdown grouped by payment methods (wallet, UPI, card, etc.)'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Revenue grouped by payment method' 
  })
  async getRevenueByPaymentMethod(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<RevenueByPaymentMethod[]> {
    this.logger.log(`Getting revenue by payment method from ${startDate} to ${endDate}`);
    return this.analyticsService.getRevenueByPaymentMethod(startDate, endDate);
  }

  /**
   * Get time series data for charts
   */
  @Get('revenue/time-series')
  @ApiOperation({ 
    summary: 'Get revenue time series',
    description: 'Retrieve time series data for charts, grouped by specified time period'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Time series data points' 
  })
  async getTimeSeries(
    @Query() query: RevenueAnalyticsQueryDto,
  ): Promise<TimeSeriesDataPoint[]> {
    this.logger.log(`Getting time series with query: ${JSON.stringify(query)}`);
    return this.analyticsService.getTimeSeries(query);
  }

  /**
   * Get top customers by transaction volume
   */
  @Get('customers/top')
  @ApiOperation({ 
    summary: 'Get top customers',
    description: 'Retrieve top customers ranked by total transaction amount'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of customers to return (default: 10)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of top customers' 
  })
  async getTopCustomers(
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<TopCustomer[]> {
    this.logger.log(`Getting top ${limit || 10} customers from ${startDate} to ${endDate}`);
    return this.analyticsService.getTopCustomers(limit || 10, startDate, endDate);
  }

  /**
   * Get quick stats for widgets
   */
  @Get('quick-stats')
  @ApiOperation({ 
    summary: 'Get quick stats',
    description: 'Retrieve quick statistics for dashboard widgets (today, this week, this month)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Quick statistics' 
  })
  async getQuickStats(): Promise<{
    today: RevenueOverview;
    thisWeek: RevenueOverview;
    thisMonth: RevenueOverview;
  }> {
    const now = new Date();
    
    // Today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);
    
    // This week (Monday to Sunday)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const [today, thisWeek, thisMonth] = await Promise.all([
      this.analyticsService.getRevenueOverview(
        todayStart.toISOString().split('T')[0],
        todayEnd.toISOString().split('T')[0]
      ),
      this.analyticsService.getRevenueOverview(
        weekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0]
      ),
      this.analyticsService.getRevenueOverview(
        monthStart.toISOString().split('T')[0],
        monthEnd.toISOString().split('T')[0]
      ),
    ]);

    return { today, thisWeek, thisMonth };
  }

  /**
   * Get analytics summary with period-based grouping
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Get analytics summary',
    description: 'Retrieve analytics summary with revenue metrics, category breakdown, and trends for a specific period',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics summary data',
  })
  async getAnalyticsSummary(
    @Query() query: AnalyticsSummaryQueryDto,
  ): Promise<AnalyticsSummaryResponse> {
    this.logger.log(`Getting analytics summary with query: ${JSON.stringify(query)}`);
    return this.analyticsService.getAnalyticsSummary(
      query.period,
      query.startDate,
      query.endDate,
      query.groupBy
    );
  }

  /**
   * Get top services by revenue
   */
  @Get('top-services')
  @ApiOperation({
    summary: 'Get top services',
    description: 'Retrieve top performing services ranked by revenue',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top services list',
  })
  async getTopServices(
    @Query() query: TopServicesQueryDto,
  ): Promise<TopServicesResponse> {
    this.logger.log(`Getting top services with query: ${JSON.stringify(query)}`);
    return this.analyticsService.getTopServices(
      query.period,
      query.limit || 10,
      query.category
    );
  }

  /**
   * Get time series with summary
   */
  @Get('time-series')
  @ApiOperation({
    summary: 'Get time series data',
    description: 'Retrieve time series data with summary for charts',
  })
  @ApiQuery({ name: 'period', required: true, description: 'Period: 7d, 30d, 90d, 1y, custom' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (required if period is custom)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (required if period is custom)' })
  @ApiQuery({ name: 'metrics', required: false, description: 'Comma-separated metrics: revenue,transactions,users,successRate' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Time series data with summary',
  })
  async getTimeSeriesExtended(
    @Query('period') period: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('metrics') metrics?: string,
  ): Promise<TimeSeriesResponse> {
    this.logger.log(`Getting time series for period: ${period}`);
    const metricsArray = metrics ? metrics.split(',') : undefined;
    return this.analyticsService.getTimeSeriesExtended(period, startDate, endDate, metricsArray);
  }

  /**
   * Get filter options for UI dropdowns
   */
  @Get('filter-options')
  @ApiOperation({ 
    summary: 'Get filter options',
    description: 'Retrieve available filter options for dropdowns in admin UI'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Filter options' 
  })
  async getFilterOptions(): Promise<{
    types: { value: string; label: string }[];
    statuses: { value: string; label: string }[];
    categories: { value: string; label: string }[];
    paymentMethods: { value: string; label: string }[];
    periods: { value: string; label: string }[];
  }> {
    const formatLabel = (value: string) => 
      value.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

    return {
      types: [
        { value: 'recharge', label: 'Recharge' },
        { value: 'bill_payment', label: 'Bill Payment' },
        { value: 'transfer', label: 'Transfer' },
        { value: 'refund', label: 'Refund' },
        { value: 'cashback', label: 'Cashback' },
        { value: 'withdrawal', label: 'Withdrawal' },
        { value: 'deposit', label: 'Deposit' },
      ],
      statuses: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'success', label: 'Success' },
        { value: 'failed', label: 'Failed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'refunded', label: 'Refunded' },
      ],
      categories: [
        { value: 'mobile_recharge', label: 'Mobile Recharge' },
        { value: 'dth_recharge', label: 'DTH Recharge' },
        { value: 'broadband_recharge', label: 'Broadband Recharge' },
        { value: 'electricity_bill', label: 'Electricity Bill' },
        { value: 'water_bill', label: 'Water Bill' },
        { value: 'gas_bill', label: 'Gas Bill' },
        { value: 'credit_card_bill', label: 'Credit Card Bill' },
        { value: 'loan_repayment', label: 'Loan Repayment' },
        { value: 'insurance_premium', label: 'Insurance Premium' },
        { value: 'fastag_recharge', label: 'FASTag Recharge' },
        { value: 'upi_transfer', label: 'UPI Transfer' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'wallet_transfer', label: 'Wallet Transfer' },
        { value: 'cashback_earned', label: 'Cashback Earned' },
        { value: 'refund_received', label: 'Refund Received' },
        { value: 'wallet_topup', label: 'Wallet Top-up' },
        { value: 'withdrawal_to_bank', label: 'Withdrawal to Bank' },
      ],
      paymentMethods: [
        { value: 'wallet', label: 'Wallet' },
        { value: 'upi', label: 'UPI' },
        { value: 'card', label: 'Card' },
        { value: 'net_banking', label: 'Net Banking' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
      ],
      periods: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' },
      ],
    };
  }
}
