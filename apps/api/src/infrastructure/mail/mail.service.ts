import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { RequestContext } from '../../auth/types/auth.types.js';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not defined. Email service will not work properly.');
    }
    this.resend = new Resend(apiKey || 'dummy-key');
  }

  private formatContext(ctx?: RequestContext): string {
    if (!ctx) return '';
    return ` [requestId=${ctx.requestId}, ip=${ctx.ipAddress ?? 'unknown'}, ua=${ctx.userAgent ?? 'unknown'}]`;
  }

  /**
   * Sends an HTML email via the Resend API provider.
   *
   * @param to - Recipient email address (e.g., 'user@example.com').
   * @param subject - Subject line of the email.
   * @param html - HTML body content of the email.
   * @param from - (Optional) Sender address. Defaults to `MAIL_FROM` environment variable.
   * @param ctx - (Optional) RequestContext for structured logging
   * @returns Promise resolving to the Resend API response containing the email ID.
   * @throws {InternalServerErrorException} When Resend returns an error or sending fails.
   *
   * @example
   * ```typescript
   * const result = await this.mailService.sendEmail(
   *   'user@example.com',
   *   'Welcome to Our Platform!',
   *   '<h1>Welcome!</h1><p>Thank you for registering.</p>',
   *   'noreply@yourdomain.com' // Optional
   * );
   * ```
   */
  async sendEmail(to: string, subject: string, html: string, from?: string, ctx?: RequestContext) {
    try {
      const sender =
        from || this.configService.get<string>('MAIL_FROM') || 'noreply@yourdomain.com';

      const { data, error } = await this.resend.emails.send({
        from: sender,
        to,
        subject,
        html,
      });

      if (error) {
        this.logger.error(
          `Resend API Error sending email to ${to}: ${error.message}${this.formatContext(ctx)}`,
        );
        // Throw an exception so the global error handler (Exception Filter) can catch it
        throw new InternalServerErrorException(`Failed to send email: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${(error as Error).message}${this.formatContext(ctx)}`,
        (error as Error).stack,
      );
      // If it's already an HttpException, rethrow it
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred while sending the email',
      );
    }
  }
}
