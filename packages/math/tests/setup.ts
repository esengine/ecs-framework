/**
 * Jest测试设置文件
 * 用于配置全局测试环境
 */

// 设置测试超时
jest.setTimeout(10000);

// 全局数学常量和工具函数
(global as any).EPSILON = 1e-10;

// 浮点数比较助手函数
(global as any).expectFloatsEqual = (actual: number, expected: number, epsilon = (global as any).EPSILON) => {
  expect(Math.abs(actual - expected)).toBeLessThan(epsilon);
};

// 声明全局类型扩展
declare global {
  var EPSILON: number;
  var expectFloatsEqual: (actual: number, expected: number, epsilon?: number) => void;
}

export {};