/**
 * NetworkIdentity组件测试
 */
import { NetworkIdentity } from '../src/components/NetworkIdentity';
import { AuthorityType, NetworkScope } from '../src/types/NetworkTypes';

describe('NetworkIdentity', () => {
  let networkIdentity: NetworkIdentity;

  beforeEach(() => {
    networkIdentity = new NetworkIdentity();
  });

  describe('基础属性', () => {
    test('应该有默认的网络ID', () => {
      expect(networkIdentity.networkId).toBe(0);
    });

    test('应该有默认的权限类型', () => {
      expect(networkIdentity.authority).toBe(AuthorityType.Server);
    });

    test('应该有默认的网络作用域', () => {
      expect(networkIdentity.scope).toBe(NetworkScope.Room);
    });

    test('应该有默认的同步频率', () => {
      expect(networkIdentity.syncRate).toBe(20);
    });

    test('应该默认启用同步', () => {
      expect(networkIdentity.syncEnabled).toBe(true);
    });

    test('应该默认可见', () => {
      expect(networkIdentity.visible).toBe(true);
    });
  });

  describe('权限检查', () => {
    test('服务端权限下客户端无权限', () => {
      networkIdentity.authority = AuthorityType.Server;
      expect(networkIdentity.hasAuthority('client1')).toBe(false);
    });

    test('客户端权限下拥有者有权限', () => {
      networkIdentity.authority = AuthorityType.Client;
      networkIdentity.ownerId = 'client1';
      expect(networkIdentity.hasAuthority('client1')).toBe(true);
      expect(networkIdentity.hasAuthority('client2')).toBe(false);
    });

    test('共享权限下所有人都有权限', () => {
      networkIdentity.authority = AuthorityType.Shared;
      expect(networkIdentity.hasAuthority('client1')).toBe(true);
      expect(networkIdentity.hasAuthority('client2')).toBe(true);
    });
  });

  describe('同步范围检查', () => {
    test('全局作用域下所有客户端都应该同步', () => {
      networkIdentity.scope = NetworkScope.Global;
      expect(networkIdentity.shouldSyncToClient('client1')).toBe(true);
      expect(networkIdentity.shouldSyncToClient('client2')).toBe(true);
    });

    test('拥有者作用域下只有拥有者应该同步', () => {
      networkIdentity.scope = NetworkScope.Owner;
      networkIdentity.ownerId = 'client1';
      expect(networkIdentity.shouldSyncToClient('client1')).toBe(true);
      expect(networkIdentity.shouldSyncToClient('client2')).toBe(false);
    });

    test('附近作用域下距离内的客户端应该同步', () => {
      networkIdentity.scope = NetworkScope.Nearby;
      networkIdentity.distanceThreshold = 100;
      
      expect(networkIdentity.shouldSyncToClient('client1', 50)).toBe(true);
      expect(networkIdentity.shouldSyncToClient('client2', 150)).toBe(false);
    });

    test('禁用同步时不应该同步给任何客户端', () => {
      networkIdentity.scope = NetworkScope.Global;
      networkIdentity.syncEnabled = false;
      expect(networkIdentity.shouldSyncToClient('client1')).toBe(false);
    });

    test('不可见时不应该同步给任何客户端', () => {
      networkIdentity.scope = NetworkScope.Global;
      networkIdentity.visible = false;
      expect(networkIdentity.shouldSyncToClient('client1')).toBe(false);
    });
  });

  describe('同步权重计算', () => {
    test('应该基于优先级计算权重', () => {
      networkIdentity.priority = 10;
      expect(networkIdentity.getSyncWeight()).toBe(10);
    });

    test('附近作用域应该基于距离调整权重', () => {
      networkIdentity.scope = NetworkScope.Nearby;
      networkIdentity.priority = 10;
      networkIdentity.distanceThreshold = 100;
      
      // 距离为0时权重应该等于优先级
      expect(networkIdentity.getSyncWeight(0)).toBe(10);
      
      // 距离为50时权重应该降低
      const weight50 = networkIdentity.getSyncWeight(50);
      expect(weight50).toBeGreaterThan(0);
      expect(weight50).toBeLessThan(10);
      
      // 距离超过阈值时权重应该为0
      expect(networkIdentity.getSyncWeight(150)).toBe(0);
    });
  });

  describe('拥有者管理', () => {
    test('应该能够设置拥有者', () => {
      networkIdentity.setOwner('client1');
      expect(networkIdentity.ownerId).toBe('client1');
    });
  });

  describe('调试信息', () => {
    test('应该返回完整的调试信息', () => {
      networkIdentity.networkId = 123;
      networkIdentity.ownerId = 'client1';
      networkIdentity.priority = 5;
      
      const debugInfo = networkIdentity.getDebugInfo();
      
      expect(debugInfo).toMatchObject({
        networkId: 123,
        ownerId: 'client1',
        authority: AuthorityType.Server,
        scope: NetworkScope.Room,
        syncRate: 20,
        priority: 5,
        syncEnabled: true,
        visible: true
      });
      
      expect(debugInfo).toHaveProperty('lastSyncTime');
    });
  });
});