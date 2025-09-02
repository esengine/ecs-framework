import { ComponentStorage, ComponentRegistry, ComponentType } from '../../src/ECS/Core/ComponentStorage';
import { Component } from '../../src/ECS/Component';

// 测试组件类
class PerformanceTestComponent extends Component {
    public value: number;
    public x: number;
    public y: number;
    public active: boolean;
    
    constructor(value = 0, x = 0, y = 0, active = true) {
        super();
        this.value = value;
        this.x = x;
        this.y = y;
        this.active = active;
    }
}

// 模拟旧的基于holes的ComponentStorage实现
class LegacyComponentStorage<T extends Component> {
    private components: (T | null)[] = [];
    private freeIndices: number[] = [];
    private entityToIndex = new Map<number, number>();
    private componentType: ComponentType<T>;
    
    constructor(componentType: ComponentType<T>) {
        this.componentType = componentType;
    }
    
    public addComponent(entityId: number, component: T): void {
        if (this.entityToIndex.has(entityId)) {
            throw new Error(`Entity ${entityId} already has component`);
        }
        
        let index: number;
        if (this.freeIndices.length > 0) {
            index = this.freeIndices.pop()!;
        } else {
            index = this.components.length;
            this.components.push(null);
        }
        
        this.components[index] = component;
        this.entityToIndex.set(entityId, index);
    }
    
    public getComponent(entityId: number): T | null {
        const index = this.entityToIndex.get(entityId);
        return index !== undefined ? this.components[index] : null;
    }
    
    public hasComponent(entityId: number): boolean {
        return this.entityToIndex.has(entityId);
    }
    
    public removeComponent(entityId: number): T | null {
        const index = this.entityToIndex.get(entityId);
        if (index === undefined) {
            return null;
        }
        
        const component = this.components[index];
        this.components[index] = null;
        this.freeIndices.push(index);
        this.entityToIndex.delete(entityId);
        
        return component;
    }
    
    public forEach(callback: (component: T, entityId: number, index: number) => void): void {
        for (let i = 0; i < this.components.length; i++) {
            const component = this.components[i];
            if (component !== null) {
                // 需要找到对应的entityId，这在holes存储中是低效的
                for (const [entityId, compIndex] of this.entityToIndex) {
                    if (compIndex === i) {
                        callback(component, entityId, i);
                        break;
                    }
                }
            }
        }
    }
    
    public clear(): void {
        this.components.length = 0;
        this.freeIndices.length = 0;
        this.entityToIndex.clear();
    }
    
    public get size(): number {
        return this.entityToIndex.size;
    }
}

