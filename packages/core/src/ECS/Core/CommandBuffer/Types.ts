/**
 * CommandBuffer类型定义
 * 
 * 定义命令缓冲系统的基础类型和接口
 */

import { Component } from '../../Component';
import { Entity } from '../../Entity';

/**
 * 实体ID类型
 */
export type EntityId = number;

/**
 * 操作类型枚举
 * 
 * 定义了命令缓冲支持的操作类型，按执行优先级排序
 */
export enum OpType {
    CREATE = 0,   // 创建实体
    ADD = 1,      // 添加组件
    REMOVE = 2,   // 移除组件
    DESTROY = 3   // 销毁实体
}

/**
 * 添加组件操作
 */
export interface AddOp {
    /** 操作类型 */
    t: OpType.ADD;
    /** 目标实体ID */
    e: EntityId;
    /** 组件构造函数 */
    C: new (...args: any[]) => Component;
    /** 组件构造参数 */
    data?: any[];
    /** 操作序号（用于稳定排序） */
    order?: number;
}

/**
 * 移除组件操作
 */
export interface RemoveOp {
    /** 操作类型 */
    t: OpType.REMOVE;
    /** 目标实体ID */
    e: EntityId;
    /** 组件构造函数 */
    C: new (...args: any[]) => Component;
    /** 操作序号（用于稳定排序） */
    order?: number;
}

/**
 * 创建实体操作
 */
export interface CreateOp {
    /** 操作类型 */
    t: OpType.CREATE;
    /** 实体ID提示（可选，用于预分配ID） */
    eHint?: EntityId;
    /** 实体名称 */
    name?: string;
    /** 操作序号（用于稳定排序） */
    order?: number;
}

/**
 * 销毁实体操作
 */
export interface DestroyOp {
    /** 操作类型 */
    t: OpType.DESTROY;
    /** 目标实体ID */
    e: EntityId;
    /** 操作序号（用于稳定排序） */
    order?: number;
}

/**
 * 所有操作的联合类型
 */
export type Op = AddOp | RemoveOp | CreateOp | DestroyOp;

/**
 * 命令缓冲执行上下文接口
 * 
 * 定义了CommandBuffer需要的外部依赖接口
 */
export interface ICommandBufferContext {
    /**
     * 创建实体
     * @param name 实体名称
     * @param idHint ID提示
     * @returns 创建的实体
     */
    createEntity(name?: string, idHint?: EntityId): Entity;

    /**
     * 销毁实体
     * @param entityId 实体ID
     * @returns 是否成功销毁
     */
    destroyEntity(entityId: EntityId): boolean;

    /**
     * 添加组件到实体
     * @param entityId 实体ID
     * @param ComponentClass 组件类
     * @param args 组件构造参数
     * @returns 是否成功添加
     */
    addComponent<T extends Component>(
        entityId: EntityId, 
        ComponentClass: new (...args: any[]) => T, 
        ...args: any[]
    ): boolean;

    /**
     * 从实体移除组件
     * @param entityId 实体ID
     * @param ComponentClass 组件类
     * @returns 是否成功移除
     */
    removeComponent<T extends Component>(
        entityId: EntityId, 
        ComponentClass: new (...args: any[]) => T
    ): boolean;

    /**
     * 根据ID获取实体
     * @param entityId 实体ID
     * @returns 实体实例，不存在则返回null
     */
    getEntity(entityId: EntityId): Entity | null;
}