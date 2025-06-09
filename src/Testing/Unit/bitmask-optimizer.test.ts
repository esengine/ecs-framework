import { BitMaskOptimizer } from '../../ECS/Core/BitMaskOptimizer';

/**
 * 位掩码优化器测试
 */
function testBitMaskOptimizer(): void {
    console.log('🧪 测试位掩码优化器');
    
    const optimizer = BitMaskOptimizer.getInstance();
    optimizer.reset();
    
    // 测试组件类型注册
    console.log('  📝 测试组件类型注册...');
    const positionId = optimizer.registerComponentType('Position');
    const velocityId = optimizer.registerComponentType('Velocity');
    const healthId = optimizer.registerComponentType('Health');
    
    console.log(`    Position ID: ${positionId}`);
    console.log(`    Velocity ID: ${velocityId}`);
    console.log(`    Health ID: ${healthId}`);
    
    // 测试单个组件掩码
    console.log('  🎯 测试单个组件掩码...');
    const positionMask = optimizer.createSingleComponentMask('Position');
    const velocityMask = optimizer.createSingleComponentMask('Velocity');
    
    console.log(`    Position掩码: ${positionMask.toString(2)}`);
    console.log(`    Velocity掩码: ${velocityMask.toString(2)}`);
    
    // 测试组合掩码
    console.log('  🔗 测试组合掩码...');
    const combinedMask = optimizer.createCombinedMask(['Position', 'Velocity']);
    console.log(`    Position+Velocity掩码: ${combinedMask.toString(2)}`);
    
    // 测试掩码包含检查
    console.log('  ✅ 测试掩码包含检查...');
    const hasPosition = optimizer.maskContainsComponent(combinedMask, 'Position');
    const hasVelocity = optimizer.maskContainsComponent(combinedMask, 'Velocity');
    const hasHealth = optimizer.maskContainsComponent(combinedMask, 'Health');
    
    console.log(`    包含Position: ${hasPosition}`);
    console.log(`    包含Velocity: ${hasVelocity}`);
    console.log(`    包含Health: ${hasHealth}`);
    
    // 测试掩码操作
    console.log('  🔧 测试掩码操作...');
    let entityMask = 0n;
    entityMask = optimizer.addComponentToMask(entityMask, 'Position');
    entityMask = optimizer.addComponentToMask(entityMask, 'Health');
    
    console.log(`    添加Position和Health后: ${entityMask.toString(2)}`);
    
    const hasAll = optimizer.maskContainsAllComponents(entityMask, ['Position', 'Health']);
    const hasAny = optimizer.maskContainsAnyComponent(entityMask, ['Position', 'Velocity']);
    
    console.log(`    包含Position和Health: ${hasAll}`);
    console.log(`    包含Position或Velocity: ${hasAny}`);
    
    // 测试掩码分析
    console.log('  📊 测试掩码分析...');
    const componentNames = optimizer.maskToComponentNames(entityMask);
    const componentCount = optimizer.getComponentCount(entityMask);
    
    console.log(`    掩码包含的组件: ${componentNames.join(', ')}`);
    console.log(`    组件数量: ${componentCount}`);
    
    // 测试缓存统计
    console.log('  📈 测试缓存统计...');
    const stats = optimizer.getCacheStats();
    console.log(`    缓存大小: ${stats.size}`);
    console.log(`    组件类型数量: ${stats.componentTypes}`);
    
    // 测试预计算常用掩码
    console.log('  ⚡ 测试预计算常用掩码...');
    const commonCombinations = [
        ['Position', 'Velocity'],
        ['Position', 'Health'],
        ['Position', 'Velocity', 'Health']
    ];
    
    optimizer.precomputeCommonMasks(commonCombinations);
    const statsAfterPrecompute = optimizer.getCacheStats();
    console.log(`    预计算后缓存大小: ${statsAfterPrecompute.size}`);
    
    console.log('✅ 位掩码优化器测试完成');
}

/**
 * 性能测试
 */
