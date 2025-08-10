/**
 * 网络库基础功能测试
 */

import 'reflect-metadata';
import { NetworkManager } from '../src/NetworkManager';
import { NetworkIdentity } from '../src/NetworkIdentity';
import { NetworkBehaviour } from '../src/NetworkBehaviour';
import { SyncVar } from '../src/decorators/SyncVar';
import { ClientRpc } from '../src/decorators/ClientRpc';
import { Command } from '../src/decorators/Command';
import { NetworkRegistry } from '../src/core/NetworkRegistry';
import { SyncVarManager } from '../src/core/SyncVarManager';
import { RpcManager } from '../src/core/RpcManager';

// 测试用的玩家组件
class TestPlayerComponent extends NetworkBehaviour {
  @SyncVar({ onChanged: 'onHealthChanged' })
  public health: number = 100;

  @SyncVar()
  public playerName: string = 'Player';

  public lastHealthChangeValue: number = 0;

  @ClientRpc()
  public showDamageEffect(damage: number, position: { x: number; y: number }): void {
    console.log(`显示伤害特效: ${damage} at (${position.x}, ${position.y})`);
  }

  @Command()
  public movePlayer(direction: { x: number; y: number }): void {
    console.log(`移动玩家: (${direction.x}, ${direction.y})`);
  }

  private onHealthChanged(oldValue: number, newValue: number): void {
    this.lastHealthChangeValue = newValue;
    console.log(`生命值变化: ${oldValue} -> ${newValue}`);
  }
}

// 模拟实体类
class MockEntity {
  private components: any[] = [];
  public name: string = 'TestEntity';

  public addComponent(component: any): void {
    this.components.push(component);
    component.entity = this;
  }

  public getComponent(componentType: any): any {
    return this.components.find(c => c instanceof componentType);
  }

  public getComponents(): any[] {
    return this.components;
  }
}

