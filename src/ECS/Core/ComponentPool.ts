import { Component } from '../Component';

/**
 * 组件对象池，用于复用组件实例以减少内存分配
 */
export class ComponentPool<T extends Component> {
    private pool: T[] = [];
    private createFn: () => T;
    private resetFn?: (component: T) => void;
    private maxSize: number;

    constructor(
        createFn: () => T,
        resetFn?: (component: T) => void,
        maxSize: number = 1000
    ) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;
    }

    /**
     * 获取一个组件实例
     */
    acquire(): T {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        return this.createFn();
    }

    /**
     * 释放一个组件实例回池中
     */
    release(component: T): void {
        if (this.pool.length < this.maxSize) {
            if (this.resetFn) {
                this.resetFn(component);
            }
            this.pool.push(component);
        }
    }

    /**
     * 预填充对象池
     */
    prewarm(count: number): void {
        for (let i = 0; i < count && this.pool.length < this.maxSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    /**
     * 清空对象池
     */
    clear(): void {
        this.pool.length = 0;
    }

    /**
     * 获取池中可用对象数量
     */
    getAvailableCount(): number {
        return this.pool.length;
    }

    /**
     * 获取池的最大容量
     */
    getMaxSize(): number {
        return this.maxSize;
    }
}

/**
 * 全局组件池管理器
 */
export class ComponentPoolManager {
    private static instance: ComponentPoolManager;
    private pools = new Map<string, ComponentPool<any>>();

    private constructor() {}

    static getInstance(): ComponentPoolManager {
        if (!ComponentPoolManager.instance) {
            ComponentPoolManager.instance = new ComponentPoolManager();
        }
        return ComponentPoolManager.instance;
    }

    /**
     * 注册组件池
     */
    registerPool<T extends Component>(
        componentName: string,
        createFn: () => T,
        resetFn?: (component: T) => void,
        maxSize?: number
    ): void {
        this.pools.set(componentName, new ComponentPool(createFn, resetFn, maxSize));
    }

    /**
     * 获取组件实例
     */
    acquireComponent<T extends Component>(componentName: string): T | null {
        const pool = this.pools.get(componentName);
        return pool ? pool.acquire() : null;
    }

    /**
     * 释放组件实例
     */
    releaseComponent<T extends Component>(componentName: string, component: T): void {
        const pool = this.pools.get(componentName);
        if (pool) {
            pool.release(component);
        }
    }

    /**
     * 预热所有池
     */
    prewarmAll(count: number = 100): void {
        for (const pool of this.pools.values()) {
            pool.prewarm(count);
        }
    }

    /**
     * 清空所有池
     */
    clearAll(): void {
        for (const pool of this.pools.values()) {
            pool.clear();
        }
    }

    /**
     * 获取池统计信息
     */
    getPoolStats(): Map<string, { available: number; maxSize: number }> {
        const stats = new Map();
        for (const [name, pool] of this.pools) {
            stats.set(name, {
                available: pool.getAvailableCount(),
                maxSize: pool.getMaxSize()
            });
        }
        return stats;
    }
} 