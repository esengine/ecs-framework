/**
 * 客户端预测系统
 * 
 * 实现客户端预测和服务器和解
 */

import { EntitySystem, Entity, Matcher, Time } from '@esengine/ecs-framework';
import { NetworkValue } from '@esengine/ecs-framework-network-shared';
import { NetworkIdentity } from '../core/NetworkIdentity';
import { IPredictable } from '../interfaces/NetworkInterfaces';

/**
 * 预测状态快照
 */
export interface PredictionSnapshot {
  /** 时间戳 */
  timestamp: number;
  /** 网络ID */
  networkId: string;
  /** 状态数据 */
  state: NetworkValue;
  /** 输入数据 */
  inputs?: NetworkValue;
}

/**
 * 预测输入
 */
export interface PredictionInput {
  /** 时间戳 */
  timestamp: number;
  /** 输入数据 */
  data: NetworkValue;
}

/**
 * 客户端预测系统
 */
export class PredictionSystem extends EntitySystem {
  /** 预测状态缓冲区 */
  private predictionBuffer: Map<string, PredictionSnapshot[]> = new Map();
  /** 输入缓冲区 */
  private inputBuffer: PredictionInput[] = [];
  /** 最大缓冲区大小 */
  private maxBufferSize: number = 64;
  /** 预测时间窗口(毫秒) */
  private predictionWindow: number = 500;
  /** 当前预测时间戳 */
  private currentPredictionTime: number = 0;

  constructor(maxBufferSize = 64, predictionWindow = 500) {
    // 使用Matcher查询具有NetworkIdentity的实体
    super(Matcher.all(NetworkIdentity));
    
    this.maxBufferSize = maxBufferSize;
    this.predictionWindow = predictionWindow;
    this.currentPredictionTime = Date.now();
  }

  /**
   * 系统初始化
   */
  override initialize(): void {
    super.initialize();
    this.currentPredictionTime = Date.now();
  }

  /**
   * 系统更新
   */
  override update(): void {
    this.currentPredictionTime = Date.now();
    this.cleanupOldSnapshots();
    
    // 调用父类update，会自动调用process方法处理匹配的实体
    super.update();
  }

  /**
   * 处理匹配的实体
   */
  protected override process(entities: Entity[]): void {
    for (const entity of entities) {
      const networkIdentity = entity.getComponent(NetworkIdentity);
      
      if (networkIdentity && 
          networkIdentity.isPredictionEnabled && 
          networkIdentity.isLocalPlayer) {
        
        // 保存当前状态快照
        this.saveSnapshot(entity);
        
        // 应用当前输入进行预测
        const currentInputs = this.getCurrentInputs();
        if (currentInputs) {
          this.applyInputs(entity, currentInputs, this.currentPredictionTime);
        }
      }
    }
  }

