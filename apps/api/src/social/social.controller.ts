import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SocialService } from './social.service.js';
import { YoutubeOAuthGuard, YoutubeCallbackGuard } from './guards/youtube-oauth.guard.js';
import { LinkedinOAuthGuard, LinkedinCallbackGuard } from './guards/linkedin-oauth.guard.js';
import { XOAuthGuard, XCallbackGuard } from './guards/x-oauth.guard.js';
import { InstagramOAuthGuard, InstagramCallbackGuard } from './guards/instagram-oauth.guard.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import type { SocialAuthProfile } from './types/social.types.js';
import { OAuthCallbackQueryDto, SocialAccountIdParamDto } from './dto/social.dto.js';
import { successResponse } from '../common/response/api-response.js';

/**
 * Controller exposing social account connection endpoints under `/api/social`.
 *
 * ### Context
 * Exclusively provides OAuth account linking for automated social media scheduling and publishing.
 * It is completely distinct from application authentication/login.
 *
 * ### Endpoints:
 * - `GET /api/social/youtube` - Initiates YouTube OAuth 2.0 authorization redirect.
 * - `GET /api/social/youtube/callback` - Handles YouTube OAuth callback and persists credentials.
 * - `GET /api/social/linkedin` - Initiates LinkedIn OAuth 2.0 authorization redirect.
 * - `GET /api/social/linkedin/callback` - Handles LinkedIn OAuth callback and persists credentials.
 * - `GET /api/social/x` - Initiates X (Twitter) OAuth 2.0 PKCE authorization redirect.
 * - `GET /api/social/x/callback` - Handles X OAuth callback and persists credentials.
 * - `GET /api/social/instagram` - Initiates Instagram OAuth authorization redirect.
 * - `GET /api/social/instagram/callback` - Handles Instagram OAuth callback and persists credentials.
 * - `GET /api/social/accounts` - Lists connected social accounts for the authenticated user.
 * - `DELETE /api/social/accounts/:id` - Disconnects and deletes a connected social account.
 */
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ─── YOUTUBE (GOOGLE OAUTH 2.0) ───────────────────────────────────────────

  /**
   * `GET /api/social/youtube`
   * Initiates Google OAuth 2.0 authorization for YouTube publishing and channel automation.
   *
   * Requires caller to be an already authenticated Aayeshol user (enforced by `JwtAuthGuard`).
   * Generates a cryptographic state in Redis and redirects to Google's consent screen.
   */
  @UseGuards(YoutubeOAuthGuard)
  @Get('youtube')
  async initiateYoutube(): Promise<void> {
    // Handled by Passport redirect in YoutubeOAuthGuard
  }

  /**
   * `GET /api/social/youtube/callback`
   * Handles the Google authorization callback, exchanges the code for tokens,
   * validates and evicts state, encrypts tokens, and dispatches a confirmation email via Resend.
   */
  @Public()
  @UseGuards(YoutubeCallbackGuard)
  @Get('youtube/callback')
  async youtubeCallback(
    @Query() query: OAuthCallbackQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (res.headersSent || !req.user) {
      return;
    }
    const socialProfile = req.user as unknown as SocialAuthProfile;
    try {
      return await this.socialService.handleOAuthCallback(query.state, socialProfile, res, req);
    } catch (error) {
      this.socialService.handleCallbackError('youtube', error, res);
    }
  }

  // ─── LINKEDIN (OAUTH 2.0) ─────────────────────────────────────────────────

  /**
   * `GET /api/social/linkedin`
   * Initiates LinkedIn OAuth 2.0 authorization for post creation and profile integration.
   */
  @UseGuards(LinkedinOAuthGuard)
  @Get('linkedin')
  async initiateLinkedin(): Promise<void> {
    // Handled by Passport redirect in LinkedinOAuthGuard
  }

  /**
   * `GET /api/social/linkedin/callback`
   * Handles LinkedIn callback, validates state, encrypts tokens, and links to initiating user.
   */
  @Public()
  @UseGuards(LinkedinCallbackGuard)
  @Get('linkedin/callback')
  async linkedinCallback(
    @Query() query: OAuthCallbackQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (res.headersSent || !req.user) {
      return;
    }
    const socialProfile = req.user as unknown as SocialAuthProfile;
    try {
      return await this.socialService.handleOAuthCallback(query.state, socialProfile, res, req);
    } catch (error) {
      this.socialService.handleCallbackError('linkedin', error, res);
    }
  }

  // ─── X / TWITTER (OAUTH 2.0 PKCE) ──────────────────────────────────────────

  /**
   * `GET /api/social/x`
   * Initiates Twitter API v2 OAuth 2.0 authorization with PKCE for automated tweets.
   */
  @UseGuards(XOAuthGuard)
  @Get('x')
  async initiateX(): Promise<void> {
    // Handled by Passport redirect in XOAuthGuard
  }

  /**
   * `GET /api/social/x/callback`
   * Handles X (Twitter) OAuth 2.0 PKCE callback.
   */
  @Public()
  @UseGuards(XCallbackGuard)
  @Get('x/callback')
  async xCallback(
    @Query() query: OAuthCallbackQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (res.headersSent || !req.user) {
      return;
    }
    const socialProfile = req.user as unknown as SocialAuthProfile;
    try {
      return await this.socialService.handleOAuthCallback(query.state, socialProfile, res, req);
    } catch (error) {
      this.socialService.handleCallbackError('x', error, res);
    }
  }

  // ─── INSTAGRAM (GRAPH API) ────────────────────────────────────────────────

  /**
   * `GET /api/social/instagram`
   * Initiates Instagram authorization for media posting and account publishing.
   */
  @UseGuards(InstagramOAuthGuard)
  @Get('instagram')
  async initiateInstagram(): Promise<void> {
    // Handled by Passport redirect in InstagramOAuthGuard
  }

  /**
   * `GET /api/social/instagram/callback`
   * Handles Instagram callback.
   */
  @Public()
  @UseGuards(InstagramCallbackGuard)
  @Get('instagram/callback')
  async instagramCallback(
    @Query() query: OAuthCallbackQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (res.headersSent || !req.user) {
      return;
    }
    const socialProfile = req.user as unknown as SocialAuthProfile;
    try {
      return await this.socialService.handleOAuthCallback(query.state, socialProfile, res, req);
    } catch (error) {
      this.socialService.handleCallbackError('instagram', error, res);
    }
  }

  // ─── CONNECTED ACCOUNTS MANAGEMENT ────────────────────────────────────────

  /**
   * `GET /api/social/accounts`
   * Retrieves all social accounts connected by the authenticated user.
   */
  @Get('accounts')
  @HttpCode(HttpStatus.OK)
  async getAccounts(@CurrentUser() user: AuthenticatedUser) {
    const accounts = await this.socialService.getConnectedAccounts(user.userId);
    return successResponse('Connected accounts retrieved successfully', accounts);
  }

  /**
   * `DELETE /api/social/accounts/:id`
   * Disconnects and deletes a connected social account.
   */
  @Delete('accounts/:id')
  @HttpCode(HttpStatus.OK)
  async disconnectAccount(
    @Param() params: SocialAccountIdParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.socialService.disconnectAccount(user.userId, params.id);
    return successResponse('Social account disconnected successfully', null);
  }
}
