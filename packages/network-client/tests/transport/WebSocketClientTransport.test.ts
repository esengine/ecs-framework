/**
 * WebSocketClientTransport 测试
 * 测试WebSocket客户端传输层的构造函数和依赖问题
 */

import { WebSocketClientTransport, WebSocketClientConfig } from '../../src/transport/WebSocketClientTransport';
import { ConnectionState } from '../../src/transport/ClientTransport';

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

// Mock依赖 - 直接创建mock对象而不依赖外部模块
const mockCore = {
  schedule: {
    scheduleRepeating: jest.fn((callback: Function, interval: number) => ({
      stop: jest.fn()
    }))
  }
};

const mockEmitter = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  removeAllListeners: jest.fn()
};

const mockNetworkShared = {
  NetworkValue: {},
  generateMessageId: jest.fn(() => 'mock-message-id-123')
};

// 设置模块mock
jest.doMock('@esengine/ecs-framework', () => ({
  Core: mockCore,
  Emitter: jest.fn(() => mockEmitter)
}));

jest.doMock('@esengine/ecs-framework-network-shared', () => mockNetworkShared);

// 设置全局WebSocket mock
(global as any).WebSocket = MockWebSocket;
(global as any).WebSocket.CONNECTING = 0;
(global as any).WebSocket.OPEN = 1;
(global as any).WebSocket.CLOSING = 2;
(global as any).WebSocket.CLOSED = 3;

