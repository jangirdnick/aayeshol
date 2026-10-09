import { IsEmail, IsNotEmpty, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { EMAIL_REGEX } from '../utils/regex.util.js';

export class ForgotPasswordDto {
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
}
