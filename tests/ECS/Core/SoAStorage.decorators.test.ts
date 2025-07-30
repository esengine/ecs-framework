import { Component } from '../../../src/ECS/Component';
import { ComponentStorageManager, EnableSoA, HighPrecision, Float64, Int32 } from '../../../src/ECS/Core/ComponentStorage';
import { SoAStorage } from '../../../src/ECS/Core/SoAStorage';

// 测试组件：使用不同的数值类型装饰器
@EnableSoA
class DecoratedComponent extends Component {
    // 默认Float32Array存储
    public normalFloat: number = 3.14;
    
    // 高精度存储（作为复杂对象）
    @HighPrecision
    public highPrecisionNumber: number = Number.MAX_SAFE_INTEGER;
    
    // Float64Array存储
    @Float64
    public preciseFloat: number = Math.PI;
    
    // Int32Array存储
    @Int32
    public integerValue: number = 42;
    
    // 布尔值（默认Float32Array）
    public flag: boolean = true;
    
    // 字符串（专门数组）
    public text: string = 'hello';
    
    constructor() {
        super();
    }
}

describe('SoA数值类型装饰器测试', () => {
    let manager: ComponentStorageManager;

    beforeEach(() => {
        manager = new ComponentStorageManager();
    });

    test('验证不同装饰器的存储类型', () => {
        console.log('\\n=== 测试装饰器存储类型 ===');
        
        const component = new DecoratedComponent();
        component.highPrecisionNumber = Number.MAX_SAFE_INTEGER;
        component.preciseFloat = Math.PI;
        component.integerValue = 999999;
        component.normalFloat = 2.718;
        
        console.log('原始数据:', {
            normalFloat: component.normalFloat,
            highPrecisionNumber: component.highPrecisionNumber,
            preciseFloat: component.preciseFloat,
            integerValue: component.integerValue,
            flag: component.flag,
            text: component.text
        });
        
        manager.addComponent(1, component);
        const retrieved = manager.getComponent(1, DecoratedComponent);
        
        console.log('\\n取回数据:', {
            normalFloat: retrieved?.normalFloat,
            highPrecisionNumber: retrieved?.highPrecisionNumber,
            preciseFloat: retrieved?.preciseFloat,
            integerValue: retrieved?.integerValue,
            flag: retrieved?.flag,
            text: retrieved?.text
        });
        
        // 验证精度保持
        expect(retrieved?.normalFloat).toBeCloseTo(2.718, 5); // Float32精度
        expect(retrieved?.highPrecisionNumber).toBe(Number.MAX_SAFE_INTEGER); // 高精度保持
        expect(retrieved?.preciseFloat).toBeCloseTo(Math.PI, 15); // Float64精度
        expect(retrieved?.integerValue).toBe(999999); // 整数保持
        expect(retrieved?.flag).toBe(true);
        expect(retrieved?.text).toBe('hello');
        
        console.log('✅ 所有装饰器类型验证通过');
    });

    test('验证存储器内部结构', () => {
        console.log('\\n=== 测试存储器内部结构 ===');
        
        const component = new DecoratedComponent();
        manager.addComponent(1, component);
        
        const storage = manager.getStorage(DecoratedComponent) as SoAStorage<DecoratedComponent>;
        
        // 检查TypedArray字段
        const normalFloatArray = storage.getFieldArray('normalFloat');
        const preciseFloatArray = storage.getFieldArray('preciseFloat');
        const integerArray = storage.getFieldArray('integerValue');
        const flagArray = storage.getFieldArray('flag');
        
        console.log('存储类型:', {
            normalFloat: normalFloatArray?.constructor.name,
            preciseFloat: preciseFloatArray?.constructor.name,
            integerValue: integerArray?.constructor.name,
            flag: flagArray?.constructor.name
        });
        
        // 验证存储类型
        expect(normalFloatArray).toBeInstanceOf(Float32Array);
        expect(preciseFloatArray).toBeInstanceOf(Float64Array);
        expect(integerArray).toBeInstanceOf(Int32Array);
        expect(flagArray).toBeInstanceOf(Float32Array);
        
        // 高精度字段不应该在TypedArray中
        const highPrecisionArray = storage.getFieldArray('highPrecisionNumber');
        expect(highPrecisionArray).toBeNull();
        
        console.log('✅ 存储器内部结构验证通过');
    });

    test('测试边界值精度', () => {
        console.log('\\n=== 测试边界值精度 ===');
        
        const component = new DecoratedComponent();
        
        // 测试极限值
        component.highPrecisionNumber = Number.MAX_SAFE_INTEGER;
        component.preciseFloat = Number.MIN_VALUE;
        component.normalFloat = 16777217; // 超出Float32精度
        component.integerValue = -2147483648; // Int32最小值
        
        manager.addComponent(1, component);
        const retrieved = manager.getComponent(1, DecoratedComponent);
        
        console.log('边界值测试结果:', {
            highPrecision: retrieved?.highPrecisionNumber === Number.MAX_SAFE_INTEGER,
            preciseFloat: retrieved?.preciseFloat === Number.MIN_VALUE,
            normalFloat: retrieved?.normalFloat, // 可能有精度损失
            integerValue: retrieved?.integerValue === -2147483648
        });
        
        // 验证高精度保持
        expect(retrieved?.highPrecisionNumber).toBe(Number.MAX_SAFE_INTEGER);
        expect(retrieved?.preciseFloat).toBe(Number.MIN_VALUE);
        expect(retrieved?.integerValue).toBe(-2147483648);
        
        console.log('✅ 边界值精度测试通过');
    });

    test('性能对比：装饰器 vs 自动检测', () => {
        console.log('\\n=== 性能对比测试 ===');
        
        const entityCount = 1000;
        
        // 使用装饰器的组件
        const startTime = performance.now();
        for (let i = 0; i < entityCount; i++) {
            const component = new DecoratedComponent();
            component.highPrecisionNumber = Number.MAX_SAFE_INTEGER;
            component.preciseFloat = Math.PI * i;
            component.integerValue = i;
            manager.addComponent(i, component);
        }
        const decoratorTime = performance.now() - startTime;
        
        console.log(`装饰器方式: ${decoratorTime.toFixed(2)}ms`);
        console.log(`平均每个组件: ${(decoratorTime / entityCount).toFixed(4)}ms`);
        
        // 验证数据完整性
        const sample = manager.getComponent(500, DecoratedComponent);
        expect(sample?.highPrecisionNumber).toBe(Number.MAX_SAFE_INTEGER);
        expect(sample?.integerValue).toBe(500);
        
        console.log('✅ 性能测试完成，数据完整性验证通过');
    });
});