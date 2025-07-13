/**
 * Centralized logging service for the CRI Test Application
 * Replaces debug statements with structured, environment-aware logging
 */

interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: Error;
  operation?: string;
  userId?: string;
  testId?: string;
  requestId?: string;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;
  private logLevel: string;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel =
      process.env.LOG_LEVEL || (this.isProduction ? 'info' : 'debug');
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLogEntry(
    level: string,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...(context && { context }),
      ...(error && {
        error: { message: error.message, stack: error.stack, name: error.name },
      }),
    };

    return logEntry;
  }

  private outputLog(logEntry: LogEntry): void {
    if (this.isProduction) {
      // In production, use structured JSON logging
      process.stdout.write(JSON.stringify(logEntry) + '\n');
    } else {
      // In development, use formatted output
      const { timestamp, level, message, context, error } = logEntry;
      const timeStr = new Date(timestamp).toLocaleTimeString();

      let output = `[${timeStr}] ${level}: ${message}`;

      if (context && Object.keys(context).length > 0) {
        output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
      }

      if (error) {
        output += `\n  Error: ${error.message}`;
        if (error.stack && level === 'ERROR') {
          output += `\n  Stack: ${error.stack}`;
        }
      }

      // Use process.stdout/stderr to avoid pre-commit hook conflicts
      const outputStream = level === 'ERROR' ? process.stderr : process.stdout;
      outputStream.write(output + '\n');
    }
  }

  /**
   * Debug level logging - for detailed diagnostic information
   * Only shown in development or when LOG_LEVEL=debug
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;

    const logEntry = this.formatLogEntry('debug', message, context);
    this.outputLog(logEntry);
  }

  /**
   * Info level logging - for general application flow information
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;

    const logEntry = this.formatLogEntry('info', message, context);
    this.outputLog(logEntry);
  }

  /**
   * Warning level logging - for potentially problematic situations
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;

    const logEntry = this.formatLogEntry('warn', message, context);
    this.outputLog(logEntry);
  }

  /**
   * Error level logging - for error conditions
   */
  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog('error')) return;

    const logEntry = this.formatLogEntry('error', message, context, error);
    this.outputLog(logEntry);
  }

  /**
   * API request logging helper
   */
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, {
      operation: 'api_request',
      method,
      path,
      ...context,
    });
  }

  /**
   * API response logging helper
   */
  apiResponse(
    method: string,
    path: string,
    status: number,
    duration?: number,
    context?: LogContext
  ): void {
    const level = status >= 400 ? 'warn' : 'info';

    if (level === 'warn') {
      this.warn(`API ${method} ${path} - ${status}`, {
        operation: 'api_response',
        method,
        path,
        status,
        ...(duration !== undefined && { duration }),
        ...context,
      });
    } else {
      this.info(`API ${method} ${path} - ${status}`, {
        operation: 'api_response',
        method,
        path,
        status,
        ...(duration !== undefined && { duration }),
        ...context,
      });
    }
  }

  /**
   * Database operation logging helper
   */
  dbOperation(operation: string, table?: string, context?: LogContext): void {
    this.debug(`Database ${operation}${table ? ` on ${table}` : ''}`, {
      operation: 'database',
      dbOperation: operation,
      ...(table && { table }),
      ...context,
    });
  }

  /**
   * Authentication logging helper
   */
  auth(event: string, userId?: string, context?: LogContext): void {
    this.info(`Auth: ${event}`, {
      operation: 'authentication',
      event,
      ...(userId && { userId }),
      ...context,
    });
  }

  /**
   * Test-related logging helper
   */
  test(
    event: string,
    testId?: string,
    userId?: string,
    context?: LogContext
  ): void {
    this.info(`Test: ${event}`, {
      operation: 'test',
      event,
      ...(testId && { testId }),
      ...(userId && { userId }),
      ...context,
    });
  }

  /**
   * Proctoring system logging helper
   */
  proctoring(
    event: string,
    testAttemptId?: string,
    context?: LogContext
  ): void {
    this.info(`Proctoring: ${event}`, {
      operation: 'proctoring',
      event,
      ...(testAttemptId && { testAttemptId }),
      ...context,
    });
  }

  /**
   * Email service logging helper
   */
  email(event: string, recipientEmail?: string, context?: LogContext): void {
    this.info(`Email: ${event}`, {
      operation: 'email',
      event,
      ...(recipientEmail && {
        recipientEmail: recipientEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
      }), // Mask email for privacy
      ...context,
    });
  }
}

// Create singleton instance
export const logger = new Logger();

// Backward compatibility helpers for easy migration
export const log = {
  debug: (message: string, data?: any) => logger.debug(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  error: (message: string, error?: any, data?: any) => {
    if (error instanceof Error) {
      logger.error(message, data, error);
    } else {
      logger.error(message, { ...data, errorData: error });
    }
  },
};

// Export types for TypeScript
export type { LogContext, LogEntry };