function testBitMaskPerformance(): void {
    console.log('\n🚀 位掩码优化器性能测试');
    
    const optimizer = BitMaskOptimizer.getInstance();
    optimizer.reset();
    
    // 注册组件类型
    const componentTypes = ['Position', 'Velocity', 'Health', 'Render', 'AI', 'Physics', 'Audio', 'Network'];
    for (const type of componentTypes) {
        optimizer.registerComponentType(type);
    }
    
    const iterations = 100000;
    
    // 测试单个掩码创建性能
    console.log('  🔥 测试单个掩码创建性能...');
    let start = performance.now();
    for (let i = 0; i < iterations; i++) {
        optimizer.createSingleComponentMask('Position');
    }
    let end = performance.now();
    console.log(`    ${iterations}次单个掩码创建: ${(end - start).toFixed(2)}ms`);
    
    // 测试组合掩码创建性能
    console.log('  🔥 测试组合掩码创建性能...');
    start = performance.now();
    for (let i = 0; i < iterations; i++) {
        optimizer.createCombinedMask(['Position', 'Velocity', 'Health']);
    }
    end = performance.now();
    console.log(`    ${iterations}次组合掩码创建: ${(end - start).toFixed(2)}ms`);
    
    // 测试掩码检查性能
    console.log('  🔥 测试掩码检查性能...');
    const testMask = optimizer.createCombinedMask(['Position', 'Velocity', 'Health']);
    
    start = performance.now();
    for (let i = 0; i < iterations; i++) {
        optimizer.maskContainsComponent(testMask, 'Position');
        optimizer.maskContainsComponent(testMask, 'AI');
    }
    end = performance.now();
    console.log(`    ${iterations * 2}次掩码检查: ${(end - start).toFixed(2)}ms`);
    
    // 对比原生位操作性能
    console.log('  ⚖️ 对比原生位操作性能...');
    const positionBit = 1n << 0n;
    const velocityBit = 1n << 1n;
    const healthBit = 1n << 2n;
    const nativeMask = positionBit | velocityBit | healthBit;
    
    start = performance.now();
    for (let i = 0; i < iterations; i++) {
        (nativeMask & positionBit) !== 0n;
        (nativeMask & (1n << 7n)) !== 0n; // AI位
    }
    end = performance.now();
    console.log(`    ${iterations * 2}次原生位操作: ${(end - start).toFixed(2)}ms`);
    
    console.log('✅ 性能测试完成');
}

/**
 * 内存使用测试
 */
function testBitMaskMemoryUsage(): void {
    console.log('\n💾 位掩码优化器内存使用测试');
    
    const optimizer = BitMaskOptimizer.getInstance();
    optimizer.reset();
    
    // 注册大量组件类型
    console.log('  📝 注册组件类型...');
    for (let i = 0; i < 100; i++) {
        optimizer.registerComponentType(`Component${i}`);
    }
    
    // 创建大量掩码组合
    console.log('  🔗 创建掩码组合...');
    const maskCount = 1000;
    for (let i = 0; i < maskCount; i++) {
        const componentCount = Math.floor(Math.random() * 5) + 1;
                 const components: string[] = [];
         for (let j = 0; j < componentCount; j++) {
             components.push(`Component${Math.floor(Math.random() * 100)}`);
         }
        optimizer.createCombinedMask(components);
    }
    
    const stats = optimizer.getCacheStats();
    console.log(`  📊 最终统计:`);
    console.log(`    组件类型数量: ${stats.componentTypes}`);
    console.log(`    缓存掩码数量: ${stats.size}`);
    console.log(`    平均每个掩码占用: ~${(stats.size * 64 / 1024).toFixed(2)} KB`);
    
    console.log('✅ 内存使用测试完成');
}

// 运行所有测试
export function runBitMaskOptimizerTests(): void {
    console.log('🧪 位掩码优化器测试套件');
    console.log('='.repeat(50));
    
    testBitMaskOptimizer();
    testBitMaskPerformance();
    testBitMaskMemoryUsage();
    
    console.log('\n✅ 所有测试完成');
} 