import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export interface UploadFileOptions {
  bucketName?: string;
  folder?: string;
  fileName?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write';
}

export interface DownloadFileOptions {
  bucketName?: string;
  expiresIn?: number; // in seconds, default 3600 (1 hour)
}

export interface UploadUrlOptions {
  bucketName?: string;
  expiresIn?: number; // in seconds, default 3600 (1 hour)
  acl?: 'private' | 'public-read' | 'public-read-write';
  metadata?: Record<string, string>;
}

export interface FileInfo {
  key: string;
  bucket: string;
  url: string;
  size?: number;
  contentType?: string;
  lastModified?: Date;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  success: boolean;
  fileInfo?: FileInfo;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  url?: string;
  error?: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly defaultBucket: string;
  private readonly defaultRegion: string;
  private readonly profileBucket: string;
  private readonly documentsBucket: string;
  private readonly uploadsBucket: string;
  private readonly profileFolder: string;
  private readonly documentsFolder: string;

  constructor(private configService: ConfigService) {
    this.defaultRegion = this.configService.get('AWS_REGION', 'us-east-1');
    this.defaultBucket = this.configService.get(
      'S3_BUCKET_NAME',
      'wyaparpay-assets'
    );
    // Profile bucket defaults to the main bucket (wyaparpay-assets)
    this.profileBucket = this.configService.get(
      'S3_PROFILE_BUCKET',
      this.defaultBucket
    );
    // Documents bucket is separate (txn-documents)
    this.documentsBucket = this.configService.get(
      'S3_DOCUMENTS_BUCKET',
      this.defaultBucket
    );
    this.uploadsBucket = this.configService.get(
      'S3_UPLOADS_BUCKET',
      this.defaultBucket
    );
    
    // Folder configurations
    this.profileFolder = this.configService.get(
      'S3_PROFILE_FOLDER',
      'profile-images'
    );
    this.documentsFolder = this.configService.get(
      'S3_DOCUMENTS_FOLDER',
      'documents'
    );

    // Initialize S3 client
    this.s3Client = new S3Client({
      region: this.defaultRegion,
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.logger.log(
      `S3 Service initialized with region: ${this.defaultRegion}`
    );
    this.logger.log(
      `Buckets - Default: ${this.defaultBucket}, Profile: ${this.profileBucket}, Documents: ${this.documentsBucket}, Uploads: ${this.uploadsBucket}`
    );
    this.logger.log(
      `Folders - Profile: ${this.profileFolder}, Documents: ${this.documentsFolder}`
    );
  }

  /**
   * Upload a file to S3
   * @param file - The file buffer or stream
   * @param options - Upload options
   * @returns Promise<UploadResult>
   */
  async uploadFile(
    file: Buffer,
    options: UploadFileOptions = {}
  ): Promise<UploadResult> {
    try {
      const {
        bucketName = this.defaultBucket,
        folder = '',
        fileName,
        contentType = 'application/octet-stream',
        metadata = {},
        acl = 'private',
      } = options;

      // Generate unique filename if not provided
      const finalFileName = fileName || `${uuidv4()}-${Date.now()}`;

      // Construct the S3 key (path)
      const key = folder ? `${folder}/${finalFileName}` : finalFileName;

      // Prepare metadata
      const s3Metadata = {
        ...metadata,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'wyaparpay-backend',
      };

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: s3Metadata,
        ACL: acl,
      });

      await this.s3Client.send(command);

      // Generate the file URL
      const fileUrl = `https://${bucketName}.s3.${this.defaultRegion}.amazonaws.com/${key}`;

      const fileInfo: FileInfo = {
        key,
        bucket: bucketName,
        url: fileUrl,
        contentType,
        metadata: s3Metadata,
      };

      this.logger.log(
        `File uploaded successfully: ${key} to bucket: ${bucketName}`
      );

      return {
        success: true,
        fileInfo,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload multiple files to S3
   * @param files - Array of file buffers
   * @param options - Upload options
   * @returns Promise<UploadResult[]>
   */
  async uploadMultipleFiles(
    files: Buffer[],
    options: UploadFileOptions = {}
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file, index) => {
      const fileOptions = {
        ...options,
        fileName: options.fileName ? `${options.fileName}-${index}` : undefined,
      };
      return this.uploadFile(file, fileOptions);
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Generate a presigned URL for downloading a file
   * @param key - The S3 object key
   * @param options - Download options
   * @returns Promise<DownloadResult>
   */
  async getDownloadUrl(
    key: string,
    options: DownloadFileOptions = {}
  ): Promise<DownloadResult> {
    try {
      const {
        bucketName = this.defaultBucket,
        expiresIn = 3600, // 1 hour default
      } = options;

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      this.logger.log(
        `Generated download URL for key: ${key}, expires in: ${expiresIn}s`
      );

      return {
        success: true,
        url,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate download URL for key: ${key}, error: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate a presigned URL for uploading a file (client-side upload)
   * @param key - The S3 object key
   * @param contentType - The content type of the file
   * @param options - Upload options
   * @returns Promise<DownloadResult>
   */
  async getUploadUrl(
    key: string,
    contentType: string,
    options: UploadUrlOptions = {}
  ): Promise<DownloadResult> {
    try {
      const {
        bucketName = this.defaultBucket,
        expiresIn = 3600, // 1 hour default
        acl = 'private',
      } = options;

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
        ACL: acl,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      this.logger.log(
        `Generated upload URL for key: ${key}, expires in: ${expiresIn}s`
      );

      return {
        success: true,
        url,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate upload URL for key: ${key}, error: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get file information from S3
   * @param key - The S3 object key
   * @param bucketName - The S3 bucket name
   * @returns Promise<FileInfo | null>
   */
  async getFileInfo(
    key: string,
    bucketName: string = this.defaultBucket
  ): Promise<FileInfo | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      const fileInfo: FileInfo = {
        key,
        bucket: bucketName,
        url: `https://${bucketName}.s3.${this.defaultRegion}.amazonaws.com/${key}`,
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };

      return fileInfo;
    } catch (error) {
      this.logger.error(
        `Failed to get file info for key: ${key}, error: ${error.message}`,
        error.stack
      );
      return null;
    }
  }

  /**
   * Delete a file from S3
   * @param key - The S3 object key
   * @param bucketName - The S3 bucket name
   * @returns Promise<boolean>
   */
  async deleteFile(
    key: string,
    bucketName: string = this.defaultBucket
  ): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(
        `File deleted successfully: ${key} from bucket: ${bucketName}`
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete file: ${key}, error: ${error.message}`,
        error.stack
      );
      return false;
    }
  }

  /**
   * Check if a file exists in S3
   * @param key - The S3 object key
   * @param bucketName - The S3 bucket name
   * @returns Promise<boolean>
   */
  async fileExists(
    key: string,
    bucketName: string = this.defaultBucket
  ): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      this.logger.error(
        `Error checking file existence: ${key}, error: ${error.message}`,
        error.stack
      );
      return false;
    }
  }

  /**
   * Upload profile image with specific naming convention
   * @param file - The file buffer
   * @param userId - The user ID
   * @param fileExtension - The file extension (e.g., 'jpg', 'png')
   * @returns Promise<UploadResult>
   */
  async uploadProfileImage(
    file: Buffer,
    userId: string,
    fileExtension: string
  ): Promise<UploadResult> {
    const fileName = `profile-${userId}-${Date.now()}.${fileExtension}`;
    const contentType = this.getContentTypeFromExtension(fileExtension);

    this.logger.log(
      `Uploading profile image to bucket: ${this.profileBucket}, folder: ${this.profileFolder}`
    );

    return this.uploadFile(file, {
      bucketName: this.profileBucket,
      folder: this.profileFolder,
      fileName,
      contentType,
      metadata: {
        userId,
        type: 'profile-image',
      },
    });
  }

  /**
   * Upload document with specific naming convention
   * @param file - The file buffer
   * @param userId - The user ID
   * @param documentType - The type of document (e.g., 'pan', 'aadhar', 'passport')
   * @param fileExtension - The file extension
   * @returns Promise<UploadResult>
   */
  async uploadDocument(
    file: Buffer,
    userId: string,
    documentType: string,
    fileExtension: string
  ): Promise<UploadResult> {
    const fileName = `${documentType}-${userId}-${Date.now()}.${fileExtension}`;
    const contentType = this.getContentTypeFromExtension(fileExtension);

    this.logger.log(
      `Uploading document to bucket: ${this.documentsBucket}, folder: ${this.documentsFolder}`
    );

    return this.uploadFile(file, {
      bucketName: this.documentsBucket,
      folder: this.documentsFolder,
      fileName,
      contentType,
      metadata: {
        userId,
        documentType,
        type: 'document',
      },
    });
  }

  /**
   * Upload general file to uploads bucket
   * @param file - The file buffer
   * @param userId - The user ID
   * @param fileName - The file name
   * @param contentType - The content type
   * @returns Promise<UploadResult>
   */
  async uploadGeneralFile(
    file: Buffer,
    userId: string,
    fileName: string,
    contentType: string
  ): Promise<UploadResult> {
    const finalFileName = `${Date.now()}-${fileName}`;

    return this.uploadFile(file, {
      bucketName: this.uploadsBucket,
      folder: 'uploads',
      fileName: finalFileName,
      contentType,
      metadata: {
        userId,
        type: 'general-upload',
      },
    });
  }

  /**
   * Get content type from file extension
   * @param extension - The file extension
   * @returns string
   */
  private getContentTypeFromExtension(extension: string): string {
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Get bucket configuration information
   * @returns Object with bucket configuration
   */
  getBucketConfig() {
    return {
      defaultBucket: this.defaultBucket,
      profileBucket: this.profileBucket,
      documentsBucket: this.documentsBucket,
      uploadsBucket: this.uploadsBucket,
      profileFolder: this.profileFolder,
      documentsFolder: this.documentsFolder,
      region: this.defaultRegion,
    };
  }

  /**
   * Test S3 connectivity for all configured buckets
   * @returns Promise<boolean>
   */
  async testConnection(): Promise<boolean> {
    try {
      const buckets = [
        { name: this.defaultBucket, type: 'default' },
        { name: this.profileBucket, type: 'profile' },
        { name: this.documentsBucket, type: 'documents' },
        { name: this.uploadsBucket, type: 'uploads' },
      ];

      // Remove duplicates
      const uniqueBuckets = buckets.filter(
        (bucket, index, self) =>
          index === self.findIndex((b) => b.name === bucket.name)
      );

      for (const bucket of uniqueBuckets) {
        const testKey = `test-connection-${bucket.type}-${Date.now()}`;
        const testContent = Buffer.from(`test-${bucket.type}`);

        // Try to upload a test file
        const uploadResult = await this.uploadFile(testContent, {
          bucketName: bucket.name,
          fileName: testKey,
          contentType: 'text/plain',
        });

        if (!uploadResult.success) {
          this.logger.error(
            `Failed to upload test file to ${bucket.name}: ${uploadResult.error}`
          );
          return false;
        }

        // Try to delete the test file
        const deleteResult = await this.deleteFile(testKey, bucket.name);

        if (!deleteResult) {
          this.logger.error(`Failed to delete test file from ${bucket.name}`);
          return false;
        }

        this.logger.log(`✅ Successfully tested ${bucket.name} bucket`);
      }

      this.logger.log('✅ All S3 buckets tested successfully');
      return true;
    } catch (error) {
      this.logger.error(
        `S3 connection test failed: ${error.message}`,
        error.stack
      );
      return false;
    }
  }
}
