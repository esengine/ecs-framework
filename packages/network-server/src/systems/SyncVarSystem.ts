/**
 * SyncVar 同步系统
 * 
 * 处理服务端的 SyncVar 同步逻辑、权限验证、数据传播等
 */

import { EventEmitter } from 'events';
import { 
  NetworkValue, 
  SyncVarMetadata, 
  NetworkSerializer 
} from '@esengine/ecs-framework-network-shared';
import { ClientConnection } from '../core/ClientConnection';
import { Room } from '../rooms/Room';
import { TransportMessage } from '../core/Transport';

/**
 * SyncVar 更改记录
 */
export interface SyncVarChange {
  /** 网络对象ID */
  networkId: number;
  /** 组件类型 */
  componentType: string;
  /** 属性名 */
  propertyName: string;
  /** 旧值 */
  oldValue: NetworkValue;
  /** 新值 */
  newValue: NetworkValue;
  /** 元数据 */
  metadata: SyncVarMetadata;
  /** 发送者客户端ID */
  senderId: string;
  /** 时间戳 */
  timestamp: Date;
}

/**
 * SyncVar 同步配置
 */
export interface SyncVarSystemConfig {
  /** 批量同步间隔(毫秒) */
  batchInterval?: number;
  /** 单次批量最大数量 */
  maxBatchSize?: number;
  /** 是否启用增量同步 */
  enableDeltaSync?: boolean;
  /** 是否启用权限检查 */
  enablePermissionCheck?: boolean;
  /** 是否启用数据验证 */
  enableDataValidation?: boolean;
  /** 最大同步频率(次/秒) */
  maxSyncRate?: number;
}

/**
 * 网络对象状态
 */
export interface NetworkObjectState {
  /** 网络对象ID */
  networkId: number;
  /** 拥有者客户端ID */
  ownerId: string;
  /** 组件状态 */
  components: Map<string, Map<string, NetworkValue>>;
  /** 最后更新时间 */
  lastUpdateTime: Date;
  /** 权威状态 */
  hasAuthority: boolean;
}

/**
 * SyncVar 系统事件
 */
export interface SyncVarSystemEvents {
  /** SyncVar 值变化 */
  'syncvar-changed': (change: SyncVarChange) => void;
  /** 同步批次完成 */
  'batch-synced': (changes: SyncVarChange[], targetClients: string[]) => void;
  /** 权限验证失败 */
  'permission-denied': (clientId: string, change: SyncVarChange) => void;
  /** 数据验证失败 */
  'validation-failed': (clientId: string, change: SyncVarChange, reason: string) => void;
  /** 同步错误 */
  'sync-error': (error: Error, clientId?: string) => void;
}

/**
 * 客户端同步状态
 */
interface ClientSyncState {
  /** 客户端ID */
  clientId: string;
  /** 待同步的变化列表 */
  pendingChanges: SyncVarChange[];
  /** 最后同步时间 */
  lastSyncTime: Date;
  /** 同步频率限制 */
  syncCount: number;
  /** 频率重置时间 */
  rateResetTime: Date;
}

/**
 * SyncVar 同步系统
 */
export class SyncVarSystem extends EventEmitter {
  private config: SyncVarSystemConfig;
  private networkObjects = new Map<number, NetworkObjectState>();
  private clientSyncStates = new Map<string, ClientSyncState>();
  private serializer: NetworkSerializer;
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(config: SyncVarSystemConfig = {}) {
    super();
    
    this.config = {
      batchInterval: 50, // 50ms批量间隔
      maxBatchSize: 100,
      enableDeltaSync: true,
      enablePermissionCheck: true,
      enableDataValidation: true,
      maxSyncRate: 60, // 60次/秒
      ...config
    };

    this.serializer = new NetworkSerializer();
    this.initialize();
  }

