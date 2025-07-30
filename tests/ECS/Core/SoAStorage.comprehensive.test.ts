import { Component } from '../../../src/ECS/Component';
import { ComponentStorageManager, EnableSoA, HighPrecision, Float64, Int32, SerializeMap, SerializeSet, SerializeArray, DeepCopy } from '../../../src/ECS/Core/ComponentStorage';
import { SoAStorage } from '../../../src/ECS/Core/SoAStorage';

// 综合测试组件，覆盖所有装饰器
@EnableSoA
class ComprehensiveComponent extends Component {
    @HighPrecision
    public bigIntId: number = BigInt(Number.MAX_SAFE_INTEGER + 1) as any;
    
    @Float64
    public preciseValue: number = Math.PI;
    
    @Int32
    public intValue: number = -2147483648;
    
    @SerializeMap
    public gameMap: Map<string, any> = new Map();
    
    @SerializeSet
    public flags: Set<number> = new Set();
    
    @SerializeArray
    public items: any[] = [];
    
    @DeepCopy
    public nestedConfig: any = { deep: { nested: { value: 42 } } };
    
    // 未装饰的字段
    public normalFloat: number = 1.23;
    public flag: boolean = true;
    public text: string = 'default';
    public complexObject: any = null;
    
    constructor() {
        super();
    }
}

