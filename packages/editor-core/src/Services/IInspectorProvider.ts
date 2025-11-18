import React from 'react';

/**
 * Inspector提供器接口
 * 用于扩展Inspector面板，支持不同类型的对象检视
 */
export interface IInspectorProvider<T = unknown> {
    /**
     * 提供器唯一标识
     */
    readonly id: string;

    /**
     * 提供器名称
     */
    readonly name: string;

    /**
     * 优先级，数字越大优先级越高
     */
    readonly priority?: number;

    /**
     * 判断是否可以处理该目标
     */
    canHandle(target: unknown): target is T;

    /**
     * 渲染Inspector内容
     */
    render(target: T, context: InspectorContext): React.ReactElement;
}

/**
 * Inspector上下文
 */
export interface InspectorContext {
    /**
     * 当前选中的目标
     */
    target: unknown;

    /**
     * 是否只读模式
     */
    readonly?: boolean;

    /**
     * 项目路径
     */
    projectPath?: string | null;

    /**
     * 额外的上下文数据
     */
    [key: string]: unknown;
}

/**
 * Inspector目标类型
 */
export interface InspectorTarget<T = unknown> {
    /**
     * 目标类型
     */
    type: string;

    /**
     * 目标数据
     */
    data: T;

    /**
     * 额外的元数据
     */
    metadata?: Record<string, unknown>;
}
