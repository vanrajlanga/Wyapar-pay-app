import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  TransactionService,
  TransactionFilters,
  TransactionSummary,
} from './transaction.service';
import {
  TransactionType,
  TransactionStatus,
  TransactionCategory,
  PaymentMethod,
} from '../../entities/transaction.entity';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  /**
   * Get all transactions with filters and pagination
   */
  @Get()
  @ApiOperation({ summary: 'Get all transactions with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TransactionType,
    description: 'Filter by transaction type',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: TransactionCategory,
    description: 'Filter by transaction category',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TransactionStatus,
    description: 'Filter by transaction status',
  })
  @ApiQuery({
    name: 'paymentMethod',
    required: false,
    enum: PaymentMethod,
    description: 'Filter by payment method',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO string)',
  })
  @ApiQuery({
    name: 'minAmount',
    required: false,
    type: Number,
    description: 'Minimum amount filter',
  })
  @ApiQuery({
    name: 'maxAmount',
    required: false,
    type: Number,
    description: 'Maximum amount filter',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  async getTransactions(
    @Request() req: any,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
    @Query('type') type?: TransactionType,
    @Query('category') category?: TransactionCategory,
    @Query('status') status?: TransactionStatus,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minAmount') minAmountParam?: string,
    @Query('maxAmount') maxAmountParam?: string,
    @Query('search') search?: string
  ) {
    // Manually parse and validate numeric parameters
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const minAmount = minAmountParam && minAmountParam.trim() !== '' ? parseFloat(minAmountParam) : undefined;
    const maxAmount = maxAmountParam && maxAmountParam.trim() !== '' ? parseFloat(maxAmountParam) : undefined;

    // Validate parsed values
    const safePage = !isNaN(page) && page > 0 ? page : 1;
    const safeLimit = !isNaN(limit) && limit > 0 && limit <= 100 ? limit : 20;

    console.log('=== TRANSACTION CONTROLLER ===');
    console.log('Raw query:', req.query);
    console.log('Parsed params:', { page: safePage, limit: safeLimit, type, category, status, paymentMethod, startDate, endDate, minAmount, maxAmount, search });

    const filters: TransactionFilters = {
      type,
      category,
      status,
      paymentMethod,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minAmount: minAmount !== undefined && !isNaN(minAmount) ? minAmount : undefined,
      maxAmount: maxAmount !== undefined && !isNaN(maxAmount) ? maxAmount : undefined,
      search,
    };

    return this.transactionService.getTransactions(
      req.user.id,
      filters,
      safePage,
      safeLimit
    );
  }

  /**
   * Get transaction by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransactionById(@Request() req: any, @Param('id') id: string) {
    return this.transactionService.getTransactionById(id, req.user.id);
  }

  /**
   * Get transaction summary
   */
  @Get('summary/overview')
  @ApiOperation({ summary: 'Get transaction summary and analytics' })
  @ApiResponse({
    status: 200,
    description: 'Transaction summary retrieved successfully',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TransactionType,
    description: 'Filter by transaction type',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: TransactionCategory,
    description: 'Filter by transaction category',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TransactionStatus,
    description: 'Filter by transaction status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO string)',
  })
  async getTransactionSummary(
    @Request() req: any,
    @Query('type') type?: TransactionType,
    @Query('category') category?: TransactionCategory,
    @Query('status') status?: TransactionStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const filters: TransactionFilters = {
      type,
      category,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.transactionService.getTransactionSummary(
      req.user.id,
      filters
    );
  }

  /**
   * Get recent transactions for dashboard
   */
  @Get('recent/list')
  @ApiOperation({ summary: 'Get recent transactions for dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Recent transactions retrieved successfully',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of transactions (default: 10)',
  })
  async getRecentTransactions(
    @Request() req: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10
  ) {
    return this.transactionService.getRecentTransactions(
      req.user.id,
      limit
    );
  }

  /**
   * Get transactions by category
   */
  @Get('category/:category')
  @ApiOperation({ summary: 'Get transactions by category' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of transactions (default: 20)',
  })
  async getTransactionsByCategory(
    @Request() req: any,
    @Param('category', new ParseEnumPipe(TransactionCategory))
    category: TransactionCategory,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20
  ) {
    return this.transactionService.getTransactionsByCategory(
      req.user.id,
      category,
      limit
    );
  }

  /**
   * Search transactions
   */
  @Get('search/query')
  @ApiOperation({ summary: 'Search transactions' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results (default: 20)',
  })
  async searchTransactions(
    @Request() req: any,
    @Query('q') query: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20
  ) {
    return this.transactionService.searchTransactions(
      req.user.id,
      query,
      limit
    );
  }

  /**
   * Get transaction statistics
   */
  @Get('stats/analytics')
  @ApiOperation({ summary: 'Get transaction statistics and analytics' })
  @ApiResponse({
    status: 200,
    description: 'Transaction statistics retrieved successfully',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to analyze (default: 30)',
  })
  async getTransactionStats(
    @Request() req: any,
    @Query('days', new ParseIntPipe({ optional: true })) days: number = 30
  ) {
    return this.transactionService.getTransactionStats(req.user.id, days);
  }

  /**
   * Update transaction status (for admin/internal use)
   */
  @Put(':id/status')
  @ApiOperation({ summary: 'Update transaction status' })
  @ApiResponse({
    status: 200,
    description: 'Transaction status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async updateTransactionStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status', new ParseEnumPipe(TransactionStatus))
    status: TransactionStatus,
    @Body('metadata') metadata?: Record<string, any>
  ) {
    return this.transactionService.updateTransactionStatus(
      id,
      req.user.id,
      status,
      metadata
    );
  }
}
