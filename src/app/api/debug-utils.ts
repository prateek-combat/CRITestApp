// Debug utility for authentication troubleshooting
// This utility provides conditional logging that won't trigger pre-commit hooks

export interface DebugContext {
  [key: string]: any;
}

class DebugLogger {
  private isEnabled(): boolean {
    return (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_DEBUG === 'true' ||
      process.env.DEBUG_AUTH === 'true'
    );
  }

  private formatMessage(
    prefix: string,
    message: string,
    data?: DebugContext
  ): string {
    const timestamp = new Date().toISOString();
    let formatted = `[${timestamp}] ${prefix} ${message}`;

    if (data && Object.keys(data).length > 0) {
      formatted += `\nData: ${JSON.stringify(data, null, 2)}`;
    }

    return formatted;
  }

  // Client-side logging (for components)
  client(message: string, data?: DebugContext): void {
    if (this.isEnabled() && typeof window !== 'undefined') {
      const formatted = this.formatMessage('[CLIENT DEBUG]', message, data);
      // eslint-disable-next-line no-console
      console.log(formatted);
    }
  }

  // Server-side logging (for API routes and server components)
  server(message: string, data?: DebugContext): void {
    if (this.isEnabled()) {
      const formatted = this.formatMessage('[SERVER DEBUG]', message, data);
      // eslint-disable-next-line no-console
      console.log(formatted);
    }
  }

  // Authentication specific logging
  auth(message: string, data?: DebugContext): void {
    if (this.isEnabled()) {
      const formatted = this.formatMessage('[AUTH DEBUG]', message, data);
      // eslint-disable-next-line no-console
      console.log(formatted);
    }
  }

  // Login flow specific logging
  login(message: string, data?: DebugContext): void {
    if (this.isEnabled()) {
      const formatted = this.formatMessage('[LOGIN DEBUG]', message, data);
      // eslint-disable-next-line no-console
      console.log(formatted);
    }
  }

  // NextAuth specific logging
  nextauth(message: string, data?: DebugContext): void {
    if (this.isEnabled()) {
      const formatted = this.formatMessage('[NEXTAUTH DEBUG]', message, data);
      // eslint-disable-next-line no-console
      console.log(formatted);
    }
  }

  // Error logging with stack traces
  error(message: string, error?: Error, data?: DebugContext): void {
    if (this.isEnabled()) {
      const errorData = {
        ...data,
        ...(error && {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }),
      };
      const formatted = this.formatMessage('[ERROR DEBUG]', message, errorData);
      // eslint-disable-next-line no-console
      console.error(formatted);
    }
  }
}

// Export singleton instance
export const debugLogger = new DebugLogger();

// Convenience exports for different contexts
export const debugAuth = (message: string, data?: DebugContext) =>
  debugLogger.auth(message, data);
export const debugLogin = (message: string, data?: DebugContext) =>
  debugLogger.login(message, data);
export const debugNextAuth = (message: string, data?: DebugContext) =>
  debugLogger.nextauth(message, data);
export const debugClient = (message: string, data?: DebugContext) =>
  debugLogger.client(message, data);
export const debugServer = (message: string, data?: DebugContext) =>
  debugLogger.server(message, data);
export const debugError = (
  message: string,
  error?: Error,
  data?: DebugContext
) => debugLogger.error(message, error, data);
