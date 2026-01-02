import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test Environment
    globals: true,
    environment: 'node',

    // Coverage Configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'tests/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/**',
        'src/cli/index.ts', // CLI entry point - tested via E2E
        'src/scripts/**', // Legacy research scripts
      ],
      // Aim for 100% coverage
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Test Files
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],

    // Test Timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporters
    reporters: ['verbose'],
  },
});
