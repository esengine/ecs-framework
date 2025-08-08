/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '\\.performance\\.test\\.ts$'],
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
    }
  },
  verbose: true,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: false,
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@esengine/ecs-framework$': '<rootDir>/../core/src/index.ts',
    '^@esengine/ecs-framework/(.*)$': '<rootDir>/../core/src/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
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