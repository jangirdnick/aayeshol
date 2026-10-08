import { IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  /** challengeId returned from POST /auth/register or POST /auth/resend-verification */
  @IsString()
  challengeId!: string;

  /** 6-digit OTP sent to the user's email */
  @IsString()
  @Length(6, 6)
  otp!: string;
}
