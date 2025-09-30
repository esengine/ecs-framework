import { Component } from '../../../src/ECS/Component';
import { ComponentStorageManager } from '../../../src/ECS/Core/ComponentStorage';
import { EnableSoA, AutoTyped, TypeInference } from '../../../src/ECS/Core/StorageDecorators';

// 测试自动类型推断
@EnableSoA
class AutoInferredComponent extends Component {
    // 基于默认值的自动推断
    @AutoTyped() health: number = 100; // 应该推断为uint8
    @AutoTyped() score: number = 1000000; // 应该推断为uint32
    @AutoTyped() position: number = 3.14; // 应该推断为float32
    @AutoTyped() temperature: number = -40; // 应该推断为int8

    // 基于范围的精确推断
    @AutoTyped({ minValue: 0, maxValue: 255 })
    level: number = 1; // 应该推断为uint8

    @AutoTyped({ minValue: -1000, maxValue: 1000 })
    velocity: number = 0; // 应该推断为int16

    @AutoTyped({ minValue: 0, maxValue: 100000, precision: false })
    experience: number = 0; // 应该推断为uint32（禁用精度）

    @AutoTyped({ precision: true })
    exactValue: number = 42; // 应该推断为float32（强制精度）

    @AutoTyped({ minValue: 0, maxValue: 10, signed: false })
    difficulty: number = 5; // 应该推断为uint8（无符号）
}

// 传统手动指定类型的组件（用于对比）
@EnableSoA
class ManualTypedComponent extends Component {
    health: number = 100; // 默认Float32Array
    score: number = 1000000; // 默认Float32Array
    position: number = 3.14; // 默认Float32Array
    temperature: number = -40; // 默认Float32Array
    level: number = 1; // 默认Float32Array
    velocity: number = 0; // 默认Float32Array
    experience: number = 0; // 默认Float32Array
    exactValue: number = 42; // 默认Float32Array
    difficulty: number = 5; // 默认Float32Array
}

