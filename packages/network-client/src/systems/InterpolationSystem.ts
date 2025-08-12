/**
 * 客户端插值系统
 * 
 * 实现网络对象的平滑插值
 */

import { EntitySystem, Entity, Matcher, Time } from '@esengine/ecs-framework';
import { NetworkValue } from '@esengine/ecs-framework-network-shared';
import { NetworkIdentity } from '../core/NetworkIdentity';
import { IInterpolatable } from '../interfaces/NetworkInterfaces';

/**
 * 插值状态快照
 */
export interface InterpolationSnapshot {
  /** 时间戳 */
  timestamp: number;
  /** 网络ID */
  networkId: string;
  /** 状态数据 */
  state: NetworkValue;
}

/**
 * 插值目标
 */
export interface InterpolationTarget {
  /** 网络ID */
  networkId: string;
  /** 起始状态 */
  fromState: NetworkValue;
  /** 目标状态 */
  toState: NetworkValue;
  /** 起始时间 */
  fromTime: number;
  /** 结束时间 */
  toTime: number;
  /** 当前插值进度 (0-1) */
  progress: number;
}

/**
 * 插值配置
 */
export interface InterpolationConfig {
  /** 插值延迟(毫秒) */
  delay: number;
  /** 最大插值时间(毫秒) */
  maxTime: number;
  /** 插值缓冲区大小 */
  bufferSize: number;
  /** 外推是否启用 */
  enableExtrapolation: boolean;
  /** 最大外推时间(毫秒) */
  maxExtrapolationTime: number;
}

/**
 * 插值算法类型
 */
export enum InterpolationType {
  /** 线性插值 */
  LINEAR = 'linear',
  /** 平滑插值 */
  SMOOTHSTEP = 'smoothstep',
  /** 三次贝塞尔插值 */
  CUBIC = 'cubic'
}

/**
 * 客户端插值系统
 */
export class InterpolationSystem extends EntitySystem {
  /** 插值状态缓冲区 */
  private stateBuffer: Map<string, InterpolationSnapshot[]> = new Map();
  /** 当前插值目标 */
  private interpolationTargets: Map<string, InterpolationTarget> = new Map();
  /** 插值配置 */
  private config: InterpolationConfig;
  /** 当前时间 */
  private currentTime: number = 0;

  constructor(config?: Partial<InterpolationConfig>) {
    // 使用Matcher查询具有NetworkIdentity的实体
    super(Matcher.all(NetworkIdentity));
    
    this.config = {
      delay: 100,
      maxTime: 500,
      bufferSize: 32,
      enableExtrapolation: false,
      maxExtrapolationTime: 50,
      ...config
    };
    
    this.currentTime = Date.now();
  }

  /**
   * 系统初始化
   */
  override initialize(): void {
    super.initialize();
    this.currentTime = Date.now();
  }

  /**
   * 系统更新
   */
  override update(): void {
    this.currentTime = Date.now();
    this.cleanupOldStates();
    
    // 调用父类update，会自动调用process方法处理匹配的实体
    super.update();
  }

  /**
   * 处理匹配的实体
   */
  protected override process(entities: Entity[]): void {
    const interpolationTime = this.currentTime - this.config.delay;

    for (const entity of entities) {
      const networkIdentity = entity.getComponent(NetworkIdentity);
      
      if (networkIdentity && networkIdentity.isInterpolationEnabled) {
        const networkId = networkIdentity.networkId;
        const target = this.interpolationTargets.get(networkId);
        
        if (target) {
          // 计算插值进度
          const duration = target.toTime - target.fromTime;
          if (duration > 0) {
            const elapsed = interpolationTime - target.fromTime;
            target.progress = Math.max(0, Math.min(1, elapsed / duration));

            // 执行插值
            const interpolatedState = this.interpolateStates(
              target.fromState,
              target.toState,
              target.progress,
              InterpolationType.LINEAR
            );

            // 应用插值状态
            this.applyInterpolatedState(entity, interpolatedState);

            // 检查是否需要外推
            if (target.progress >= 1 && this.config.enableExtrapolation) {
              this.performExtrapolation(entity, target, interpolationTime);
            }
          }
        }
      }
    }
  }

