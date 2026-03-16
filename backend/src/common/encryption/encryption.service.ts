import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly saltRounds: number;

  constructor(private configService: ConfigService) {
    this.saltRounds = parseInt(
      this.configService.get('BCRYPT_ROUNDS', '12'),
      10
    );
  }

  // Password hashing
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // OTP generation using cryptographically secure random
  generateOtp(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';

    // Use crypto.randomBytes for cryptographically secure random numbers
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      // Use modulo to map random bytes to digit indices
      otp += digits[randomBytes[i] % digits.length];
    }

    return otp;
  }

  // Token generation
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateUuid(): string {
    return crypto.randomUUID();
  }

  // Encryption/Decryption using secure methods
  encrypt(text: string, key?: string): string {
    const secretKey =
      key ||
      this.configService.get('ENCRYPTION_KEY') ||
      this.configService.get('JWT_SECRET');

    // Generate proper IV
    const iv = crypto.randomBytes(16);

    // Derive key using PBKDF2 for better security
    const salt = crypto.randomBytes(32);
    const derivedKey = crypto.pbkdf2Sync(secretKey, salt, 100000, 32, 'sha256');

    // Use createCipheriv (not deprecated createCipher)
    const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return: salt:iv:encrypted (all parts needed for decryption)
    return salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string, key?: string): string {
    const secretKey =
      key ||
      this.configService.get('ENCRYPTION_KEY') ||
      this.configService.get('JWT_SECRET');

    // Split the encrypted text to get salt, iv, and encrypted data
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    // Derive the same key using the same salt
    const derivedKey = crypto.pbkdf2Sync(secretKey, salt, 100000, 32, 'sha256');

    // Use createDecipheriv (not deprecated createDecipher)
    const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Hash generation
  generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // HMAC generation
  generateHmac(data: string, secret?: string): string {
    const secretKey = secret || this.configService.get('JWT_SECRET');
    return crypto.createHmac('sha256', secretKey).update(data).digest('hex');
  }

  // Verify HMAC
  verifyHmac(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.generateHmac(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}
