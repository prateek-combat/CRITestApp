/**
 * Tests for environment variable validation
 * @jest-environment node
 */

import { validateEnv } from '@/lib/env-validation';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Required Variables', () => {
    describe('DATABASE_URL', () => {
      it('should throw when DATABASE_URL is missing', () => {
        delete process.env.DATABASE_URL;
        process.env.NEXTAUTH_SECRET = 'secret';
        process.env.NEXTAUTH_URL = 'http://localhost:3000';

        expect(() => validateEnv()).toThrow(
          'Missing required environment variables'
        );
        expect(() => validateEnv()).toThrow('DATABASE_URL');
      });

      it('should validate DATABASE_URL starts with postgresql://', () => {
        process.env.DATABASE_URL = 'mysql://localhost:3306/db';
        process.env.NEXTAUTH_SECRET = 'secret';
        process.env.NEXTAUTH_URL = 'http://localhost:3000';

        expect(() => validateEnv()).toThrow(
          'DATABASE_URL must be a valid PostgreSQL connection string'
        );
      });

      it('should accept DATABASE_URL starting with postgres://', () => {
        process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
        process.env.NEXTAUTH_SECRET = 'secret';
        process.env.NEXTAUTH_URL = 'http://localhost:3000';

        expect(() => validateEnv()).not.toThrow();
      });

      it('should accept DATABASE_URL starting with postgresql://', () => {
        process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
        process.env.NEXTAUTH_SECRET = 'secret';
        process.env.NEXTAUTH_URL = 'http://localhost:3000';

        expect(() => validateEnv()).not.toThrow();
      });
    });

    describe('NEXTAUTH_SECRET', () => {
      it('should throw when NEXTAUTH_SECRET is missing', () => {
        process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
        delete process.env.NEXTAUTH_SECRET;
        process.env.NEXTAUTH_URL = 'http://localhost:3000';

        expect(() => validateEnv()).toThrow(
          'Missing required environment variables'
        );
        expect(() => validateEnv()).toThrow('NEXTAUTH_SECRET');
      });
    });

    describe('NEXTAUTH_URL', () => {
      it('should throw when NEXTAUTH_URL is missing', () => {
        process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
        process.env.NEXTAUTH_SECRET = 'secret';
        delete process.env.NEXTAUTH_URL;

        expect(() => validateEnv()).toThrow(
          'Missing required environment variables'
        );
        expect(() => validateEnv()).toThrow('NEXTAUTH_URL');
      });

      it('should validate NEXTAUTH_URL is a valid URL', () => {
        process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
        process.env.NEXTAUTH_SECRET = 'secret';
        process.env.NEXTAUTH_URL = 'not-a-valid-url';

        expect(() => validateEnv()).toThrow('NEXTAUTH_URL must be a valid URL');
      });

      it('should accept valid HTTP URLs', () => {
        process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
        process.env.NEXTAUTH_SECRET = 'secret';
        process.env.NEXTAUTH_URL = 'http://localhost:3000';

        expect(() => validateEnv()).not.toThrow();
      });

      it('should accept valid HTTPS URLs', () => {
        process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
        process.env.NEXTAUTH_SECRET = 'secret';
        process.env.NEXTAUTH_URL = 'https://example.com';

        expect(() => validateEnv()).not.toThrow();
      });
    });

    describe('Multiple missing variables', () => {
      it('should list all missing required variables', () => {
        delete process.env.DATABASE_URL;
        delete process.env.NEXTAUTH_SECRET;
        delete process.env.NEXTAUTH_URL;

        expect(() => validateEnv()).toThrow('DATABASE_URL');
        expect(() => validateEnv()).toThrow('NEXTAUTH_SECRET');
        expect(() => validateEnv()).toThrow('NEXTAUTH_URL');
      });
    });
  });

  describe('SMTP Configuration', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
      process.env.NEXTAUTH_SECRET = 'secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
    });

    it('should not warn when no SMTP variables are set', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      validateEnv();

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('SMTP')
      );

      consoleSpy.mockRestore();
    });

    it('should warn when partial SMTP config is detected', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      process.env.SMTP_HOST = 'smtp.example.com';
      // Missing SMTP_PORT, SMTP_USER, SMTP_PASS

      validateEnv();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Partial SMTP configuration')
      );

      consoleSpy.mockRestore();
    });

    it('should list missing SMTP variables in warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      // Missing SMTP_USER, SMTP_PASS

      validateEnv();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SMTP_USER')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SMTP_PASS')
      );

      consoleSpy.mockRestore();
    });

    it('should not warn when all SMTP variables are set', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';

      validateEnv();

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('SMTP')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Worker API Configuration', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
      process.env.NEXTAUTH_SECRET = 'secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
    });

    it('should not warn when no worker variables are set', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      validateEnv();

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('worker')
      );

      consoleSpy.mockRestore();
    });

    it('should warn about partial worker config in test environment', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      process.env.WORKER_API_URL = 'http://worker.example.com';
      // Missing WORKER_API_TOKEN

      validateEnv();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Partial worker API configuration')
      );

      consoleSpy.mockRestore();
    });

    it('should throw in production when partial worker config detected', () => {
      process.env.NODE_ENV = 'production';
      process.env.WORKER_API_URL = 'http://worker.example.com';
      // Missing WORKER_API_TOKEN

      expect(() => validateEnv()).toThrow('WORKER_API_TOKEN');
    });

    it('should not warn when all worker variables are set', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      process.env.WORKER_API_URL = 'http://worker.example.com';
      process.env.WORKER_API_TOKEN = 'token123';

      validateEnv();

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('worker')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Return Value', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.NEXTAUTH_SECRET = 'secret123';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
    });

    it('should return required variables', () => {
      const result = validateEnv();

      expect(result.DATABASE_URL).toBe(
        'postgresql://user:pass@localhost:5432/db'
      );
      expect(result.NEXTAUTH_SECRET).toBe('secret123');
      expect(result.NEXTAUTH_URL).toBe('http://localhost:3000');
    });

    it('should return optional SMTP variables when set', () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      process.env.SMTP_FROM = 'noreply@example.com';

      const result = validateEnv();

      expect(result.SMTP_HOST).toBe('smtp.example.com');
      expect(result.SMTP_PORT).toBe('587');
      expect(result.SMTP_USER).toBe('user');
      expect(result.SMTP_PASS).toBe('pass');
      expect(result.SMTP_FROM).toBe('noreply@example.com');
    });

    it('should return undefined for optional variables when not set', () => {
      const result = validateEnv();

      expect(result.SMTP_HOST).toBeUndefined();
      expect(result.GOOGLE_VISION_API_KEY).toBeUndefined();
      expect(result.WORKER_API_URL).toBeUndefined();
    });

    it('should return other optional variables', () => {
      process.env.GOOGLE_VISION_API_KEY = 'vision-key';
      process.env.CUSTOM_AI_SERVICE_URL = 'http://ai.example.com';
      process.env.CUSTOM_AI_API_KEY = 'ai-key';
      process.env.MAINTENANCE_MODE = 'true';

      const result = validateEnv();

      expect(result.GOOGLE_VISION_API_KEY).toBe('vision-key');
      expect(result.CUSTOM_AI_SERVICE_URL).toBe('http://ai.example.com');
      expect(result.CUSTOM_AI_API_KEY).toBe('ai-key');
      expect(result.MAINTENANCE_MODE).toBe('true');
    });
  });
});
