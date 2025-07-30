import { IBigIntLike, BigIntFactory } from '../Utils/BigIntCompatibility';

/**
 * 位掩码优化器，用于预计算和缓存常用的组件掩码
 * 
 * 使用BigInt兼容层确保在所有平台上的正常运行。
 */
export class BitMaskOptimizer {
    private static instance: BitMaskOptimizer;
    private maskCache = new Map<string, IBigIntLike>();
    private componentTypeMap = new Map<string, number>();
    private nextComponentId = 0;

    private constructor() {}

    static getInstance(): BitMaskOptimizer {
        if (!BitMaskOptimizer.instance) {
            BitMaskOptimizer.instance = new BitMaskOptimizer();
        }
        return BitMaskOptimizer.instance;
    }

    /**
     * 注册组件类型
     */
    registerComponentType(componentName: string): number {
        if (!this.componentTypeMap.has(componentName)) {
            this.componentTypeMap.set(componentName, this.nextComponentId++);
        }
        return this.componentTypeMap.get(componentName)!;
    }

    /**
     * 获取组件类型ID
     */
    getComponentTypeId(componentName: string): number | undefined {
        return this.componentTypeMap.get(componentName);
    }

    /**
     * 创建单个组件的掩码
     * @param componentName 组件名称
     * @returns 组件掩码
     */
    createSingleComponentMask(componentName: string): IBigIntLike {
        const cacheKey = `single:${componentName}`;
        
        if (this.maskCache.has(cacheKey)) {
            return this.maskCache.get(cacheKey)!;
        }

        const componentId = this.getComponentTypeId(componentName);
        if (componentId === undefined) {
            throw new Error(`Component type not registered: ${componentName}`);
        }

        const mask = BigIntFactory.one().shiftLeft(componentId);
        this.maskCache.set(cacheKey, mask);
        return mask;
    }

    /**
     * 创建多个组件的组合掩码
     * @param componentNames 组件名称数组
     * @returns 组合掩码
     */
    createCombinedMask(componentNames: string[]): IBigIntLike {
        const sortedNames = [...componentNames].sort();
        const cacheKey = `combined:${sortedNames.join(',')}`;
        
        if (this.maskCache.has(cacheKey)) {
            return this.maskCache.get(cacheKey)!;
        }

        let mask = BigIntFactory.zero();
        for (const componentName of componentNames) {
            const componentId = this.getComponentTypeId(componentName);
            if (componentId === undefined) {
                throw new Error(`Component type not registered: ${componentName}`);
            }
            const componentMask = BigIntFactory.one().shiftLeft(componentId);
            mask = mask.or(componentMask);
        }

        this.maskCache.set(cacheKey, mask);
        return mask;
    }

    /**
     * 检查掩码是否包含指定组件
     * @param mask 要检查的掩码
     * @param componentName 组件名称
     * @returns 是否包含指定组件
     */
    maskContainsComponent(mask: IBigIntLike, componentName: string): boolean {
        const componentMask = this.createSingleComponentMask(componentName);
        return !mask.and(componentMask).isZero();
    }

    /**
     * 检查掩码是否包含所有指定组件
     * @param mask 要检查的掩码
     * @param componentNames 组件名称数组
     * @returns 是否包含所有指定组件
     */
    maskContainsAllComponents(mask: IBigIntLike, componentNames: string[]): boolean {
        const requiredMask = this.createCombinedMask(componentNames);
        const intersection = mask.and(requiredMask);
        return intersection.equals(requiredMask);
    }

    /**
     * 检查掩码是否包含任一指定组件
     * @param mask 要检查的掩码
     * @param componentNames 组件名称数组
     * @returns 是否包含任一指定组件
     */
    maskContainsAnyComponent(mask: IBigIntLike, componentNames: string[]): boolean {
        const anyMask = this.createCombinedMask(componentNames);
        return !mask.and(anyMask).isZero();
    }

    /**
     * 添加组件到掩码
     * @param mask 原始掩码
     * @param componentName 要添加的组件名称
     * @returns 新的掩码
     */
    addComponentToMask(mask: IBigIntLike, componentName: string): IBigIntLike {
        const componentMask = this.createSingleComponentMask(componentName);
        return mask.or(componentMask);
    }

    /**
     * 从掩码中移除组件
     * @param mask 原始掩码
     * @param componentName 要移除的组件名称
     * @returns 新的掩码
     */
    removeComponentFromMask(mask: IBigIntLike, componentName: string): IBigIntLike {
        const componentMask = this.createSingleComponentMask(componentName);
        const notComponentMask = componentMask.not();
        return mask.and(notComponentMask);
    }

    /**
     * 预计算常用掩码组合
     */
    precomputeCommonMasks(commonCombinations: string[][]): void {
        for (const combination of commonCombinations) {
            this.createCombinedMask(combination);
        }
    }

    /**
     * 获取掩码缓存统计信息
     */
    getCacheStats(): { size: number; componentTypes: number } {
        return {
            size: this.maskCache.size,
            componentTypes: this.componentTypeMap.size
        };
    }

    /**
     * 清空缓存
     */
    clearCache(): void {
        this.maskCache.clear();
    }

    /**
     * 重置优化器
     */
    reset(): void {
        this.maskCache.clear();
        this.componentTypeMap.clear();
        this.nextComponentId = 0;
    }

    /**
     * 将掩码转换为组件名称数组
     */
    maskToComponentNames(mask: IBigIntLike): string[] {
        const componentNames: string[] = [];
        
        for (const [componentName, componentId] of this.componentTypeMap) {
            const componentMask = BigIntFactory.one().shiftLeft(componentId);
            if (!mask.and(componentMask).isZero()) {
                componentNames.push(componentName);
            }
        }
        
        return componentNames;
    }

    /**
     * 获取掩码中组件的数量
     */
    getComponentCount(mask: IBigIntLike): number {
        let count = 0;
        let tempMask = mask.clone();
        const one = BigIntFactory.one();
        
        while (!tempMask.isZero()) {
            if (!tempMask.and(one).isZero()) {
                count++;
            }
            tempMask = tempMask.shiftRight(1);
        }
        
        return count;
    }
} 