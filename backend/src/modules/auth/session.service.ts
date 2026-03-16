import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { UserSession, SessionStatus } from '../../entities/user-session.entity';
import { EncryptionService } from '../../common/encryption/encryption.service';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
    private configService: ConfigService,
    private encryptionService: EncryptionService
  ) {}

  // Create new session
  async createSession(
    userId: string,
    accessToken: string,
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
    deviceId?: string,
    deviceType?: string
  ): Promise<UserSession> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    const session = this.sessionRepository.create({
      userId,
      token: accessToken,
      refreshToken,
      ipAddress,
      userAgent,
      deviceId,
      deviceType,
      expiresAt,
      lastUsedAt: new Date(),
    });

    return this.sessionRepository.save(session);
  }

  // Get active sessions for user
  async getUserActiveSessions(userId: string): Promise<UserSession[]> {
    return this.sessionRepository.find({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
      order: { lastUsedAt: 'DESC' },
    });
  }

  // Update session last used
  async updateSessionLastUsed(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      lastUsedAt: new Date(),
    });
  }

  // Revoke specific session
  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      status: SessionStatus.REVOKED,
      revokedAt: new Date(),
    });
  }

  // Revoke all sessions for user
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.sessionRepository.update(
      { userId, status: SessionStatus.ACTIVE },
      {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
      }
    );
  }

  // Revoke sessions by device
  async revokeSessionsByDevice(
    userId: string,
    deviceId: string
  ): Promise<void> {
    await this.sessionRepository.update(
      { userId, deviceId, status: SessionStatus.ACTIVE },
      {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
      }
    );
  }

  // Clean expired sessions
  async cleanExpiredSessions(): Promise<void> {
    await this.sessionRepository.update(
      {
        status: SessionStatus.ACTIVE,
        expiresAt: new Date(),
      },
      {
        status: SessionStatus.EXPIRED,
      }
    );
  }

  // Get session by token
  async getSessionByToken(token: string): Promise<UserSession | null> {
    return this.sessionRepository.findOne({
      where: { token, status: SessionStatus.ACTIVE },
      relations: ['user'],
    });
  }

  // Get session by refresh token
  async getSessionByRefreshToken(
    refreshToken: string
  ): Promise<UserSession | null> {
    return this.sessionRepository.findOne({
      where: { refreshToken, status: SessionStatus.ACTIVE },
      relations: ['user'],
    });
  }

  // Update session tokens
  async updateSessionTokens(
    sessionId: string,
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      token: accessToken,
      refreshToken,
      lastUsedAt: new Date(),
    });
  }
}
