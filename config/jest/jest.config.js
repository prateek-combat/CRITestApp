const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  rootDir: '../../',
  setupFilesAfterEnv: ['<rootDir>/config/jest/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.(js|jsx|ts|tsx)',
    '**/__tests__/**/*.spec.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
  ],
  modulePathIgnorePatterns: ['<rootDir>/.next/standalone/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    // Global thresholds set to current baseline - increase as coverage improves
    global: {
      branches: 1,
      functions: 3,
      lines: 2,
      statements: 2,
    },
    // Security-critical files should maintain high coverage
    './src/lib/rate-limit.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/lib/csrf.ts': {
      branches: 50,
      functions: 90,
      lines: 75,
      statements: 75,
    },
    './src/lib/worker-auth.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/lib/validation-utils.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/lib/env-validation.ts': {
      branches: 90,
      functions: 100,
      lines: 95,
      statements: 95,
    },
  },
  setupFiles: ['<rootDir>/config/jest/jest.env.js'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
