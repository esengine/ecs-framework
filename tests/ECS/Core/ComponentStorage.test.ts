import { 
    ComponentRegistry, 
    ComponentStorage, 
    ComponentStorageManager, 
    ComponentType 
} from '../../../src/ECS/Core/ComponentStorage';
import { Component } from '../../../src/ECS/Component';
import { BigIntFactory } from '../../../src/ECS/Utils/BigIntCompatibility';

// 测试组件类
class TestComponent extends Component {
    constructor(public value: number = 0) {
        super();
    }
}

class PositionComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class VelocityComponent extends Component {
    constructor(public vx: number = 0, public vy: number = 0) {
        super();
    }
}

class HealthComponent extends Component {
    constructor(public health: number = 100, public maxHealth: number = 100) {
        super();
    }
}

describe('ComponentRegistry - 组件注册表测试', () => {
    beforeEach(() => {
        // 重置注册表状态
        (ComponentRegistry as any).componentTypes = new Map<Function, number>();
        (ComponentRegistry as any).nextBitIndex = 0;
    });

    describe('组件注册功能', () => {
        test('应该能够注册组件类型', () => {
            const bitIndex = ComponentRegistry.register(TestComponent);
            
            expect(bitIndex).toBe(0);
            expect(ComponentRegistry.isRegistered(TestComponent)).toBe(true);
        });

        test('重复注册相同组件应该返回相同的位索引', () => {
            const bitIndex1 = ComponentRegistry.register(TestComponent);
            const bitIndex2 = ComponentRegistry.register(TestComponent);
            
            expect(bitIndex1).toBe(bitIndex2);
            expect(bitIndex1).toBe(0);
        });

        test('应该能够注册多个组件类型', () => {
            const bitIndex1 = ComponentRegistry.register(TestComponent);
            const bitIndex2 = ComponentRegistry.register(PositionComponent);
            const bitIndex3 = ComponentRegistry.register(VelocityComponent);
            
            expect(bitIndex1).toBe(0);
            expect(bitIndex2).toBe(1);
            expect(bitIndex3).toBe(2);
        });

        test('应该能够检查组件是否已注册', () => {
            expect(ComponentRegistry.isRegistered(TestComponent)).toBe(false);
            
            ComponentRegistry.register(TestComponent);
            expect(ComponentRegistry.isRegistered(TestComponent)).toBe(true);
        });

        test('超过最大组件数量应该抛出错误', () => {
            // 设置较小的最大组件数量用于测试
            (ComponentRegistry as any).maxComponents = 3;
            
            ComponentRegistry.register(TestComponent);
            ComponentRegistry.register(PositionComponent);
            ComponentRegistry.register(VelocityComponent);
            
            expect(() => {
                ComponentRegistry.register(HealthComponent);
            }).toThrow('Maximum number of component types (3) exceeded');
        });
    });

    describe('位掩码功能', () => {
        test('应该能够获取组件的位掩码', () => {
            ComponentRegistry.register(TestComponent);
            ComponentRegistry.register(PositionComponent);
            
            const mask1 = ComponentRegistry.getBitMask(TestComponent);
            const mask2 = ComponentRegistry.getBitMask(PositionComponent);
            
            expect(mask1.toString()).toBe('1'); // 2^0
            expect(mask2.toString()).toBe('2'); // 2^1
        });

        test('应该能够获取组件的位索引', () => {
            ComponentRegistry.register(TestComponent);
            ComponentRegistry.register(PositionComponent);
            
            const index1 = ComponentRegistry.getBitIndex(TestComponent);
            const index2 = ComponentRegistry.getBitIndex(PositionComponent);
            
            expect(index1).toBe(0);
            expect(index2).toBe(1);
        });

        test('获取未注册组件的位掩码应该抛出错误', () => {
            expect(() => {
                ComponentRegistry.getBitMask(TestComponent);
            }).toThrow('Component type TestComponent is not registered');
        });

        test('获取未注册组件的位索引应该抛出错误', () => {
            expect(() => {
                ComponentRegistry.getBitIndex(TestComponent);
            }).toThrow('Component type TestComponent is not registered');
        });
    });

    describe('注册表管理', () => {
        test('应该能够获取所有已注册的组件类型', () => {
            ComponentRegistry.register(TestComponent);
            ComponentRegistry.register(PositionComponent);
            
            const allTypes = ComponentRegistry.getAllRegisteredTypes();
            
            expect(allTypes.size).toBe(2);
            expect(allTypes.has(TestComponent)).toBe(true);
            expect(allTypes.has(PositionComponent)).toBe(true);
            expect(allTypes.get(TestComponent)).toBe(0);
            expect(allTypes.get(PositionComponent)).toBe(1);
        });

        test('返回的注册表副本不应该影响原始数据', () => {
            ComponentRegistry.register(TestComponent);
            
            const allTypes = ComponentRegistry.getAllRegisteredTypes();
            allTypes.set(PositionComponent, 999);
            
            expect(ComponentRegistry.isRegistered(PositionComponent)).toBe(false);
        });
    });
});

