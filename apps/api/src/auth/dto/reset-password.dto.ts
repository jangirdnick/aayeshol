import { IsString, Length, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  /** challengeId returned from POST /auth/forgot-password */
  @IsString()
  challengeId!: string;

  /** 6-digit OTP sent to the user's email */
  @IsString()
  @Length(6, 6)
  otp!: string;

  /** New password must be at least 8 chars */
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
