/**
 * Jest测试设置文件
 */

import 'reflect-metadata';

// 全局Jest配置
expect.extend({});

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

// 设置全局测试超时
jest.setTimeout(10000);

// 清理函数
afterEach(() => {
  // 清理所有定时器
  jest.clearAllTimers();
  
  // 清理所有模拟
  jest.clearAllMocks();
});