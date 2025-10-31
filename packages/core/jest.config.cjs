/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '\\.performance\\.test\\.ts$', '/tests/performance/'],
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/**/index.ts',
    '!**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // 设置覆盖度阈值
  coverageThreshold: {
    global: {
      branches: 6,
      functions: 17,
      lines: 16,
      statements: 15
    },
    // 核心模块要求更高覆盖率
    './src/ECS/Core/': {
      branches: 8,
      functions: 20,
      lines: 18,
      statements: 18
    },
    // ECS基础模块
    './src/ECS/': {
      branches: 7,
      functions: 18,
      lines: 17,
      statements: 16
    }
  },
  verbose: true,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      useESM: false,
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 0,
  // 清除模块缓存
  clearMocks: true,
  restoreMocks: true,
  // 忽略某些模块
  modulePathIgnorePatterns: [
    '<rootDir>/bin/',
    '<rootDir>/dist/',
    '<rootDir>/node_modules/'
  ]
}; 