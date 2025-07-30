import { Component } from '../../../src/ECS/Component';
import { ComponentStorageManager, EnableSoA, HighPrecision, Float64 } from '../../../src/ECS/Core/ComponentStorage';

// 包含所有基础类型的组件
@EnableSoA
class AllTypesComponent extends Component {
    // 数值类型
    public intNumber: number = 42;
    public floatNumber: number = 3.14;
    public zeroNumber: number = 0;
    
    // 布尔类型
    public trueBoolean: boolean = true;
    public falseBoolean: boolean = false;
    
    // 字符串类型
    public emptyString: string = '';
    public normalString: string = 'hello';
    public longString: string = 'this is a long string with spaces and 123 numbers!';
    
    // 其他基础类型
    public nullValue: null = null;
    public undefinedValue: undefined = undefined;
    
    // 复杂类型
    public arrayValue: number[] = [1, 2, 3];
    public objectValue: { name: string } = { name: 'test' };
    
    constructor() {
        super();
    }
}

// 边界测试专用组件
@EnableSoA
class BoundaryTestComponent extends Component {
    // 高精度大整数
    @HighPrecision
    public maxInt: number = 0;
    
    // 高精度小浮点数
    @Float64
    public minFloat: number = 0;
    
    // 普通数值
    public normalNumber: number = 0;
    
    // 字符串测试
    public testString: string = '';
    public longString: string = '';
    
    constructor() {
        super();
    }
}

describe('SoA所有数据类型处理测试', () => {
    let manager: ComponentStorageManager;

    beforeEach(() => {
        manager = new ComponentStorageManager();
    });

    test('验证所有基础类型的处理', () => {
        console.log('\\n=== 测试所有数据类型 ===');
        
        // 创建包含各种类型的组件
        const originalComponent = new AllTypesComponent();
        originalComponent.normalString = 'modified string';
        originalComponent.longString = '测试中文字符串 with emoji 🎉';
        originalComponent.intNumber = 999;
        originalComponent.floatNumber = 2.718;
        originalComponent.trueBoolean = false;
        originalComponent.falseBoolean = true;
        
        console.log('原始组件数据:', {
            intNumber: originalComponent.intNumber,
            floatNumber: originalComponent.floatNumber,
            trueBoolean: originalComponent.trueBoolean,
            falseBoolean: originalComponent.falseBoolean,
            emptyString: `"${originalComponent.emptyString}"`,
            normalString: `"${originalComponent.normalString}"`,
            longString: `"${originalComponent.longString}"`,
            arrayValue: originalComponent.arrayValue,
            objectValue: originalComponent.objectValue
        });
        
        // 存储到SoA
        manager.addComponent(1, originalComponent);
        
        // 获取并验证
        const retrievedComponent = manager.getComponent(1, AllTypesComponent);
        
        console.log('\\n取回的组件数据:', {
            intNumber: retrievedComponent?.intNumber,
            floatNumber: retrievedComponent?.floatNumber,
            trueBoolean: retrievedComponent?.trueBoolean,
            falseBoolean: retrievedComponent?.falseBoolean,
            emptyString: `"${retrievedComponent?.emptyString}"`,
            normalString: `"${retrievedComponent?.normalString}"`,
            longString: `"${retrievedComponent?.longString}"`,
            arrayValue: retrievedComponent?.arrayValue,
            objectValue: retrievedComponent?.objectValue
        });
        
        // 验证数值类型
        expect(retrievedComponent?.intNumber).toBe(999);
        expect(retrievedComponent?.floatNumber).toBeCloseTo(2.718);
        
        // 验证布尔类型
        expect(retrievedComponent?.trueBoolean).toBe(false);
        expect(retrievedComponent?.falseBoolean).toBe(true);
        
        // 验证字符串类型
        expect(retrievedComponent?.emptyString).toBe('');
        expect(retrievedComponent?.normalString).toBe('modified string');
        expect(retrievedComponent?.longString).toBe('测试中文字符串 with emoji 🎉');
        
        // 验证复杂类型
        expect(retrievedComponent?.arrayValue).toEqual([1, 2, 3]);
        expect(retrievedComponent?.objectValue).toEqual({ name: 'test' });
        
        console.log('\\n✅ 所有类型验证完成');
    });

    test('边界情况测试', () => {
        console.log('\\n=== 边界情况测试 ===');
        
        const component = new BoundaryTestComponent();
        
        // 特殊数值
        component.maxInt = Number.MAX_SAFE_INTEGER;
        component.minFloat = Number.MIN_VALUE;
        component.normalNumber = -0;
        
        // 特殊字符串
        component.testString = '\\n\\t\\r"\'\\\\'; // 转义字符
        component.longString = 'a'.repeat(1000); // 长字符串
        
        manager.addComponent(1, component);
        const retrieved = manager.getComponent(1, BoundaryTestComponent);
        
        console.log('边界情况结果:', {
            maxInt: retrieved?.maxInt,
            minFloat: retrieved?.minFloat,
            negativeZero: retrieved?.normalNumber,
            escapeStr: retrieved?.testString,
            longStr: retrieved?.longString?.length
        });
        
        expect(retrieved?.maxInt).toBe(Number.MAX_SAFE_INTEGER);
        expect(retrieved?.minFloat).toBe(Number.MIN_VALUE);
        expect(retrieved?.testString).toBe('\\n\\t\\r"\'\\\\');
        expect(retrieved?.longString).toBe('a'.repeat(1000));
        
        console.log('✅ 边界情况测试通过');
    });
});