/**
 * Admin Auth Controller
 * Handles admin authentication - login with role verification
 */

import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { EncryptionService } from '../../common/encryption/encryption.service';

class AdminLoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // email or phone

  @IsString()
  @IsNotEmpty()
  password: string;
}

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login with role verification' })
  async login(@Body() dto: AdminLoginDto) {
    const { identifier, password } = dto;

    // Find user by email or phone
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account is temporarily locked');
    }

    // Verify password
    const isPasswordValid = await this.encryptionService.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account is suspended');
    }

    // Verify admin role
    const adminRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.MODERATOR,
    ];

    if (!adminRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions. Admin access required.');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      status: user.status,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '24h'),
    });

    this.logger.log(`Admin login successful for ${user.email} (role: ${user.role})`);

    return {
      token: accessToken,
      expiresIn: 86400,
      user: {
        id: user.id,
        username: user.email,
        email: user.email,
        role: user.role,
        name: user.name,
        avatar: null,
        lastLogin: user.lastLoginAt?.toISOString() || new Date().toISOString(),
        permissions: ['all'],
      },
    };
  }
}
