import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { EMAIL_REGEX } from '../utils/regex.util.js';

export class LoginDto {
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
  @MinLength(1, { message: 'Password cannot be empty.' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters.' })
  password!: string;
}
