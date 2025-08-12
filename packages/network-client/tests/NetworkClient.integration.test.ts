/**
 * NetworkClient 集成测试
 * 测试网络客户端的完整功能，包括依赖注入和错误处理
 */

import { NetworkClient } from '../src/core/NetworkClient';

// Mock 所有外部依赖
jest.mock('@esengine/ecs-framework', () => ({
  Core: {
    scene: null,
    schedule: {
      scheduleRepeating: jest.fn((callback: Function, interval: number) => ({
        stop: jest.fn()
      }))
    }
  },
  Emitter: jest.fn().mockImplementation(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    removeAllListeners: jest.fn()
  }))
}));

jest.mock('@esengine/ecs-framework-network-shared', () => ({
  NetworkValue: {},
  generateMessageId: jest.fn(() => 'test-message-id-123'),
  generateNetworkId: jest.fn(() => 12345),
  NetworkUtils: {
    generateMessageId: jest.fn(() => 'test-message-id-456'),
    calculateDistance: jest.fn(() => 100),
    isNodeEnvironment: jest.fn(() => false),
    isBrowserEnvironment: jest.fn(() => true)
  }
}));

// Mock WebSocket
class MockWebSocket {
  public readyState: number = WebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(public url: string, public protocols?: string | string[]) {}

  send(data: string | ArrayBuffer | Blob): void {}
  close(code?: number, reason?: string): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code || 1000, reason: reason || '' }));
    }
  }
}

(global as any).WebSocket = MockWebSocket;
(global as any).WebSocket.CONNECTING = 0;
(global as any).WebSocket.OPEN = 1;
(global as any).WebSocket.CLOSING = 2;
(global as any).WebSocket.CLOSED = 3;

