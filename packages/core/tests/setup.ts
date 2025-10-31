/**
 * Jest 测试全局设置文件
 *
 * 此文件在每个测试文件执行前运行，用于设置全局测试环境
 */

// 设置测试超时时间（毫秒）
jest.setTimeout(10000);

// 在测试环境中可以选择性地静默某些日志
beforeAll(() => {
  // 在测试开始前确保 WorldManager 使用无定时器配置
  // 这样后续的 Core.getWorldManager() 调用都会使用这个已创建的实例
  try {
    const { Core } = require('../src/Core');
    // 确保 Core 实例已创建
    if (!Core._instance) {
      Core.create();
    }
    Core.getWorldManager({
      autoCleanup: false,
      cleanupInterval: 0
    });
  } catch (error) {
    // 忽略初始化错误
  }
});

afterAll(() => {
  // 清理全局资源
  // 清理WorldManager以避免定时器阻止Jest退出
  try {
    const { Core } = require('../src/Core');
    const worldManager = Core.getWorldManager();
    if (worldManager) {
      worldManager.destroy();
    }
  } catch (error) {
    // 忽略清理错误，避免影响测试结果
  }
});

// 每个测试前的清理
beforeEach(() => {
  // 清理定时器
  jest.clearAllTimers();
});

afterEach(() => {
  // 恢复所有模拟
  jest.restoreAllMocks();

  // 清理WorldManager状态以避免测试间的状态污染
  try {
    const { Core } = require('../src/Core');
    const { WorldManager } = require('../src/ECS/WorldManager');

    // 销毁 Core 和 WorldManager 单例
    if (Core._instance) {
      Core.destroy();
    }
    if (WorldManager._instance) {
      if (WorldManager._instance.destroy) {
        WorldManager._instance.destroy();
      }
      WorldManager._instance = null;
    }
  } catch (error) {
    // 忽略清理错误
  }
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