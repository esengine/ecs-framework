/**
 * Jest测试环境设置 - 客户端
 */

// 导入reflect-metadata以支持装饰器
import 'reflect-metadata';

// 模拟浏览器环境的WebSocket
Object.defineProperty(global, 'WebSocket', {
  value: class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readyState = MockWebSocket.CONNECTING;
    url: string;
    onopen: ((event: Event) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    constructor(url: string) {
      this.url = url;
      // 模拟异步连接
      setTimeout(() => {
        this.readyState = MockWebSocket.OPEN;
        if (this.onopen) {
          this.onopen(new Event('open'));
        }
      }, 0);
    }

    send(data: string | ArrayBuffer) {
      // 模拟发送
    }

    close() {
      this.readyState = MockWebSocket.CLOSED;
      if (this.onclose) {
        this.onclose(new CloseEvent('close'));
      }
    }
  }
});

// 全局测试配置
beforeAll(() => {
  // 设置测试环境
  process.env.NODE_ENV = 'test';
  process.env.NETWORK_ENV = 'client';
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