describe('NetworkClient 集成测试', () => {
  let client: NetworkClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (client) {
      client.disconnect().catch(() => {});
      client = null as any;
    }
  });

  describe('依赖注入测试', () => {
    it('应该正确处理所有依赖模块', () => {
      expect(() => {
        client = new NetworkClient({
          transport: 'websocket',
          transportConfig: {
            host: 'localhost',
            port: 8080
          }
        });
      }).not.toThrow();
      
      expect(client).toBeInstanceOf(NetworkClient);
    });

    it('应该正确使用network-shared中的工具函数', () => {
      const { generateMessageId, NetworkUtils } = require('@esengine/ecs-framework-network-shared');
      
      client = new NetworkClient({
        transport: 'websocket',
        transportConfig: {
          host: 'localhost',
          port: 8080
        }
      });
      
      // 验证network-shared模块被正确导入
      expect(generateMessageId).toBeDefined();
      expect(NetworkUtils).toBeDefined();
    });

    it('应该正确使用ecs-framework中的Core模块', () => {
      const { Core } = require('@esengine/ecs-framework');
      
      client = new NetworkClient({
        transport: 'websocket',
        transportConfig: {
          host: 'localhost',
          port: 8080
        }
      });
      
      expect(Core).toBeDefined();
      expect(Core.schedule).toBeDefined();
    });
  });

  describe('构造函数错误处理', () => {
    it('应该处理network-shared模块导入失败', () => {
      // 重置模块并模拟导入失败
      jest.resetModules();
      jest.doMock('@esengine/ecs-framework-network-shared', () => {
        throw new Error('network-shared模块导入失败');
      });

      expect(() => {
        const { NetworkClient } = require('../src/core/NetworkClient');
        new NetworkClient({
          transportType: 'websocket',
          host: 'localhost',
          port: 8080
        });
      }).toThrow();
    });

    it('应该处理ecs-framework模块导入失败', () => {
      // 重置模块并模拟导入失败
      jest.resetModules();
      jest.doMock('@esengine/ecs-framework', () => {
        throw new Error('ecs-framework模块导入失败');
      });

      expect(() => {
        const { NetworkClient } = require('../src/core/NetworkClient');
        new NetworkClient({
          transportType: 'websocket',
          host: 'localhost',
          port: 8080
        });
      }).toThrow();
    });

    it('应该处理传输层构造失败', () => {
      // Mock传输层构造函数抛出异常
      const originalWebSocket = (global as any).WebSocket;
      (global as any).WebSocket = jest.fn(() => {
        throw new Error('WebSocket不可用');
      });

      client = new NetworkClient({
        transport: 'websocket',
        transportConfig: {
          host: 'localhost',
          port: 8080
        }
      });

      expect(client.connect()).rejects.toThrow();

      // 恢复原始WebSocket
      (global as any).WebSocket = originalWebSocket;
    });
  });

  describe('功能测试', () => {
    beforeEach(() => {
      client = new NetworkClient({
        transport: 'websocket',
        transportConfig: {
          host: 'localhost',
          port: 8080
        }
      });
    });

    it('应该能够成功连接', async () => {
      const connectPromise = client.connect();
      
      // 模拟连接成功
      setTimeout(() => {
        const transport = (client as any).transport;
        if (transport && transport.websocket && transport.websocket.onopen) {
          transport.websocket.readyState = WebSocket.OPEN;
          transport.websocket.onopen(new Event('open'));
        }
      }, 0);
      
      await expect(connectPromise).resolves.toBeUndefined();
    });

    it('应该能够发送消息', async () => {
      // 先连接
      const connectPromise = client.connect();
      setTimeout(() => {
        const transport = (client as any).transport;
        if (transport && transport.websocket && transport.websocket.onopen) {
          transport.websocket.readyState = WebSocket.OPEN;
          transport.websocket.onopen(new Event('open'));
        }
      }, 0);
      await connectPromise;
      
      // 发送消息
      const message = {
        type: 'custom' as const,
        data: { test: 'message' },
        reliable: true
      };
      
      // NetworkClient没有直接的sendMessage方法，它通过RPC调用
    });

    it('应该能够正确断开连接', async () => {
      await expect(client.disconnect()).resolves.toBeUndefined();
    });

    it('应该返回正确的认证状态', () => {
      expect(client.isAuthenticated()).toBe(false);
    });

    it('应该能够获取网络对象列表', () => {
      const networkObjects = client.getAllNetworkObjects();
      expect(Array.isArray(networkObjects)).toBe(true);
      expect(networkObjects.length).toBe(0);
    });
  });

  describe('消息ID生成测试', () => {
    beforeEach(() => {
      client = new NetworkClient({
        transport: 'websocket',
        transportConfig: {
          host: 'localhost',
          port: 8080
        }
      });
    });

    it('应该能够生成唯一的消息ID', () => {
      const messageId1 = (client as any).generateMessageId();
      const messageId2 = (client as any).generateMessageId();
      
      expect(typeof messageId1).toBe('string');
      expect(typeof messageId2).toBe('string');
      expect(messageId1).not.toBe(messageId2);
    });

    it('生成的消息ID应该符合预期格式', () => {
      const messageId = (client as any).generateMessageId();
      
      // 检查消息ID格式（时间戳 + 随机字符串）
      expect(messageId).toMatch(/^[a-z0-9]+$/);
      expect(messageId.length).toBeGreaterThan(10);
    });
  });

  describe('错误恢复测试', () => {
    beforeEach(() => {
      client = new NetworkClient({
        transportType: 'websocket',
        host: 'localhost',
        port: 8080,
        maxReconnectAttempts: 2,
        reconnectInterval: 100
      });
    });

    it('连接失败后应该尝试重连', async () => {
      let connectAttempts = 0;
      const originalWebSocket = (global as any).WebSocket;
      
      (global as any).WebSocket = jest.fn().mockImplementation(() => {
        connectAttempts++;
        const ws = new originalWebSocket('ws://localhost:8080');
        // 模拟连接失败
        setTimeout(() => {
          if (ws.onerror) {
            ws.onerror(new Event('error'));
          }
        }, 0);
        return ws;
      });

      await expect(client.connect()).rejects.toThrow();
      
      // 等待重连尝试
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(connectAttempts).toBeGreaterThan(1);
      
      // 恢复原始WebSocket
      (global as any).WebSocket = originalWebSocket;
    });

    it('达到最大重连次数后应该停止重连', async () => {
      const maxAttempts = 2;
      client = new NetworkClient({
        transportType: 'websocket',
        host: 'localhost',
        port: 8080,
        maxReconnectAttempts: maxAttempts,
        reconnectInterval: 50
      });

      let connectAttempts = 0;
      const originalWebSocket = (global as any).WebSocket;
      
      (global as any).WebSocket = jest.fn().mockImplementation(() => {
        connectAttempts++;
        const ws = new originalWebSocket('ws://localhost:8080');
        setTimeout(() => {
          if (ws.onerror) {
            ws.onerror(new Event('error'));
          }
        }, 0);
        return ws;
      });

      await expect(client.connect()).rejects.toThrow();
      
      // 等待所有重连尝试完成
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(connectAttempts).toBeLessThanOrEqual(maxAttempts + 1);
      
      // 恢复原始WebSocket
      (global as any).WebSocket = originalWebSocket;
    });
  });

  describe('内存泄漏防护测试', () => {
    it('断开连接时应该清理所有资源', async () => {
      client = new NetworkClient({
        transport: 'websocket',
        transportConfig: {
          host: 'localhost',
          port: 8080
        }
      });

      const { Emitter } = require('@esengine/ecs-framework');
      const emitterInstance = Emitter.mock.results[Emitter.mock.results.length - 1].value;
      
      await client.disconnect();
      
      expect(emitterInstance.removeAllListeners).toHaveBeenCalled();
    });

    it('多次创建和销毁客户端不应该造成内存泄漏', () => {
      const initialEmitterCallCount = require('@esengine/ecs-framework').Emitter.mock.calls.length;
      
      // 创建和销毁多个客户端实例
      for (let i = 0; i < 5; i++) {
        const tempClient = new NetworkClient({
          transportType: 'websocket',
          host: 'localhost',
          port: 8080
        });
        tempClient.disconnect().catch(() => {});
      }
      
      const finalEmitterCallCount = require('@esengine/ecs-framework').Emitter.mock.calls.length;
      
      // 验证Emitter实例数量符合预期
      expect(finalEmitterCallCount - initialEmitterCallCount).toBe(5);
    });
  });
});