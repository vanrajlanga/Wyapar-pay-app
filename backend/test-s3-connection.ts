#!/usr/bin/env node

/**
 * AWS S3 Connectivity Test Script
 *
 * This script tests the AWS S3 connectivity and configuration
 * Run with: npm run test:s3
 */

import { ConfigService } from '@nestjs/config';
import { S3Service } from './src/common/s3/s3.service';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testS3Connection() {
  console.log('🔍 Testing AWS S3 Connectivity...\n');

  // Check environment variables
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'S3_BUCKET_NAME',
  ];

  console.log('📋 Environment Variables Check:');
  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(
        `  ✅ ${envVar}: ${envVar.includes('SECRET') ? '***' : value}`
      );
    } else {
      console.log(`  ❌ ${envVar}: Not set`);
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    console.log(
      '\n❌ Missing required environment variables. Please check your .env file.'
    );
    process.exit(1);
  }

  console.log('\n🔧 Initializing S3 Service...');

  try {
    // Create a mock ConfigService
    const configService = new ConfigService();

    // Initialize S3 service
    const s3Service = new S3Service(configService);

    console.log('✅ S3 Service initialized successfully');

    console.log('\n🧪 Testing S3 Connection...');

    // Get bucket configuration first
    const bucketConfig = s3Service.getBucketConfig();

    console.log('\n📊 S3 Configuration Summary:');
    console.log(`  Region: ${bucketConfig.region}`);
    console.log(`  Default Bucket: ${bucketConfig.defaultBucket}`);
    console.log(`  Profile Bucket: ${bucketConfig.profileBucket}`);
    console.log(`  Documents Bucket: ${bucketConfig.documentsBucket}`);
    console.log(`  Uploads Bucket: ${bucketConfig.uploadsBucket}`);

    // Test basic S3 connectivity without requiring buckets to exist
    try {
      const testKey = `test-connection-${Date.now()}`;
      const testContent = Buffer.from('test-connection');

      console.log('\n🔍 Testing basic S3 connectivity...');

      // Try to upload to default bucket (this will fail if bucket doesn't exist, but that's expected)
      const uploadResult = await s3Service.uploadFile(testContent, {
        bucketName: bucketConfig.defaultBucket,
        fileName: testKey,
        contentType: 'text/plain',
      });

      if (uploadResult.success) {
        console.log('✅ S3 connection test passed!');
        console.log('🎉 AWS S3 is properly configured and ready to use!');

        // Clean up test file
        await s3Service.deleteFile(testKey, bucketConfig.defaultBucket);
        console.log('🧹 Test file cleaned up successfully');
      } else {
        if (uploadResult.error?.includes('does not exist')) {
          console.log(
            '⚠️  S3 credentials are valid, but buckets need to be created'
          );
          console.log('\n📋 Required S3 Buckets:');
          console.log(`  • ${bucketConfig.defaultBucket} (main assets)`);
          console.log(`  • ${bucketConfig.profileBucket} (profile images)`);
          console.log(`  • ${bucketConfig.documentsBucket} (documents)`);
          console.log(`  • ${bucketConfig.uploadsBucket} (general uploads)`);
          console.log('\n🔧 Create buckets using AWS CLI:');
          console.log(
            `aws s3 mb s3://${bucketConfig.defaultBucket} --region ${bucketConfig.region}`
          );
          console.log(
            `aws s3 mb s3://${bucketConfig.profileBucket} --region ${bucketConfig.region}`
          );
          console.log(
            `aws s3 mb s3://${bucketConfig.documentsBucket} --region ${bucketConfig.region}`
          );
          console.log(
            `aws s3 mb s3://${bucketConfig.uploadsBucket} --region ${bucketConfig.region}`
          );
          console.log('\n✅ AWS S3 credentials are working correctly!');
        } else {
          console.log(`❌ S3 connection test failed: ${uploadResult.error}`);
          process.exit(1);
        }
      }
    } catch (error) {
      if (error.message?.includes('does not exist')) {
        console.log(
          '⚠️  S3 credentials are valid, but buckets need to be created'
        );
        console.log('\n📋 Required S3 Buckets:');
        console.log(`  • ${bucketConfig.defaultBucket} (main assets)`);
        console.log(`  • ${bucketConfig.profileBucket} (profile images)`);
        console.log(`  • ${bucketConfig.documentsBucket} (documents)`);
        console.log(`  • ${bucketConfig.uploadsBucket} (general uploads)`);
        console.log('\n🔧 Create buckets using AWS CLI:');
        console.log(
          `aws s3 mb s3://${bucketConfig.defaultBucket} --region ${bucketConfig.region}`
        );
        console.log(
          `aws s3 mb s3://${bucketConfig.profileBucket} --region ${bucketConfig.region}`
        );
        console.log(
          `aws s3 mb s3://${bucketConfig.documentsBucket} --region ${bucketConfig.region}`
        );
        console.log(
          `aws s3 mb s3://${bucketConfig.uploadsBucket} --region ${bucketConfig.region}`
        );
        console.log('\n✅ AWS S3 credentials are working correctly!');
      } else {
        console.log(`❌ S3 connection test failed: ${error.message}`);
        process.exit(1);
      }
    }
  } catch (error: any) {
    console.error('❌ Error testing S3 connection:', error.message);
    process.exit(1);
  }
}

// Run the test
testS3Connection().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
