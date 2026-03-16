import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { WalletService } from './wallet.service';
import { WalletLedgerService } from './wallet-ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateWalletDto } from './dto/create-wallet.dto';
import { TransferDto } from './dto/transfer.dto';
import { LockWalletDto } from './dto/lock-wallet.dto';
import { GetLedgerEntriesDto } from './dto/get-ledger-entries.dto';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(
    private walletService: WalletService,
    private walletLedgerService: WalletLedgerService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new wallet' })
  @ApiResponse({ status: 201, description: 'Wallet created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createWallet(
    @Request() req: any,
    @Body() createWalletDto: CreateWalletDto
  ) {
    return this.walletService.createWallet(req.user.id, createWalletDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user wallets' })
  @ApiResponse({ status: 200, description: 'Wallets retrieved successfully' })
  async getUserWallets(@Request() req: any) {
    return this.walletService.getUserWallets(req.user.id);
  }

  @Get('primary')
  @ApiOperation({ summary: 'Get primary wallet' })
  @ApiResponse({
    status: 200,
    description: 'Primary wallet retrieved successfully',
  })
  async getPrimaryWallet(@Request() req: any) {
    return this.walletService.getPrimaryWallet(req.user.id);
  }

  @Get(':walletId')
  @ApiOperation({ summary: 'Get wallet by ID' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getWalletById(
    @Request() req: any,
    @Param('walletId') walletId: string
  ) {
    return this.walletService.getWalletById(walletId, req.user.id);
  }

  @Post(':walletId/transfer/:toWalletId')
  @ApiOperation({ summary: 'Transfer money between wallets' })
  @ApiResponse({ status: 200, description: 'Transfer completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async transferMoney(
    @Request() req: any,
    @Param('walletId') fromWalletId: string,
    @Param('toWalletId') toWalletId: string,
    @Body() transferDto: TransferDto
  ) {
    return this.walletService.transferMoney(
      fromWalletId,
      toWalletId,
      req.user.id,
      transferDto
    );
  }

  @Put(':walletId/lock')
  @ApiOperation({ summary: 'Lock wallet' })
  @ApiResponse({ status: 200, description: 'Wallet locked successfully' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async lockWallet(
    @Request() req: any,
    @Param('walletId') walletId: string,
    @Body() lockWalletDto: LockWalletDto
  ) {
    return this.walletService.lockWallet(walletId, req.user.id, lockWalletDto);
  }

  @Put(':walletId/unlock')
  @ApiOperation({ summary: 'Unlock wallet' })
  @ApiResponse({ status: 200, description: 'Wallet unlocked successfully' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async unlockWallet(@Request() req: any, @Param('walletId') walletId: string) {
    return this.walletService.unlockWallet(walletId, req.user.id);
  }

  @Put(':walletId/reset-limits')
  @ApiOperation({ summary: 'Reset wallet limits' })
  @ApiResponse({ status: 200, description: 'Limits reset successfully' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async resetLimits(@Request() req: any, @Param('walletId') walletId: string) {
    return this.walletService.resetLimits(walletId, req.user.id);
  }

  @Get(':walletId/ledger')
  @ApiOperation({ summary: 'Get wallet ledger entries' })
  @ApiResponse({
    status: 200,
    description: 'Ledger entries retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getLedgerEntries(
    @Request() req: any,
    @Param('walletId') walletId: string,
    @Query() getLedgerEntriesDto: GetLedgerEntriesDto
  ) {
    // Verify wallet belongs to user
    await this.walletService.getWalletById(walletId, req.user.id);
    return this.walletLedgerService.getLedgerEntries(
      walletId,
      getLedgerEntriesDto
    );
  }

  @Get(':walletId/balance-history')
  @ApiOperation({ summary: 'Get wallet balance history' })
  @ApiResponse({
    status: 200,
    description: 'Balance history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getBalanceHistory(
    @Request() req: any,
    @Param('walletId') walletId: string,
    @Query('days') days: number = 30
  ) {
    // Verify wallet belongs to user
    await this.walletService.getWalletById(walletId, req.user.id);
    return this.walletLedgerService.getBalanceHistory(walletId, days);
  }

  @Get(':walletId/summary')
  @ApiOperation({ summary: 'Get wallet transaction summary' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getTransactionSummary(
    @Request() req: any,
    @Param('walletId') walletId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    // Verify wallet belongs to user
    await this.walletService.getWalletById(walletId, req.user.id);
    return this.walletLedgerService.getTransactionSummary(
      walletId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get(':walletId/category-summary')
  @ApiOperation({ summary: 'Get category-wise transaction summary' })
  @ApiResponse({
    status: 200,
    description: 'Category summary retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getCategorySummary(
    @Request() req: any,
    @Param('walletId') walletId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    // Verify wallet belongs to user
    await this.walletService.getWalletById(walletId, req.user.id);
    return this.walletLedgerService.getCategorySummary(
      walletId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get(':walletId/recent-transactions')
  @ApiOperation({ summary: 'Get recent wallet transactions' })
  @ApiResponse({
    status: 200,
    description: 'Recent transactions retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getRecentTransactions(
    @Request() req: any,
    @Param('walletId') walletId: string,
    @Query('limit') limit: number = 10
  ) {
    // Verify wallet belongs to user
    await this.walletService.getWalletById(walletId, req.user.id);
    return this.walletLedgerService.getRecentTransactions(walletId, limit);
  }
}
