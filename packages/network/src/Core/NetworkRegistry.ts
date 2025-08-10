/**
 * 网络注册表
 * 
 * 管理所有网络对象的注册和查找
 */

import { createLogger } from '@esengine/ecs-framework';
import { NetworkIdentity } from '../NetworkIdentity';

const logger = createLogger('NetworkRegistry');

export class NetworkRegistry {
  private static _instance: NetworkRegistry | null = null;

  /** 网络对象映射表 networkId -> NetworkIdentity */
  private networkObjects: Map<number, NetworkIdentity> = new Map();

  /** 下一个可用的网络ID */
  private nextNetworkId: number = 1;

  /** 本地玩家对象 */
  private localPlayer: NetworkIdentity | null = null;

  public static get instance(): NetworkRegistry {
    if (!NetworkRegistry._instance) {
      NetworkRegistry._instance = new NetworkRegistry();
    }
    return NetworkRegistry._instance;
  }

  private constructor() {}

  /**
   * 注册网络对象
   * @param identity 网络身份组件
   * @param networkId 指定的网络ID，如果不提供则自动分配
   * @returns 分配的网络ID
   */
  public register(identity: NetworkIdentity, networkId?: number): number {
    // 使用指定ID或自动分配
    const assignedId = networkId || this.nextNetworkId++;
    
    // 检查ID是否已被占用
    if (this.networkObjects.has(assignedId)) {
      logger.error(`网络ID ${assignedId} 已被占用`);
      throw new Error(`Network ID ${assignedId} is already in use`);
    }

    // 注册对象
    identity.networkId = assignedId;
    this.networkObjects.set(assignedId, identity);

    // 确保下一个ID不冲突
    if (assignedId >= this.nextNetworkId) {
      this.nextNetworkId = assignedId + 1;
    }

    logger.debug(`注册网络对象: ID=${assignedId}, Type=${identity.entity?.name || 'Unknown'}`);
    return assignedId;
  }

  /**
   * 注销网络对象
   * @param networkId 网络ID
   */
  public unregister(networkId: number): void {
    const identity = this.networkObjects.get(networkId);
    if (identity) {
      this.networkObjects.delete(networkId);
      
      // 如果是本地玩家，清除引用
      if (this.localPlayer === identity) {
        this.localPlayer = null;
      }

      logger.debug(`注销网络对象: ID=${networkId}`);
    }
  }

  /**
   * 根据网络ID查找对象
   * @param networkId 网络ID
   * @returns 网络身份组件
   */
  public find(networkId: number): NetworkIdentity | null {
    return this.networkObjects.get(networkId) || null;
  }

  /**
   * 获取所有网络对象
   */
  public getAllNetworkObjects(): NetworkIdentity[] {
    return Array.from(this.networkObjects.values());
  }

  /**
   * 获取所有拥有权威的对象
   */
  public getAuthorityObjects(): NetworkIdentity[] {
    return Array.from(this.networkObjects.values()).filter(identity => identity.hasAuthority);
  }

  /**
   * 获取指定客户端拥有的对象
   * @param ownerId 客户端ID
   */
  public getObjectsByOwner(ownerId: number): NetworkIdentity[] {
    return Array.from(this.networkObjects.values()).filter(identity => identity.ownerId === ownerId);
  }

  /**
   * 设置本地玩家
   * @param identity 本地玩家的网络身份组件
   */
  public setLocalPlayer(identity: NetworkIdentity): void {
    // 清除之前的本地玩家标记
    if (this.localPlayer) {
      this.localPlayer.isLocalPlayer = false;
    }

    // 设置新的本地玩家
    this.localPlayer = identity;
    identity.setAsLocalPlayer();

    logger.info(`设置本地玩家: ID=${identity.networkId}`);
  }

  /**
   * 获取本地玩家
   */
  public getLocalPlayer(): NetworkIdentity | null {
    return this.localPlayer;
  }

  /**
   * 清理指定客户端断开连接后的对象
   * @param ownerId 断开连接的客户端ID
   */
  public cleanupDisconnectedClient(ownerId: number): void {
    const ownedObjects = this.getObjectsByOwner(ownerId);
    
    for (const identity of ownedObjects) {
      // 移除权威，转移给服务端
      identity.setAuthority(false, 0);
      
      // 如果是本地玩家，清除引用
      if (identity === this.localPlayer) {
        this.localPlayer = null;
      }
    }

    logger.info(`清理断开连接客户端 ${ownerId} 的 ${ownedObjects.length} 个对象`);
  }

  /**
   * 检查网络ID是否存在
   * @param networkId 网络ID
   */
  public exists(networkId: number): boolean {
    return this.networkObjects.has(networkId);
  }

  /**
   * 重置注册表（用于测试）
   */
  public reset(): void {
    this.networkObjects.clear();
    this.nextNetworkId = 1;
    this.localPlayer = null;
    logger.info('网络注册表已重置');
  }

  /**
   * 获取统计信息
   */
  public getStats() {
    const objects = Array.from(this.networkObjects.values());
    return {
      totalObjects: objects.length,
      authorityObjects: objects.filter(o => o.hasAuthority).length,
      localPlayerCount: this.localPlayer ? 1 : 0,
      nextNetworkId: this.nextNetworkId
    };
  }
}