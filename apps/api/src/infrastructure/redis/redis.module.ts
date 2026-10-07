import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisModule as NestIORedisModule } from '@nestjs-modules/ioredis';
import { RedisService } from './redis.service.js';

@Global()
@Module({
  imports: [
    NestIORedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST') || 'localhost';
        const port = configService.get<number>('REDIS_PORT') || 6379;
        const password = configService.get<string>('REDIS_PASSWORD');

        return {
          type: 'single',
          options: {
            host,
            port: Number(port),
            password: password || undefined,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [NestIORedisModule, RedisService],
})
export class RedisModule {}
