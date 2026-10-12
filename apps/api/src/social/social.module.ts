import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RedisModule } from '../infrastructure/redis/redis.module.js';
import { MailModule } from '../infrastructure/mail/mail.module.js';
import { SocialController } from './social.controller.js';
import { SocialService } from './social.service.js';
import { YoutubeStrategy } from './strategies/youtube.strategy.js';
import { LinkedinStrategy } from './strategies/linkedin.strategy.js';
import { XStrategy } from './strategies/x.strategy.js';
import { InstagramStrategy } from './strategies/instagram.strategy.js';
import { YoutubeOAuthGuard, YoutubeCallbackGuard } from './guards/youtube-oauth.guard.js';
import { LinkedinOAuthGuard, LinkedinCallbackGuard } from './guards/linkedin-oauth.guard.js';
import { XOAuthGuard, XCallbackGuard } from './guards/x-oauth.guard.js';
import { InstagramOAuthGuard, InstagramCallbackGuard } from './guards/instagram-oauth.guard.js';

/**
 * SocialModule registers all OAuth providers, strategies, guards, and services
 * for connecting external social media accounts (YouTube, LinkedIn, X, Instagram)
 * used exclusively for social media publishing and automation.
 */
@Module({
  imports: [PassportModule.register({ session: false }), PrismaModule, RedisModule, MailModule],
  controllers: [SocialController],
  providers: [
    SocialService,
    YoutubeStrategy,
    LinkedinStrategy,
    XStrategy,
    InstagramStrategy,
    YoutubeOAuthGuard,
    YoutubeCallbackGuard,
    LinkedinOAuthGuard,
    LinkedinCallbackGuard,
    XOAuthGuard,
    XCallbackGuard,
    InstagramOAuthGuard,
    InstagramCallbackGuard,
  ],
  exports: [SocialService],
})
export class SocialModule {}