  /**
   * 添加网络状态快照
   */
  addStateSnapshot(networkId: string, state: NetworkValue, timestamp: number): void {
    // 获取或创建缓冲区
    if (!this.stateBuffer.has(networkId)) {
      this.stateBuffer.set(networkId, []);
    }

    const buffer = this.stateBuffer.get(networkId)!;
    
    const snapshot: InterpolationSnapshot = {
      timestamp,
      networkId,
      state
    };

    // 插入到正确的位置（按时间戳排序）
    const insertIndex = this.findInsertIndex(buffer, timestamp);
    buffer.splice(insertIndex, 0, snapshot);

    // 保持缓冲区大小
    if (buffer.length > this.config.bufferSize) {
      buffer.shift();
    }

    // 更新插值目标
    this.updateInterpolationTarget(networkId);
  }


  /**
   * 更新插值目标
   */
  private updateInterpolationTarget(networkId: string): void {
    const buffer = this.stateBuffer.get(networkId);
    if (!buffer || buffer.length < 2) {
      return;
    }

    const interpolationTime = this.currentTime - this.config.delay;
    
    // 查找插值区间
    const { from, to } = this.findInterpolationRange(buffer, interpolationTime);
    
    if (!from || !to) {
      return;
    }

    // 更新或创建插值目标
    this.interpolationTargets.set(networkId, {
      networkId,
      fromState: from.state,
      toState: to.state,
      fromTime: from.timestamp,
      toTime: to.timestamp,
      progress: 0
    });
  }

  /**
   * 查找插值区间
   */
  private findInterpolationRange(buffer: InterpolationSnapshot[], time: number): {
    from: InterpolationSnapshot | null;
    to: InterpolationSnapshot | null;
  } {
    let from: InterpolationSnapshot | null = null;
    let to: InterpolationSnapshot | null = null;

    for (let i = 0; i < buffer.length - 1; i++) {
      const current = buffer[i];
      const next = buffer[i + 1];

      if (time >= current.timestamp && time <= next.timestamp) {
        from = current;
        to = next;
        break;
      }
    }

    // 如果没有找到区间，使用最近的两个状态
    if (!from && !to && buffer.length >= 2) {
      if (time < buffer[0].timestamp) {
        // 时间过早，使用前两个状态
        from = buffer[0];
        to = buffer[1];
      } else if (time > buffer[buffer.length - 1].timestamp) {
        // 时间过晚，使用后两个状态
        from = buffer[buffer.length - 2];
        to = buffer[buffer.length - 1];
      }
    }

    return { from, to };
  }

  /**
   * 状态插值
   */
  private interpolateStates(
    fromState: NetworkValue,
    toState: NetworkValue,
    progress: number,
    type: InterpolationType
  ): NetworkValue {
    // 调整插值进度曲线
    const adjustedProgress = this.adjustProgress(progress, type);
    
    try {
      return this.interpolateValue(fromState, toState, adjustedProgress);
    } catch (error) {
      console.error('Error interpolating states:', error);
      return toState; // 出错时返回目标状态
    }
  }

  /**
   * 递归插值值
   */
  private interpolateValue(from: NetworkValue, to: NetworkValue, progress: number): NetworkValue {
    // 如果类型不同，直接返回目标值
    if (typeof from !== typeof to) {
      return to;
    }

    // 数字插值
    if (typeof from === 'number' && typeof to === 'number') {
      return from + (to - from) * progress;
    }

    // 字符串插值（直接切换）
    if (typeof from === 'string' && typeof to === 'string') {
      return progress < 0.5 ? from : to;
    }

    // 布尔插值（直接切换）
    if (typeof from === 'boolean' && typeof to === 'boolean') {
      return progress < 0.5 ? from : to;
    }

    // 数组插值
    if (Array.isArray(from) && Array.isArray(to)) {
      const result: NetworkValue[] = [];
      const maxLength = Math.max(from.length, to.length);
      
      for (let i = 0; i < maxLength; i++) {
        const fromValue = i < from.length ? from[i] : to[i];
        const toValue = i < to.length ? to[i] : from[i];
        result[i] = this.interpolateValue(fromValue, toValue, progress);
      }
      
      return result;
    }

    // 对象插值
    if (from && to && typeof from === 'object' && typeof to === 'object') {
      const result: any = {};
      const allKeys = new Set([...Object.keys(from), ...Object.keys(to)]);
      
      for (const key of allKeys) {
        const fromValue = (from as any)[key];
        const toValue = (to as any)[key];
        
        if (fromValue !== undefined && toValue !== undefined) {
          result[key] = this.interpolateValue(fromValue, toValue, progress);
        } else {
          result[key] = toValue !== undefined ? toValue : fromValue;
        }
      }
      
      return result;
    }

    // 其他类型直接返回目标值
    return to;
  }

