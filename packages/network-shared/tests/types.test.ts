/**
 * 类型定义测试
 */
import { MessageType, AuthorityType, NetworkScope, SyncMode, RpcTarget } from '../src/types/NetworkTypes';

describe('NetworkTypes', () => {
  describe('MessageType枚举', () => {
    test('应该包含所有必要的消息类型', () => {
      expect(MessageType.CONNECT).toBe('connect');
      expect(MessageType.DISCONNECT).toBe('disconnect');
      expect(MessageType.HEARTBEAT).toBe('heartbeat');
      expect(MessageType.SYNC_VAR).toBe('sync_var');
      expect(MessageType.RPC_CALL).toBe('rpc_call');
      expect(MessageType.ENTITY_CREATE).toBe('entity_create');
      expect(MessageType.ERROR).toBe('error');
    });
  });

  describe('AuthorityType枚举', () => {
    test('应该包含正确的权限类型', () => {
      expect(AuthorityType.Server).toBe('server');
      expect(AuthorityType.Client).toBe('client');
      expect(AuthorityType.Shared).toBe('shared');
    });
  });

  describe('NetworkScope枚举', () => {
    test('应该包含正确的网络作用域', () => {
      expect(NetworkScope.Global).toBe('global');
      expect(NetworkScope.Room).toBe('room');
      expect(NetworkScope.Owner).toBe('owner');
      expect(NetworkScope.Nearby).toBe('nearby');
      expect(NetworkScope.Custom).toBe('custom');
    });
  });

  describe('SyncMode枚举', () => {
    test('应该包含正确的同步模式', () => {
      expect(SyncMode.All).toBe('all');
      expect(SyncMode.Owner).toBe('owner');
      expect(SyncMode.Others).toBe('others');
      expect(SyncMode.Nearby).toBe('nearby');
      expect(SyncMode.Custom).toBe('custom');
    });
  });

  describe('RpcTarget枚举', () => {
    test('应该包含正确的RPC目标', () => {
      expect(RpcTarget.Server).toBe('server');
      expect(RpcTarget.Client).toBe('client');
      expect(RpcTarget.All).toBe('all');
      expect(RpcTarget.Others).toBe('others');
      expect(RpcTarget.Owner).toBe('owner');
      expect(RpcTarget.Nearby).toBe('nearby');
    });
  });
});