describe('ComponentStorage 性能对比测试', () => {
    let newStorage: ComponentStorage<PerformanceTestComponent>;
    let legacyStorage: LegacyComponentStorage<PerformanceTestComponent>;
    
    beforeEach(() => {
        ComponentRegistry.reset();
        newStorage = new ComponentStorage(PerformanceTestComponent);
        legacyStorage = new LegacyComponentStorage(PerformanceTestComponent);
    });
    
    const createComponent = (id: number) => new PerformanceTestComponent(id, id * 2, id * 3, true);
    
    describe('基础操作性能对比', () => {
        const entityCount = 10000;
        
        test('批量添加组件性能', () => {
            console.log(`\n=== 批量添加${entityCount}个组件性能对比 ===`);
            
            // 测试新实现
            const newStartTime = performance.now();
            for (let i = 1; i <= entityCount; i++) {
                newStorage.addComponent(i, createComponent(i));
            }
            const newAddTime = performance.now() - newStartTime;
            
            // 测试旧实现
            const legacyStartTime = performance.now();
            for (let i = 1; i <= entityCount; i++) {
                legacyStorage.addComponent(i, createComponent(i));
            }
            const legacyAddTime = performance.now() - legacyStartTime;
            
            console.log(`旧实现（holes存储）: ${legacyAddTime.toFixed(3)}ms`);
            console.log(`新实现（稀疏集合）: ${newAddTime.toFixed(3)}ms`);
            console.log(`性能提升: ${((legacyAddTime - newAddTime) / legacyAddTime * 100).toFixed(1)}%`);
            
            expect(newStorage.size).toBe(entityCount);
            expect(legacyStorage.size).toBe(entityCount);
        });
        
        test('批量查找组件性能', () => {
            console.log(`\n=== 批量查找${entityCount}个组件性能对比 ===`);
            
            // 先添加数据
            for (let i = 1; i <= entityCount; i++) {
                newStorage.addComponent(i, createComponent(i));
                legacyStorage.addComponent(i, createComponent(i));
            }
            
            // 测试新实现查找
            const newStartTime = performance.now();
            for (let i = 1; i <= entityCount; i++) {
                const component = newStorage.getComponent(i);
                expect(component?.value).toBe(i);
            }
            const newGetTime = performance.now() - newStartTime;
            
            // 测试旧实现查找
            const legacyStartTime = performance.now();
            for (let i = 1; i <= entityCount; i++) {
                const component = legacyStorage.getComponent(i);
                expect(component?.value).toBe(i);
            }
            const legacyGetTime = performance.now() - legacyStartTime;
            
            console.log(`旧实现（holes存储）: ${legacyGetTime.toFixed(3)}ms`);
            console.log(`新实现（稀疏集合）: ${newGetTime.toFixed(3)}ms`);
            console.log(`性能提升: ${((legacyGetTime - newGetTime) / legacyGetTime * 100).toFixed(1)}%`);
        });
        
        test('批量移除组件性能', () => {
            console.log(`\n=== 批量移除${entityCount / 2}个组件性能对比 ===`);
            
            // 先添加数据
            for (let i = 1; i <= entityCount; i++) {
                newStorage.addComponent(i, createComponent(i));
                legacyStorage.addComponent(i, createComponent(i));
            }
            
            // 测试新实现移除（移除奇数ID）
            const newStartTime = performance.now();
            for (let i = 1; i <= entityCount; i += 2) {
                newStorage.removeComponent(i);
            }
            const newRemoveTime = performance.now() - newStartTime;
            
            // 测试旧实现移除（移除奇数ID）
            const legacyStartTime = performance.now();
            for (let i = 1; i <= entityCount; i += 2) {
                legacyStorage.removeComponent(i);
            }
            const legacyRemoveTime = performance.now() - legacyStartTime;
            
            console.log(`旧实现（holes存储）: ${legacyRemoveTime.toFixed(3)}ms`);
            console.log(`新实现（稀疏集合）: ${newRemoveTime.toFixed(3)}ms`);
            console.log(`性能提升: ${((legacyRemoveTime - newRemoveTime) / legacyRemoveTime * 100).toFixed(1)}%`);
            
            expect(newStorage.size).toBe(entityCount / 2);
            expect(legacyStorage.size).toBe(entityCount / 2);
        });
    });
    
    describe('遍历性能对比', () => {
        const entityCount = 50000;
        
        test('完整遍历性能 - 无碎片情况', () => {
            console.log(`\n=== 完整遍历${entityCount}个组件性能对比（无碎片） ===`);
            
            // 先添加数据
            for (let i = 1; i <= entityCount; i++) {
                newStorage.addComponent(i, createComponent(i));
                legacyStorage.addComponent(i, createComponent(i));
            }
            
            let newSum = 0;
            let legacySum = 0;
            
            // 测试新实现遍历
            const newStartTime = performance.now();
            newStorage.forEach((component) => {
                newSum += component.value;
            });
            const newForEachTime = performance.now() - newStartTime;
            
            // 测试旧实现遍历
            const legacyStartTime = performance.now();
            legacyStorage.forEach((component) => {
                legacySum += component.value;
            });
            const legacyForEachTime = performance.now() - legacyStartTime;
            
            console.log(`旧实现（holes存储）: ${legacyForEachTime.toFixed(3)}ms`);
            console.log(`新实现（稀疏集合）: ${newForEachTime.toFixed(3)}ms`);
            console.log(`性能提升: ${((legacyForEachTime - newForEachTime) / legacyForEachTime * 100).toFixed(1)}%`);
            
            expect(newSum).toBe(legacySum);
        });
        
        test('遍历性能 - 高碎片情况', () => {
            console.log(`\n=== 遍历性能对比（高碎片情况，70%组件被移除） ===`);
            
            // 添加大量数据
            for (let i = 1; i <= entityCount; i++) {
                newStorage.addComponent(i, createComponent(i));
                legacyStorage.addComponent(i, createComponent(i));
            }
            
            // 移除70%的组件，创建大量碎片
            for (let i = 1; i <= entityCount; i++) {
                if (i % 10 < 7) { // 移除70%
                    newStorage.removeComponent(i);
                    legacyStorage.removeComponent(i);
                }
            }
            
            console.log(`剩余组件数量: ${newStorage.size}`);
            
            let newSum = 0;
            let legacySum = 0;
            
            // 测试新实现遍历（稀疏集合天然无碎片）
            const newStartTime = performance.now();
            newStorage.forEach((component) => {
                newSum += component.value;
            });
            const newForEachTime = performance.now() - newStartTime;
            
            // 测试旧实现遍历（需要跳过大量holes）
            const legacyStartTime = performance.now();
            legacyStorage.forEach((component) => {
                legacySum += component.value;
            });
            const legacyForEachTime = performance.now() - legacyStartTime;
            
            console.log(`旧实现（holes存储，70%空洞）: ${legacyForEachTime.toFixed(3)}ms`);
            console.log(`新实现（稀疏集合，无空洞）: ${newForEachTime.toFixed(3)}ms`);
            console.log(`性能提升: ${((legacyForEachTime - newForEachTime) / legacyForEachTime * 100).toFixed(1)}%`);
            
            expect(newSum).toBe(legacySum);
        });
    });
    
    describe('内存效率对比', () => {
        const entityCount = 20000;
        
        test('内存使用和碎片对比', () => {
            console.log(`\n=== 内存效率对比 ===`);
            
            // 添加组件
            for (let i = 1; i <= entityCount; i++) {
                newStorage.addComponent(i, createComponent(i));
                legacyStorage.addComponent(i, createComponent(i));
            }
            
            // 移除一半组件创建碎片
            for (let i = 1; i <= entityCount; i += 2) {
                newStorage.removeComponent(i);
                legacyStorage.removeComponent(i);
            }
            
            const newStats = newStorage.getStats();
            
            console.log(`=== 移除50%组件后的存储效率 ===`);
            console.log(`新实现（稀疏集合）:`);
            console.log(`  - 总槽位: ${newStats.totalSlots}`);
            console.log(`  - 使用槽位: ${newStats.usedSlots}`);
            console.log(`  - 空闲槽位: ${newStats.freeSlots}`);
            console.log(`  - 碎片率: ${(newStats.fragmentation * 100).toFixed(1)}%`);
            console.log(`  - 内存效率: ${((newStats.usedSlots / newStats.totalSlots) * 100).toFixed(1)}%`);
            
            console.log(`旧实现（holes存储）:`);
            console.log(`  - 总槽位: ${entityCount} (固定数组大小)`);
            console.log(`  - 使用槽位: ${entityCount / 2}`);
            console.log(`  - 空闲槽位: ${entityCount / 2}`);
            console.log(`  - 碎片率: 50.0%`);
            console.log(`  - 内存效率: 50.0%`);
            
            // 验证新实现的优势
            expect(newStats.fragmentation).toBe(0); // 稀疏集合无碎片
            expect(newStats.totalSlots).toBe(newStats.usedSlots); // 完全紧凑
        });
    });
    
    describe('随机访问模式性能测试', () => {
        const entityCount = 10000;
        const operationCount = 5000;
        
        test('混合操作性能对比', () => {
            console.log(`\n=== 混合操作性能对比（${operationCount}次随机操作） ===`);
            
            // 预先添加一些数据
            for (let i = 1; i <= entityCount / 2; i++) {
                newStorage.addComponent(i, createComponent(i));
                legacyStorage.addComponent(i, createComponent(i));
            }
            
            // 生成随机操作序列
            const operations: Array<{type: 'add' | 'get' | 'remove', entityId: number}> = [];
            for (let i = 0; i < operationCount; i++) {
                const type = Math.random() < 0.4 ? 'add' : Math.random() < 0.7 ? 'get' : 'remove';
                const entityId = Math.floor(Math.random() * entityCount) + 1;
                operations.push({ type, entityId });
            }
            
            // 测试新实现
            const newStartTime = performance.now();
            operations.forEach(op => {
                try {
                    switch (op.type) {
                        case 'add':
                            if (!newStorage.hasComponent(op.entityId)) {
                                newStorage.addComponent(op.entityId, createComponent(op.entityId));
                            }
                            break;
                        case 'get':
                            newStorage.getComponent(op.entityId);
                            break;
                        case 'remove':
                            newStorage.removeComponent(op.entityId);
                            break;
                    }
                } catch (e) {
                    // 忽略重复添加等错误
                }
            });
            const newMixedTime = performance.now() - newStartTime;
            
            // 重置旧实现状态
            legacyStorage.clear();
            for (let i = 1; i <= entityCount / 2; i++) {
                legacyStorage.addComponent(i, createComponent(i));
            }
            
            // 测试旧实现
            const legacyStartTime = performance.now();
            operations.forEach(op => {
                try {
                    switch (op.type) {
                        case 'add':
                            if (!legacyStorage.hasComponent(op.entityId)) {
                                legacyStorage.addComponent(op.entityId, createComponent(op.entityId));
                            }
                            break;
                        case 'get':
                            legacyStorage.getComponent(op.entityId);
                            break;
                        case 'remove':
                            legacyStorage.removeComponent(op.entityId);
                            break;
                    }
                } catch (e) {
                    // 忽略重复添加等错误
                }
            });
            const legacyMixedTime = performance.now() - legacyStartTime;
            
            console.log(`旧实现（holes存储）: ${legacyMixedTime.toFixed(3)}ms`);
            console.log(`新实现（稀疏集合）: ${newMixedTime.toFixed(3)}ms`);
            console.log(`性能提升: ${((legacyMixedTime - newMixedTime) / legacyMixedTime * 100).toFixed(1)}%`);
        });
    });
});