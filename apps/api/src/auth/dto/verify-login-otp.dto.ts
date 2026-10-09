import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class VerifyLoginOtpDto {
  /** The challengeId returned from POST /auth/login */
  @IsNotEmpty({ message: 'Challenge ID is required.' })
  @IsUUID(4, { message: 'Challenge ID must be a valid UUID format.' })
  @IsString()
  challengeId!: string;

  /** 6-digit OTP sent via email */
  @IsNotEmpty({ message: 'OTP is required.' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits.' })
  otp!: string;
}
