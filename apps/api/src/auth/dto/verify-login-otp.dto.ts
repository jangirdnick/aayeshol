import { IsString, Length } from 'class-validator';

export class VerifyLoginOtpDto {
  /** The challengeId returned from POST /auth/login */
  @IsString()
  challengeId!: string;

  /** 6-digit OTP sent via email */
  @IsString()
  @Length(6, 6)
  otp!: string;
}