describe('SoA存储综合测试覆盖', () => {
    let manager: ComponentStorageManager;

    beforeEach(() => {
        manager = new ComponentStorageManager();
    });

    test('验证所有装饰器类型的存储和检索', () => {
        console.log('\\n=== 综合装饰器测试 ===');
        
        const component = new ComprehensiveComponent();
        
        // 设置复杂数据
        component.gameMap.set('player1', { level: 10, gold: 500 });
        component.gameMap.set('player2', { level: 15, gold: 1200 });
        
        component.flags.add(1);
        component.flags.add(2);
        component.flags.add(4);
        
        component.items.push({ type: 'weapon', name: 'sword' });
        component.items.push({ type: 'armor', name: 'shield' });
        
        component.nestedConfig.deep.nested.value = 999;
        component.complexObject = { reference: 'shared' };
        
        manager.addComponent(1, component);
        const retrieved = manager.getComponent(1, ComprehensiveComponent);
        
        // 验证所有类型
        expect(retrieved?.bigIntId).toBe(component.bigIntId);
        expect(retrieved?.preciseValue).toBeCloseTo(Math.PI, 15);
        expect(retrieved?.intValue).toBe(-2147483648);
        
        expect(retrieved?.gameMap).toBeInstanceOf(Map);
        expect(retrieved?.gameMap.get('player1')).toEqual({ level: 10, gold: 500 });
        
        expect(retrieved?.flags).toBeInstanceOf(Set);
        expect(retrieved?.flags.has(2)).toBe(true);
        
        expect(retrieved?.items).toEqual(component.items);
        expect(retrieved?.nestedConfig.deep.nested.value).toBe(999);
        
        // 深拷贝验证
        expect(retrieved?.nestedConfig).not.toBe(component.nestedConfig);
        
        console.log('✅ 综合装饰器测试通过');
    });

    test('测试存储器内存统计和容量管理', () => {
        console.log('\\n=== 存储器管理测试 ===');
        
        const storage = manager.getStorage(ComprehensiveComponent) as SoAStorage<ComprehensiveComponent>;
        
        // 添加多个组件
        for (let i = 1; i <= 5; i++) {
            const component = new ComprehensiveComponent();
            component.intValue = i * 100;
            component.preciseValue = i * Math.PI;
            manager.addComponent(i, component);
        }
        
        // 检查统计信息
        const stats = storage.getStats();
        console.log('存储统计:', {
            size: stats.size,
            capacity: stats.capacity,
            memoryUsage: stats.memoryUsage,
            fieldCount: stats.fieldStats.size
        });
        
        expect(stats.size).toBe(5);
        expect(stats.capacity).toBeGreaterThanOrEqual(5);
        expect(stats.memoryUsage).toBeGreaterThan(0);
        
        // 测试压缩
        storage.removeComponent(2);
        storage.removeComponent(4);
        
        const statsBeforeCompact = storage.getStats();
        storage.compact();
        const statsAfterCompact = storage.getStats();
        
        expect(statsAfterCompact.size).toBe(3);
        console.log('压缩前后对比:', {
            before: statsBeforeCompact.size,
            after: statsAfterCompact.size
        });
        
        console.log('✅ 存储器管理测试通过');
    });

    test('测试序列化错误处理', () => {
        console.log('\\n=== 序列化错误处理测试 ===');
        
        // 创建包含循环引用的对象
        const component = new ComprehensiveComponent();
        const cyclicObject: any = { name: 'test' };
        cyclicObject.self = cyclicObject; // 循环引用
        
        // 这应该不会崩溃，而是优雅处理
        component.items.push(cyclicObject);
        
        expect(() => {
            manager.addComponent(1, component);
        }).not.toThrow();
        
        const retrieved = manager.getComponent(1, ComprehensiveComponent);
        expect(retrieved).toBeDefined();
        
        console.log('✅ 序列化错误处理测试通过');
    });

    test('测试大容量扩展和性能', () => {
        console.log('\\n=== 大容量性能测试 ===');
        
        const startTime = performance.now();
        const entityCount = 2000;
        
        // 创建大量实体
        for (let i = 1; i <= entityCount; i++) {
            const component = new ComprehensiveComponent();
            component.intValue = i;
            component.preciseValue = i * 0.1;
            component.gameMap.set(`key${i}`, i);
            component.flags.add(i % 10);
            component.items.push(`item${i}`);
            
            manager.addComponent(i, component);
        }
        
        const createTime = performance.now() - startTime;
        
        // 随机访问测试
        const readStartTime = performance.now();
        for (let i = 0; i < 100; i++) {
            const randomId = Math.floor(Math.random() * entityCount) + 1;
            const component = manager.getComponent(randomId, ComprehensiveComponent);
            expect(component?.intValue).toBe(randomId);
        }
        const readTime = performance.now() - readStartTime;
        
        console.log(`创建${entityCount}个组件: ${createTime.toFixed(2)}ms`);
        console.log(`随机读取100次: ${readTime.toFixed(2)}ms`);
        console.log(`平均创建时间: ${(createTime / entityCount).toFixed(4)}ms/组件`);
        
        // 验证存储统计
        const storage = manager.getStorage(ComprehensiveComponent) as SoAStorage<ComprehensiveComponent>;
        const stats = storage.getStats();
        
        expect(stats.size).toBe(entityCount);
        expect(stats.capacity).toBeGreaterThanOrEqual(entityCount);
        
        console.log('✅ 大容量性能测试通过');
    });

    test('测试空值和边界处理', () => {
        console.log('\\n=== 空值边界测试 ===');
        
        const component = new ComprehensiveComponent();
        
        // 设置各种边界值
        component.gameMap.set('null', null);
        component.gameMap.set('undefined', undefined);
        component.gameMap.set('empty', '');
        component.gameMap.set('zero', 0);
        component.gameMap.set('false', false);
        
        component.flags.add(0);
        component.items.push(null, undefined, '', 0, false);
        
        component.nestedConfig = null;
        
        manager.addComponent(1, component);
        const retrieved = manager.getComponent(1, ComprehensiveComponent);
        
        // 验证边界值处理
        expect(retrieved?.gameMap.get('null')).toBe(null);
        expect(retrieved?.gameMap.get('undefined')).toBe(null); // JSON序列化会将undefined转为null
        expect(retrieved?.gameMap.get('empty')).toBe('');
        expect(retrieved?.gameMap.get('zero')).toBe(0);
        expect(retrieved?.gameMap.get('false')).toBe(false);
        
        expect(retrieved?.flags.has(0)).toBe(true);
        expect(retrieved?.items).toEqual([null, null, '', 0, false]); // undefined序列化为null
        expect(retrieved?.nestedConfig).toBe(null);
        
        console.log('✅ 空值边界测试通过');
    });

    test('测试不同TypedArray类型的字段访问', () => {
        console.log('\\n=== TypedArray字段测试 ===');
        
        const storage = manager.getStorage(ComprehensiveComponent) as SoAStorage<ComprehensiveComponent>;
        
        // 添加测试数据
        const component = new ComprehensiveComponent();
        manager.addComponent(1, component);
        
        // 检查不同类型的TypedArray
        const preciseArray = storage.getFieldArray('preciseValue');
        const intArray = storage.getFieldArray('intValue');
        const normalArray = storage.getFieldArray('normalFloat');
        const flagArray = storage.getFieldArray('flag');
        
        expect(preciseArray).toBeInstanceOf(Float64Array);
        expect(intArray).toBeInstanceOf(Int32Array);
        expect(normalArray).toBeInstanceOf(Float32Array);
        expect(flagArray).toBeInstanceOf(Float32Array);
        
        // 高精度字段不应该在TypedArray中
        const bigIntArray = storage.getFieldArray('bigIntId');
        expect(bigIntArray).toBeNull();
        
        console.log('TypedArray类型验证:', {
            preciseValue: preciseArray?.constructor.name,
            intValue: intArray?.constructor.name,
            normalFloat: normalArray?.constructor.name,
            flag: flagArray?.constructor.name,
            bigIntId: bigIntArray ? 'Found' : 'null (正确)'
        });
        
        console.log('✅ TypedArray字段测试通过');
    });

    test('测试向量化批量操作', () => {
        console.log('\\n=== 向量化操作测试 ===');
        
        const storage = manager.getStorage(ComprehensiveComponent) as SoAStorage<ComprehensiveComponent>;
        
        // 添加测试数据
        for (let i = 1; i <= 10; i++) {
            const component = new ComprehensiveComponent();
            component.normalFloat = i;
            component.intValue = i * 10;
            manager.addComponent(i, component);
        }
        
        // 执行向量化操作
        let operationExecuted = false;
        storage.performVectorizedOperation((fieldArrays, activeIndices) => {
            operationExecuted = true;
            
            const normalFloatArray = fieldArrays.get('normalFloat') as Float32Array;
            const intArray = fieldArrays.get('intValue') as Int32Array;
            
            expect(normalFloatArray).toBeInstanceOf(Float32Array);
            expect(intArray).toBeInstanceOf(Int32Array);
            expect(activeIndices.length).toBe(10);
            
            // 批量修改数据
            for (let i = 0; i < activeIndices.length; i++) {
                const idx = activeIndices[i];
                normalFloatArray[idx] *= 2; // 乘以2
                intArray[idx] += 5; // 加5
            }
        });
        
        expect(operationExecuted).toBe(true);
        
        // 验证批量操作结果
        const component = manager.getComponent(5, ComprehensiveComponent);
        expect(component?.normalFloat).toBe(10); // 5 * 2
        expect(component?.intValue).toBe(55); // 50 + 5
        
        console.log('✅ 向量化操作测试通过');
    });
});