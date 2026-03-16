import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3Service } from './s3.service';
import { FileUploadController } from './file-upload.controller';
import { User } from '../../entities/user.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  providers: [S3Service],
  controllers: [FileUploadController],
  exports: [S3Service],
})
export class S3Module {}