describe('网络库基础功能测试', () => {
  let networkManager: NetworkManager;
  let entity: MockEntity;
  let networkIdentity: NetworkIdentity;
  let playerComponent: TestPlayerComponent;

  beforeEach(() => {
    // 重置单例
    (NetworkManager as any)._instance = null;
    NetworkRegistry.instance.reset();
    SyncVarManager.instance.clearPendingChanges();
    RpcManager.instance.clearPendingCalls();

    // 创建网络管理器
    networkManager = new NetworkManager();
    
    // 创建测试实体
    entity = new MockEntity();
    networkIdentity = new NetworkIdentity();
    playerComponent = new TestPlayerComponent();

    entity.addComponent(networkIdentity);
    entity.addComponent(playerComponent);
    
    // 手动调用组件初始化以注册网络行为
    playerComponent.start();
  });

  afterEach(() => {
    networkManager?.destroy();
  });

  describe('网络身份管理', () => {
    test('网络对象注册和查找', () => {
      const networkId = networkManager.registerNetworkObject(entity);
      
      expect(networkId).toBeGreaterThan(0);
      expect(networkIdentity.networkId).toBe(networkId);
      
      const foundIdentity = NetworkRegistry.instance.find(networkId);
      expect(foundIdentity).toBe(networkIdentity);
    });

    test('网络权威设置', () => {
      networkManager.registerNetworkObject(entity);
      
      expect(networkIdentity.hasAuthority).toBe(false);
      expect(playerComponent.hasAuthority).toBe(false);
      
      networkIdentity.setAuthority(true, 1);
      expect(networkIdentity.hasAuthority).toBe(true);
      expect(networkIdentity.ownerId).toBe(1);
      expect(playerComponent.hasAuthority).toBe(true);
    });

    test('本地玩家设置', () => {
      networkManager.registerNetworkObject(entity);
      
      expect(networkIdentity.isLocalPlayer).toBe(false);
      expect(playerComponent.isLocalPlayer).toBe(false);
      
      NetworkRegistry.instance.setLocalPlayer(networkIdentity);
      expect(networkIdentity.isLocalPlayer).toBe(true);
      expect(networkIdentity.hasAuthority).toBe(true);
      expect(playerComponent.isLocalPlayer).toBe(true);
    });
  });

  describe('SyncVar 同步变量', () => {
    test('SyncVar 属性同步', () => {
      networkManager.registerNetworkObject(entity);
      networkIdentity.setAuthority(true, 1);

      // 修改同步变量
      playerComponent.health = 80;
      playerComponent.playerName = 'TestPlayer';

      // 检查待同步消息
      const messages = SyncVarManager.instance.getPendingMessages();
      expect(messages.length).toBeGreaterThanOrEqual(2);

      // 验证消息内容
      const healthMessage = messages.find(m => m.propertyName === 'health');
      expect(healthMessage).toBeDefined();
      expect(healthMessage?.value).toBe(80);

      const nameMessage = messages.find(m => m.propertyName === 'playerName');
      expect(nameMessage).toBeDefined();
      expect(nameMessage?.value).toBe('TestPlayer');
    });

    test('SyncVar 变化回调', () => {
      networkManager.registerNetworkObject(entity);
      networkIdentity.setAuthority(true, 1);

      expect(playerComponent.lastHealthChangeValue).toBe(0);

      playerComponent.health = 75;
      expect(playerComponent.lastHealthChangeValue).toBe(75);
    });

    test('权威验证', () => {
      networkManager.registerNetworkObject(entity);
      
      // 没有权威时不应该能修改
      expect(networkIdentity.hasAuthority).toBe(false);
      
      const originalHealth = playerComponent.health;
      playerComponent.health = 50;
      
      // 检查是否有待同步消息（没有权威应该没有）
      const messages = SyncVarManager.instance.getPendingMessages();
      expect(messages.length).toBe(0);
    });
  });

  describe('RPC 远程过程调用', () => {
    test('RPC 方法注册', () => {
      networkManager.registerNetworkObject(entity);
      
      const stats = RpcManager.instance.getStats();
      expect(stats.registeredComponents).toBeGreaterThan(0);
    });

    test('RPC 消息生成', () => {
      networkManager.registerNetworkObject(entity);
      
      // 模拟服务端调用ClientRpc
      if (NetworkManager.isServer) {
        playerComponent.showDamageEffect(25, { x: 100, y: 200 });
        
        const rpcMessages = RpcManager.instance.getPendingRpcMessages();
        const damageMessage = rpcMessages.find(m => m.methodName === 'showDamageEffect');
        expect(damageMessage).toBeDefined();
        expect(damageMessage?.isClientRpc).toBe(true);
      }
    });
  });

  describe('网络管理器状态', () => {
    test('网络端类型判断', () => {
      // 默认应该是客户端
      expect(NetworkManager.isClient).toBe(true);
      expect(NetworkManager.isServer).toBe(false);
      expect(NetworkManager.isConnected).toBe(false);
    });

    test('连接状态管理', () => {
      expect(networkManager.getConnectionState()).toBe('disconnected');
    });

    test('网络统计信息', () => {
      const stats = networkManager.getStats();
      expect(stats).toHaveProperty('connectionCount');
      expect(stats).toHaveProperty('messagesSent');
      expect(stats).toHaveProperty('messagesReceived');
      expect(stats.connectionCount).toBe(0);
    });
  });

  describe('网络注册表管理', () => {
    test('多个网络对象管理', () => {
      // 创建多个实体
      const entity2 = new MockEntity();
      const networkIdentity2 = new NetworkIdentity();
      entity2.addComponent(networkIdentity2);
      const playerComponent2 = new TestPlayerComponent();
      entity2.addComponent(playerComponent2);
      playerComponent2.start();

      const networkId1 = networkManager.registerNetworkObject(entity);
      const networkId2 = networkManager.registerNetworkObject(entity2);

      expect(networkId1).not.toBe(networkId2);
      expect(NetworkRegistry.instance.getAllNetworkObjects().length).toBe(2);
    });

    test('网络对象注销', () => {
      const networkId = networkManager.registerNetworkObject(entity);
      
      expect(NetworkRegistry.instance.exists(networkId)).toBe(true);
      
      NetworkRegistry.instance.unregister(networkId);
      
      expect(NetworkRegistry.instance.exists(networkId)).toBe(false);
      expect(NetworkRegistry.instance.find(networkId)).toBeNull();
    });

    test('按所有者查找对象', () => {
      const networkId = networkManager.registerNetworkObject(entity);
      networkIdentity.setAuthority(true, 123);
      
      const ownedObjects = NetworkRegistry.instance.getObjectsByOwner(123);
      expect(ownedObjects.length).toBe(1);
      expect(ownedObjects[0]).toBe(networkIdentity);
    });
  });
});