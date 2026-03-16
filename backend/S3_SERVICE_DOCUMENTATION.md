# AWS S3 Service Documentation

## Overview

The S3Service provides comprehensive file upload, download, and management capabilities for WyaparPay backend. It supports both server-side and client-side uploads with presigned URLs, making it suitable for various use cases including profile images, documents, and general file storage.

## Features

- ✅ **File Upload**: Single and multiple file uploads
- ✅ **File Download**: Generate presigned URLs for secure downloads
- ✅ **Client-side Upload**: Generate presigned URLs for direct client uploads
- ✅ **File Management**: Delete, check existence, get file info
- ✅ **Specialized Methods**: Profile images and document uploads
- ✅ **Security**: Private/public access control
- ✅ **Metadata**: Custom metadata support
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Connection Testing**: Built-in connectivity testing

## Configuration

### Environment Variables

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=wyaparpay-assets
S3_PROFILE_FOLDER=profile-images
S3_DOCUMENTS_FOLDER=documents
```

### Required AWS Permissions

Your AWS IAM user/role needs the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:HeadObject"
            ],
            "Resource": [
                "arn:aws:s3:::wyaparpay-assets/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::wyaparpay-assets"
            ]
        }
    ]
}
```

## API Endpoints

### File Upload Endpoints

#### 1. Upload Single File
```http
POST /api/v1/files/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- file: File (required)
- folder: string (optional)
- fileName: string (optional)
- contentType: string (optional)
- acl: 'private' | 'public-read' | 'public-read-write' (optional)
```

#### 2. Upload Multiple Files
```http
POST /api/v1/files/upload-multiple
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- files: File[] (required, max 10 files)
- folder: string (optional)
- acl: 'private' | 'public-read' | 'public-read-write' (optional)
```

#### 3. Upload Profile Image
```http
POST /api/v1/files/profile-image
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- file: File (required, max 5MB, JPEG/PNG/GIF/WebP)
```

#### 4. Upload Document
```http
POST /api/v1/files/document
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- file: File (required, max 10MB, JPEG/PNG/PDF)
- documentType: string (required, e.g., 'pan', 'aadhar', 'passport')
```

### File Management Endpoints

#### 5. Generate Upload URL (Client-side)
```http
POST /api/v1/files/upload-url
Authorization: Bearer <token>

Body:
{
  "fileName": "example.jpg",
  "contentType": "image/jpeg",
  "folder": "uploads",
  "acl": "private"
}
```

#### 6. Generate Download URL
```http
GET /api/v1/files/download-url/{key}
Authorization: Bearer <token>

Body:
{
  "expiresIn": 3600
}
```

#### 7. Get File Information
```http
GET /api/v1/files/info/{key}
Authorization: Bearer <token>
```

#### 8. Delete File
```http
DELETE /api/v1/files/{key}
Authorization: Bearer <token>
```

#### 9. Test S3 Connection
```http
GET /api/v1/files/test-connection
Authorization: Bearer <token>
```

## Usage Examples

### 1. Server-side File Upload

```typescript
import { S3Service } from './common/s3/s3.service';

@Injectable()
export class MyService {
  constructor(private s3Service: S3Service) {}

  async uploadFile(file: Buffer, userId: string) {
    const result = await this.s3Service.uploadFile(file, {
      folder: 'user-uploads',
      fileName: `user-${userId}-${Date.now()}.jpg`,
      contentType: 'image/jpeg',
      metadata: {
        userId,
        uploadedBy: 'my-service'
      }
    });

    if (result.success) {
      return result.fileInfo;
    } else {
      throw new Error(result.error);
    }
  }
}
```

### 2. Profile Image Upload

```typescript
async uploadUserProfile(file: Buffer, userId: string) {
  const result = await this.s3Service.uploadProfileImage(
    file, 
    userId, 
    'jpg'
  );
  
  return result;
}
```

### 3. Document Upload

```typescript
async uploadUserDocument(file: Buffer, userId: string, docType: string) {
  const result = await this.s3Service.uploadDocument(
    file, 
    userId, 
    docType, 
    'pdf'
  );
  
  return result;
}
```

