export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableExternal: boolean;
  format: 'json' | 'pretty';
  service?: string;
}

export class Logger {
  private config: LoggerConfig;
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      enableConsole: process.env.NODE_ENV !== 'test',
      enableFile: process.env.NODE_ENV === 'production',
      enableExternal: process.env.NODE_ENV === 'production',
      format: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
      service: 'test-app',
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.config.level];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.config.service,
      message,
      ...(context && { context }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    if (this.config.format === 'json') {
      return JSON.stringify(logEntry);
    }

    // Pretty format for development
    const levelColors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m', // Green
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    const color = levelColors[level];

    let formatted = `${color}[${timestamp}] ${level.toUpperCase()}${reset}: ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += `\n  Context: ${JSON.stringify(context, null, 2)}`;
    }

    if (error) {
      formatted += `\n  Error: ${error.message}`;
      if (error.stack) {
        formatted += `\n  Stack: ${error.stack}`;
      }
    }

    return formatted;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context, error);

    // Console logging
    if (this.config.enableConsole) {
      const consoleMethod = level === 'debug' ? 'log' : level;
      console[consoleMethod](formattedMessage);
    }

    // File logging (future implementation)
    if (this.config.enableFile) {
      // TODO: Implement file logging
      // This could write to a log file or send to a logging service
    }

    // External logging service (future implementation)
    if (this.config.enableExternal) {
      // TODO: Implement external logging (e.g., Winston, DataDog, etc.)
      // this.sendToExternalService(level, message, context, error);
    }
  }

  // Public logging methods
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log('warn', message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  // Convenience methods for common use cases
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, {
      type: 'api_request',
      method,
      path,
      ...context,
    });
  }

  apiResponse(
    method: string,
    path: string,
    statusCode: number,
    duration?: number
  ): void {
    this.info(`API Response: ${method} ${path} - ${statusCode}`, {
      type: 'api_response',
      method,
      path,
      statusCode,
      ...(duration && { duration: `${duration}ms` }),
    });
  }

  apiError(
    method: string,
    path: string,
    error: Error,
    context?: LogContext
  ): void {
    this.error(
      `API Error: ${method} ${path}`,
      {
        type: 'api_error',
        method,
        path,
        ...context,
      },
      error
    );
  }

  dbQuery(query: string, duration?: number, context?: LogContext): void {
    this.debug('Database Query', {
      type: 'db_query',
      query: query.length > 100 ? query.substring(0, 100) + '...' : query,
      ...(duration && { duration: `${duration}ms` }),
      ...context,
    });
  }

  dbError(query: string, error: Error, context?: LogContext): void {
    this.error(
      'Database Error',
      {
        type: 'db_error',
        query: query.length > 100 ? query.substring(0, 100) + '...' : query,
        ...context,
      },
      error
    );
  }

  auth(action: string, userId?: string, context?: LogContext): void {
    this.info(`Auth: ${action}`, {
      type: 'auth',
      action,
      ...(userId && { userId }),
      ...context,
    });
  }

  security(event: string, context?: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      type: 'security',
      event,
      ...context,
    });
  }

  performance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 1000 ? 'warn' : 'info'; // Warn if operation takes > 1 second
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      type: 'performance',
      operation,
      duration,
      ...context,
    });
  }

  // Performance timer
  startTimer(operation: string) {
    const startTime = Date.now();

    return {
      done: (message: string, context?: LogContext) => {
        const duration = Date.now() - startTime;
        this.performance(operation, duration, {
          ...context,
          message,
        });
      },
    };
  }

  // Create child logger with additional context
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.config);
    const originalLog = childLogger.log.bind(childLogger);

    childLogger.log = (
      level: LogLevel,
      message: string,
      childContext?: LogContext,
      error?: Error
    ) => {
      originalLog(level, message, { ...context, ...childContext }, error);
    };

    return childLogger;
  }
}

// Create default logger instance
export const logger = new Logger();

// Create specialized loggers for different modules
export const apiLogger = logger.child({ module: 'api' });
export const dbLogger = logger.child({ module: 'database' });
export const authLogger = logger.child({ module: 'auth' });
export const proctorLogger = logger.child({ module: 'proctor' });
export const emailLogger = logger.child({ module: 'email' });
export const testLogger = logger.child({ module: 'test' });

export default logger;
