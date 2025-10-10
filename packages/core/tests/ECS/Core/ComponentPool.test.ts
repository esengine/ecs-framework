import { ComponentPool, ComponentPoolManager } from '../../../src/ECS/Core/ComponentPool';
import { Component } from '../../../src/ECS/Component';

// 测试用组件类
class TestComponent extends Component {
    public value: number = 0;
    public name: string = '';
    
    reset(): void {
        this.value = 0;
        this.name = '';
    }
}

class AnotherTestComponent extends Component {
    public data: string = '';
    
    reset(): void {
        this.data = '';
    }
}

describe('ComponentPool - 组件对象池测试', () => {
    let pool: ComponentPool<TestComponent>;
    let createFn: () => TestComponent;
    let resetFn: (component: TestComponent) => void;

    beforeEach(() => {
        createFn = () => new TestComponent();
        resetFn = (component: TestComponent) => component.reset();
        pool = new ComponentPool(createFn, resetFn, 10);
    });

    describe('基本功能测试', () => {
        it('应该能够创建组件池', () => {
            expect(pool).toBeDefined();
            expect(pool.getAvailableCount()).toBe(0);
            expect(pool.getMaxSize()).toBe(10);
        });

        it('应该能够获取组件实例', () => {
            const component = pool.acquire();
            expect(component).toBeInstanceOf(TestComponent);
            expect(component.value).toBe(0);
        });

        it('第一次获取应该创建新实例', () => {
            const component = pool.acquire();
            expect(component).toBeInstanceOf(TestComponent);
            expect(pool.getAvailableCount()).toBe(0);
        });

        it('应该能够释放组件回池中', () => {
            const component = pool.acquire();
            component.value = 42;
            component.name = 'test';
            
            pool.release(component);
            
            expect(pool.getAvailableCount()).toBe(1);
            expect(component.value).toBe(0); // 应该被重置
            expect(component.name).toBe(''); // 应该被重置
        });

        it('从池中获取的组件应该是之前释放的', () => {
            const component1 = pool.acquire();
            pool.release(component1);
            
            const component2 = pool.acquire();
            expect(component2).toBe(component1); // 应该是同一个实例
        });
    });

    describe('池容量管理', () => {
        it('应该能够设置最大容量', () => {
            const smallPool = new ComponentPool(createFn, resetFn, 2);
            expect(smallPool.getMaxSize()).toBe(2);
        });

        it('超过最大容量的组件不应该被存储', () => {
            const smallPool = new ComponentPool(createFn, resetFn, 2);
            
            const components = [];
            for (let i = 0; i < 5; i++) {
                components.push(smallPool.acquire());
            }
            
            // 释放所有组件
            components.forEach(comp => smallPool.release(comp));
            
            // 只有2个组件被存储在池中
            expect(smallPool.getAvailableCount()).toBe(2);
        });

        it('应该正确处理默认最大容量', () => {
            const defaultPool = new ComponentPool(createFn);
            expect(defaultPool.getMaxSize()).toBe(1000); // 默认值
        });
    });

    describe('重置功能测试', () => {
        it('没有重置函数时应该正常工作', () => {
            const poolWithoutReset = new ComponentPool<TestComponent>(createFn);
            const component = poolWithoutReset.acquire();
            component.value = 42;
            
            poolWithoutReset.release(component);
            
            // 没有重置函数，值应该保持不变
            expect(component.value).toBe(42);
            expect(poolWithoutReset.getAvailableCount()).toBe(1);
        });

        it('重置函数应该在释放时被调用', () => {
            const mockReset = jest.fn();
            const poolWithMockReset = new ComponentPool(createFn, mockReset);
            
            const component = poolWithMockReset.acquire();
            poolWithMockReset.release(component);
            
            expect(mockReset).toHaveBeenCalledWith(component);
        });
    });

    describe('预热功能', () => {
        it('应该能够预填充对象池', () => {
            pool.prewarm(5);
            expect(pool.getAvailableCount()).toBe(5);
        });

        it('预热不应该超过最大容量', () => {
            pool.prewarm(15); // 超过最大容量10
            expect(pool.getAvailableCount()).toBe(10);
        });

        it('预热0个对象应该安全', () => {
            pool.prewarm(0);
            expect(pool.getAvailableCount()).toBe(0);
        });

        it('多次预热应该填充到最大值', () => {
            pool.prewarm(3);
            expect(pool.getAvailableCount()).toBe(3);
            pool.prewarm(5);
            expect(pool.getAvailableCount()).toBe(5);
            pool.prewarm(2);
            expect(pool.getAvailableCount()).toBe(5);
        });
    });

    describe('清空功能', () => {
        it('应该能够清空对象池', () => {
            pool.prewarm(5);
            expect(pool.getAvailableCount()).toBe(5);
            
            pool.clear();
            expect(pool.getAvailableCount()).toBe(0);
        });

        it('空池清空应该安全', () => {
            pool.clear();
            expect(pool.getAvailableCount()).toBe(0);
        });
    });

    describe('边界情况测试', () => {
        it('应该处理连续的获取和释放', () => {
            const components: TestComponent[] = [];
            
            // 获取多个组件
            for (let i = 0; i < 5; i++) {
                components.push(pool.acquire());
            }
            
            // 释放所有组件
            components.forEach(comp => pool.release(comp));
            expect(pool.getAvailableCount()).toBe(5);
            
            // 再次获取应该复用之前的实例
            const reusedComponents: TestComponent[] = [];
            for (let i = 0; i < 5; i++) {
                reusedComponents.push(pool.acquire());
            }
            
            expect(pool.getAvailableCount()).toBe(0);
            
            // 验证复用的组件确实是之前的实例
            components.forEach(originalComp => {
                expect(reusedComponents).toContain(originalComp);
            });
        });

        it('应该处理空池的多次获取', () => {
            const component1 = pool.acquire();
            const component2 = pool.acquire();
            const component3 = pool.acquire();
            
            expect(component1).not.toBe(component2);
            expect(component2).not.toBe(component3);
            expect(component1).not.toBe(component3);
        });
    });
});

