/**
 * 网络系统相关接口
 */

import { NetworkValue } from '@esengine/ecs-framework-network-shared';

/**
 * 可预测组件接口
 * 
 * 实现此接口的组件可以参与客户端预测系统
 */
export interface IPredictable {
  /**
   * 预测更新
   * 
   * @param inputs 输入数据
   * @param timestamp 时间戳
   */
  predictUpdate(inputs: NetworkValue, timestamp: number): void;
}

/**
 * 可插值组件接口
 * 
 * 实现此接口的组件可以参与插值系统
 */
export interface IInterpolatable {
  /**
   * 应用插值状态
   * 
   * @param state 插值后的状态数据
   */
  applyInterpolatedState(state: NetworkValue): void;
}