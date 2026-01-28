/**
 * Environment Variable Validation
 * Ensures all required environment variables are set at startup
 */

export interface RequiredEnvVars {
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  GOOGLE_VISION_API_KEY?: string;
  CUSTOM_AI_SERVICE_URL?: string;
  CUSTOM_AI_API_KEY?: string;
  WORKER_API_URL?: string;
  WORKER_API_TOKEN?: string;
  MAINTENANCE_MODE?: string;
}

export function validateEnv(): RequiredEnvVars {
  const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missingVars: string[] = [];

  // Check required variables
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please check your .env file or environment configuration.'
    );
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL!;
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    throw new Error(
      'DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql:// or postgres://'
    );
  }

  // Validate NEXTAUTH_URL format
  const nextAuthUrl = process.env.NEXTAUTH_URL!;
  try {
    new URL(nextAuthUrl);
  } catch {
    throw new Error('NEXTAUTH_URL must be a valid URL');
  }

  // Validate SMTP configuration if any SMTP variable is set
  const smtpVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const hasAnySMTP = smtpVars.some((v) => process.env[v]);
  if (hasAnySMTP) {
    const missingSMTP = smtpVars.filter((v) => !process.env[v]);
    if (missingSMTP.length > 0) {
      console.warn(
        `Warning: Partial SMTP configuration detected. Missing: ${missingSMTP.join(', ')}`
      );
    }
  }

  // Validate worker API configuration if any worker variable is set
  const workerVars = ['WORKER_API_URL', 'WORKER_API_TOKEN'];
  const hasAnyWorker = workerVars.some((v) => process.env[v]);
  if (hasAnyWorker) {
    const missingWorker = workerVars.filter((v) => !process.env[v]);
    if (missingWorker.length > 0) {
      const message = `Partial worker API configuration detected. Missing: ${missingWorker.join(', ')}`;
      if (process.env.NODE_ENV === 'production') {
        throw new Error(message);
      } else {
        console.warn(`Warning: ${message}`);
      }
    }
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY,
    CUSTOM_AI_SERVICE_URL: process.env.CUSTOM_AI_SERVICE_URL,
    CUSTOM_AI_API_KEY: process.env.CUSTOM_AI_API_KEY,
    WORKER_API_URL: process.env.WORKER_API_URL,
    WORKER_API_TOKEN: process.env.WORKER_API_TOKEN,
    MAINTENANCE_MODE: process.env.MAINTENANCE_MODE,
  };
}

// Validate on module load in production
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}
