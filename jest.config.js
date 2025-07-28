/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
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
      branches: 40,
      functions: 50,
      lines: 50,
      statements: 50
    },
    // 核心模块要求更高覆盖率
    './src/ECS/Core/': {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60
    },
    // ECS基础模块
    './src/ECS/': {
      branches: 45,
      functions: 55,
      lines: 55,
      statements: 55
    }
  },
  verbose: true,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // 测试超时设置
  testTimeout: 10000,
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