  /**
   * 调整插值进度曲线
   */
  private adjustProgress(progress: number, type: InterpolationType): number {
    switch (type) {
      case InterpolationType.LINEAR:
        return progress;
        
      case InterpolationType.SMOOTHSTEP:
        return progress * progress * (3 - 2 * progress);
        
      case InterpolationType.CUBIC:
        return progress < 0.5 
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          
      default:
        return progress;
    }
  }

  /**
   * 应用插值状态到实体
   */
  private applyInterpolatedState(entity: Entity, state: NetworkValue): void {
    // 获取所有可插值的组件
    const components: any[] = [];
    for (const component of components) {
      if (this.isInterpolatable(component)) {
        try {
          (component as IInterpolatable).applyInterpolatedState(state);
        } catch (error) {
          console.error('Error applying interpolated state:', error);
        }
      }
    }

    // 更新NetworkIdentity中的状态
    const networkIdentity = entity.getComponent(NetworkIdentity);
    if (networkIdentity && typeof networkIdentity.deserializeState === 'function') {
      try {
        networkIdentity.deserializeState(state);
      } catch (error) {
        console.error('Error deserializing interpolated state:', error);
      }
    }
  }

  /**
   * 检查组件是否实现了IInterpolatable接口
   */
  private isInterpolatable(component: any): component is IInterpolatable {
    return component && typeof component.applyInterpolatedState === 'function';
  }

  /**
   * 执行外推
   */
  private performExtrapolation(entity: Entity, target: InterpolationTarget, currentTime: number): void {
    if (!this.config.enableExtrapolation) {
      return;
    }

    const extrapolationTime = currentTime - target.toTime;
    if (extrapolationTime > this.config.maxExtrapolationTime) {
      return;
    }

    // 计算外推状态
    const extrapolationProgress = extrapolationTime / (target.toTime - target.fromTime);
    const extrapolatedState = this.extrapolateState(
      target.fromState,
      target.toState,
      1 + extrapolationProgress
    );

    // 应用外推状态
    this.applyInterpolatedState(entity, extrapolatedState);
  }

  /**
   * 状态外推
   */
  private extrapolateState(fromState: NetworkValue, toState: NetworkValue, progress: number): NetworkValue {
    // 简单的线性外推
    return this.interpolateValue(fromState, toState, progress);
  }

  /**
   * 查找插入位置
   */
  private findInsertIndex(buffer: InterpolationSnapshot[], timestamp: number): number {
    let left = 0;
    let right = buffer.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (buffer[mid].timestamp < timestamp) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  /**
   * 清理过期状态
   */
  private cleanupOldStates(): void {
    const cutoffTime = this.currentTime - this.config.maxTime;

    this.stateBuffer.forEach((buffer, networkId) => {
      // 移除过期的状态
      const validStates = buffer.filter(snapshot => snapshot.timestamp > cutoffTime);
      
      if (validStates.length !== buffer.length) {
        this.stateBuffer.set(networkId, validStates);
      }

      // 如果缓冲区为空，移除它
      if (validStates.length === 0) {
        this.stateBuffer.delete(networkId);
        this.interpolationTargets.delete(networkId);
      }
    });
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
   * 设置插值配置
   */
  setInterpolationConfig(config: Partial<InterpolationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取插值统计信息
   */
  getInterpolationStats(): { [networkId: string]: { bufferSize: number; progress: number } } {
    const stats: { [networkId: string]: { bufferSize: number; progress: number } } = {};
    
    this.stateBuffer.forEach((buffer, networkId) => {
      const target = this.interpolationTargets.get(networkId);
      stats[networkId] = {
        bufferSize: buffer.length,
        progress: target ? target.progress : 0
      };
    });

    return stats;
  }

  /**
   * 清空所有插值数据
   */
  clearInterpolationData(): void {
    this.stateBuffer.clear();
    this.interpolationTargets.clear();
  }

  /**
   * 系统销毁
   */
  onDestroy(): void {
    this.clearInterpolationData();
  }
}

