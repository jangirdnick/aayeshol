import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const mockConfigService = {
      getOrThrow: vi.fn((key: string) => {
        if (key === 'DATABASE_URL') return 'postgresql://postgres:postgres@localhost:5432/test_db';
        throw new Error(`Configuration key "${key}" does not exist`);
      }),
      get: vi.fn((key: string, defaultValue?: string) => {
        if (key === 'NODE_ENV') return 'test';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