describe('WebSocketClientTransport', () => {
  let transport: WebSocketClientTransport;
  const defaultConfig: WebSocketClientConfig = {
    host: 'localhost',
    port: 8080,
    secure: false,
    connectionTimeout: 5000,
    reconnectInterval: 1000,
    maxReconnectAttempts: 3,
    heartbeatInterval: 30000
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (transport) {
      transport.disconnect().catch(() => {});
      transport = null as any;
    }
  });

  describe('构造函数测试', () => {
    it('应该能够成功创建WebSocketClientTransport实例', () => {
      expect(() => {
        transport = new WebSocketClientTransport(defaultConfig);
      }).not.toThrow();
      
      expect(transport).toBeInstanceOf(WebSocketClientTransport);
    });

    it('应该正确合并默认配置', () => {
      transport = new WebSocketClientTransport(defaultConfig);
      
      const config = (transport as any).config;
      expect(config.path).toBe('/ws');
      expect(config.protocols).toEqual([]);
      expect(config.headers).toEqual({});
      expect(config.binaryType).toBe('arraybuffer');
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(8080);
    });

    it('应该允许自定义配置覆盖默认值', () => {
      const customConfig: WebSocketClientConfig = {
        ...defaultConfig,
        path: '/custom-ws',
        protocols: ['custom-protocol'],
        headers: { 'X-Custom': 'value' },
        binaryType: 'blob'
      };
      
      transport = new WebSocketClientTransport(customConfig);
      
      const config = (transport as any).config;
      expect(config.path).toBe('/custom-ws');
      expect(config.protocols).toEqual(['custom-protocol']);
      expect(config.headers).toEqual({ 'X-Custom': 'value' });
      expect(config.binaryType).toBe('blob');
    });

    it('应该正确初始化内部状态', () => {
      transport = new WebSocketClientTransport(defaultConfig);
      
      expect((transport as any).websocket).toBeNull();
      expect((transport as any).connectionPromise).toBeNull();
      expect((transport as any).connectionTimeoutTimer).toBeNull();
      expect((transport as any).state).toBe(ConnectionState.DISCONNECTED);
    });
  });

  describe('依赖注入测试', () => {
    it('应该正确处理@esengine/ecs-framework依赖', () => {
      const { Core } = require('@esengine/ecs-framework');
      
      expect(() => {
        transport = new WebSocketClientTransport(defaultConfig);
      }).not.toThrow();
      
      expect(Core).toBeDefined();
    });

    it('应该正确处理@esengine/ecs-framework-network-shared依赖', () => {
      const { generateMessageId } = require('@esengine/ecs-framework-network-shared');
      
      expect(() => {
        transport = new WebSocketClientTransport(defaultConfig);
      }).not.toThrow();
      
      expect(generateMessageId).toBeDefined();
      expect(typeof generateMessageId).toBe('function');
    });
  });

  describe('连接功能测试', () => {
    beforeEach(() => {
      transport = new WebSocketClientTransport(defaultConfig);
    });

    it('应该能够发起连接', async () => {
      const connectPromise = transport.connect();
      
      expect((transport as any).websocket).toBeInstanceOf(MockWebSocket);
      expect((transport as any).state).toBe(ConnectionState.CONNECTING);
      
      // 模拟连接成功
      const ws = (transport as any).websocket as MockWebSocket;
      ws.readyState = WebSocket.OPEN;
      if (ws.onopen) {
        ws.onopen(new Event('open'));
      }
      
      await expect(connectPromise).resolves.toBeUndefined();
    });

    it('应该构造正确的WebSocket URL', async () => {
      transport.connect();
      
      const ws = (transport as any).websocket as MockWebSocket;
      expect(ws.url).toBe('ws://localhost:8080/ws');
    });

    it('使用安全连接时应该构造HTTPS URL', async () => {
      const secureConfig = { ...defaultConfig, secure: true };
      transport = new WebSocketClientTransport(secureConfig);
      
      transport.connect();
      
      const ws = (transport as any).websocket as MockWebSocket;
      expect(ws.url).toBe('wss://localhost:8080/ws');
    });

    it('应该设置WebSocket事件处理器', async () => {
      transport.connect();
      
      const ws = (transport as any).websocket as MockWebSocket;
      expect(ws.onopen).toBeDefined();
      expect(ws.onclose).toBeDefined();
      expect(ws.onmessage).toBeDefined();
      expect(ws.onerror).toBeDefined();
    });

    it('连接超时应该被正确处理', async () => {
      const shortTimeoutConfig = { ...defaultConfig, connectionTimeout: 100 };
      transport = new WebSocketClientTransport(shortTimeoutConfig);
      
      const connectPromise = transport.connect();
      
      // 不触发onopen事件，让连接超时
      await expect(connectPromise).rejects.toThrow('连接超时');
    });

    it('应该能够正确断开连接', async () => {
      transport.connect();
      
      // 模拟连接成功
      const ws = (transport as any).websocket as MockWebSocket;
      ws.readyState = WebSocket.OPEN;
      if (ws.onopen) {
        ws.onopen(new Event('open'));
      }
      
      await transport.disconnect();
      expect((transport as any).state).toBe(ConnectionState.DISCONNECTED);
    });
  });

  describe('消息发送测试', () => {
    beforeEach(async () => {
      transport = new WebSocketClientTransport(defaultConfig);
    });

    it('未连接时发送消息应该加入队列', async () => {
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

    it('连接后应该发送队列中的消息', async () => {
      const message = {
        type: 'custom' as const,
        data: { test: 'data' },
        reliable: true,
        timestamp: Date.now()
      };
      
      // 先发送消息到队列
      await transport.sendMessage(message);
      
      // 然后连接
      transport.connect();
      const ws = (transport as any).websocket as MockWebSocket;
      const sendSpy = jest.spyOn(ws, 'send');
      
      // 模拟连接成功
      ws.readyState = WebSocket.OPEN;
      if (ws.onopen) {
        ws.onopen(new Event('open'));
      }
      
      expect(sendSpy).toHaveBeenCalled();
      expect((transport as any).messageQueue).toHaveLength(0);
    });
  });

  describe('错误处理测试', () => {
    it('应该处理WebSocket构造函数异常', () => {
      // Mock WebSocket构造函数抛出异常
      const originalWebSocket = (global as any).WebSocket;
      (global as any).WebSocket = jest.fn(() => {
        throw new Error('WebSocket构造失败');
      });
      
      transport = new WebSocketClientTransport(defaultConfig);
      
      expect(transport.connect()).rejects.toThrow('WebSocket构造失败');
      
      // 恢复原始WebSocket
      (global as any).WebSocket = originalWebSocket;
    });

    it('应该处理网络连接错误', async () => {
      transport = new WebSocketClientTransport(defaultConfig);
      
      const connectPromise = transport.connect();
      
      // 模拟连接错误
      const ws = (transport as any).websocket as MockWebSocket;
      if (ws.onerror) {
        ws.onerror(new Event('error'));
      }
      
      await expect(connectPromise).rejects.toThrow();
    });

    it('应该处理意外的连接关闭', () => {
      transport = new WebSocketClientTransport(defaultConfig);
      transport.connect();
      
      const ws = (transport as any).websocket as MockWebSocket;
      
      // 模拟连接意外关闭
      if (ws.onclose) {
        ws.onclose(new CloseEvent('close', { code: 1006, reason: '意外关闭' }));
      }
      
      expect((transport as any).state).toBe(ConnectionState.DISCONNECTED);
    });
  });

  describe('统计信息测试', () => {
    it('应该正确计算连接统计信息', async () => {
      transport = new WebSocketClientTransport(defaultConfig);
      
      const initialStats = transport.getStats();
      expect(initialStats.connectedAt).toBeNull();
      expect(initialStats.messagesSent).toBe(0);
      expect(initialStats.messagesReceived).toBe(0);
    });

    it('连接后应该更新统计信息', async () => {
      transport = new WebSocketClientTransport(defaultConfig);
      
      transport.connect();
      const ws = (transport as any).websocket as MockWebSocket;
      ws.readyState = WebSocket.OPEN;
      if (ws.onopen) {
        ws.onopen(new Event('open'));
      }
      
      const stats = transport.getStats();
      expect(stats.connectedAt).toBeInstanceOf(Date);
    });
  });
});