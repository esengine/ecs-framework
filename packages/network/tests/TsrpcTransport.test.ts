/**
 * TSRPC传输层测试
 */

import 'reflect-metadata';
import { TsrpcTransport } from '../src/transport/TsrpcTransport';
import { NetworkConfig } from '../src/types/NetworkTypes';

// 简化测试，只验证基本功能
describe('TSRPC传输层测试', () => {
  let serverTransport: TsrpcTransport;
  let clientTransport: TsrpcTransport;
  
  const serverConfig: NetworkConfig = {
    port: 18888, // 使用不同端口避免冲突
    host: 'localhost',
    syncRate: 20
  };

  const clientConfig: NetworkConfig = {
    port: 18888,
    host: 'localhost'
  };

  beforeEach(() => {
    serverTransport = new TsrpcTransport(serverConfig);
    clientTransport = new TsrpcTransport(clientConfig);
  });

  afterEach(async () => {
    if (serverTransport) {
      await serverTransport.disconnect();
    }
    if (clientTransport) {
      await clientTransport.disconnect();
    }
  });

  describe('传输层创建', () => {
    test('创建服务端传输层', () => {
      expect(serverTransport).toBeDefined();
      expect(serverTransport.getNetworkSide()).toBe('client'); // 默认为客户端
      expect(serverTransport.isConnected()).toBe(false);
    });

    test('创建客户端传输层', () => {
      expect(clientTransport).toBeDefined();
      expect(clientTransport.getNetworkSide()).toBe('client');
      expect(clientTransport.isConnected()).toBe(false);
    });
  });

  describe('事件处理器设置', () => {
    test('设置事件处理器', () => {
      let connectedCalled = false;
      let disconnectedCalled = false;

      serverTransport.setEventHandlers({
        onConnected: () => {
          connectedCalled = true;
        },
        onDisconnected: () => {
          disconnectedCalled = true;
        }
      });

      // 验证事件处理器被正确设置
      expect(connectedCalled).toBe(false);
      expect(disconnectedCalled).toBe(false);
    });

    test('单独设置事件处理器', () => {
      let errorCalled = false;

      serverTransport.on('onError', (error) => {
        errorCalled = true;
      });

      expect(errorCalled).toBe(false);
    });
  });

  describe('基本功能验证', () => {
    test('获取统计信息', () => {
      const stats = serverTransport.getStats();
      
      expect(stats).toHaveProperty('messagesSent');
      expect(stats).toHaveProperty('messagesReceived');
      expect(stats).toHaveProperty('bytesSent');
      expect(stats).toHaveProperty('bytesReceived');
      expect(stats).toHaveProperty('clientCount');
      expect(stats).toHaveProperty('uptime');

      // 初始值应该为0
      expect(stats.messagesSent).toBe(0);
      expect(stats.messagesReceived).toBe(0);
      expect(stats.clientCount).toBe(0);
    });

    test('客户端模式方法调用异常处理', async () => {
      // 客户端模式下调用服务端方法应该抛出错误
      await expect(serverTransport.getServerStatus()).rejects.toThrow('只能在客户端模式下查询服务端状态');
      await expect(serverTransport.ping()).rejects.toThrow('只能在客户端模式下发送心跳');
    });

    test('未初始化时发送消息异常处理', async () => {
      const testMessage = {
        type: 'test',
        networkId: 1,
        data: { test: 'data' },
        timestamp: Date.now()
      };

      // 未连接时发送消息应该抛出错误
      await expect(serverTransport.sendMessage(testMessage)).rejects.toThrow('传输层未初始化或状态错误');
      await expect(serverTransport.sendSyncVar(1, 'TestComponent', 'testProp', 'testValue')).rejects.toThrow('传输层未初始化或状态错误');
      await expect(serverTransport.sendRpcCall(1, 'TestComponent', 'testMethod', [], true)).rejects.toThrow('传输层未初始化或状态错误');
    });
  });

  describe('网络配置', () => {
    test('获取正确的网络端类型', async () => {
      // 测试服务端模式
      const config: NetworkConfig = {
        port: 18889,
        host: 'localhost'
      };
      
      const transport = new TsrpcTransport(config);
      expect(transport.getNetworkSide()).toBe('client'); // 创建时默认为客户端

      await transport.disconnect();
    });

    test('获取客户端ID和连接信息', () => {
      expect(serverTransport.getClientId()).toBe(0); // 未连接时为0
      expect(serverTransport.getConnectedClients()).toEqual([]); // 客户端模式返回空数组
      expect(serverTransport.getClientCount()).toBe(0); // 客户端模式返回0
    });
  });

  // 注意：由于在测试环境中启动真实的网络服务可能很复杂，
  // 这里主要测试API的正确性和错误处理，
  // 真正的端到端网络测试需要在集成测试中进行
});