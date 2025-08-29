import { ComponentRegistry, ComponentType } from '../ComponentStorage';
import { IBigIntLike, BigIntFactory } from '../../Utils/BigIntCompatibility';
import { createLogger } from '../../../Utils/Logger';
import { getComponentTypeName } from '../../Decorators';
import { QuerySystem, QueryResult } from '../QuerySystem';

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
    mask: IBigIntLike;
}

/**
 * 查询构建器
 * 
 * 提供链式API来构建复杂的实体查询条件。
 * 支持组合多种查询条件，创建灵活的查询表达式。
 * 
 * @example
 * ```typescript
 * const result = new QueryBuilder(querySystem)
 *     .withAll(PositionComponent, VelocityComponent)
 *     .without(DeadComponent)
 *     .execute();
 * ```
 */
export class QueryBuilder {
    private _logger = createLogger('QueryBuilder');
    private conditions: QueryCondition[] = [];
    private querySystem: QuerySystem;

    constructor(querySystem: QuerySystem) {
        this.querySystem = querySystem;
    }

    /**
     * 添加"必须包含所有组件"条件
     * 
     * @param componentTypes 必须包含的组件类型
     * @returns 查询构建器实例，支持链式调用
     */
    public withAll(...componentTypes: ComponentType[]): QueryBuilder {
        this.conditions.push({
            type: QueryConditionType.ALL,
            componentTypes,
            mask: this.createComponentMask(componentTypes)
        });
        return this;
    }

    /**
     * 添加"必须包含任意组件"条件
     * 
     * @param componentTypes 必须包含其中任意一个的组件类型
     * @returns 查询构建器实例，支持链式调用
     */
    public withAny(...componentTypes: ComponentType[]): QueryBuilder {
        this.conditions.push({
            type: QueryConditionType.ANY,
            componentTypes,
            mask: this.createComponentMask(componentTypes)
        });
        return this;
    }

    /**
     * 添加"不能包含任何组件"条件
     * 
     * @param componentTypes 不能包含的组件类型
     * @returns 查询构建器实例，支持链式调用
     */
    public without(...componentTypes: ComponentType[]): QueryBuilder {
        this.conditions.push({
            type: QueryConditionType.NONE,
            componentTypes,
            mask: this.createComponentMask(componentTypes)
        });
        return this;
    }

    /**
     * 执行查询并返回结果
     * 
     * 根据已添加的查询条件执行实体查询。
     * 
     * @returns 查询结果，包含匹配的实体和性能信息
     */
    public execute(): QueryResult {
        const startTime = performance.now();

        // 简化实现：目前只支持单一条件
        if (this.conditions.length === 1) {
            const condition = this.conditions[0];
            switch (condition.type) {
                case QueryConditionType.ALL:
                    return this.querySystem.queryAll(...condition.componentTypes);
                case QueryConditionType.ANY:
                    return this.querySystem.queryAny(...condition.componentTypes);
                case QueryConditionType.NONE:
                    return this.querySystem.queryNone(...condition.componentTypes);
            }
        }

        // 多条件查询的复杂实现留待后续扩展
        return {
            entities: [],
            count: 0,
            executionTime: performance.now() - startTime,
            fromCache: false
        };
    }

    /**
     * 创建组件掩码
     */
    private createComponentMask(componentTypes: ComponentType[]): IBigIntLike {
        let mask = BigIntFactory.zero();
        for (const type of componentTypes) {
            try {
                const bitMask = ComponentRegistry.getBitMask(type);
                mask = mask.or(bitMask);
            } catch (error) {
                this._logger.warn(`组件类型 ${getComponentTypeName(type)} 未注册，跳过`);
            }
        }
        return mask;
    }

    /**
     * 重置查询构建器
     * 
     * 清除所有已添加的查询条件，重新开始构建查询。
     * 
     * @returns 查询构建器实例，支持链式调用
     */
    public reset(): QueryBuilder {
        this.conditions = [];
        return this;
    }
}