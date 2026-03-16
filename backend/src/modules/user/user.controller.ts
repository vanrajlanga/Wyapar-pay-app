import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';

import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@ApiTags('User Management')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Request() req: any) {
    return this.userService.getUserProfile(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    return this.userService.updateProfile(req.user.id, updateProfileDto);
  }

  @Get('kyc')
  @ApiOperation({ summary: 'Get KYC status' })
  @ApiResponse({
    status: 200,
    description: 'KYC status retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getKycStatus(@Request() req: any) {
    return this.userService.getKycStatus(req.user.id);
  }

  @Put('kyc')
  @ApiOperation({ summary: 'Update KYC information' })
  @ApiResponse({
    status: 200,
    description: 'KYC information updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateKyc(@Request() req: any, @Body() updateKycDto: UpdateKycDto) {
    return this.userService.updateKyc(req.user.id, updateKycDto);
  }

  @Post('documents')
  @ApiOperation({ summary: 'Upload document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async uploadDocument(
    @Request() req: any,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|pdf)$/ }),
        ],
      })
    )
    file: Express.Multer.File
  ) {
    return this.userService.uploadDocument(
      req.user.id,
      uploadDocumentDto,
      file
    );
  }

  @Get('documents')
  @ApiOperation({ summary: 'Get user documents' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getDocuments(@Request() req: any) {
    return this.userService.getUserDocuments(req.user.id);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({
    status: 200,
    description: 'User preferences retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPreferences(@Request() req: any) {
    const user = await this.userService.getUserProfile(req.user.id);
    return {
      preferences: user.preferences || {},
      message: 'Preferences retrieved successfully',
    };
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updatePreferences(
    @Request() req: any,
    @Body() updatePreferencesDto: UpdatePreferencesDto
  ) {
    return this.userService.updatePreferences(
      req.user.id,
      updatePreferencesDto
    );
  }

  @Put('password')
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return this.userService.changePassword(req.user.id, changePasswordDto);
  }

  @Put('deactivate')
  @ApiOperation({ summary: 'Deactivate account' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivateAccount(@Request() req: any, @Body('reason') reason: string) {
    return this.userService.deactivateAccount(req.user.id, reason);
  }
}
