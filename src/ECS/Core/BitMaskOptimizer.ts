/**
 * 位掩码优化器，用于预计算和缓存常用的组件掩码
 */
export class BitMaskOptimizer {
    private static instance: BitMaskOptimizer;
    private maskCache = new Map<string, bigint>();
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
     */
    createSingleComponentMask(componentName: string): bigint {
        const cacheKey = `single:${componentName}`;
        
        if (this.maskCache.has(cacheKey)) {
            return this.maskCache.get(cacheKey)!;
        }

        const componentId = this.getComponentTypeId(componentName);
        if (componentId === undefined) {
            throw new Error(`Component type not registered: ${componentName}`);
        }

        const mask = 1n << BigInt(componentId);
        this.maskCache.set(cacheKey, mask);
        return mask;
    }

    /**
     * 创建多个组件的组合掩码
     */
    createCombinedMask(componentNames: string[]): bigint {
        const sortedNames = [...componentNames].sort();
        const cacheKey = `combined:${sortedNames.join(',')}`;
        
        if (this.maskCache.has(cacheKey)) {
            return this.maskCache.get(cacheKey)!;
        }

        let mask = 0n;
        for (const componentName of componentNames) {
            const componentId = this.getComponentTypeId(componentName);
            if (componentId === undefined) {
                throw new Error(`Component type not registered: ${componentName}`);
            }
            mask |= 1n << BigInt(componentId);
        }

        this.maskCache.set(cacheKey, mask);
        return mask;
    }

    /**
     * 检查掩码是否包含指定组件
     */
    maskContainsComponent(mask: bigint, componentName: string): boolean {
        const componentMask = this.createSingleComponentMask(componentName);
        return (mask & componentMask) !== 0n;
    }

    /**
     * 检查掩码是否包含所有指定组件
     */
    maskContainsAllComponents(mask: bigint, componentNames: string[]): boolean {
        const requiredMask = this.createCombinedMask(componentNames);
        return (mask & requiredMask) === requiredMask;
    }

    /**
     * 检查掩码是否包含任一指定组件
     */
    maskContainsAnyComponent(mask: bigint, componentNames: string[]): boolean {
        const anyMask = this.createCombinedMask(componentNames);
        return (mask & anyMask) !== 0n;
    }

    /**
     * 添加组件到掩码
     */
    addComponentToMask(mask: bigint, componentName: string): bigint {
        const componentMask = this.createSingleComponentMask(componentName);
        return mask | componentMask;
    }

    /**
     * 从掩码中移除组件
     */
    removeComponentFromMask(mask: bigint, componentName: string): bigint {
        const componentMask = this.createSingleComponentMask(componentName);
        return mask & ~componentMask;
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
    maskToComponentNames(mask: bigint): string[] {
        const componentNames: string[] = [];
        
        for (const [componentName, componentId] of this.componentTypeMap) {
            const componentMask = 1n << BigInt(componentId);
            if ((mask & componentMask) !== 0n) {
                componentNames.push(componentName);
            }
        }
        
        return componentNames;
    }

    /**
     * 获取掩码中组件的数量
     */
    getComponentCount(mask: bigint): number {
        let count = 0;
        let tempMask = mask;
        
        while (tempMask !== 0n) {
            if ((tempMask & 1n) !== 0n) {
                count++;
            }
            tempMask >>= 1n;
        }
        
        return count;
    }
} 