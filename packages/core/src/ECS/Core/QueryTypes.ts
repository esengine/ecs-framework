import { ComponentType } from './ComponentStorage';
import { BitMask64Data } from '../Utils/BigIntCompatibility';
import { Entity } from '../Entity';

/**
 * 查询条件类型
 */
export enum QueryConditionType {
    /** 必须包含所有指定组件 */
    ALL = 'all',
    /** 必须包含任意一个指定组件 */
    ANY = 'any',
    /** 不能包含任何指定组件 */
    NONE = 'none'
}

/**
 * 查询条件接口
 */
export interface QueryCondition {
    type: QueryConditionType;
    componentTypes: ComponentType[];
    mask: BitMask64Data;
}

/**
 * 实体查询结果接口
 */
export interface QueryResult {
    entities: readonly Entity[];
    count: number;
    /** 查询执行时间（毫秒） */
    executionTime: number;
    /** 是否来自缓存 */
    fromCache: boolean;
}