describe('ComponentStorage - 组件存储器测试', () => {
    let storage: ComponentStorage<TestComponent>;

    beforeEach(() => {
        // 重置注册表
        (ComponentRegistry as any).componentTypes = new Map<Function, number>();
        (ComponentRegistry as any).nextBitIndex = 0;
        
        storage = new ComponentStorage(TestComponent);
    });

    describe('基本存储功能', () => {
        test('应该能够创建组件存储器', () => {
            expect(storage).toBeInstanceOf(ComponentStorage);
            expect(storage.size).toBe(0);
            expect(storage.type).toBe(TestComponent);
        });

        test('应该能够添加组件', () => {
            const component = new TestComponent(100);
            
            storage.addComponent(1, component);
            
            expect(storage.size).toBe(1);
            expect(storage.hasComponent(1)).toBe(true);
            expect(storage.getComponent(1)).toBe(component);
        });

        test('重复添加组件到同一实体应该抛出错误', () => {
            const component1 = new TestComponent(100);
            const component2 = new TestComponent(200);
            
            storage.addComponent(1, component1);
            
            expect(() => {
                storage.addComponent(1, component2);
            }).toThrow('Entity 1 already has component TestComponent');
        });

        test('应该能够获取组件', () => {
            const component = new TestComponent(100);
            storage.addComponent(1, component);
            
            const retrieved = storage.getComponent(1);
            expect(retrieved).toBe(component);
            expect(retrieved!.value).toBe(100);
        });

        test('获取不存在的组件应该返回null', () => {
            const retrieved = storage.getComponent(999);
            expect(retrieved).toBeNull();
        });

        test('应该能够检查实体是否有组件', () => {
            expect(storage.hasComponent(1)).toBe(false);
            
            storage.addComponent(1, new TestComponent(100));
            expect(storage.hasComponent(1)).toBe(true);
        });

        test('应该能够移除组件', () => {
            const component = new TestComponent(100);
            storage.addComponent(1, component);
            
            const removed = storage.removeComponent(1);
            
            expect(removed).toBe(component);
            expect(storage.size).toBe(0);
            expect(storage.hasComponent(1)).toBe(false);
            expect(storage.getComponent(1)).toBeNull();
        });

        test('移除不存在的组件应该返回null', () => {
            const removed = storage.removeComponent(999);
            expect(removed).toBeNull();
        });
    });

    describe('遍历和批量操作', () => {
        test('应该能够遍历所有组件', () => {
            const component1 = new TestComponent(100);
            const component2 = new TestComponent(200);
            const component3 = new TestComponent(300);
            
            storage.addComponent(1, component1);
            storage.addComponent(2, component2);
            storage.addComponent(3, component3);
            
            const results: Array<{component: TestComponent, entityId: number, index: number}> = [];
            
            storage.forEach((component, entityId, index) => {
                results.push({ component, entityId, index });
            });
            
            expect(results.length).toBe(3);
            expect(results.find(r => r.entityId === 1)?.component).toBe(component1);
            expect(results.find(r => r.entityId === 2)?.component).toBe(component2);
            expect(results.find(r => r.entityId === 3)?.component).toBe(component3);
        });

        test('应该能够获取密集数组', () => {
            const component1 = new TestComponent(100);
            const component2 = new TestComponent(200);
            
            storage.addComponent(1, component1);
            storage.addComponent(2, component2);
            
            const { components, entityIds } = storage.getDenseArray();
            
            expect(components.length).toBe(2);
            expect(entityIds.length).toBe(2);
            expect(components).toContain(component1);
            expect(components).toContain(component2);
            expect(entityIds).toContain(1);
            expect(entityIds).toContain(2);
        });

        test('应该能够清空所有组件', () => {
            storage.addComponent(1, new TestComponent(100));
            storage.addComponent(2, new TestComponent(200));
            
            expect(storage.size).toBe(2);
            
            storage.clear();
            
            expect(storage.size).toBe(0);
            expect(storage.hasComponent(1)).toBe(false);
            expect(storage.hasComponent(2)).toBe(false);
        });
    });

    describe('内存管理和优化', () => {
        test('应该能够重用空闲索引', () => {
            const component1 = new TestComponent(100);
            const component2 = new TestComponent(200);
            const component3 = new TestComponent(300);
            
            // 添加三个组件
            storage.addComponent(1, component1);
            storage.addComponent(2, component2);
            storage.addComponent(3, component3);
            
            // 移除中间的组件
            storage.removeComponent(2);
            
            // 添加新组件应该重用空闲索引
            const component4 = new TestComponent(400);
            storage.addComponent(4, component4);
            
            expect(storage.size).toBe(3);
            expect(storage.getComponent(4)).toBe(component4);
        });

        test('应该能够压缩存储', () => {
            // 添加多个组件
            storage.addComponent(1, new TestComponent(100));
            storage.addComponent(2, new TestComponent(200));
            storage.addComponent(3, new TestComponent(300));
            storage.addComponent(4, new TestComponent(400));
            
            // 移除部分组件创建空洞
            storage.removeComponent(2);
            storage.removeComponent(3);
            
            let stats = storage.getStats();
            expect(stats.freeSlots).toBe(2);
            expect(stats.fragmentation).toBeGreaterThan(0);
            
            // 压缩存储
            storage.compact();
            
            stats = storage.getStats();
            expect(stats.freeSlots).toBe(0);
            expect(stats.fragmentation).toBe(0);
            expect(storage.size).toBe(2);
            expect(storage.hasComponent(1)).toBe(true);
            expect(storage.hasComponent(4)).toBe(true);
        });

        test('没有空洞时压缩应该不做任何操作', () => {
            storage.addComponent(1, new TestComponent(100));
            storage.addComponent(2, new TestComponent(200));
            
            const statsBefore = storage.getStats();
            storage.compact();
            const statsAfter = storage.getStats();
            
            expect(statsBefore).toEqual(statsAfter);
        });

        test('应该能够获取存储统计信息', () => {
            storage.addComponent(1, new TestComponent(100));
            storage.addComponent(2, new TestComponent(200));
            storage.addComponent(3, new TestComponent(300));
            
            // 移除一个组件创建空洞
            storage.removeComponent(2);
            
            const stats = storage.getStats();
            
            expect(stats.totalSlots).toBe(3);
            expect(stats.usedSlots).toBe(2);
            expect(stats.freeSlots).toBe(1);
            expect(stats.fragmentation).toBeCloseTo(1/3);
        });
    });

    describe('边界情况', () => {
        test('空存储器的统计信息应该正确', () => {
            const stats = storage.getStats();
            
            expect(stats.totalSlots).toBe(0);
            expect(stats.usedSlots).toBe(0);
            expect(stats.freeSlots).toBe(0);
            expect(stats.fragmentation).toBe(0);
        });

        test('遍历空存储器应该安全', () => {
            let callCount = 0;
            storage.forEach(() => { callCount++; });
            
            expect(callCount).toBe(0);
        });

        test('获取空存储器的密集数组应该返回空数组', () => {
            const { components, entityIds } = storage.getDenseArray();
            
            expect(components.length).toBe(0);
            expect(entityIds.length).toBe(0);
        });
    });
});

