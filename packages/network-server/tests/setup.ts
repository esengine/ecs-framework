/**
 * Jest测试环境设置 - 服务端
 */

// 导入reflect-metadata以支持装饰器
import 'reflect-metadata';

// 全局测试配置
beforeAll(() => {
  // 设置测试环境
  process.env.NODE_ENV = 'test';
  process.env.NETWORK_ENV = 'server';
});

afterAll(() => {
  // 清理测试环境
});

beforeEach(() => {
  // 每个测试前的准备工作
});

afterEach(() => {
  // 每个测试后的清理工作
  // 清理可能的网络连接、定时器等
});