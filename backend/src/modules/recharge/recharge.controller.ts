import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { RechargeService } from './recharge.service';
import {
  DetectOperatorDto,
  GetPlansDto,
  MobileRechargeDto,
  AddFavoriteDto,
  ValidateRechargeDto,
  GetDthPlansDto,
  DthRechargeDto,
} from './dto/mobile-recharge.dto';
import { KwikApiService } from './kwikapi/kwikapi.service';
import { KwikApiRechargeRequest } from './kwikapi/kwikapi.interface';
import { RechargeExchangeService } from './rechargeexchange/rechargeexchange.service';

@ApiTags('Recharge')
@Controller('recharge')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RechargeController {
  constructor(
    private readonly rechargeService: RechargeService,
    private readonly kwikApiService: KwikApiService,
    private readonly rechargeExchangeService: RechargeExchangeService,
  ) {}

  /**
   * Auto-detect operator from mobile number
   */
  @Public()
  @Post('detect-operator')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-detect operator from mobile number' })
  @ApiResponse({ status: 200, description: 'Operator detected successfully' })
  async detectOperator(@Body() dto: DetectOperatorDto) {
    return this.rechargeService.detectOperator(dto);
  }

  /**
   * Get list of available operators
   */
  @Public()
  @Get('operators')
  @ApiOperation({ summary: 'Get list of available operators' })
  @ApiResponse({ status: 200, description: 'List of operators' })
  async getOperators() {
    return this.rechargeService.getOperators();
  }

  /**
   * Get circles for a specific operator
   */
  @Public()
  @Get('circles/:operatorCode')
  @ApiOperation({ summary: 'Get circles for an operator' })
  @ApiResponse({ status: 200, description: 'List of circles' })
  async getCircles(@Param('operatorCode') operatorCode: string) {
    return this.rechargeService.getCircles(operatorCode);
  }

  /**
   * Get all circles from database
   */
  @Public()
  @Get('all-circles')
  @ApiOperation({ summary: 'Get all available circles' })
  @ApiResponse({ status: 200, description: 'List of all circles' })
  async getAllCircles() {
    return this.rechargeService.getAllCircles();
  }

  /**
   * Fetch and store circles from KWIKAPI (Admin only - rate limited)
   * WARNING: Only 2 hits/day allowed on KWIKAPI
   */
  @Post('fetch-circles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch circles from KWIKAPI and store in DB' })
  @ApiResponse({ status: 200, description: 'Circles fetched and stored successfully' })
  async fetchAndStoreCircles() {
    return this.rechargeService.fetchAndStoreCircles();
  }

  /**
   * Get all operators from database (cached)
   */
  @Public()
  @Get('all-operators')
  @ApiOperation({ summary: 'Get all operators from database' })
  @ApiResponse({ status: 200, description: 'List of all operators with KWIKAPI IDs' })
  async getAllOperatorsFromDB() {
    return this.rechargeService.getAllOperatorsFromDB();
  }

  /**
   * Fetch and store operators from KWIKAPI (Admin only - rate limited)
   * WARNING: Only 15 hits/day allowed on KWIKAPI
   */
  @Post('fetch-operators')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch operators from KWIKAPI and store in DB' })
  @ApiResponse({ status: 200, description: 'Operators fetched and stored successfully' })
  async fetchAndStoreOperators() {
    return this.rechargeService.fetchAndStoreOperators();
  }

  /**
   * Get recharge plans
   */
  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get recharge plans for an operator' })
  @ApiResponse({ status: 200, description: 'List of plans' })
  async getPlans(@Query() dto: GetPlansDto) {
    return this.rechargeService.getPlans(dto);
  }

  /**
   * Validate recharge before processing
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate recharge request' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validateRecharge(
    @Body() dto: ValidateRechargeDto,
    @Request() req: any
  ) {
    return this.rechargeService.validateRecharge(dto, req.user.id);
  }

  /**
   * Process mobile recharge
   */
  @Post('mobile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process mobile recharge' })
  @ApiResponse({ status: 200, description: 'Recharge processed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or insufficient balance',
  })
  async processMobileRecharge(
    @Body() dto: MobileRechargeDto,
    @Request() req: any
  ) {
    return this.rechargeService.processMobileRecharge(dto, req.user.id);
  }

  /**
   * Get recharge history
   */
  @Get('history')
  @ApiOperation({ summary: 'Get user recharge history' })
  @ApiResponse({ status: 200, description: 'List of past recharges' })
  async getRechargeHistory(
    @Request() req: any,
    @Query('limit') limit?: number
  ) {
    return this.rechargeService.getRechargeHistory(
      req.user.id,
      limit || 10
    );
  }

  /**
   * Add number to favorites
   */
  @Post('favorites')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add number to favorites' })
  @ApiResponse({ status: 201, description: 'Favorite added successfully' })
  async addFavorite(@Body() dto: AddFavoriteDto, @Request() req: any) {
    return this.rechargeService.addFavorite(dto, req.user.id);
  }

  /**
   * Get user favorites
   */
  @Get('favorites')
  @ApiOperation({ summary: 'Get user favorite numbers' })
  @ApiResponse({ status: 200, description: 'List of favorites' })
  async getFavorites(@Request() req: any, @Query('type') type?: string) {
    return this.rechargeService.getFavorites(req.user.id, type as any);
  }

  /**
   * Remove favorite
   */
  @Delete('favorites/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove favorite number' })
  @ApiResponse({ status: 200, description: 'Favorite removed successfully' })
  async removeFavorite(@Param('id') favoriteId: string, @Request() req: any) {
    await this.rechargeService.removeFavorite(favoriteId, req.user.id);
    return { message: 'Favorite removed successfully' };
  }

  /**
   * Get DTH plans for an operator
   */
  @Public()
  @Get('dth/plans')
  @ApiOperation({ summary: 'Get DTH plans for an operator' })
  @ApiResponse({ status: 200, description: 'DTH plans fetched successfully' })
  async getDthPlans(@Query() dto: GetDthPlansDto) {
    return this.rechargeService.getDthPlans(dto);
  }

  /**
   * Process DTH recharge
   */
  @Post('dth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process DTH recharge' })
  @ApiResponse({ status: 200, description: 'DTH recharge processed successfully' })
  async processDthRecharge(@Body() dto: DthRechargeDto, @Request() req: any) {
    return this.rechargeService.processDthRecharge(dto, req.user.id);
  }

  /**
   * RechargeExchange Callback endpoint
   * RE sends GET to this URL when PENDING transactions resolve to SUCCESS/FAIL
   * Configure in RE dashboard: https://yourdomain.com/recharge/callback
   */
  @Public()
  @Get('callback')
  @ApiOperation({ summary: 'RechargeExchange callback for PENDING transaction resolution' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async handleRechargeCallback(
    @Query('transid') transid: string,
    @Query('status') status: string,
    @Query('optransid') optransid?: string,
    @Query('amount') amount?: string,
    @Query('number') number?: string,
    @Query('opcode') opcode?: string,
  ) {
    await this.rechargeService.handleRechargeCallback(transid, status, optransid, amount);
    return { received: true };
  }

  /**
   * Check RechargeExchange transaction status by RE transid
   */
  @Get('status')
  @ApiOperation({ summary: 'Check RechargeExchange transaction status' })
  @ApiResponse({ status: 200, description: 'Status fetched successfully' })
  async getRechargeStatus(@Query('transid') transid: string) {
    if (!transid) {
      throw new Error('transid is required');
    }
    return this.rechargeExchangeService.getTransactionStatus(transid);
  }

  /**
   * Get RechargeExchange account balance
   */
  @Get('re/balance')
  @ApiOperation({ summary: 'Get RechargeExchange account balance' })
  @ApiResponse({ status: 200, description: 'Balance fetched successfully' })
  async getRechargeExchangeBalance(@Query('forceRefresh') forceRefresh?: string) {
    const refresh = forceRefresh === 'true';
    return this.rechargeExchangeService.getBalance(refresh);
  }

  /**
   * Get KWIKAPI wallet balance
   */
  @Get('kwikapi/balance')
  @ApiOperation({ summary: 'Get KWIKAPI wallet balance' })
  @ApiResponse({ status: 200, description: 'KWIKAPI balance fetched successfully' })
  async getKwikApiBalance(@Query('forceRefresh') forceRefresh?: string) {
    const refresh = forceRefresh === 'true';
    return this.kwikApiService.getWalletBalance(refresh);
  }

  /**
   * Process KWIKAPI recharge
   */
  @Public()
  @Post('kwikapi/recharge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process mobile recharge via KWIKAPI' })
  @ApiResponse({ status: 200, description: 'Recharge processed successfully' })
  async processKwikApiRecharge(@Body() dto: KwikApiRechargeRequest) {
    return this.kwikApiService.processRecharge(dto);
  }

  /**
   * Check KWIKAPI recharge status
   */
  @Public()
  @Get('kwikapi/status')
  @ApiOperation({ summary: 'Check KWIKAPI recharge status' })
  @ApiResponse({ status: 200, description: 'Status fetched successfully' })
  async checkKwikApiStatus(@Query('orderId') orderId: string) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    return this.kwikApiService.checkRechargeStatus(orderId);
  }

  /**
   * Get KWIKAPI configuration (environment, URL, etc.)
   */
  @Get('kwikapi/config')
  @ApiOperation({ summary: 'Get KWIKAPI configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  async getKwikApiConfig() {
    const config = this.kwikApiService.getConfiguration();
    return {
      enabled: config.enabled,
      environment: config.environment,
      baseUrl: config.baseUrl,
      apiKey: `${config.apiKey.substring(0, 10)}...${config.apiKey.substring(config.apiKey.length - 4)}`,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      isProduction: config.environment === 'production',
      warning: config.environment === 'production'
        ? 'You are using PRODUCTION environment. Real money will be deducted.'
        : 'You are using UAT (testing) environment.',
    };
  }
}