### 4. Generate Download URL

```typescript
async getSecureDownloadUrl(fileKey: string) {
  const result = await this.s3Service.getDownloadUrl(fileKey, {
    expiresIn: 3600 // 1 hour
  });
  
  return result.url;
}
```

### 5. Client-side Upload

```typescript
async generateClientUploadUrl(fileName: string, contentType: string) {
  const key = `uploads/${Date.now()}-${fileName}`;
  
  const result = await this.s3Service.getUploadUrl(key, contentType, {
    acl: 'private',
    metadata: {
      uploadedBy: 'client'
    }
  });
  
  return {
    uploadUrl: result.url,
    key,
    expiresIn: 3600
  };
}
```

## File Organization

### Folder Structure

```
wyaparpay-assets/
├── profile-images/
│   ├── profile-user123-1234567890.jpg
│   └── profile-user456-1234567891.png
├── documents/
│   ├── pan-user123-1234567890.pdf
│   ├── aadhar-user123-1234567891.jpg
│   └── passport-user456-1234567892.pdf
└── uploads/
    ├── general-file1.pdf
    └── general-file2.jpg
```

### Naming Conventions

- **Profile Images**: `profile-{userId}-{timestamp}.{extension}`
- **Documents**: `{documentType}-{userId}-{timestamp}.{extension}`
- **General Files**: `{customName}-{timestamp}.{extension}`

## Error Handling

The service provides comprehensive error handling:

```typescript
const result = await s3Service.uploadFile(file);

if (!result.success) {
  // Handle error
  console.error('Upload failed:', result.error);
  throw new BadRequestException(result.error);
}

// Use successful result
const fileInfo = result.fileInfo;
```

## Testing

### Test S3 Connection

```bash
# Test AWS S3 connectivity
npm run test:s3
```

### Manual Testing

1. **Start the backend server**
2. **Test connection endpoint**:
   ```bash
   curl -H "Authorization: Bearer <token>" \
        http://localhost:3000/api/v1/files/test-connection
   ```

3. **Upload a test file**:
   ```bash
   curl -X POST \
        -H "Authorization: Bearer <token>" \
        -F "file=@test-image.jpg" \
        http://localhost:3000/api/v1/files/upload
   ```

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **File Validation**: File type and size validation
3. **Access Control**: Private/public ACL support
4. **Presigned URLs**: Time-limited access for downloads
5. **Metadata**: Track upload source and user information

## Performance Tips

1. **Use presigned URLs** for large files to reduce server load
2. **Implement file compression** before upload for images
3. **Use CDN** for frequently accessed public files
4. **Batch operations** for multiple file uploads
5. **Implement retry logic** for failed uploads

## Troubleshooting

### Common Issues

1. **AWS Credentials**: Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
2. **Bucket Permissions**: Verify S3 bucket exists and has proper permissions
3. **Region Mismatch**: Ensure AWS_REGION matches your bucket region
4. **File Size Limits**: Check file size limits (5MB for images, 10MB for documents)
5. **Content Type**: Ensure correct content type is specified

### Debug Steps

1. Run `npm run test:s3` to test connectivity
2. Check AWS CloudTrail for API call logs
3. Verify S3 bucket policy and IAM permissions
4. Test with small files first
5. Check network connectivity to AWS

## Integration with Other Services

The S3Service can be easily integrated with other services:

```typescript
// In UserService
@Injectable()
export class UserService {
  constructor(
    private s3Service: S3Service,
    private userRepository: Repository<User>
  ) {}

  async updateUserProfile(userId: string, profileImage: Buffer) {
    // Upload profile image
    const uploadResult = await this.s3Service.uploadProfileImage(
      profileImage, 
      userId, 
      'jpg'
    );

    if (uploadResult.success) {
      // Update user record with image URL
      await this.userRepository.update(userId, {
        profileImageUrl: uploadResult.fileInfo.url
      });
    }

    return uploadResult;
  }
}
```

This comprehensive S3 service provides all the functionality needed for file management in the WyaparPay application with proper security, error handling, and reusability across the backend.
