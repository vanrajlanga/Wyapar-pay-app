import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  NotFoundException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import {
  S3Service,
  UploadFileOptions,
  DownloadFileOptions,
} from './s3.service';

export class UploadFileDto {
  folder?: string;
  fileName?: string;
  contentType?: string;
  acl?: 'private' | 'public-read' | 'public-read-write';
}

export class UploadMultipleFilesDto {
  folder?: string;
  acl?: 'private' | 'public-read' | 'public-read-write';
}

export class GenerateUploadUrlDto {
  fileName: string;
  contentType: string;
  folder?: string;
  acl?: 'private' | 'public-read' | 'public-read-write';
}

export class GenerateDownloadUrlDto {
  expiresIn?: number;
}

@ApiTags('File Upload')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FileUploadController {
  constructor(
    private readonly s3Service: S3Service,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
    @Request() req: any
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const options: UploadFileOptions = {
      folder: uploadDto.folder,
      fileName: uploadDto.fileName,
      contentType: uploadDto.contentType || file.mimetype,
      acl: uploadDto.acl || 'private',
      metadata: {
        uploadedBy: req.user.id,
        originalName: file.originalname,
      },
    };

    const result = await this.s3Service.uploadFile(file.buffer, options);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      message: 'File uploaded successfully',
      fileInfo: result.fileInfo,
    };
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiOperation({ summary: 'Upload multiple files to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadDto: UploadMultipleFilesDto,
    @Request() req: any
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const fileBuffers = files.map((file) => file.buffer);
    const options: UploadFileOptions = {
      folder: uploadDto.folder,
      acl: uploadDto.acl || 'private',
      metadata: {
        uploadedBy: req.user.id,
      },
    };

    const results = await this.s3Service.uploadMultipleFiles(
      fileBuffers,
      options
    );

    const successfulUploads = results.filter((result) => result.success);
    const failedUploads = results.filter((result) => !result.success);

    return {
      success: true,
      message: `${successfulUploads.length} files uploaded successfully`,
      successfulUploads: successfulUploads.map((result) => result.fileInfo),
      failedUploads: failedUploads.map((result) => ({ error: result.error })),
    };
  }

  @Post('upload-url')
  @ApiOperation({ summary: 'Generate presigned URL for client-side upload' })
  @ApiResponse({
    status: 201,
    description: 'Upload URL generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async generateUploadUrl(
    @Body() generateUrlDto: GenerateUploadUrlDto,
    @Request() req: any
  ) {
    const fileName = `${Date.now()}-${generateUrlDto.fileName}`;
    const key = generateUrlDto.folder
      ? `${generateUrlDto.folder}/${fileName}`
      : fileName;

    const options: UploadFileOptions = {
      folder: generateUrlDto.folder,
      acl: generateUrlDto.acl || 'private',
      metadata: {
        uploadedBy: req.user.id,
        generatedAt: new Date().toISOString(),
      },
    };

    const result = await this.s3Service.getUploadUrl(
      key,
      generateUrlDto.contentType,
      options
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      uploadUrl: result.url,
      key,
      expiresIn: 3600, // 1 hour
    };
  }

  @Get('download-url/:key')
  @ApiOperation({ summary: 'Generate presigned URL for downloading a file' })
  @ApiResponse({
    status: 200,
    description: 'Download URL generated successfully',
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async generateDownloadUrl(
    @Param('key') key: string,
    @Body() downloadDto: GenerateDownloadUrlDto
  ) {
    const options: DownloadFileOptions = {
      expiresIn: downloadDto.expiresIn || 3600,
    };

    const result = await this.s3Service.getDownloadUrl(key, options);

    if (!result.success) {
      throw new NotFoundException(result.error);
    }

    return {
      success: true,
      downloadUrl: result.url,
      expiresIn: options.expiresIn,
    };
  }

  @Get('info/:key')
  @ApiOperation({ summary: 'Get file information' })
  @ApiResponse({
    status: 200,
    description: 'File information retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFileInfo(@Param('key') key: string) {
    const fileInfo = await this.s3Service.getFileInfo(key);

    if (!fileInfo) {
      throw new NotFoundException('File not found');
    }

    return {
      success: true,
      fileInfo,
    };
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a file from S3' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(@Param('key') key: string) {
    const success = await this.s3Service.deleteFile(key);

    if (!success) {
      throw new NotFoundException('Failed to delete file or file not found');
    }

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload user profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Profile image uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size too large. Maximum size is 5MB.'
      );
    }

    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const result = await this.s3Service.uploadProfileImage(
      file.buffer,
      req.user.id,
      fileExtension
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    // Save the profile image URL to the user record
    await this.userRepository.update(req.user.id, {
      profileImage: result.fileInfo?.url || result.fileInfo?.key,
    });

    return {
      success: true,
      message: 'Profile image uploaded successfully',
      fileInfo: result.fileInfo,
    };
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload user document' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @Request() req: any
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!documentType) {
      throw new BadRequestException('Document type is required');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and PDF are allowed.'
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size too large. Maximum size is 10MB.'
      );
    }

    const fileExtension = file.originalname.split('.').pop() || 'pdf';
    const result = await this.s3Service.uploadDocument(
      file.buffer,
      req.user.id,
      documentType,
      fileExtension
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      message: 'Document uploaded successfully',
      fileInfo: result.fileInfo,
    };
  }

  @Get('bucket-config')
  @ApiOperation({ summary: 'Get S3 bucket configuration' })
  @ApiResponse({
    status: 200,
    description: 'Bucket configuration retrieved successfully',
  })
  async getBucketConfig() {
    const bucketConfig = this.s3Service.getBucketConfig();

    return {
      success: true,
      bucketConfig,
    };
  }

  @Get('test-connection')
  @ApiOperation({ summary: 'Test S3 connection' })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  async testConnection() {
    const isConnected = await this.s3Service.testConnection();

    return {
      success: true,
      connected: isConnected,
      message: isConnected
        ? 'S3 connection successful'
        : 'S3 connection failed',
    };
  }
}
