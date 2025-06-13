# Logging System Documentation

## Overview

This application uses a comprehensive, structured logging system that provides consistent logging across all modules. The system supports multiple log levels, structured context, and environment-specific configurations.

## Features

- ✅ **Multiple Log Levels**: debug, info, warn, error
- ✅ **Structured Logging**: Consistent JSON or pretty-printed format
- ✅ **Context Support**: Rich metadata for every log entry
- ✅ **Environment Aware**: Different behavior for dev/test/prod
- ✅ **Module-Specific Loggers**: Pre-configured loggers for different app modules
- ✅ **Child Loggers**: Inherit context from parent loggers
- ✅ **Performance Monitoring**: Built-in performance logging
- ✅ **API Request Tracking**: Automatic request/response logging
- ✅ **Error Context**: Rich error information with stack traces

## Quick Start

### Basic Usage

```typescript
import { logger } from '@/lib/logger';

// Simple logging
logger.info('User logged in successfully');
logger.warn('High memory usage detected');
logger.error('Database connection failed');

// Logging with context
logger.info('User action completed', {
  userId: 'user123',
  action: 'profile_update',
  duration: 150,
});

// Error logging with error object
try {
  // Some operation
} catch (error) {
  logger.error('Operation failed', {
    operation: 'data_processing',
    userId: 'user123',
  }, error as Error);
}
```

### Module-Specific Loggers

```typescript
import { apiLogger, authLogger, dbLogger, emailLogger, proctorLogger, testLogger } from '@/lib/logger';

// API operations
apiLogger.apiRequest('POST', '/api/users', { userId: 'admin123' });
apiLogger.apiResponse('POST', '/api/users', 201, 150);

// Authentication events
authLogger.auth('login_success', 'user123', { method: 'email_password' });
authLogger.security('suspicious_activity', { event: 'multiple_failed_logins' });

// Database operations
dbLogger.dbQuery('SELECT * FROM users', 45, { userId: 'admin123' });

// Email operations
emailLogger.info('Test completion email sent', {
  recipientEmail: 'user@example.com',
  testId: 'test_123',
});

// Proctor operations
proctorLogger.warn('Suspicious activity detected', {
  attemptId: 'attempt_123',
  type: 'face_detection_lost',
});

// Test operations
testLogger.info('Test attempt started', {
  testId: 'test_123',
  userId: 'user123',
  questionCount: 25,
});
```

## Configuration

### Environment Variables

```bash
# Log level (debug, info, warn, error)
LOG_LEVEL=info

# Log format (json, pretty)
LOG_FORMAT=pretty

# Enable/disable console output
LOG_ENABLE_CONSOLE=true

# Enable/disable file logging (future feature)
LOG_ENABLE_FILE=false

# Enable/disable external logging service (future feature)
LOG_ENABLE_EXTERNAL=false
```

### Default Behavior by Environment

| Environment | Console | Format | Level | File | External |
|-------------|---------|--------|-------|------|----------|
| development | ✅      | pretty | info  | ❌   | ❌       |
| test        | ❌      | json   | warn  | ❌   | ❌       |
| production  | ✅      | json   | info  | ✅   | ✅       |

## API Request Logging Middleware

### Automatic Request/Response Logging

```typescript
import { withLogging } from '@/lib/logging-middleware';

async function handleGet(request: NextRequest) {
  // Your API logic here
  return NextResponse.json({ success: true });
}

// Wrap your handler with automatic logging
export const GET = withLogging(handleGet, '/api/my-endpoint');
```

This automatically logs:
- ✅ Request method, path, IP, user agent
- ✅ Response status code and duration
- ✅ Errors with full context

### Database Operation Logging

```typescript
import { withDbLogging } from '@/lib/logging-middleware';

// Wrap database operations for automatic logging
const users = await withDbLogging(
  () => prisma.user.findMany({ where: { active: true } }),
  'SELECT users WHERE active = true',
  { userId: 'admin123' }
);
```

## Child Loggers

Create loggers with persistent context:

```typescript
import { logger } from '@/lib/logger';

// Create a user-specific logger
const userLogger = logger.child({
  userId: 'user123',
  sessionId: 'session_abc',
  userRole: 'candidate',
});

// All logs will include the context
userLogger.info('Started test session'); // Includes userId, sessionId, userRole
userLogger.warn('Attempted unauthorized action'); // Includes userId, sessionId, userRole

// Create a test-specific logger
const testLogger = logger.child({
  testId: 'test_123',
  attemptId: 'attempt_456',
});

testLogger.info('Question answered', { questionId: 'q_1', correct: true });
```

## Log Levels

### Debug
- **When to use**: Detailed debugging information
- **Environment**: Only shown in development
- **Examples**: Variable values, execution flow, detailed state

```typescript
logger.debug('Processing user data', {
  userId: 'user123',
  step: 'validation',
  inputData: { email: 'user@example.com' },
});
```

### Info
- **When to use**: General application flow, successful operations
- **Environment**: Shown in all environments
- **Examples**: User actions, successful API calls, system events

```typescript
logger.info('User logged in successfully', {
  userId: 'user123',
  loginMethod: 'email_password',
});
```

### Warn
- **When to use**: Unusual conditions that don't prevent operation
- **Environment**: Shown in all environments
- **Examples**: Performance issues, deprecated usage, recoverable errors

```typescript
logger.warn('API response slow', {
  endpoint: '/api/users',
  duration: 2500, // milliseconds
  threshold: 1000,
});
```

### Error
- **When to use**: Error conditions that prevent normal operation
- **Environment**: Shown in all environments
- **Examples**: Exceptions, failed operations, system failures

```typescript
logger.error('Database connection failed', {
  database: 'postgresql',
  host: 'localhost',
  port: 5432,
}, error);
```

