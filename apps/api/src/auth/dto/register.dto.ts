import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EMAIL_REGEX, STRONG_PASSWORD_REGEX } from '../utils/regex.util.js';

export class RegisterDto {
  @IsNotEmpty({ message: 'First name is required.' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @Matches(EMAIL_REGEX, {
    message: 'Email address must be a valid format (e.g. user@example.com).',
  })
  @MaxLength(255, { message: 'Email address must not exceed 255 characters.' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email!: string;

  @IsNotEmpty({ message: 'Password is required.' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters.' })
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
        'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
    },
  )
  @Matches(STRONG_PASSWORD_REGEX, {
    message:
      'Password must be 8-128 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
  })
  password!: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatar?: string;
}
