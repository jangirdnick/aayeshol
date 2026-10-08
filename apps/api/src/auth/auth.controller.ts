import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { Public } from './decorators/public.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { REFRESH_TOKEN_COOKIE } from './utils/token.util.js';
import type { AuthenticatedUser } from './types/auth.types.js';

/**
 * Auth controller exposing authentication endpoints under /api/auth.
 * Public routes use the \@Public() decorator to bypass JWT guard.
 * Protected routes require a valid Bearer access token.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── PUBLIC ROUTES ────────────────────────────────────────────────────────

  /**
   * POST /api/auth/register
   * Registers a new user and initiates email verification.
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/auth/verify-email
   * Verifies the user's email using the OTP sent after registration.
   */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  /**
   * POST /api/auth/resend-verification
   * Resends the email verification OTP.
   */
  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  /**
   * POST /api/auth/login
   * Step 1: Validates credentials and sends a login OTP.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /api/auth/verify-otp
   * Step 2: Verifies the login OTP and issues access + refresh tokens.
   */
  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyLoginOtp(
    @Body() dto: VerifyLoginOtpDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.verifyLoginOtp(dto, res, ipAddress, userAgent);
  }

  /**
   * POST /api/auth/forgot-password
   * Initiates password reset by sending an OTP to the user's email.
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /**
   * POST /api/auth/reset-password
   * Verifies the reset OTP and updates the user's password.
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /**
   * POST /api/auth/refresh
   * Rotates the refresh token and returns a new access token.
   * Reads the refresh token from the httpOnly cookie.
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    return this.authService.refreshTokens(refreshToken, res);
  }

  // ─── PROTECTED ROUTES ─────────────────────────────────────────────────────

  /**
   * POST /api/auth/logout
   * Revokes the refresh token and clears the session cookie.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    return this.authService.logout(user, refreshToken, res);
  }

  /**
   * GET /api/auth/me
   * Returns the authenticated user's profile.
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user);
  }
}
