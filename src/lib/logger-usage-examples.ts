/**
 * Examples of how to use the logging library across different parts of the application
 */

import {
  logger,
  apiLogger,
  authLogger,
  dbLogger,
  proctorLogger,
  emailLogger,
  testLogger,
} from './logger';

// 1. Basic logging examples
export function basicLoggingExamples() {
  // Simple info log
  logger.info('Application started successfully');

  // Warning with context
  logger.warn('High memory usage detected', {
    memoryUsage: '85%',
    threshold: '80%',
  });

  // Error with error object
  try {
    throw new Error('Something went wrong');
  } catch (error) {
    logger.error(
      'Operation failed',
      {
        operation: 'data_processing',
        userId: 'user123',
      },
      error as Error
    );
  }

  // Debug logs (only shown in development)
  logger.debug('Processing user data', {
    userId: 'user123',
    step: 'validation',
  });
}

// 2. API logging examples
export async function apiLoggingExamples() {
  // Manual API logging
  apiLogger.apiRequest('POST', '/api/users', {
    userId: 'admin123',
    requestSize: '2.3KB',
  });

  apiLogger.apiResponse('POST', '/api/users', 201, 150);

  // Error in API
  try {
    // Some API operation
    throw new Error('Database connection failed');
  } catch (error) {
    apiLogger.apiError('POST', '/api/users', error as Error, {
      userId: 'admin123',
      requestId: 'req_123',
    });
  }
}

// 3. Authentication logging
export function authLoggingExamples() {
  authLogger.auth('login_success', 'user123', {
    method: 'email_password',
    ip: '192.168.1.1',
  });

  authLogger.auth('login_failed', undefined, {
    email: 'user@example.com',
    reason: 'invalid_password',
    ip: '192.168.1.1',
  });

  authLogger.security('suspicious_activity', {
    event: 'multiple_failed_logins',
    ip: '192.168.1.1',
    attempts: 5,
  });
}

// 4. Database logging examples
export async function databaseLoggingExamples() {
  // Using the wrapper function
  const startTime = Date.now();

  try {
    // Simulate database operation
    await new Promise((resolve) => setTimeout(resolve, 100));

    const duration = Date.now() - startTime;
    dbLogger.dbQuery('SELECT * FROM users WHERE active = true', duration, {
      userId: 'admin123',
      resultCount: 42,
    });
  } catch (error) {
    dbLogger.dbError(
      'SELECT * FROM users WHERE active = true',
      error as Error,
      {
        userId: 'admin123',
      }
    );
  }
}

// 5. Performance logging
export function performanceLoggingExamples() {
  const startTime = Date.now();

  // Simulate some operation
  setTimeout(() => {
    const duration = Date.now() - startTime;
    logger.performance('user_data_processing', duration, {
      userId: 'user123',
      recordCount: 1000,
    });
  }, 1200); // This will trigger a warning since it's > 1000ms
}

// 6. Proctor-specific logging
export function proctorLoggingExamples() {
  proctorLogger.info('Recording session started', {
    attemptId: 'attempt_123',
    userId: 'user123',
    resolution: '640x480',
  });

  proctorLogger.warn('Suspicious activity detected', {
    attemptId: 'attempt_123',
    type: 'face_detection_lost',
    timestamp: new Date().toISOString(),
  });

  proctorLogger.error(
    'Recording upload failed',
    {
      attemptId: 'attempt_123',
      frameCount: 150,
      uploadSize: '2.3MB',
    },
    new Error('S3 upload timeout')
  );
}

// 7. Email service logging
export function emailLoggingExamples() {
  emailLogger.info('Test completion email sent', {
    recipientEmail: 'user@example.com',
    testId: 'test_123',
    emailType: 'completion_notification',
  });

  emailLogger.warn('Email delivery delayed', {
    recipientEmail: 'user@example.com',
    retryAttempt: 2,
    delay: '30s',
  });

  emailLogger.error(
    'Email sending failed',
    {
      recipientEmail: 'user@example.com',
      smtpError: 'Authentication failed',
    },
    new Error('SMTP connection timeout')
  );
}

// 8. Test-specific logging
export function testLoggingExamples() {
  testLogger.info('Test attempt started', {
    testId: 'test_123',
    userId: 'user123',
    questionCount: 25,
  });

  testLogger.info('Answer submitted', {
    testId: 'test_123',
    questionId: 'q_456',
    userId: 'user123',
    timeSpent: 45, // seconds
    isCorrect: true,
  });

  testLogger.warn('Test session timeout warning', {
    testId: 'test_123',
    userId: 'user123',
    remainingTime: '2 minutes',
  });
}

// 9. Child logger example
export function childLoggerExample() {
  // Create a logger for a specific user session
  const userSessionLogger = logger.child({
    userId: 'user123',
    sessionId: 'session_abc',
    userRole: 'candidate',
  });

  // All logs from this logger will include the context
  userSessionLogger.info('Started test session');
  userSessionLogger.info('Navigated to question 5');
  userSessionLogger.warn('Attempted to navigate backward');

  // Create a logger for a specific test
  const testSessionLogger = testLogger.child({
    testId: 'test_123',
    attemptId: 'attempt_456',
  });

  testSessionLogger.info('Test loaded successfully');
  testSessionLogger.info('Question answered', {
    questionId: 'q_1',
    correct: true,
  });
}

// 10. Environment-specific behavior
export function environmentExamples() {
  // These will behave differently based on NODE_ENV
  logger.debug('This only shows in development'); // Hidden in production
  logger.info('This shows in all environments');

  // Production logs are JSON formatted, development logs are pretty-printed
  logger.error(
    'Database connection failed',
    {
      database: 'postgresql',
      host: 'localhost',
      port: 5432,
    },
    new Error('Connection timeout')
  );
}