  /**
   * 添加预测输入
   */
  addInput(input: PredictionInput): void {
    this.inputBuffer.push(input);
    
    // 保持输入缓冲区大小
    if (this.inputBuffer.length > this.maxBufferSize) {
      this.inputBuffer.shift();
    }
    
    // 按时间戳排序
    this.inputBuffer.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 保存预测状态快照
   */
  saveSnapshot(entity: Entity): void {
    const networkIdentity = entity.getComponent(NetworkIdentity);
    if (!networkIdentity || !networkIdentity.isPredictionEnabled) {
      return;
    }

    const networkId = networkIdentity.networkId;
    const snapshot: PredictionSnapshot = {
      timestamp: this.currentPredictionTime,
      networkId,
      state: networkIdentity.serializeState(),
      inputs: this.getCurrentInputs() || undefined
    };

    // 获取或创建缓冲区
    if (!this.predictionBuffer.has(networkId)) {
      this.predictionBuffer.set(networkId, []);
    }

    const buffer = this.predictionBuffer.get(networkId)!;
    buffer.push(snapshot);

    // 保持缓冲区大小
    if (buffer.length > this.maxBufferSize) {
      buffer.shift();
    }
  }

  /**
   * 从服务器接收权威状态进行和解
   */
  reconcileWithServer(networkId: string, serverState: NetworkValue, serverTimestamp: number): void {
    const buffer = this.predictionBuffer.get(networkId);
    if (!buffer || buffer.length === 0) {
      return;
    }

    // 查找对应时间戳的预测状态
    const predictionSnapshot = this.findSnapshot(buffer, serverTimestamp);
    if (!predictionSnapshot) {
      return;
    }

    // 比较预测状态和服务器状态
    if (this.statesMatch(predictionSnapshot.state, serverState)) {
      // 预测正确，移除已确认的快照
      this.removeSnapshotsBeforeTimestamp(buffer, serverTimestamp);
      return;
    }

    // 预测错误，需要进行和解
    this.performReconciliation(networkId, serverState, serverTimestamp);
  }

  /**
   * 执行预测和解
   */
  private performReconciliation(networkId: string, serverState: NetworkValue, serverTimestamp: number): void {
    const entity = this.findEntityByNetworkId(networkId);
    if (!entity) {
      return;
    }

    const networkIdentity = entity.getComponent(NetworkIdentity);
    if (!networkIdentity) {
      return;
    }

    // 回滚到服务器状态
    if (typeof networkIdentity.deserializeState === 'function') {
      networkIdentity.deserializeState(serverState);
    }

    // 重新应用服务器时间戳之后的输入
    const buffer = this.predictionBuffer.get(networkId)!;
    const snapshotsToReplay = buffer.filter(snapshot => snapshot.timestamp > serverTimestamp);

    for (const snapshot of snapshotsToReplay) {
      if (snapshot.inputs) {
        this.applyInputs(entity, snapshot.inputs, snapshot.timestamp);
      }
    }

    // 清理已和解的快照
    this.removeSnapshotsBeforeTimestamp(buffer, serverTimestamp);
  }


  /**
   * 应用输入进行预测计算
   */
  private applyInputs(entity: Entity, inputs: NetworkValue, timestamp: number): void {
    const networkIdentity = entity.getComponent(NetworkIdentity);
    if (!networkIdentity) return;

    // 获取实体的所有组件并检查是否实现了IPredictable接口
    const components: any[] = [];
    for (const component of components) {
      if (this.isPredictable(component)) {
        try {
          (component as IPredictable).predictUpdate(inputs, timestamp);
        } catch (error) {
          console.error('Error applying prediction:', error);
        }
      }
    }
  }

  /**
   * 检查组件是否实现了IPredictable接口
   */
  private isPredictable(component: any): component is IPredictable {
    return component && typeof component.predictUpdate === 'function';
  }

  /**
   * 获取当前输入
   */
  private getCurrentInputs(): NetworkValue | null {
    if (this.inputBuffer.length === 0) {
      return null;
    }

    // 获取最新的输入
    return this.inputBuffer[this.inputBuffer.length - 1].data;
  }

  /**
   * 查找指定时间戳的快照
   */
  private findSnapshot(buffer: PredictionSnapshot[], timestamp: number): PredictionSnapshot | null {
    // 查找最接近的快照
    let closest: PredictionSnapshot | null = null;
    let minDiff = Number.MAX_SAFE_INTEGER;

    for (const snapshot of buffer) {
      const diff = Math.abs(snapshot.timestamp - timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = snapshot;
      }
    }

    return closest;
  }

  /**
   * 比较两个状态是否匹配
   */
  private statesMatch(predictedState: NetworkValue, serverState: NetworkValue): boolean {
    try {
      // 简单的JSON比较，实际应用中可能需要更精确的比较
      return JSON.stringify(predictedState) === JSON.stringify(serverState);
    } catch (error) {
      return false;
    }
  }

  /**
   * 移除指定时间戳之前的快照
   */
  private removeSnapshotsBeforeTimestamp(buffer: PredictionSnapshot[], timestamp: number): void {
    for (let i = buffer.length - 1; i >= 0; i--) {
      if (buffer[i].timestamp < timestamp) {
        buffer.splice(0, i + 1);
        break;
      }
    }
  }

  /**
   * 清理过期的快照
   */
  private cleanupOldSnapshots(): void {
    const cutoffTime = this.currentPredictionTime - this.predictionWindow;

    this.predictionBuffer.forEach((buffer, networkId) => {
      this.removeSnapshotsBeforeTimestamp(buffer, cutoffTime);
      
      // 如果缓冲区为空，移除它
      if (buffer.length === 0) {
        this.predictionBuffer.delete(networkId);
      }
    });

    // 清理过期的输入
    this.inputBuffer = this.inputBuffer.filter(input => 
      input.timestamp > cutoffTime
    );
  }

  /**
   * 根据网络ID查找实体
   */
  private findEntityByNetworkId(networkId: string): Entity | null {
    // 使用系统的entities属性来查找
    for (const entity of this.entities) {
      const networkIdentity = entity.getComponent(NetworkIdentity);
      if (networkIdentity && networkIdentity.networkId === networkId) {
        return entity;
      }
    }

    return null;
  }

  /**
   * 设置预测配置
   */
  setPredictionConfig(maxBufferSize: number, predictionWindow: number): void {
    this.maxBufferSize = maxBufferSize;
    this.predictionWindow = predictionWindow;
  }

  /**
   * 获取预测统计信息
   */
  getPredictionStats(): { [networkId: string]: number } {
    const stats: { [networkId: string]: number } = {};
    
    this.predictionBuffer.forEach((buffer, networkId) => {
      stats[networkId] = buffer.length;
    });

    return stats;
  }

  /**
   * 清空所有预测数据
   */
  clearPredictionData(): void {
    this.predictionBuffer.clear();
    this.inputBuffer = [];
  }

  /**
   * 系统销毁
   */
  onDestroy(): void {
    this.clearPredictionData();
  }
}

