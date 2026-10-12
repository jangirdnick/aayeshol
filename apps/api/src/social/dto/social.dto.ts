import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO for validating incoming OAuth callback query parameters.
 */
export class OAuthCallbackQueryDto {
  /** OAuth state parameter returned by the authorization server */
  @IsString()
  @IsNotEmpty()
  state!: string;

  /** Authorization code issued by the provider */
  @IsOptional()
  @IsString()
  code?: string;

  /** Error code if user denied authorization or provider rejected request */
  @IsOptional()
  @IsString()
  error?: string;

  /** Human-readable error description from OAuth provider */
  @IsOptional()
  @IsString()
  error_description?: string;

  /** Twitter/X OAuth 1.0a denied parameter */
  @IsOptional()
  @IsString()
  denied?: string;
}

/**
 * Route parameter DTO for social account manipulation (e.g., delete / disconnect).
 */
export class SocialAccountIdParamDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
}
