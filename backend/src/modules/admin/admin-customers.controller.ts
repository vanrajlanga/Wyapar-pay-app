/**
 * Admin Customers Controller
 * API endpoints for customer management
 */

import {
  Controller,
  Get,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { AdminCustomersService } from './admin-customers.service';
import {
  CustomerListQueryDto,
  UpdateCustomerStatusDto,
  PaginatedCustomerResponse,
  CustomerDetailResponse,
  CustomerStatusUpdateResponse,
  CustomerStats,
} from './dto/admin-customers.dto';

@ApiTags('Admin Customers')
@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiBearerAuth()
export class AdminCustomersController {
  private readonly logger = new Logger(AdminCustomersController.name);

  constructor(private readonly customersService: AdminCustomersService) {}

  /**
   * Get customer statistics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get customer statistics',
    description: 'Retrieve comprehensive statistics about customers including counts, growth rate, and KYC status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer statistics',
  })
  async getCustomerStats(): Promise<CustomerStats> {
    this.logger.log('Getting customer statistics');
    return this.customersService.getCustomerStats();
  }

  /**
   * Get paginated customer list
   */
  @Get()
  @ApiOperation({
    summary: 'Get customers list',
    description: 'Retrieve paginated list of customers with filters and search',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated customer list with stats',
  })
  async getCustomers(
    @Query() query: CustomerListQueryDto,
  ): Promise<PaginatedCustomerResponse> {
    this.logger.log(`Getting customers with filters: ${JSON.stringify(query)}`);
    return this.customersService.getCustomers(query);
  }

  /**
   * Get customer by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get customer details',
    description: 'Retrieve detailed information about a specific customer including transactions and activity',
  })
  @ApiParam({ name: 'id', description: 'Customer ID (UUID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer details',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  async getCustomerById(@Param('id') id: string): Promise<CustomerDetailResponse> {
    this.logger.log(`Getting customer by ID: ${id}`);
    return this.customersService.getCustomerById(id);
  }

  /**
   * Update customer status
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update customer status',
    description: 'Update the status of a customer (active, inactive, blocked)',
  })
  @ApiParam({ name: 'id', description: 'Customer ID (UUID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer status updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  async updateCustomerStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerStatusDto,
  ): Promise<CustomerStatusUpdateResponse> {
    this.logger.log(`Updating customer ${id} status to: ${dto.status}`);
    return this.customersService.updateCustomerStatus(id, dto);
  }
}