describe('ComponentPoolManager - 组件池管理器测试', () => {
    let manager: ComponentPoolManager;

    beforeEach(() => {
        manager = ComponentPoolManager.getInstance();
        // 重置管理器以确保测试隔离
        manager.reset();
    });

    describe('单例模式测试', () => {
        it('应该返回同一个实例', () => {
            const instance1 = ComponentPoolManager.getInstance();
            const instance2 = ComponentPoolManager.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('池注册和管理', () => {
        it('应该能够注册组件池', () => {
            const createFn = () => new TestComponent();
            const resetFn = (comp: TestComponent) => comp.reset();
            
            manager.registerPool('TestComponent', createFn, resetFn, 20);
            
            const stats = manager.getPoolStats();
            expect(stats.has('TestComponent')).toBe(true);
            expect(stats.get('TestComponent')?.maxSize).toBe(20);
        });

        it('应该能够注册多个不同类型的池', () => {
            manager.registerPool('TestComponent', () => new TestComponent());
            manager.registerPool('AnotherTestComponent', () => new AnotherTestComponent());
            
            const stats = manager.getPoolStats();
            expect(stats.size).toBe(2);
            expect(stats.has('TestComponent')).toBe(true);
            expect(stats.has('AnotherTestComponent')).toBe(true);
        });

        it('注册池时应该使用默认参数', () => {
            manager.registerPool('TestComponent', () => new TestComponent());
            
            const stats = manager.getPoolStats();
            expect(stats.get('TestComponent')?.maxSize).toBe(1000); // 默认值
        });
    });

    describe('组件获取和释放', () => {
        beforeEach(() => {
            manager.registerPool('TestComponent', () => new TestComponent(), (comp) => comp.reset());
        });

        it('应该能够获取组件实例', () => {
            const component = manager.acquireComponent<TestComponent>('TestComponent');
            expect(component).toBeInstanceOf(TestComponent);
        });

        it('获取未注册池的组件应该返回null', () => {
            const component = manager.acquireComponent<TestComponent>('UnknownComponent');
            expect(component).toBeNull();
        });

        it('应该能够释放组件实例', () => {
            const component = manager.acquireComponent<TestComponent>('TestComponent')!;
            component.value = 42;
            
            manager.releaseComponent('TestComponent', component);
            
            // 验证组件被重置并返回池中
            const reusedComponent = manager.acquireComponent<TestComponent>('TestComponent');
            expect(reusedComponent).toBe(component);
            expect(reusedComponent!.value).toBe(0); // 应该被重置
        });

        it('释放到未注册池应该安全处理', () => {
            const component = new TestComponent();
            expect(() => {
                manager.releaseComponent('UnknownComponent', component);
            }).not.toThrow();
        });
    });

    describe('批量操作', () => {
        beforeEach(() => {
            manager.registerPool('TestComponent', () => new TestComponent());
            manager.registerPool('AnotherTestComponent', () => new AnotherTestComponent());
        });

        it('应该能够预热所有池', () => {
            manager.prewarmAll(5);
            
            const stats = manager.getPoolStats();
            expect(stats.get('TestComponent')?.available).toBe(5);
            expect(stats.get('AnotherTestComponent')?.available).toBe(5);
        });

        it('应该能够清空所有池', () => {
            manager.prewarmAll(5);
            manager.clearAll();
            
            const stats = manager.getPoolStats();
            expect(stats.get('TestComponent')?.available).toBe(0);
            expect(stats.get('AnotherTestComponent')?.available).toBe(0);
        });

        it('prewarmAll应该使用默认值', () => {
            manager.prewarmAll(); // 默认100
            
            const stats = manager.getPoolStats();
            expect(stats.get('TestComponent')?.available).toBe(100);
            expect(stats.get('AnotherTestComponent')?.available).toBe(100);
        });
    });

    describe('统计信息', () => {
        beforeEach(() => {
            manager.registerPool('TestComponent', () => new TestComponent(), undefined, 50);
        });

        it('应该能够获取池统计信息', () => {
            const stats = manager.getPoolStats();
            
            expect(stats.has('TestComponent')).toBe(true);
            const poolStat = stats.get('TestComponent')!;
            expect(poolStat.available).toBe(0);
            expect(poolStat.maxSize).toBe(50);
        });

        it('应该能够获取池利用率信息', () => {
            manager.prewarmAll(30); // 预热30个
            
            const utilization = manager.getPoolUtilization();
            const testComponentUtil = utilization.get('TestComponent')!;
            
            expect(testComponentUtil.used).toBe(20); // 50 - 30 = 20
            expect(testComponentUtil.total).toBe(50);
            expect(testComponentUtil.utilization).toBe(40); // 20/50 * 100
        });

        it('应该能够获取指定组件的池利用率', () => {
            manager.prewarmAll(30);
            
            const utilization = manager.getComponentUtilization('TestComponent');
            expect(utilization).toBe(40); // (50-30)/50 * 100
        });

        it('获取未注册组件的利用率应该返回0', () => {
            const utilization = manager.getComponentUtilization('UnknownComponent');
            expect(utilization).toBe(0);
        });

        it('空池的利用率应该为0', () => {
            // 完全重置管理器，移除所有池
            manager.reset();
            const utilization = manager.getComponentUtilization('TestComponent');
            expect(utilization).toBe(0);
        });
    });

    describe('动态使用场景测试', () => {
        beforeEach(() => {
            manager.registerPool('TestComponent', () => new TestComponent(), (comp) => comp.reset(), 10);
        });

        it('应该正确跟踪组件使用情况', () => {
            // 获取5个组件
            const components = [];
            for (let i = 0; i < 5; i++) {
                const comp = manager.acquireComponent<TestComponent>('TestComponent')!;
                comp.value = i;
                components.push(comp);
            }
            
            // 利用率 = (maxSize - available) / maxSize * 100
            // 获取了5个，池中应该没有可用的（因为是从空池开始），所以利用率是 10/10 * 100 = 100%
            let utilization = manager.getComponentUtilization('TestComponent');
            expect(utilization).toBe(100); // 10/10 * 100
            
            // 释放3个组件
            for (let i = 0; i < 3; i++) {
                manager.releaseComponent('TestComponent', components[i]);
            }
            
            // 现在池中有3个可用，7个在使用
            utilization = manager.getComponentUtilization('TestComponent');
            expect(utilization).toBe(70); // 7/10 * 100
            
            const stats = manager.getPoolStats();
            expect(stats.get('TestComponent')?.available).toBe(3); // 池中有3个可用
        });

        it('应该处理池满的情况', () => {
            // 预热到满容量
            manager.prewarmAll(10);
            
            // 获取所有组件
            const components = [];
            for (let i = 0; i < 10; i++) {
                components.push(manager.acquireComponent<TestComponent>('TestComponent')!);
            }
            
            expect(manager.getComponentUtilization('TestComponent')).toBe(100);
            
            // 尝试释放更多组件（超过容量）
            for (let i = 0; i < 15; i++) {
                const extraComp = new TestComponent();
                manager.releaseComponent('TestComponent', extraComp);
            }
            
            // 池应该仍然是满的，不会超过容量
            const stats = manager.getPoolStats();
            expect(stats.get('TestComponent')?.available).toBe(10);
        });
    });

    describe('性能测试', () => {
        beforeEach(() => {
            manager.registerPool('TestComponent', () => new TestComponent(), (comp) => comp.reset());
        });

        it('大量组件获取和释放应该高效', () => {
            const startTime = performance.now();
            const components = [];
            
            // 获取1000个组件
            for (let i = 0; i < 1000; i++) {
                components.push(manager.acquireComponent<TestComponent>('TestComponent')!);
            }
            
            // 释放所有组件
            components.forEach(comp => manager.releaseComponent('TestComponent', comp));
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
        });
    });

    describe('边界情况和错误处理', () => {
        it('空管理器的统计信息应该正确', () => {
            // 完全重置管理器以确保清洁状态
            const emptyManager = ComponentPoolManager.getInstance();
            emptyManager.reset();
            
            const stats = emptyManager.getPoolStats();
            const utilization = emptyManager.getPoolUtilization();
            
            expect(stats.size).toBe(0);
            expect(utilization.size).toBe(0);
        });

        it('重复注册同一组件类型应该覆盖之前的池', () => {
            manager.registerPool('TestComponent', () => new TestComponent(), undefined, 10);
            manager.registerPool('TestComponent', () => new TestComponent(), undefined, 20);
            
            const stats = manager.getPoolStats();
            expect(stats.get('TestComponent')?.maxSize).toBe(20);
        });

        it('处理极端的预热数量', () => {
            manager.registerPool('TestComponent', () => new TestComponent(), undefined, 5);
            
            // 预热超过最大容量
            manager.prewarmAll(100);
            
            const stats = manager.getPoolStats();
            expect(stats.get('TestComponent')?.available).toBe(5); // 不应该超过最大容量
        });
    });
});