import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { STRONG_PASSWORD_REGEX } from '../utils/regex.util.js';

export class ResetPasswordDto {
  /** challengeId returned from POST /auth/forgot-password */
  @IsNotEmpty({ message: 'Challenge ID is required.' })
  @IsUUID(4, { message: 'Challenge ID must be a valid UUID format.' })
  @IsString()
  challengeId!: string;

  /** 6-digit OTP sent to the user's email */
  @IsNotEmpty({ message: 'OTP is required.' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits.' })
  otp!: string;

  /** New password must be at least 8 chars with strong password complexity */
  @IsNotEmpty({ message: 'New password is required.' })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long.' })
  @MaxLength(128, { message: 'New password must not exceed 128 characters.' })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'New password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
    },
  )
  @Matches(STRONG_PASSWORD_REGEX, {
    message:
      'New password must be 8-128 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
  })
  newPassword!: string;
}
