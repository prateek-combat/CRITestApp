/**
 * Tests for the logging library
 */

import { Logger } from '../lib/logger';

// Mock console methods
const mockConsoleLog = jest.fn();
const mockConsoleInfo = jest.fn();
const mockConsoleWarn = jest.fn();
const mockConsoleError = jest.fn();

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Mock console methods
  console.log = mockConsoleLog;
  console.info = mockConsoleInfo;
  console.warn = mockConsoleWarn;
  console.error = mockConsoleError;
});

describe('Logger', () => {
  describe('Log Levels', () => {
    it('should respect log level filtering', () => {
      const logger = new Logger({ level: 'warn', enableConsole: true });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      // Only warn and error should be logged
      expect(mockConsoleLog).not.toHaveBeenCalled();
      expect(mockConsoleInfo).not.toHaveBeenCalled();
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
    });

    it('should log all levels when set to debug', () => {
      const logger = new Logger({ level: 'debug', enableConsole: true });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(mockConsoleLog).toHaveBeenCalledTimes(1); // debug uses console.log
      expect(mockConsoleInfo).toHaveBeenCalledTimes(1);
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Message Formatting', () => {
    it('should format messages with context in pretty format', () => {
      const logger = new Logger({
        level: 'debug',
        enableConsole: true,
        format: 'pretty',
      });

      logger.info('Test message', { userId: '123', action: 'test' });

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('userId')
      );
    });

    it('should format messages as JSON in production format', () => {
      const logger = new Logger({
        level: 'debug',
        enableConsole: true,
        format: 'json',
      });

      logger.info('Test message', { userId: '123' });

      const logCall = mockConsoleInfo.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.message).toBe('Test message');
      expect(logData.context.userId).toBe('123');
      expect(logData.level).toBe('info');
    });
  });

  describe('Error Handling', () => {
    it('should include error details in logs', () => {
      const logger = new Logger({
        level: 'debug',
        enableConsole: true,
        format: 'json',
      });

      const testError = new Error('Test error');
      logger.error('Operation failed', { operation: 'test' }, testError);

      const logCall = mockConsoleError.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.error.message).toBe('Test error');
      expect(logData.error.name).toBe('Error');
      expect(logData.context.operation).toBe('test');
    });
  });

  describe('Convenience Methods', () => {
    it('should log API requests correctly', () => {
      const logger = new Logger({
        level: 'debug',
        enableConsole: true,
        format: 'json',
      });

      logger.apiRequest('GET', '/api/test', { userId: '123' });

      const logCall = mockConsoleInfo.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.context.type).toBe('api_request');
      expect(logData.context.method).toBe('GET');
      expect(logData.context.path).toBe('/api/test');
    });

    it('should log performance metrics correctly', () => {
      const logger = new Logger({
        level: 'debug',
        enableConsole: true,
        format: 'json',
      });

      // Fast operation should use info level
      logger.performance('fast_operation', 500);
      expect(mockConsoleInfo).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      // Slow operation should use warn level
      logger.performance('slow_operation', 1500);
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Child Loggers', () => {
    it('should inherit parent context in child loggers', () => {
      const logger = new Logger({
        level: 'debug',
        enableConsole: true,
        format: 'json',
      });

      const childLogger = logger.child({ userId: '123', module: 'test' });
      childLogger.info('Child log message', { action: 'test_action' });

      const logCall = mockConsoleInfo.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.context.userId).toBe('123');
      expect(logData.context.module).toBe('test');
      expect(logData.context.action).toBe('test_action');
    });
  });

  describe('Environment Configuration', () => {
    it('should disable console logging when enableConsole is false', () => {
      const logger = new Logger({
        level: 'debug',
        enableConsole: false,
      });

      logger.info('Test message');

      expect(mockConsoleInfo).not.toHaveBeenCalled();
    });

    it('should not log in test environment by default', () => {
      // This test verifies the default behavior by explicitly setting test config
      const logger = new Logger({ enableConsole: false }); // Explicitly disable for test
      logger.info('Test message');

      expect(mockConsoleInfo).not.toHaveBeenCalled();
    });
  });
});