## Convenience Methods

### Performance Logging

```typescript
const startTime = Date.now();
// ... some operation
const duration = Date.now() - startTime;

logger.performance('user_data_processing', duration, {
  userId: 'user123',
  recordCount: 1000,
});
// Uses 'info' level if < 1000ms, 'warn' level if >= 1000ms
```

### API Operations

```typescript
// Request logging
apiLogger.apiRequest('POST', '/api/tests', {
  userId: 'admin123',
  testType: 'cognitive',
});

// Response logging
apiLogger.apiResponse('POST', '/api/tests', 201, 150);

// Error logging
apiLogger.apiError('POST', '/api/tests', error, {
  userId: 'admin123',
  requestId: 'req_123',
});
```

### Database Operations

```typescript
// Query logging
dbLogger.dbQuery('INSERT INTO test_attempts', 45, {
  userId: 'user123',
  testId: 'test_456',
});

// Error logging
dbLogger.dbError('INSERT INTO test_attempts', error, {
  userId: 'user123',
  testId: 'test_456',
});
```

### Authentication & Security

```typescript
// Authentication events
authLogger.auth('login_success', 'user123', {
  method: 'google_oauth',
  ip: '192.168.1.1',
});

// Security events
authLogger.security('suspicious_activity', {
  event: 'multiple_failed_logins',
  ip: '192.168.1.1',
  attempts: 5,
  timeWindow: '5 minutes',
});
```

## Log Format Examples

### Development (Pretty Format)

```
[2024-01-15T10:30:45.123Z] INFO: User logged in successfully
  Context: {
    "userId": "user123",
    "method": "email_password",
    "ip": "192.168.1.1"
  }
```

### Production (JSON Format)

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "service": "test-app",
  "message": "User logged in successfully",
  "context": {
    "userId": "user123",
    "method": "email_password",
    "ip": "192.168.1.1"
  }
}
```

### Error Logs

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "error",
  "service": "test-app",
  "message": "Database connection failed",
  "context": {
    "database": "postgresql",
    "host": "localhost",
    "port": 5432
  },
  "error": {
    "name": "Error",
    "message": "Connection timeout",
    "stack": "Error: Connection timeout\n    at Database.connect..."
  }
}
```

## Best Practices

### 1. Use Appropriate Log Levels
```typescript
// Good
logger.debug('Validating user input', { userId, inputFields });
logger.info('User created successfully', { userId, email });
logger.warn('Password strength below recommendation', { userId });
logger.error('Failed to create user', { userId, email }, error);

// Bad
logger.error('User input validation started'); // Should be debug
logger.info('Critical system failure'); // Should be error
```

### 2. Include Relevant Context
```typescript
// Good
logger.info('Test completed', {
  testId: 'test_123',
  userId: 'user456',
  score: 85,
  duration: 1800, // seconds
  questionsAnswered: 20,
});

// Bad
logger.info('Test completed'); // No context
```

### 3. Use Module-Specific Loggers
```typescript
// Good
authLogger.auth('login_success', userId);
apiLogger.apiRequest('POST', '/api/tests');
dbLogger.dbQuery('SELECT * FROM users', duration);

// Bad
logger.info('Login successful'); // Use authLogger
logger.info('API request received'); // Use apiLogger
```

### 4. Handle Errors Properly
```typescript
// Good
try {
  await createUser(userData);
  logger.info('User created successfully', { userId: userData.id });
} catch (error) {
  logger.error('Failed to create user', {
    userData: { email: userData.email }, // Don't log sensitive data
    operation: 'user_creation',
  }, error);
  throw error;
}

// Bad
try {
  await createUser(userData);
} catch (error) {
  logger.error('Error', {}, error); // No context
  // Or worse: console.log('Error:', error);
}
```

### 5. Use Child Loggers for Context
```typescript
// Good
const requestLogger = apiLogger.child({
  requestId: 'req_123',
  userId: session.user.id,
});

requestLogger.info('Processing request');
requestLogger.info('Validation passed');
requestLogger.info('Database query completed');

// Bad
logger.info('Processing request', { requestId: 'req_123', userId });
logger.info('Validation passed', { requestId: 'req_123', userId });
logger.info('Database query completed', { requestId: 'req_123', userId });
```

## Future Extensions

The logging system is designed to be extensible:

### File Logging
```typescript
// Future implementation
const logger = new Logger({
  enableFile: true,
  logFile: '/var/log/test-app.log',
  rotateDaily: true,
});
```

### External Services
```typescript
// Future implementation - DataDog, CloudWatch, etc.
const logger = new Logger({
  enableExternal: true,
  externalService: 'datadog',
  apiKey: process.env.DATADOG_API_KEY,
});
```

### Log Aggregation
```typescript
// Future implementation - ELK stack integration
const logger = new Logger({
  enableExternal: true,
  externalService: 'elasticsearch',
  elasticsearchUrl: process.env.ELASTICSEARCH_URL,
});
```

## Troubleshooting

### Logs Not Appearing

1. Check log level: `LOG_LEVEL=debug`
2. Check console enablement: `LOG_ENABLE_CONSOLE=true`
3. Verify environment: logs are disabled by default in test environment

### Performance Impact

The logging system is designed to be performant:
- JSON formatting only in production
- Context is only stringified when actually logging
- Test environment logging is disabled by default

### Log Volume Management

- Use appropriate log levels to control volume
- Consider sampling for high-frequency events
- Use structured context for better querying/filtering

## Migration from console.log

Replace existing console statements:

```typescript
// Old
console.log('User logged in:', userId);
console.error('Database error:', error);

// New
logger.info('User logged in', { userId });
logger.error('Database error', { userId, operation: 'user_fetch' }, error);
``` 