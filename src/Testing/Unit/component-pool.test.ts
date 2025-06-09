import { ComponentPool, ComponentPoolManager } from '../../ECS/Core/ComponentPool';
import { Component } from '../../ECS/Component';

/**
 * 测试用组件
 */
class TestComponent extends Component {
    public value: number = 0;
    
    constructor(value: number = 0) {
        super();
        this.value = value;
    }
    
    reset(): void {
        this.value = 0;
    }
}

/**
 * 运行组件对象池测试
 */
export function runComponentPoolTests(): void {
    console.log('🧪 组件对象池测试');
    console.log('='.repeat(50));
    
    testBasicFunctionality();
    testPoolManager();
    testPerformance();
    
    console.log('✅ 组件对象池测试完成');
}

/**
 * 基础功能测试
 */
function testBasicFunctionality(): void {
    console.log('\n📝 基础功能测试...');
    
    const pool = new ComponentPool(
        () => new TestComponent(),
        (component) => component.reset(),
        10
    );

    // 测试获取新组件实例
    console.log('  测试获取新组件实例...');
    const component = pool.acquire();
    console.assert(component instanceof TestComponent, '应该返回TestComponent实例');
    console.assert(component.value === 0, '新组件的值应该为0');
    
    // 测试释放和复用
    console.log('  测试组件释放和复用...');
    component.value = 42;
    pool.release(component);
    console.assert(pool.getAvailableCount() === 1, '池中应该有1个可用组件');
    
    const reusedComponent = pool.acquire();
    console.assert(reusedComponent === component, '应该复用同一个组件实例');
    console.assert(reusedComponent.value === 0, '复用的组件应该被重置');
    
    // 测试预填充
    console.log('  测试对象池预填充...');
    pool.prewarm(5);
    console.assert(pool.getAvailableCount() === 5, '预填充后应该有5个可用组件');
    
    const components: TestComponent[] = [];
    for (let i = 0; i < 5; i++) {
        components.push(pool.acquire());
    }
    console.assert(pool.getAvailableCount() === 0, '获取5个组件后池应该为空');
    
    // 测试最大容量限制
    console.log('  测试最大容量限制...');
    pool.prewarm(10);
    const extraComponent = new TestComponent();
    pool.release(extraComponent);
    console.assert(pool.getAvailableCount() === 10, '不应该超过最大容量');
    
    // 测试清空池
    console.log('  测试清空对象池...');
    pool.clear();
    console.assert(pool.getAvailableCount() === 0, '清空后池应该为空');
    
    console.log('  ✅ 基础功能测试通过');
}

/**
 * 池管理器测试
 */
function testPoolManager(): void {
    console.log('\n📝 池管理器测试...');
    
    const manager = ComponentPoolManager.getInstance();
    manager.clearAll();
    
    // 测试单例模式
    console.log('  测试单例模式...');
    const manager1 = ComponentPoolManager.getInstance();
    const manager2 = ComponentPoolManager.getInstance();
    console.assert(manager1 === manager2, '应该返回同一个实例');
    
    // 测试注册组件池
    console.log('  测试注册组件池...');
    manager.registerPool(
        'TestComponent',
        () => new TestComponent(),
        (component) => component.reset(),
        5
    );
    
    const stats = manager.getPoolStats();
    console.assert(stats.has('TestComponent'), '应该包含已注册的组件类型');
    console.assert(stats.get('TestComponent')?.maxSize === 5, '最大容量应该为5');
    
    // 测试获取和释放组件
    console.log('  测试获取和释放组件...');
    const component = manager.acquireComponent<TestComponent>('TestComponent');
    console.assert(component instanceof TestComponent, '应该返回TestComponent实例');
    
    if (component) {
        component.value = 42;
        manager.releaseComponent('TestComponent', component);
        
        const reusedComponent = manager.acquireComponent<TestComponent>('TestComponent');
        console.assert(reusedComponent === component, '应该复用同一个组件');
        console.assert(reusedComponent?.value === 0, '复用的组件应该被重置');
    }
    
    // 测试预热所有池
    console.log('  测试预热所有池...');
    manager.registerPool('TestComponent1', () => new TestComponent());
    manager.registerPool('TestComponent2', () => new TestComponent());
    
    manager.prewarmAll(3);
    
    const finalStats = manager.getPoolStats();
    console.assert(finalStats.get('TestComponent1')?.available === 3, 'TestComponent1应该有3个可用组件');
    console.assert(finalStats.get('TestComponent2')?.available === 3, 'TestComponent2应该有3个可用组件');
    
    // 测试未注册的组件类型
    console.log('  测试未注册的组件类型...');
    const nullComponent = manager.acquireComponent('NonExistentComponent');
    console.assert(nullComponent === null, '未注册的组件类型应该返回null');
    
    manager.clearAll();
    console.log('  ✅ 池管理器测试通过');
}

/**
 * 性能测试
 */
function testPerformance(): void {
    console.log('\n📝 性能测试...');
    
    const pool = new ComponentPool(() => new TestComponent());
    const iterations = 10000;
    
    // 预热池
    pool.prewarm(100);
    
    // 测试对象池性能
    const poolStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        const component = pool.acquire();
        pool.release(component);
    }
    const poolEnd = performance.now();
    const poolTime = poolEnd - poolStart;
    
    // 测试直接创建性能
    const directStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        new TestComponent();
    }
    const directEnd = performance.now();
    const directTime = directEnd - directStart;
    
    console.log(`  对象池时间: ${poolTime.toFixed(2)}ms`);
    console.log(`  直接创建时间: ${directTime.toFixed(2)}ms`);
    const improvement = ((directTime - poolTime) / directTime * 100);
    console.log(`  性能提升: ${improvement.toFixed(1)}%`);
    
    if (poolTime < directTime) {
        console.log('  ✅ 对象池性能测试通过 - 比直接创建更快');
    } else {
        console.log('  ⚠️ 对象池在小规模测试中可能不如直接创建快');
    }
} 