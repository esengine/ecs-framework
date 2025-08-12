/**
 * ClientTransport 基类测试
 * 测试客户端传输层基类的构造函数和依赖问题
 */

import { ClientTransport, ClientTransportConfig, ConnectionState } from '../../src/transport/ClientTransport';

// Mock Emitter 和 Core
jest.mock('@esengine/ecs-framework', () => ({
  Emitter: jest.fn().mockImplementation(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    removeAllListeners: jest.fn()
  })),
  Core: {
    schedule: {
      scheduleRepeating: jest.fn((callback: Function, interval: number) => ({
        stop: jest.fn()
      }))
    }
  }
}));

// Mock network-shared
jest.mock('@esengine/ecs-framework-network-shared', () => ({
  NetworkValue: {}
}));

// 创建测试用的具体实现类
class TestClientTransport extends ClientTransport {
  async connect(): Promise<void> {
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async sendMessage(message: any): Promise<void> {
    return Promise.resolve();
  }
}

describe('ClientTransport', () => {
  let transport: TestClientTransport;
  const defaultConfig: ClientTransportConfig = {
    host: 'localhost',
    port: 8080
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (transport) {
      transport = null as any;
    }
  });

  describe('构造函数测试', () => {
    it('应该能够成功创建ClientTransport实例', () => {
      expect(() => {
        transport = new TestClientTransport(defaultConfig);
      }).not.toThrow();
      
      expect(transport).toBeInstanceOf(ClientTransport);
    });

    it('应该正确设置默认配置', () => {
      transport = new TestClientTransport(defaultConfig);
      
      const config = (transport as any).config;
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(8080);
      expect(config.secure).toBe(false);
      expect(config.connectionTimeout).toBe(10000);
      expect(config.reconnectInterval).toBe(3000);
      expect(config.maxReconnectAttempts).toBe(10);
      expect(config.heartbeatInterval).toBe(30000);
      expect(config.maxQueueSize).toBe(1000);
    });

    it('应该允许自定义配置覆盖默认值', () => {
      const customConfig: ClientTransportConfig = {
        host: 'example.com',
        port: 9090,
        secure: true,
        connectionTimeout: 15000,
        reconnectInterval: 5000,
        maxReconnectAttempts: 5,
        heartbeatInterval: 60000,
        maxQueueSize: 500
      };
      
      transport = new TestClientTransport(customConfig);
      
      const config = (transport as any).config;
      expect(config.host).toBe('example.com');
      expect(config.port).toBe(9090);
      expect(config.secure).toBe(true);
      expect(config.connectionTimeout).toBe(15000);
      expect(config.reconnectInterval).toBe(5000);
      expect(config.maxReconnectAttempts).toBe(5);
      expect(config.heartbeatInterval).toBe(60000);
      expect(config.maxQueueSize).toBe(500);
    });

    it('应该正确初始化内部状态', () => {
      transport = new TestClientTransport(defaultConfig);
      
      expect((transport as any).state).toBe(ConnectionState.DISCONNECTED);
      expect((transport as any).messageQueue).toEqual([]);
      expect((transport as any).reconnectAttempts).toBe(0);
      expect((transport as any).reconnectTimer).toBeNull();
      expect((transport as any).heartbeatTimer).toBeNull();
      expect((transport as any).latencyMeasurements).toEqual([]);
    });

    it('应该正确初始化统计信息', () => {
      transport = new TestClientTransport(defaultConfig);
      
      const stats = transport.getStats();
      expect(stats.connectedAt).toBeNull();
      expect(stats.connectionDuration).toBe(0);
      expect(stats.messagesSent).toBe(0);
      expect(stats.messagesReceived).toBe(0);
      expect(stats.bytesSent).toBe(0);
      expect(stats.bytesReceived).toBe(0);
      expect(stats.averageLatency).toBe(0);
      expect(stats.averageLatency).toBe(0);
      expect(stats.reconnectCount).toBe(0);
    });
  });

  describe('依赖注入测试', () => {
    it('应该正确处理@esengine/ecs-framework中的Emitter', () => {
      const { Emitter } = require('@esengine/ecs-framework');
      
      expect(() => {
        transport = new TestClientTransport(defaultConfig);
      }).not.toThrow();
      
      expect(Emitter).toHaveBeenCalled();
    });

    it('构造函数中Emitter初始化失败应该抛出异常', () => {
      // Mock Emitter构造函数抛出异常
      const { Emitter } = require('@esengine/ecs-framework');
      Emitter.mockImplementation(() => {
        throw new Error('Emitter初始化失败');
      });
      
      expect(() => {
        transport = new TestClientTransport(defaultConfig);
      }).toThrow('Emitter初始化失败');
    });

    it('应该正确处理@esengine/ecs-framework-network-shared依赖', () => {
      const networkShared = require('@esengine/ecs-framework-network-shared');
      
      expect(() => {
        transport = new TestClientTransport(defaultConfig);
      }).not.toThrow();
      
      expect(networkShared).toBeDefined();
      expect(networkShared.NetworkValue).toBeDefined();
    });
  });

  describe('事件系统测试', () => {
    beforeEach(() => {
      transport = new TestClientTransport(defaultConfig);
    });

    it('应该能够注册事件监听器', () => {
      const mockCallback = jest.fn();
      const { Emitter } = require('@esengine/ecs-framework');
      const emitterInstance = Emitter.mock.results[0].value;
      
      transport.on('connected', mockCallback);
      
      expect(emitterInstance.on).toHaveBeenCalledWith('connected', mockCallback);
    });

    it('应该能够移除事件监听器', () => {
      const mockCallback = jest.fn();
      const { Emitter } = require('@esengine/ecs-framework');
      const emitterInstance = Emitter.mock.results[0].value;
      
      transport.off('connected', mockCallback);
      
      expect(emitterInstance.off).toHaveBeenCalledWith('connected', mockCallback);
    });

    it('应该能够发出事件', () => {
      const { Emitter } = require('@esengine/ecs-framework');
      const emitterInstance = Emitter.mock.results[0].value;
      
      (transport as any).emit('connected');
      
      expect(emitterInstance.emit).toHaveBeenCalledWith('connected');
    });
  });

  describe('消息队列测试', () => {
    beforeEach(() => {
      transport = new TestClientTransport(defaultConfig);
    });

    it('应该能够将消息加入队列', async () => {
      const message = {
        type: 'custom' as const,
        data: { test: 'data' },
        reliable: true,
        timestamp: Date.now()
      };
      
      await transport.sendMessage(message);
      
      const messageQueue = (transport as any).messageQueue;
      expect(messageQueue).toHaveLength(1);
      expect(messageQueue[0]).toEqual(message);
    });

    it('消息队列达到最大大小时应该移除旧消息', async () => {
      // 设置较小的队列大小
      const smallQueueConfig = { ...defaultConfig, maxQueueSize: 2 };
      transport = new TestClientTransport(smallQueueConfig);
      
      const message1 = { type: 'custom' as const, data: { id: 1 }, reliable: true, timestamp: Date.now() };
      const message2 = { type: 'custom' as const, data: { id: 2 }, reliable: true, timestamp: Date.now() };
      const message3 = { type: 'custom' as const, data: { id: 3 }, reliable: true, timestamp: Date.now() };
      
      await transport.sendMessage(message1);
      await transport.sendMessage(message2);
      await transport.sendMessage(message3);
      
      const messageQueue = (transport as any).messageQueue;
      expect(messageQueue).toHaveLength(2);
      expect(messageQueue[0]).toEqual(message2);
      expect(messageQueue[1]).toEqual(message3);
    });
  });

  describe('连接状态测试', () => {
    beforeEach(() => {
      transport = new TestClientTransport(defaultConfig);
    });

    it('应该正确获取连接状态', () => {
      expect(transport.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('应该正确检查连接状态', () => {
      expect(transport.isConnected()).toBe(false);
      
      (transport as any).state = ConnectionState.CONNECTED;
      expect(transport.isConnected()).toBe(true);
      
      (transport as any).state = ConnectionState.AUTHENTICATED;
      expect(transport.isConnected()).toBe(true);
    });

    it('状态变化时应该发出事件', () => {
      const { Emitter } = require('@esengine/ecs-framework');
      const emitterInstance = Emitter.mock.results[0].value;
      
      (transport as any).setState(ConnectionState.CONNECTING);
      
      expect(emitterInstance.emit).toHaveBeenCalledWith(
        'state-changed',
        ConnectionState.DISCONNECTED,
        ConnectionState.CONNECTING
      );
    });
  });

  describe('延迟测量测试', () => {
    beforeEach(() => {
      transport = new TestClientTransport(defaultConfig);
    });

    it('应该能够更新延迟测量', () => {
      (transport as any).updateLatency(100);
      (transport as any).updateLatency(200);
      (transport as any).updateLatency(150);
      
      const stats = transport.getStats();
      expect(stats.averageLatency).toBe(150);
    });

    it('应该限制延迟测量样本数量', () => {
      // 添加超过最大样本数的测量
      for (let i = 0; i < 150; i++) {
        (transport as any).updateLatency(i * 10);
      }
      
      const latencyMeasurements = (transport as any).latencyMeasurements;
      expect(latencyMeasurements.length).toBeLessThanOrEqual(100);
    });
  });

  describe('配置验证测试', () => {
    it('应该拒绝无效的主机名', () => {
      expect(() => {
        transport = new TestClientTransport({ host: '', port: 8080 });
      }).toThrow();
    });

    it('应该拒绝无效的端口号', () => {
      expect(() => {
        transport = new TestClientTransport({ host: 'localhost', port: 0 });
      }).toThrow();
      
      expect(() => {
        transport = new TestClientTransport({ host: 'localhost', port: 65536 });
      }).toThrow();
    });

    it('应该拒绝负数的超时配置', () => {
      expect(() => {
        transport = new TestClientTransport({
          host: 'localhost',
          port: 8080,
          connectionTimeout: -1000
        });
      }).toThrow();
    });
  });

  describe('资源清理测试', () => {
    beforeEach(() => {
      transport = new TestClientTransport(defaultConfig);
    });

    it('应该能够清理所有定时器', () => {
      const { Core } = require('@esengine/ecs-framework');
      const mockTimer = { stop: jest.fn() };
      Core.schedule.scheduleRepeating.mockReturnValue(mockTimer);
      
      // 设置一些定时器
      (transport as any).reconnectTimer = mockTimer;
      (transport as any).heartbeatTimer = mockTimer;
      
      // 调用清理方法
      (transport as any).cleanup();
      
      expect(mockTimer.stop).toHaveBeenCalledTimes(2);
      expect((transport as any).reconnectTimer).toBeNull();
      expect((transport as any).heartbeatTimer).toBeNull();
    });

    it('应该能够清理消息队列', () => {
      (transport as any).messageQueue = [
        { type: 'custom', data: {}, reliable: true, timestamp: Date.now() }
      ];
      
      (transport as any).cleanup();
      
      expect((transport as any).messageQueue).toHaveLength(0);
    });

    it('应该能够移除所有事件监听器', () => {
      const { Emitter } = require('@esengine/ecs-framework');
      const emitterInstance = Emitter.mock.results[0].value;
      
      (transport as any).cleanup();
      
      expect(emitterInstance.removeAllListeners).toHaveBeenCalled();
    });
  });
});