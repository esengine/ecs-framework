/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/performance/**/*.test.ts', '**/*.performance.test.ts'],
  collectCoverage: false,
  verbose: true,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: false,
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 0,
  clearMocks: true,
  restoreMocks: true,
  modulePathIgnorePatterns: [
    '<rootDir>/bin/',
    '<rootDir>/dist/',
    '<rootDir>/node_modules/'
  ]
};