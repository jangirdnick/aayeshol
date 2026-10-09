import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class VerifyEmailDto {
  /** challengeId returned from POST /auth/register or POST /auth/resend-verification */
  @IsNotEmpty({ message: 'Challenge ID is required.' })
  @IsUUID(4, { message: 'Challenge ID must be a valid UUID format.' })
  @IsString()
  challengeId!: string;

  /** 6-digit OTP sent to the user's email */
  @IsNotEmpty({ message: 'OTP is required.' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits.' })
  otp!: string;
}
