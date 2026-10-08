import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { MailModule } from '@/infrastructure/mail/mail.module.js';

/**
 * AuthModule registers the authentication feature.
 *
 * - JwtModule is registered without a default secret; each sign/verify call
 *   explicitly passes the secret from ConfigService to support multiple JWT
 *   secrets (access vs refresh) cleanly.
 * - JwtAuthGuard is applied globally via APP_GUARD so every route requires
 *   authentication by default. Use \@Public() on routes that should be open.
 *
 * Global dependencies (PrismaModule, RedisModule, MailModule, ConfigModule)
 * are already registered globally in AppModule.
 */
@Module({
  imports: [
    MailModule,
    JwtModule.register({}), // No global secret — each call passes its own secret
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
