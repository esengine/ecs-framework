/**
 * Jest 测试全局设置文件
 *
 * 此文件在每个测试文件执行前运行，用于设置全局测试环境
 */

// 设置测试超时时间（毫秒）
jest.setTimeout(10000);

// 模拟控制台方法以减少测试输出噪音
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// 在测试环境中可以选择性地静默某些日志
beforeAll(() => {
  // 可以在这里设置全局的模拟或配置
});

afterAll(() => {
  // 清理全局资源
});

// 每个测试前的清理
beforeEach(() => {
  // 清理定时器
  jest.clearAllTimers();
});

afterEach(() => {
  // 恢复所有模拟
  jest.restoreAllMocks();
});

// 导出测试工具函数
export const TestUtils = {
  /**
   * 创建测试用的延迟
   * @param ms 延迟毫秒数
   */
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * 等待条件满足
   * @param condition 条件函数
   * @param timeout 超时时间（毫秒）
   * @param interval 检查间隔（毫秒）
   */
  waitFor: async (
    condition: () => boolean,
    timeout: number = 5000,
    interval: number = 10
  ): Promise<void> => {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await TestUtils.delay(interval);
    }
    if (!condition()) {
      throw new Error(`等待条件超时 (${timeout}ms)`);
    }
  },

  /**
   * 模拟时间前进
   * @param ms 前进的毫秒数
   */
  advanceTime: (ms: number): void => {
    jest.advanceTimersByTime(ms);
  }
}; 