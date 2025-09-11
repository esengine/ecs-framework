/**
 * ECS Framework Math Library
 * 
 * 2D数学库，为游戏开发提供完整的数学工具
 * - 基础数学类（向量、矩阵、几何形状）
 * - 碰撞检测算法
 * - 动画插值和缓动函数
 * - 数学工具函数
 */

// 核心数学类
export { Vector2, Vector2Object } from './Vector2';
export { Matrix3 } from './Matrix3';
export { Rectangle, RectangleObject } from './Rectangle';
export { Circle, CircleObject } from './Circle';

// 数学工具
export { MathUtils } from './MathUtils';

// 碰撞检测
export * from './Collision';

// 动画和插值
export * from './Animation';