describe('ComponentStorageManager - 组件存储管理器测试', () => {
    let manager: ComponentStorageManager;

    beforeEach(() => {
        // 重置注册表
        (ComponentRegistry as any).componentTypes = new Map<Function, number>();
        (ComponentRegistry as any).nextBitIndex = 0;
        
        manager = new ComponentStorageManager();
    });

    describe('存储器管理', () => {
        test('应该能够创建组件存储管理器', () => {
            expect(manager).toBeInstanceOf(ComponentStorageManager);
        });

        test('应该能够获取或创建组件存储器', () => {
            const storage1 = manager.getStorage(TestComponent);
            const storage2 = manager.getStorage(TestComponent);
            
            expect(storage1).toBeInstanceOf(ComponentStorage);
            expect(storage1).toBe(storage2); // 应该是同一个实例
        });

        test('不同组件类型应该有不同的存储器', () => {
            const storage1 = manager.getStorage(TestComponent);
            const storage2 = manager.getStorage(PositionComponent);
            
            expect(storage1).not.toBe(storage2);
            expect(storage1.type).toBe(TestComponent);
            expect(storage2.type).toBe(PositionComponent);
        });
    });

    describe('组件操作', () => {
        test('应该能够添加组件', () => {
            const component = new TestComponent(100);
            
            manager.addComponent(1, component);
            
            expect(manager.hasComponent(1, TestComponent)).toBe(true);
            expect(manager.getComponent(1, TestComponent)).toBe(component);
        });

        test('应该能够获取组件', () => {
            const testComponent = new TestComponent(100);
            const positionComponent = new PositionComponent(10, 20);
            
            manager.addComponent(1, testComponent);
            manager.addComponent(1, positionComponent);
            
            expect(manager.getComponent(1, TestComponent)).toBe(testComponent);
            expect(manager.getComponent(1, PositionComponent)).toBe(positionComponent);
        });

        test('获取不存在的组件应该返回null', () => {
            const result = manager.getComponent(999, TestComponent);
            expect(result).toBeNull();
        });

        test('应该能够检查实体是否有组件', () => {
            expect(manager.hasComponent(1, TestComponent)).toBe(false);
            
            manager.addComponent(1, new TestComponent(100));
            expect(manager.hasComponent(1, TestComponent)).toBe(true);
        });

        test('应该能够移除组件', () => {
            const component = new TestComponent(100);
            manager.addComponent(1, component);
            
            const removed = manager.removeComponent(1, TestComponent);
            
            expect(removed).toBe(component);
            expect(manager.hasComponent(1, TestComponent)).toBe(false);
        });

        test('移除不存在的组件应该返回null', () => {
            const removed = manager.removeComponent(999, TestComponent);
            expect(removed).toBeNull();
        });

        test('应该能够移除实体的所有组件', () => {
            manager.addComponent(1, new TestComponent(100));
            manager.addComponent(1, new PositionComponent(10, 20));
            manager.addComponent(1, new VelocityComponent(1, 2));
            
            expect(manager.hasComponent(1, TestComponent)).toBe(true);
            expect(manager.hasComponent(1, PositionComponent)).toBe(true);
            expect(manager.hasComponent(1, VelocityComponent)).toBe(true);
            
            manager.removeAllComponents(1);
            
            expect(manager.hasComponent(1, TestComponent)).toBe(false);
            expect(manager.hasComponent(1, PositionComponent)).toBe(false);
            expect(manager.hasComponent(1, VelocityComponent)).toBe(false);
        });
    });

    describe('位掩码功能', () => {
        test('应该能够获取实体的组件位掩码', () => {
            // 确保组件已注册
            ComponentRegistry.register(TestComponent);
            ComponentRegistry.register(PositionComponent);
            ComponentRegistry.register(VelocityComponent);
            
            manager.addComponent(1, new TestComponent(100));
            manager.addComponent(1, new PositionComponent(10, 20));
            
            const mask = manager.getComponentMask(1);
            
            // 应该包含TestComponent(位0)和PositionComponent(位1)的掩码
            expect(mask.toString()).toBe('3'); // 1 | 2 = 3
        });

        test('没有组件的实体应该有零掩码', () => {
            const mask = manager.getComponentMask(999);
            expect(mask.isZero()).toBe(true);
        });

        test('添加和移除组件应该更新掩码', () => {
            ComponentRegistry.register(TestComponent);
            ComponentRegistry.register(PositionComponent);
            
            manager.addComponent(1, new TestComponent(100));
            let mask = manager.getComponentMask(1);
            expect(mask.toString()).toBe('1');
            
            manager.addComponent(1, new PositionComponent(10, 20));
            mask = manager.getComponentMask(1);
            expect(mask.toString()).toBe('3'); // 0b11
            
            manager.removeComponent(1, TestComponent);
            mask = manager.getComponentMask(1);
            expect(mask.toString()).toBe('2'); // 0b10
        });
    });

    describe('管理器级别操作', () => {
        test('应该能够压缩所有存储器', () => {
            manager.addComponent(1, new TestComponent(100));
            manager.addComponent(2, new TestComponent(200));
            manager.addComponent(3, new TestComponent(300));
            
            manager.addComponent(1, new PositionComponent(10, 20));
            manager.addComponent(2, new PositionComponent(30, 40));
            
            // 移除部分组件创建空洞
            manager.removeComponent(2, TestComponent);
            manager.removeComponent(1, PositionComponent);
            
            expect(() => {
                manager.compactAll();
            }).not.toThrow();
        });

        test('应该能够获取所有存储器的统计信息', () => {
            manager.addComponent(1, new TestComponent(100));
            manager.addComponent(2, new TestComponent(200));
            manager.addComponent(1, new PositionComponent(10, 20));
            
            const allStats = manager.getAllStats();
            
            expect(allStats).toBeInstanceOf(Map);
            expect(allStats.size).toBe(2);
            expect(allStats.has('TestComponent')).toBe(true);
            expect(allStats.has('PositionComponent')).toBe(true);
            
            const testStats = allStats.get('TestComponent');
            expect(testStats.usedSlots).toBe(2);
            
            const positionStats = allStats.get('PositionComponent');
            expect(positionStats.usedSlots).toBe(1);
        });

        test('应该能够清空所有存储器', () => {
            manager.addComponent(1, new TestComponent(100));
            manager.addComponent(2, new PositionComponent(10, 20));
            manager.addComponent(3, new VelocityComponent(1, 2));
            
            expect(manager.hasComponent(1, TestComponent)).toBe(true);
            expect(manager.hasComponent(2, PositionComponent)).toBe(true);
            expect(manager.hasComponent(3, VelocityComponent)).toBe(true);
            
            manager.clear();
            
            expect(manager.hasComponent(1, TestComponent)).toBe(false);
            expect(manager.hasComponent(2, PositionComponent)).toBe(false);
            expect(manager.hasComponent(3, VelocityComponent)).toBe(false);
        });
    });

    describe('边界情况和错误处理', () => {
        test('对不存在存储器的操作应该安全处理', () => {
            expect(manager.getComponent(1, TestComponent)).toBeNull();
            expect(manager.hasComponent(1, TestComponent)).toBe(false);
            expect(manager.removeComponent(1, TestComponent)).toBeNull();
        });

        test('移除所有组件对空实体应该安全', () => {
            expect(() => {
                manager.removeAllComponents(999);
            }).not.toThrow();
        });

        test('统计信息应该处理未知组件类型', () => {
            // 创建一个匿名组件类来测试未知类型处理
            const AnonymousComponent = class extends Component {};
            manager.addComponent(1, new AnonymousComponent());
            
            const stats = manager.getAllStats();
            // 检查是否有任何统计条目（匿名类可能显示为空字符串或其他名称）
            expect(stats.size).toBeGreaterThan(0);
        });

        test('多次清空应该安全', () => {
            manager.addComponent(1, new TestComponent(100));
            
            manager.clear();
            manager.clear(); // 第二次清空应该安全
            
            expect(manager.hasComponent(1, TestComponent)).toBe(false);
        });
    });

    describe('性能和内存测试', () => {
        test('大量组件操作应该高效', () => {
            const entityCount = 1000;
            
            // 添加大量组件
            for (let i = 1; i <= entityCount; i++) {
                manager.addComponent(i, new TestComponent(i));
                if (i % 2 === 0) {
                    manager.addComponent(i, new PositionComponent(i, i));
                }
            }
            
            // 验证添加成功
            expect(manager.hasComponent(1, TestComponent)).toBe(true);
            expect(manager.hasComponent(500, TestComponent)).toBe(true);
            expect(manager.hasComponent(2, PositionComponent)).toBe(true);
            expect(manager.hasComponent(1, PositionComponent)).toBe(false);
            
            // 移除部分组件
            for (let i = 1; i <= entityCount; i += 3) {
                manager.removeComponent(i, TestComponent);
            }
            
            // 验证移除成功
            expect(manager.hasComponent(1, TestComponent)).toBe(false);
            expect(manager.hasComponent(2, TestComponent)).toBe(true);
            
            const stats = manager.getAllStats();
            expect(stats.get('TestComponent').usedSlots).toBeLessThan(entityCount);
        });
    });
});