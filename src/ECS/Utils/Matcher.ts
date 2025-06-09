import { Entity } from '../Entity';
import { Component } from '../Component';
import { Bits } from './Bits';
import { ComponentTypeManager } from './ComponentTypeManager';

/**
 * 高性能实体匹配器
 * 用于快速匹配符合条件的实体
 */
export class Matcher {
    protected allSet: (new (...args: any[]) => Component)[] = [];
    protected exclusionSet: (new (...args: any[]) => Component)[] = [];
    protected oneSet: (new (...args: any[]) => Component)[] = [];

    // 缓存的位掩码，避免重复计算
    private _allBits?: Bits;
    private _exclusionBits?: Bits;
    private _oneBits?: Bits;
    private _isDirty = true;

    public static empty(): Matcher {
        return new Matcher();
    }

    public getAllSet(): (new (...args: any[]) => Component)[] {
        return this.allSet;
    }

    public getExclusionSet(): (new (...args: any[]) => Component)[] {
        return this.exclusionSet;
    }

    public getOneSet(): (new (...args: any[]) => Component)[] {
        return this.oneSet;
    }

    /**
     * 检查实体是否匹配条件
     * @param entity 要检查的实体
     * @returns 是否匹配
     */
    public isInterestedEntity(entity: Entity): boolean {
        const entityBits = this.getEntityBits(entity);
        return this.isInterested(entityBits);
    }

    /**
     * 检查组件位掩码是否匹配条件
     * @param componentBits 组件位掩码
     * @returns 是否匹配
     */
    public isInterested(componentBits: Bits): boolean {
        this.updateBitsIfDirty();

        // 检查必须包含的组件
        if (this._allBits && !componentBits.containsAll(this._allBits)) {
            return false;
        }

        // 检查排除的组件
        if (this._exclusionBits && componentBits.intersects(this._exclusionBits)) {
            return false;
        }

        // 检查至少包含其中之一的组件
        if (this._oneBits && !componentBits.intersects(this._oneBits)) {
            return false;
        }

        return true;
    }

    /**
     * 添加所有包含的组件类型
     * @param types 所有包含的组件类型列表
     */
    public all(...types: (new (...args: any[]) => Component)[]): Matcher {
        this.allSet.push(...types);
        this._isDirty = true;
        return this;
    }

    /**
     * 添加排除包含的组件类型
     * @param types 排除包含的组件类型列表
     */
    public exclude(...types: (new (...args: any[]) => Component)[]): Matcher {
        this.exclusionSet.push(...types);
        this._isDirty = true;
        return this;
    }

    /**
     * 添加至少包含其中之一的组件类型
     * @param types 至少包含其中之一的组件类型列表
     */
    public one(...types: (new (...args: any[]) => Component)[]): Matcher {
        this.oneSet.push(...types);
        this._isDirty = true;
        return this;
    }

    /**
     * 获取实体的组件位掩码
     * @param entity 实体
     * @returns 组件位掩码
     */
    private getEntityBits(entity: Entity): Bits {
        const components = entity.components;
        return ComponentTypeManager.instance.getEntityBits(components);
    }

    /**
     * 如果位掩码已过期，则更新它们
     */
    private updateBitsIfDirty(): void {
        if (!this._isDirty) {
            return;
        }

        const typeManager = ComponentTypeManager.instance;

        // 更新必须包含的组件位掩码
        if (this.allSet.length > 0) {
            this._allBits = typeManager.createBits(...this.allSet);
        } else {
            this._allBits = undefined;
        }

        // 更新排除的组件位掩码
        if (this.exclusionSet.length > 0) {
            this._exclusionBits = typeManager.createBits(...this.exclusionSet);
        } else {
            this._exclusionBits = undefined;
        }

        // 更新至少包含其中之一的组件位掩码
        if (this.oneSet.length > 0) {
            this._oneBits = typeManager.createBits(...this.oneSet);
        } else {
            this._oneBits = undefined;
        }

        this._isDirty = false;
    }

    /**
     * 创建匹配器的字符串表示（用于调试）
     * @returns 字符串表示
     */
    public toString(): string {
        const parts: string[] = [];
        
        if (this.allSet.length > 0) {
            parts.push(`all: [${this.allSet.map(t => t.name).join(', ')}]`);
        }
        
        if (this.exclusionSet.length > 0) {
            parts.push(`exclude: [${this.exclusionSet.map(t => t.name).join(', ')}]`);
        }
        
        if (this.oneSet.length > 0) {
            parts.push(`one: [${this.oneSet.map(t => t.name).join(', ')}]`);
        }
        
        return `Matcher(${parts.join(', ')})`;
    }
}