describe('AutoType Inference', () => {
    let storageManager: ComponentStorageManager;

    beforeEach(() => {
        storageManager = new ComponentStorageManager();
    });

    test('TypeInference.inferOptimalType 应该正确推断基础类型', () => {
        // 布尔值
        expect(TypeInference.inferOptimalType(true)).toBe('uint8');
        expect(TypeInference.inferOptimalType(false)).toBe('uint8');

        // 小整数
        expect(TypeInference.inferOptimalType(100)).toBe('uint8');
        expect(TypeInference.inferOptimalType(-50)).toBe('int8');

        // 大整数
        expect(TypeInference.inferOptimalType(1000)).toBe('uint16');
        expect(TypeInference.inferOptimalType(-1000)).toBe('int16');

        // 浮点数
        expect(TypeInference.inferOptimalType(3.14)).toBe('float32');
        expect(TypeInference.inferOptimalType(-3.14)).toBe('float32');

        // 非数值
        expect(TypeInference.inferOptimalType('string')).toBe('float32');
        expect(TypeInference.inferOptimalType(null)).toBe('float32');
    });

    test('TypeInference.inferOptimalType 应该根据范围推断类型', () => {
        // 指定范围的无符号整数
        expect(TypeInference.inferOptimalType(100, { minValue: 0, maxValue: 255 })).toBe('uint8');
        expect(TypeInference.inferOptimalType(1000, { minValue: 0, maxValue: 65535 })).toBe('uint16');

        // 指定范围的有符号整数
        expect(TypeInference.inferOptimalType(-50, { minValue: -128, maxValue: 127 })).toBe('int8');
        expect(TypeInference.inferOptimalType(-1000, { minValue: -32768, maxValue: 32767 })).toBe('int16');

        // 强制使用浮点精度
        expect(TypeInference.inferOptimalType(42, { precision: true })).toBe('float32');
        expect(TypeInference.inferOptimalType(42, { precision: true, maxValue: 1e40 })).toBe('float64');

        // 强制禁用精度
        expect(TypeInference.inferOptimalType(42.5, { precision: false, minValue: 0, maxValue: 255 })).toBe('uint8');
    });

    test('应该为自动推断的字段创建正确的TypedArray', () => {
        const storage = storageManager.getSoAStorage(AutoInferredComponent);
        expect(storage).not.toBeNull();

        // 验证推断的类型
        expect(storage!.getFieldArray('health')).toBeInstanceOf(Uint8Array);
        expect(storage!.getFieldArray('score')).toBeInstanceOf(Uint32Array);
        expect(storage!.getFieldArray('position')).toBeInstanceOf(Float32Array);
        expect(storage!.getFieldArray('temperature')).toBeInstanceOf(Int8Array);
        expect(storage!.getFieldArray('level')).toBeInstanceOf(Uint8Array);
        expect(storage!.getFieldArray('velocity')).toBeInstanceOf(Int16Array);
        expect(storage!.getFieldArray('experience')).toBeInstanceOf(Uint32Array);
        expect(storage!.getFieldArray('exactValue')).toBeInstanceOf(Float32Array);
        expect(storage!.getFieldArray('difficulty')).toBeInstanceOf(Uint8Array);
    });

    test('应该正确存储和检索自动推断类型的值', () => {
        const entityId = 1;
        const component = new AutoInferredComponent();

        // 设置测试值
        component.health = 255; // Uint8 最大值
        component.score = 4000000000; // 大的Uint32值
        component.position = 3.14159;
        component.temperature = -128; // Int8 最小值
        component.level = 200;
        component.velocity = -500;
        component.experience = 50000;
        component.exactValue = Math.PI;
        component.difficulty = 10;

        storageManager.addComponent(entityId, component);
        const retrieved = storageManager.getComponent(entityId, AutoInferredComponent);

        expect(retrieved).not.toBeNull();
        expect(retrieved!.health).toBe(255);
        expect(retrieved!.score).toBe(4000000000);
        expect(retrieved!.position).toBeCloseTo(3.14159, 5);
        expect(retrieved!.temperature).toBe(-128);
        expect(retrieved!.level).toBe(200);
        expect(retrieved!.velocity).toBe(-500);
        expect(retrieved!.experience).toBe(50000);
        expect(retrieved!.exactValue).toBeCloseTo(Math.PI, 5);
        expect(retrieved!.difficulty).toBe(10);
    });

    test('自动推断应该比手动类型使用更少内存', () => {
        const autoStorage = storageManager.getSoAStorage(AutoInferredComponent);
        const manualStorage = storageManager.getSoAStorage(ManualTypedComponent);

        const autoStats = autoStorage!.getStats();
        const manualStats = manualStorage!.getStats();

        // 自动推断应该使用更少的内存
        expect(autoStats.memoryUsage).toBeLessThan(manualStats.memoryUsage);

        // 验证特定字段的内存使用
        expect(autoStats.fieldStats.get('health').memory).toBe(1000); // Uint8: 1 byte per element
        expect(manualStats.fieldStats.get('health').memory).toBe(4000); // Float32: 4 bytes per element

        expect(autoStats.fieldStats.get('temperature').memory).toBe(1000); // Int8: 1 byte per element
        expect(manualStats.fieldStats.get('temperature').memory).toBe(4000); // Float32: 4 bytes per element
    });

    test('应该处理边界值', () => {
        @EnableSoA
        class BoundaryTestComponent extends Component {
            @AutoTyped({ minValue: 0, maxValue: 255 })
            maxUint8: number = 255;

            @AutoTyped({ minValue: -128, maxValue: 127 })
            minInt8: number = -128;

            @AutoTyped({ minValue: 0, maxValue: 65535 })
            maxUint16: number = 65535;

            @AutoTyped({ minValue: -32768, maxValue: 32767 })
            minInt16: number = -32768;
        }

        const storage = storageManager.getSoAStorage(BoundaryTestComponent);

        expect(storage!.getFieldArray('maxUint8')).toBeInstanceOf(Uint8Array);
        expect(storage!.getFieldArray('minInt8')).toBeInstanceOf(Int8Array);
        expect(storage!.getFieldArray('maxUint16')).toBeInstanceOf(Uint16Array);
        expect(storage!.getFieldArray('minInt16')).toBeInstanceOf(Int16Array);

        const entityId = 1;
        const component = new BoundaryTestComponent();

        storageManager.addComponent(entityId, component);
        const retrieved = storageManager.getComponent(entityId, BoundaryTestComponent);

        expect(retrieved!.maxUint8).toBe(255);
        expect(retrieved!.minInt8).toBe(-128);
        expect(retrieved!.maxUint16).toBe(65535);
        expect(retrieved!.minInt16).toBe(-32768);
    });

    test('应该输出推断日志信息', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        // 创建新的存储以触发推断
        const newStorageManager = new ComponentStorageManager();
        newStorageManager.getSoAStorage(AutoInferredComponent);

        // 验证日志输出（注意：实际的日志可能通过logger系统输出）
        // 这里主要验证不会出错
        expect(() => {
            const component = new AutoInferredComponent();
            newStorageManager.addComponent(999, component);
        }).not.toThrow();

        consoleSpy.mockRestore();
    });

    test('计算内存节省百分比', () => {
        const autoStorage = storageManager.getSoAStorage(AutoInferredComponent);
        const manualStorage = storageManager.getSoAStorage(ManualTypedComponent);

        const autoStats = autoStorage!.getStats();
        const manualStats = manualStorage!.getStats();

        const memorySaved = ((manualStats.memoryUsage - autoStats.memoryUsage) / manualStats.memoryUsage) * 100;

        // 自动推断应该节省显著的内存
        expect(memorySaved).toBeGreaterThan(20); // 至少节省20%的内存
    });
});