import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserStatus } from '../../entities/user.entity';
import {
  KycVerification,
  KycStatus,
  KycLevel,
} from '../../entities/kyc-verification.entity';
import {
  UserDocument,
  DocumentType,
  DocumentStatus,
} from '../../entities/user-document.entity';
import { ValidationService } from '../../common/validation/validation.service';
import { EncryptionService } from '../../common/encryption/encryption.service';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(KycVerification)
    private kycRepository: Repository<KycVerification>,
    @InjectRepository(UserDocument)
    private documentRepository: Repository<UserDocument>,
    private validationService: ValidationService,
    private encryptionService: EncryptionService
  ) {}

  // Get user profile
  async getUserProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['documents', 'kycVerifications'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  // Update user profile
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { name, email, phone, password, dateOfBirth, address, pincode, city, state, profileImage } =
      updateProfileDto;

    // Validate inputs
    if (name && !this.validationService.isValidName(name)) {
      throw new BadRequestException('Invalid name format');
    }

    if (pincode && !this.validationService.isValidPincode(pincode)) {
      throw new BadRequestException('Invalid pincode format');
    }

    // Handle email update
    if (email && email !== user.email) {
      if (!this.validationService.isValidEmail(email)) {
        throw new BadRequestException('Invalid email format');
      }

      // Check if email is already taken by another user
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email already in use');
      }

      user.email = email;
      // Note: In production, you might want to require email verification
      // user.isEmailVerified = false;
    }

    // Handle phone update
    if (phone && phone !== user.phone) {
      if (!this.validationService.isValidPhoneNumber(phone)) {
        throw new BadRequestException('Invalid phone number format');
      }

      // Check if phone is already taken by another user
      const existingUser = await this.userRepository.findOne({ where: { phone } });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Phone number already in use');
      }

      user.phone = phone;
      // Note: In production, you might want to require phone verification
      // user.isPhoneVerified = false;
    }

    // Handle password update
    if (password) {
      // Hash password before saving
      user.password = await this.encryptionService.hashPassword(password);
    }

    // Update other user fields
    if (name) user.name = name;
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (address) user.address = address;
    if (pincode) user.pincode = pincode;
    if (city) user.city = city;
    if (state) user.state = state;
    if (profileImage !== undefined) user.profileImage = profileImage;

    const updatedUser = await this.userRepository.save(user);
    return this.sanitizeUser(updatedUser);
  }

  // Get KYC status
  async getKycStatus(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['kycVerifications', 'documents'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const kyc = user.kycVerifications?.[0];
    const documents = user.documents || [];

    return {
      status: kyc?.status || KycStatus.NOT_STARTED,
      level: kyc?.level || KycLevel.BASIC,
      progress: this.calculateKycProgress(kyc, documents),
      requiredDocuments: this.getRequiredDocuments(
        kyc?.level || KycLevel.BASIC
      ),
      uploadedDocuments: documents.map((doc) => ({
        type: doc.type,
        status: doc.status,
        uploadedAt: doc.createdAt,
      })),
      verificationData: kyc
        ? {
            panNumber: kyc.panNumber,
            aadhaarNumber: kyc.aadhaarNumber,
            address: kyc.address,
            dateOfBirth: kyc.dateOfBirth,
            verifiedAt: kyc.verifiedAt,
          }
        : null,
    };
  }

  // Update KYC information
  async updateKyc(userId: string, updateKycDto: UpdateKycDto): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const {
      panNumber,
      aadhaarNumber,
      address,
      pincode,
      city,
      state,
      dateOfBirth,
      gender,
      fatherName,
      motherName,
      occupation,
      annualIncome,
    } = updateKycDto;

    // Validate inputs
    if (panNumber && !this.validationService.isValidPanNumber(panNumber)) {
      throw new BadRequestException('Invalid PAN number format');
    }

    if (
      aadhaarNumber &&
      !this.validationService.isValidAadhaarNumber(aadhaarNumber)
    ) {
      throw new BadRequestException('Invalid Aadhaar number format');
    }

    if (pincode && !this.validationService.isValidPincode(pincode)) {
      throw new BadRequestException('Invalid pincode format');
    }

    // Get or create KYC record
    let kyc = await this.kycRepository.findOne({ where: { userId } });
    if (!kyc) {
      kyc = this.kycRepository.create({
        userId,
        status: KycStatus.IN_PROGRESS,
        level: KycLevel.BASIC,
      });
    }

    // Update KYC fields
    if (panNumber) kyc.panNumber = panNumber.toUpperCase();
    if (aadhaarNumber) kyc.aadhaarNumber = aadhaarNumber;
    if (address) kyc.address = address;
    if (pincode) kyc.pincode = pincode;
    if (city) kyc.city = city;
    if (state) kyc.state = state;
    if (dateOfBirth) kyc.dateOfBirth = new Date(dateOfBirth);
    if (gender) kyc.gender = gender;
    if (fatherName) kyc.fatherName = fatherName;
    if (motherName) kyc.motherName = motherName;
    if (occupation) kyc.occupation = occupation;
    if (annualIncome) kyc.annualIncome = annualIncome;

    // Update status based on completeness
    kyc.status = this.determineKycStatus(kyc);
    kyc.lastAttemptAt = new Date();

    const savedKyc = await this.kycRepository.save(kyc);

    return {
      status: savedKyc.status,
      level: savedKyc.level,
      progress: this.calculateKycProgress(savedKyc, []),
      message: 'KYC information updated successfully',
    };
  }

  // Upload document
  async uploadDocument(
    userId: string,
    uploadDocumentDto: UploadDocumentDto,
    file: Express.Multer.File
  ): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { type, expiresAt } = uploadDocumentDto;

    // Check if document already exists
    const existingDocument = await this.documentRepository.findOne({
      where: { userId, type },
    });

    if (
      existingDocument &&
      existingDocument.status === DocumentStatus.VERIFIED
    ) {
      throw new BadRequestException('Document already verified');
    }

    // Validate file
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      throw new BadRequestException(
        'File size too large. Maximum 10MB allowed.'
      );
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and PDF are allowed.'
      );
    }

    // Create document record
    const document = this.documentRepository.create({
      userId,
      type,
      fileName: file.originalname,
      filePath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
      status: DocumentStatus.UPLOADED,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    const savedDocument = await this.documentRepository.save(document);

    // Update KYC status
    await this.updateKycStatusAfterDocumentUpload(userId);

    return {
      id: savedDocument.id,
      type: savedDocument.type,
      status: savedDocument.status,
      fileName: savedDocument.fileName,
      uploadedAt: savedDocument.createdAt,
      message: 'Document uploaded successfully',
    };
  }

  // Get user documents
  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    const documents = await this.documentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return documents.map((doc) => ({
      ...doc,
      filePath: undefined, // Don't expose file path for security
    })) as UserDocument[];
  }

  // Update user preferences
  async updatePreferences(
    userId: string,
    updatePreferencesDto: UpdatePreferencesDto
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Handle both new structured format and legacy format
    let updatedPreferences = { ...user.preferences };

    if (updatePreferencesDto.notifications) {
      updatedPreferences.notifications = {
        ...updatedPreferences.notifications,
        ...updatePreferencesDto.notifications,
      };
    }
    if (updatePreferencesDto.privacy) {
      updatedPreferences.privacy = {
        ...updatedPreferences.privacy,
        ...updatePreferencesDto.privacy,
      };
    }
    if (updatePreferencesDto.security) {
      updatedPreferences.security = {
        ...updatedPreferences.security,
        ...updatePreferencesDto.security,
      };
    }
    if (updatePreferencesDto.display) {
      updatedPreferences.display = {
        ...updatedPreferences.display,
        ...updatePreferencesDto.display,
      };
    }
    if (updatePreferencesDto.transactions) {
      updatedPreferences.transactions = {
        ...updatedPreferences.transactions,
        ...updatePreferencesDto.transactions,
      };
    }

    // Legacy support - merge with existing preferences
    if (updatePreferencesDto.preferences) {
      updatedPreferences = {
        ...updatedPreferences,
        ...updatePreferencesDto.preferences,
      };
    }

    user.preferences = updatedPreferences;

    const updatedUser = await this.userRepository.save(user);
    return this.sanitizeUser(updatedUser);
  }

  // Change password
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto
  ): Promise<any> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.encryptionService.comparePassword(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password
    if (!this.validationService.isStrongPassword(newPassword)) {
      throw new BadRequestException(
        'New password does not meet security requirements'
      );
    }

    // Update password
    user.password = await this.encryptionService.hashPassword(newPassword);
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  // Deactivate account
  async deactivateAccount(userId: string, reason: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = UserStatus.INACTIVE;
    await this.userRepository.save(user);

    return { message: 'Account deactivated successfully' };
  }

  // Private helper methods
  private sanitizeUser(user: User): User {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser as User;
  }

  private calculateKycProgress(
    kyc: KycVerification | null,
    documents: UserDocument[]
  ): number {
    if (!kyc) return 0;

    let progress = 0;
    const totalSteps = 6;

    // Basic information
    if (kyc.panNumber) progress += 1;
    if (kyc.aadhaarNumber) progress += 1;
    if (kyc.address && kyc.pincode && kyc.city && kyc.state) progress += 1;
    if (kyc.dateOfBirth) progress += 1;
    if (kyc.gender) progress += 1;

    // Documents
    const requiredDocs = this.getRequiredDocuments(kyc.level);
    const uploadedDocs = documents.filter(
      (doc) =>
        requiredDocs.includes(doc.type) &&
        doc.status === DocumentStatus.VERIFIED
    );
    if (uploadedDocs.length >= requiredDocs.length) progress += 1;

    return Math.round((progress / totalSteps) * 100);
  }

  private getRequiredDocuments(level: KycLevel): DocumentType[] {
    switch (level) {
      case KycLevel.BASIC:
        return [DocumentType.PAN_CARD];
      case KycLevel.STANDARD:
        return [DocumentType.PAN_CARD, DocumentType.AADHAAR_FRONT];
      case KycLevel.ENHANCED:
        return [
          DocumentType.PAN_CARD,
          DocumentType.AADHAAR_FRONT,
          DocumentType.AADHAAR_BACK,
          DocumentType.PROFILE_PHOTO,
        ];
      default:
        return [DocumentType.PAN_CARD];
    }
  }

  private determineKycStatus(kyc: KycVerification): KycStatus {
    const requiredFields = [
      'panNumber',
      'aadhaarNumber',
      'address',
      'pincode',
      'city',
      'state',
      'dateOfBirth',
    ];
    const filledFields = requiredFields.filter((field) => kyc[field]);

    if (filledFields.length === requiredFields.length) {
      return KycStatus.PENDING_REVIEW;
    } else if (filledFields.length > 0) {
      return KycStatus.IN_PROGRESS;
    } else {
      return KycStatus.NOT_STARTED;
    }
  }

  private async updateKycStatusAfterDocumentUpload(
    userId: string
  ): Promise<void> {
    const kyc = await this.kycRepository.findOne({ where: { userId } });
    if (!kyc) return;

    const documents = await this.documentRepository.find({
      where: { userId, status: DocumentStatus.VERIFIED },
    });

    const requiredDocs = this.getRequiredDocuments(kyc.level);
    const uploadedDocs = documents.filter((doc) =>
      requiredDocs.includes(doc.type)
    );

    if (
      uploadedDocs.length >= requiredDocs.length &&
      kyc.status === KycStatus.IN_PROGRESS
    ) {
      kyc.status = KycStatus.PENDING_REVIEW;
      await this.kycRepository.save(kyc);
    }
  }
}