  /**
   * 注册网络对象
   */
  registerNetworkObject(
    networkId: number, 
    ownerId: string, 
    hasAuthority: boolean = true
  ): void {
    if (this.networkObjects.has(networkId)) {
      console.warn(`Network object ${networkId} is already registered`);
      return;
    }

    const networkObject: NetworkObjectState = {
      networkId,
      ownerId,
      components: new Map(),
      lastUpdateTime: new Date(),
      hasAuthority
    };

    this.networkObjects.set(networkId, networkObject);
    console.log(`Network object registered: ${networkId} owned by ${ownerId}`);
  }

  /**
   * 注销网络对象
   */
  unregisterNetworkObject(networkId: number): boolean {
    const removed = this.networkObjects.delete(networkId);
    if (removed) {
      console.log(`Network object unregistered: ${networkId}`);
    }
    return removed;
  }

  /**
   * 获取网络对象
   */
  getNetworkObject(networkId: number): NetworkObjectState | undefined {
    return this.networkObjects.get(networkId);
  }

  /**
   * 处理 SyncVar 变化消息
   */
  async handleSyncVarChange(
    client: ClientConnection, 
    message: TransportMessage,
    room?: Room
  ): Promise<void> {
    try {
      const data = message.data as any;
      const {
        networkId,
        componentType,
        propertyName,
        oldValue,
        newValue,
        metadata
      } = data;

      // 创建变化记录
      const change: SyncVarChange = {
        networkId,
        componentType,
        propertyName,
        oldValue,
        newValue,
        metadata,
        senderId: client.id,
        timestamp: new Date()
      };

      // 权限检查
      if (this.config.enablePermissionCheck) {
        if (!this.checkSyncVarPermission(client, change)) {
          this.emit('permission-denied', client.id, change);
          return;
        }
      }

      // 频率限制检查
      if (!this.checkSyncRate(client.id)) {
        console.warn(`SyncVar rate limit exceeded for client ${client.id}`);
        return;
      }

      // 数据验证
      if (this.config.enableDataValidation) {
        const validationResult = this.validateSyncVarData(change);
        if (!validationResult.valid) {
          this.emit('validation-failed', client.id, change, validationResult.reason!);
          return;
        }
      }

      // 更新网络对象状态
      this.updateNetworkObjectState(change);

      // 触发变化事件
      this.emit('syncvar-changed', change);

      // 添加到待同步列表
      if (room) {
        this.addToBatchSync(change, room);
      }

    } catch (error) {
      this.emit('sync-error', error as Error, client.id);
    }
  }

  /**
   * 获取网络对象的完整状态
   */
  getNetworkObjectSnapshot(networkId: number): Record<string, any> | null {
    const networkObject = this.networkObjects.get(networkId);
    if (!networkObject) {
      return null;
    }

    const snapshot: Record<string, any> = {};
    
    for (const [componentType, componentData] of networkObject.components) {
      snapshot[componentType] = {};
      for (const [propertyName, value] of componentData) {
        snapshot[componentType][propertyName] = value;
      }
    }

    return snapshot;
  }

  /**
   * 向客户端发送网络对象快照
   */
  async sendNetworkObjectSnapshot(
    client: ClientConnection, 
    networkId: number
  ): Promise<boolean> {
    const snapshot = this.getNetworkObjectSnapshot(networkId);
    if (!snapshot) {
      return false;
    }

    const message: TransportMessage = {
      type: 'syncvar',
      data: {
        action: 'snapshot',
        networkId,
        snapshot
      }
    };

    return await client.sendMessage(message);
  }

  /**
   * 同步所有网络对象给新客户端
   */
  async syncAllNetworkObjects(client: ClientConnection, room: Room): Promise<number> {
    let syncedCount = 0;

    for (const networkObject of this.networkObjects.values()) {
      // 检查客户端是否有权限看到这个网络对象
      if (this.canClientSeeNetworkObject(client.id, networkObject)) {
        const success = await this.sendNetworkObjectSnapshot(client, networkObject.networkId);
        if (success) {
          syncedCount++;
        }
      }
    }

    console.log(`Synced ${syncedCount} network objects to client ${client.id}`);
    return syncedCount;
  }

