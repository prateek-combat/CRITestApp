import { logger, apiLogger, dbLogger } from './logger';

/**
 * Performance Monitoring Examples
 *
 * This file demonstrates how to use the performance logging features
 * for optimization and monitoring in the CRI Test Platform.
 */

// Example 1: API Route Performance Monitoring
export async function exampleApiPerformanceMonitoring() {
  const timer = apiLogger.startTimer('api_request_processing');

  try {
    // Simulate API processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Log successful completion with timing
    timer.done('API request completed successfully', {
      endpoint: '/api/tests',
      method: 'GET',
      userId: 'user-123',
    });
  } catch (error) {
    // Log error with timing
    timer.done('API request failed', {
      endpoint: '/api/tests',
      method: 'GET',
      error: (error as Error).message,
    });
    throw error;
  }
}

// Example 2: Database Query Performance
export async function exampleDatabasePerformanceMonitoring() {
  const timer = dbLogger.startTimer('database_query');

  try {
    // Simulate database query
    await new Promise((resolve) => setTimeout(resolve, 50));

    timer.done('Database query completed', {
      query: 'SELECT * FROM tests WHERE active = true',
      resultCount: 25,
      cacheHit: false,
    });
  } catch (error) {
    timer.done('Database query failed', {
      query: 'SELECT * FROM tests WHERE active = true',
      error: (error as Error).message,
    });
    throw error;
  }
}

// Example 3: Test Processing Performance
export async function exampleTestProcessingPerformance() {
  const overallTimer = logger.startTimer('test_processing_complete');

  // Step 1: Load test data
  const loadTimer = logger.startTimer('test_data_loading');
  await new Promise((resolve) => setTimeout(resolve, 30));
  loadTimer.done('Test data loaded', {
    testId: 'test-456',
    questionsCount: 50,
  });

  // Step 2: Process answers
  const processTimer = logger.startTimer('answer_processing');
  await new Promise((resolve) => setTimeout(resolve, 80));
  processTimer.done('Answers processed', {
    testId: 'test-456',
    answersCount: 45,
    scoringType: 'mixed',
  });

  // Step 3: Calculate scores
  const scoreTimer = logger.startTimer('score_calculation');
  await new Promise((resolve) => setTimeout(resolve, 40));
  scoreTimer.done('Scores calculated', {
    testId: 'test-456',
    rawScore: 38,
    percentile: 85,
  });

  // Complete overall processing
  overallTimer.done('Test processing completed', {
    testId: 'test-456',
    candidateId: 'candidate-789',
    finalScore: 85,
  });
}

// Example 4: Email Service Performance
export async function exampleEmailPerformanceMonitoring() {
  const timer = logger.startTimer('email_sending');

  try {
    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 200));

    timer.done('Email sent successfully', {
      emailType: 'test_completion',
      recipient: 'candidate@example.com',
      templateUsed: 'enhanced_notification',
    });
  } catch (error) {
    timer.done('Email sending failed', {
      emailType: 'test_completion',
      recipient: 'candidate@example.com',
      error: (error as Error).message,
    });
    throw error;
  }
}

// Example 5: Proctor Analysis Performance
export async function exampleProctorAnalysisPerformance() {
  const timer = logger.startTimer('proctor_analysis');

  try {
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 1500));

    timer.done('Proctor analysis completed', {
      attemptId: 'attempt-123',
      framesAnalyzed: 120,
      suspiciousActivities: 2,
      confidenceScore: 0.92,
    });
  } catch (error) {
    timer.done('Proctor analysis failed', {
      attemptId: 'attempt-123',
      error: (error as Error).message,
    });
    throw error;
  }
}

// Example 6: Bulk Operations Performance
export async function exampleBulkOperationPerformance() {
  const timer = logger.startTimer('bulk_invitation_sending');

  const batchSize = 10;
  const totalInvitations = 100;
  const batches = Math.ceil(totalInvitations / batchSize);

  try {
    for (let i = 0; i < batches; i++) {
      const batchTimer = logger.startTimer('invitation_batch');

      // Simulate batch processing
      await new Promise((resolve) => setTimeout(resolve, 300));

      batchTimer.done(`Batch ${i + 1} processed`, {
        batchNumber: i + 1,
        batchSize,
        successCount: batchSize,
        failureCount: 0,
      });
    }

    timer.done('Bulk invitation sending completed', {
      totalInvitations,
      batchCount: batches,
      successRate: 100,
    });
  } catch (error) {
    timer.done('Bulk invitation sending failed', {
      totalInvitations,
      processedBatches: 0,
      error: (error as Error).message,
    });
    throw error;
  }
}

// Example 7: System Compatibility Check Performance
export async function exampleCompatibilityCheckPerformance() {
  const overallTimer = logger.startTimer('compatibility_check_complete');

  const checks = [
    { name: 'camera_access', duration: 500 },
    { name: 'microphone_access', duration: 300 },
    { name: 'browser_compatibility', duration: 100 },
    { name: 'network_speed', duration: 2000 },
  ];

  const results: Record<string, boolean> = {};

  for (const check of checks) {
    const checkTimer = logger.startTimer(`compatibility_${check.name}`);

    try {
      // Simulate compatibility check
      await new Promise((resolve) => setTimeout(resolve, check.duration));
      results[check.name] = true;

      checkTimer.done(`${check.name} check passed`, {
        checkType: check.name,
        result: 'pass',
      });
    } catch (error) {
      results[check.name] = false;

      checkTimer.done(`${check.name} check failed`, {
        checkType: check.name,
        result: 'fail',
        error: (error as Error).message,
      });
    }
  }

  const allPassed = Object.values(results).every(Boolean);

  overallTimer.done('Compatibility check completed', {
    overallResult: allPassed ? 'pass' : 'fail',
    individualResults: results,
    checksPerformed: checks.length,
  });
}

// Example 8: Performance Optimization Insights
export function logPerformanceInsights() {
  logger.info('Performance optimization insights', {
    insights: [
      'Database queries taking >100ms should be optimized',
      'API responses >500ms need caching',
      'Email sending >1s indicates SMTP issues',
      'Proctor analysis >2s may need GPU acceleration',
    ],
    recommendations: [
      'Add database indexes for frequently queried fields',
      'Implement Redis caching for test data',
      'Use email queuing for bulk operations',
      'Consider WebRTC for real-time monitoring',
    ],
    monitoring: {
      alertThresholds: {
        apiResponse: '500ms',
        databaseQuery: '100ms',
        emailSending: '1000ms',
        proctorAnalysis: '2000ms',
      },
    },
  });
}

// Example usage in a real API route or service
export async function demonstrateRealWorldUsage() {
  logger.info('Starting performance monitoring demonstration');

  try {
    await exampleApiPerformanceMonitoring();
    await exampleDatabasePerformanceMonitoring();
    await exampleTestProcessingPerformance();
    await exampleEmailPerformanceMonitoring();
    await exampleProctorAnalysisPerformance();
    await exampleBulkOperationPerformance();
    await exampleCompatibilityCheckPerformance();

    logPerformanceInsights();

    logger.info('Performance monitoring demonstration completed successfully');
  } catch (error) {
    logger.error(
      'Performance monitoring demonstration failed',
      {
        operation: 'demo_performance_monitoring',
      },
      error as Error
    );
  }
}
