import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * DTO for registering device push token
 */
export class RegisterDeviceDto {
  @ApiProperty({
    description: 'Expo push token for the device',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    pattern: '^ExponentPushToken\\[.*\\]$',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^ExponentPushToken\[.*\]$/, {
    message: 'Push token must be a valid Expo push token format',
  })
  pushToken: string;
}

