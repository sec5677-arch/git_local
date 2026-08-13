import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/server/(.*)$': '<rootDir>/src/server/$1',
    '^@/client/(.*)$': '<rootDir>/src/client/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
  ],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: [
        '**/__tests__/components/**/*.test.[jt]sx',
        '**/__tests__/hooks/**/*.test.[jt]s',
      ],
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: [
        '**/__tests__/api/**/*.test.[jt]s',
        '**/__tests__/services/**/*.test.[jt]s',
      ],
    },
  ],
}

export default createJestConfig(config)
