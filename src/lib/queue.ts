import PgBoss from 'pg-boss';

// PostgreSQL connection for job queue
let boss: PgBoss | null = null;

// Initialize pg-boss instance
async function getBoss(): Promise<PgBoss> {
  if (!boss) {
    boss = new PgBoss({
      connectionString: process.env.DATABASE_URL,
      schema: 'pgboss',
      retryLimit: 3,
      retryDelay: 5000,
      expireInSeconds: 60 * 60, // 1 hour
    });

    await boss.start();

    // Ensure tables are created (pg-boss handles this automatically)
    console.log(
      '✅ pg-boss started successfully with schema auto-installation'
    );
  }
  return boss;
}

// Job data interfaces
export interface ProctorAnalysisJobData {
  assetId: string;
  attemptId: string;
  s3Url?: string; // Optional for S3-stored videos
  databaseStored?: boolean; // Flag for database-stored videos
}

// Helper function to enqueue analysis job
export async function enqueueProctorAnalysis(data: ProctorAnalysisJobData) {
  try {
    const pgBoss = await getBoss();

    const jobId = await pgBoss.send('proctor.analyse', data, {
      retryLimit: 3,
      retryDelay: 5000,
      startAfter: new Date(Date.now() + 2000), // Small delay to ensure upload is complete
    });

    console.log(
      `✅ Proctor analysis job enqueued: ${jobId} for attempt ${data.attemptId}`
    );
    return { id: jobId };
  } catch (error) {
    console.error('❌ Failed to enqueue proctor analysis job:', error);
    throw error;
  }
}

// Get queue status for monitoring
export async function getQueueStatus() {
  try {
    const pgBoss = await getBoss();

    // Get job counts by state
    const [created, active, completed, failed] = await Promise.all([
      pgBoss.getQueueSize('proctor.analyse', { state: 'created' }),
      pgBoss.getQueueSize('proctor.analyse', { state: 'active' }),
      pgBoss.getQueueSize('proctor.analyse', { state: 'completed' }),
      pgBoss.getQueueSize('proctor.analyse', { state: 'failed' }),
    ]);

    return {
      waiting: created,
      active: active,
      completed: completed,
      failed: failed,
    };
  } catch (error) {
    console.error('❌ Failed to get queue status:', error);
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    };
  }
}

// Graceful shutdown
export async function closeQueue() {
  if (boss) {
    await boss.stop();
    boss = null;
    console.log('✅ pg-boss stopped gracefully');
  }
}