  /**
   * 设置网络对象拥有者
   */
  setNetworkObjectOwner(networkId: number, newOwnerId: string): boolean {
    const networkObject = this.networkObjects.get(networkId);
    if (!networkObject) {
      return false;
    }

    const oldOwnerId = networkObject.ownerId;
    networkObject.ownerId = newOwnerId;
    networkObject.lastUpdateTime = new Date();

    console.log(`Network object ${networkId} ownership changed: ${oldOwnerId} -> ${newOwnerId}`);
    return true;
  }

  /**
   * 获取网络对象拥有者
   */
  getNetworkObjectOwner(networkId: number): string | undefined {
    const networkObject = this.networkObjects.get(networkId);
    return networkObject?.ownerId;
  }

  /**
   * 销毁 SyncVar 系统
   */
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    this.networkObjects.clear();
    this.clientSyncStates.clear();
    this.removeAllListeners();
  }

  /**
   * 初始化系统
   */
  private initialize(): void {
    // 启动批量同步定时器
    if (this.config.batchInterval && this.config.batchInterval > 0) {
      this.batchTimer = setInterval(() => {
        this.processBatchSync();
      }, this.config.batchInterval);
    }
  }

  /**
   * 检查 SyncVar 权限
   */
  private checkSyncVarPermission(client: ClientConnection, change: SyncVarChange): boolean {
    // 检查客户端是否有网络同步权限
    if (!client.hasPermission('canSyncVars')) {
      return false;
    }

    // 获取网络对象
    const networkObject = this.networkObjects.get(change.networkId);
    if (!networkObject) {
      return false;
    }

    // 检查权威权限
    if (change.metadata.authorityOnly) {
      // 只有网络对象拥有者或有权威权限的客户端可以修改
      return networkObject.ownerId === client.id || networkObject.hasAuthority;
    }

    return true;
  }

  /**
   * 检查同步频率
   */
  private checkSyncRate(clientId: string): boolean {
    if (!this.config.maxSyncRate || this.config.maxSyncRate <= 0) {
      return true;
    }

    const now = new Date();
    let syncState = this.clientSyncStates.get(clientId);

    if (!syncState) {
      syncState = {
        clientId,
        pendingChanges: [],
        lastSyncTime: now,
        syncCount: 1,
        rateResetTime: new Date(now.getTime() + 1000) // 1秒后重置
      };
      this.clientSyncStates.set(clientId, syncState);
      return true;
    }

    // 检查是否需要重置计数
    if (now >= syncState.rateResetTime) {
      syncState.syncCount = 1;
      syncState.rateResetTime = new Date(now.getTime() + 1000);
      return true;
    }

    // 检查频率限制
    if (syncState.syncCount >= this.config.maxSyncRate) {
      return false;
    }

    syncState.syncCount++;
    return true;
  }

  /**
   * 验证 SyncVar 数据
   */
  private validateSyncVarData(change: SyncVarChange): { valid: boolean; reason?: string } {
    // 基本类型检查
    if (change.newValue === null || change.newValue === undefined) {
      return { valid: false, reason: 'Value cannot be null or undefined' };
    }

    // 检查数据大小（防止过大的数据）
    try {
      const serialized = JSON.stringify(change.newValue);
      if (serialized.length > 65536) { // 64KB限制
        return { valid: false, reason: 'Data too large' };
      }
    } catch (error) {
      return { valid: false, reason: 'Data is not serializable' };
    }

    // 可以添加更多特定的验证逻辑
    return { valid: true };
  }

  /**
   * 更新网络对象状态
   */
  private updateNetworkObjectState(change: SyncVarChange): void {
    let networkObject = this.networkObjects.get(change.networkId);
    
    if (!networkObject) {
      // 如果网络对象不存在，创建一个新的（可能是客户端创建的）
      networkObject = {
        networkId: change.networkId,
        ownerId: change.senderId,
        components: new Map(),
        lastUpdateTime: new Date(),
        hasAuthority: true
      };
      this.networkObjects.set(change.networkId, networkObject);
    }

    // 获取或创建组件数据
    let componentData = networkObject.components.get(change.componentType);
    if (!componentData) {
      componentData = new Map();
      networkObject.components.set(change.componentType, componentData);
    }

    // 更新属性值
    componentData.set(change.propertyName, change.newValue);
    networkObject.lastUpdateTime = change.timestamp;
  }

  /**
   * 添加到批量同步
   */
  private addToBatchSync(change: SyncVarChange, room: Room): void {
    // 获取房间内需要同步的客户端
    const roomPlayers = room.getPlayers();
    const targetClientIds = roomPlayers
      .filter(player => player.client.id !== change.senderId) // 不发送给发送者
      .map(player => player.client.id);

    // 为每个目标客户端添加变化记录
    for (const clientId of targetClientIds) {
      let syncState = this.clientSyncStates.get(clientId);
      if (!syncState) {
        syncState = {
          clientId,
          pendingChanges: [],
          lastSyncTime: new Date(),
          syncCount: 0,
          rateResetTime: new Date()
        };
        this.clientSyncStates.set(clientId, syncState);
      }

      syncState.pendingChanges.push(change);
    }
  }

  /**
   * 处理批量同步
   */
  private async processBatchSync(): Promise<void> {
    const syncPromises: Promise<void>[] = [];

    for (const [clientId, syncState] of this.clientSyncStates.entries()) {
      if (syncState.pendingChanges.length === 0) {
        continue;
      }

      // 获取要同步的变化（限制批量大小）
      const changesToSync = syncState.pendingChanges.splice(
        0, 
        this.config.maxBatchSize
      );

      if (changesToSync.length > 0) {
        syncPromises.push(this.sendBatchChanges(clientId, changesToSync));
      }
    }

    if (syncPromises.length > 0) {
      await Promise.allSettled(syncPromises);
    }
  }

  /**
   * 发送批量变化
   */
  private async sendBatchChanges(clientId: string, changes: SyncVarChange[]): Promise<void> {
    try {
      // 这里需要获取客户端连接，实际实现中可能需要从外部传入
      // 为了简化，这里假设有一个方法可以获取客户端连接
      // 实际使用时，可能需要通过回调或事件来发送消息

      const message: TransportMessage = {
        type: 'syncvar',
        data: {
          action: 'batch-update',
          changes: changes.map(change => ({
            networkId: change.networkId,
            componentType: change.componentType,
            propertyName: change.propertyName,
            newValue: change.newValue,
            metadata: change.metadata as any,
            timestamp: change.timestamp.getTime()
          }))
        } as any
      };

      // 这里需要实际的发送逻辑
      // 在实际使用中，应该通过事件或回调来发送消息
      this.emit('batch-synced', changes, [clientId]);

    } catch (error) {
      this.emit('sync-error', error as Error, clientId);
    }
  }

  /**
   * 检查客户端是否可以看到网络对象
   */
  private canClientSeeNetworkObject(clientId: string, networkObject: NetworkObjectState): boolean {
    // 基本实现：客户端可以看到自己拥有的对象和公共对象
    // 实际实现中可能需要更复杂的可见性逻辑
    return true;
  }

  /**
   * 类型安全的事件监听
   */
  override on<K extends keyof SyncVarSystemEvents>(event: K, listener: SyncVarSystemEvents[K]): this {
    return super.on(event, listener);
  }

  /**
   * 类型安全的事件触发
   */
  override emit<K extends keyof SyncVarSystemEvents>(event: K, ...args: Parameters<SyncVarSystemEvents[K]>): boolean {
    return super.emit(event, ...args);
  }
}