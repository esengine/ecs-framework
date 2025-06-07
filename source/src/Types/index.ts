/**
 * 框架核心类型定义
 */

/** 更新顺序比较器接口 */
export interface IUpdateOrderComparable {
    updateOrder: number;
}

/** 日志类型枚举 */
export enum LogType {
    Error = 0,
    Assert = 1,
    Warning = 2,
    Log = 3,
    Exception = 4
}

/** 组件变换类型枚举 */
export enum ComponentTransform {
    Position = 1,
    Scale = 2,
    Rotation = 4
} 