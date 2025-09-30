import { Component } from '../../../src/ECS/Component';
import { ComponentStorageManager } from '../../../src/ECS/Core/ComponentStorage';
import {
    EnableSoA,
    Float32,
    Float64,
    Int32,
    Uint32,
    Int16,
    Uint16,
    Int8,
    Uint8,
    Uint8Clamped
} from '../../../src/ECS/Core/StorageDecorators';

// 测试组件 - 展示所有TypedArray类型
@EnableSoA
class EnhancedTestComponent extends Component {
    @Float32 x: number = 0;
    @Float32 y: number = 0;
    @Float64 preciseX: number = 0;
    @Int32 count: number = 0;
    @Uint32 entityId: number = 0; // 避免与基类id冲突
    @Int16 layer: number = 0;
    @Uint16 priority: number = 0;
    @Int8 direction: number = 0;
    @Uint8 flags: number = 0;
    @Uint8Clamped alpha: number = 255;
}

// 简单组件用于对比
class SimpleComponent extends Component {
    value: number = 42;
}

describe('Enhanced TypedArray Support', () => {
    let storageManager: ComponentStorageManager;

    beforeEach(() => {
        storageManager = new ComponentStorageManager();
    });

    test('应该为所有TypedArray类型创建正确的存储', () => {
        const storage = storageManager.getSoAStorage(EnhancedTestComponent);
        expect(storage).not.toBeNull();

        // 测试不同类型的字段数组
        const xArray = storage!.getFieldArray('x'); // Float32Array
        const preciseXArray = storage!.getFieldArray('preciseX'); // Float64Array
        const countArray = storage!.getFieldArray('count'); // Int32Array
        const entityIdArray = storage!.getFieldArray('entityId'); // Uint32Array
        const layerArray = storage!.getFieldArray('layer'); // Int16Array
        const priorityArray = storage!.getFieldArray('priority'); // Uint16Array
        const directionArray = storage!.getFieldArray('direction'); // Int8Array
        const flagsArray = storage!.getFieldArray('flags'); // Uint8Array
        const alphaArray = storage!.getFieldArray('alpha'); // Uint8ClampedArray

        expect(xArray).toBeInstanceOf(Float32Array);
        expect(preciseXArray).toBeInstanceOf(Float64Array);
        expect(countArray).toBeInstanceOf(Int32Array);
        expect(entityIdArray).toBeInstanceOf(Uint32Array);
        expect(layerArray).toBeInstanceOf(Int16Array);
        expect(priorityArray).toBeInstanceOf(Uint16Array);
        expect(directionArray).toBeInstanceOf(Int8Array);
        expect(flagsArray).toBeInstanceOf(Uint8Array);
        expect(alphaArray).toBeInstanceOf(Uint8ClampedArray);
    });

    test('应该正确存储和检索不同类型的数值', () => {
        const entityId = 1;
        const component = new EnhancedTestComponent();

        // 设置测试值
        component.x = 3.14159;
        component.preciseX = Math.PI;
        component.count = -123456;
        component.entityId = 4294967295; // 最大Uint32值
        component.layer = -32768; // 最小Int16值
        component.priority = 65535; // 最大Uint16值
        component.direction = -128; // 最小Int8值
        component.flags = 255; // 最大Uint8值
        component.alpha = 300; // 会被Clamped到255

        storageManager.addComponent(entityId, component);
        const retrieved = storageManager.getComponent(entityId, EnhancedTestComponent);

        expect(retrieved).not.toBeNull();
        expect(retrieved!.x).toBeCloseTo(3.14159, 5);
        expect(retrieved!.preciseX).toBeCloseTo(Math.PI, 10);
        expect(retrieved!.count).toBe(-123456);
        expect(retrieved!.entityId).toBe(4294967295);
        expect(retrieved!.layer).toBe(-32768);
        expect(retrieved!.priority).toBe(65535);
        expect(retrieved!.direction).toBe(-128);
        expect(retrieved!.flags).toBe(255);
        expect(retrieved!.alpha).toBe(255); // Clamped
    });

    test('应该正确计算内存使用量', () => {
        const storage = storageManager.getSoAStorage(EnhancedTestComponent);
        const stats = storage!.getStats();

        expect(stats.fieldStats.get('x').type).toBe('float32');
        expect(stats.fieldStats.get('x').memory).toBe(4000); // 1000 * 4 bytes

        expect(stats.fieldStats.get('preciseX').type).toBe('float64');
        expect(stats.fieldStats.get('preciseX').memory).toBe(8000); // 1000 * 8 bytes

        expect(stats.fieldStats.get('count').type).toBe('int32');
        expect(stats.fieldStats.get('count').memory).toBe(4000); // 1000 * 4 bytes

        expect(stats.fieldStats.get('entityId').type).toBe('uint32');
        expect(stats.fieldStats.get('entityId').memory).toBe(4000); // 1000 * 4 bytes

        expect(stats.fieldStats.get('layer').type).toBe('int16');
        expect(stats.fieldStats.get('layer').memory).toBe(2000); // 1000 * 2 bytes

        expect(stats.fieldStats.get('priority').type).toBe('uint16');
        expect(stats.fieldStats.get('priority').memory).toBe(2000); // 1000 * 2 bytes

        expect(stats.fieldStats.get('direction').type).toBe('int8');
        expect(stats.fieldStats.get('direction').memory).toBe(1000); // 1000 * 1 byte

        expect(stats.fieldStats.get('flags').type).toBe('uint8');
        expect(stats.fieldStats.get('flags').memory).toBe(1000); // 1000 * 1 byte

        expect(stats.fieldStats.get('alpha').type).toBe('uint8clamped');
        expect(stats.fieldStats.get('alpha').memory).toBe(1000); // 1000 * 1 byte
    });

    test('应该支持向量化批量操作', () => {
        const storage = storageManager.getSoAStorage(EnhancedTestComponent);

        // 添加测试数据
        for (let i = 0; i < 100; i++) {
            const component = new EnhancedTestComponent();
            component.x = i;
            component.y = i * 2;
            storageManager.addComponent(i, component);
        }

        // 执行向量化操作
        let processedCount = 0;
        storage!.performVectorizedOperation((fieldArrays, activeIndices) => {
            const xArray = fieldArrays.get('x') as Float32Array;
            const yArray = fieldArrays.get('y') as Float32Array;

            // 批量处理：x = x + y
            for (const index of activeIndices) {
                xArray[index] = xArray[index] + yArray[index];
                processedCount++;
            }
        });

        expect(processedCount).toBe(100);

        // 验证结果
        for (let i = 0; i < 100; i++) {
            const component = storageManager.getComponent(i, EnhancedTestComponent);
            expect(component!.x).toBe(i + i * 2); // x + y
        }
    });

    test('布尔值应该默认使用Uint8Array', () => {
        @EnableSoA
        class BooleanTestComponent extends Component {
            visible: boolean = true;
            @Float32 enabledFloat: boolean = true; // 显式指定Float32
        }

        const storage = storageManager.getSoAStorage(BooleanTestComponent);

        const visibleArray = storage!.getFieldArray('visible');
        const enabledFloatArray = storage!.getFieldArray('enabledFloat');

        expect(visibleArray).toBeInstanceOf(Uint8Array);
        expect(enabledFloatArray).toBeInstanceOf(Float32Array);
    });

    test('内存使用量对比：优化后应该更节省内存', () => {
        @EnableSoA
        class OptimizedComponent extends Component {
            @Uint8 flag1: number = 0;
            @Uint8 flag2: number = 0;
            @Uint8 flag3: number = 0;
            @Uint8 flag4: number = 0;
        }

        @EnableSoA
        class UnoptimizedComponent extends Component {
            @Float32 flag1: number = 0;
            @Float32 flag2: number = 0;
            @Float32 flag3: number = 0;
            @Float32 flag4: number = 0;
        }

        const optimizedStorage = storageManager.getSoAStorage(OptimizedComponent);
        const unoptimizedStorage = storageManager.getSoAStorage(UnoptimizedComponent);

        const optimizedStats = optimizedStorage!.getStats();
        const unoptimizedStats = unoptimizedStorage!.getStats();

        // 优化版本应该使用更少的内存（4个Uint8 vs 4个Float32）
        expect(optimizedStats.memoryUsage).toBeLessThan(unoptimizedStats.memoryUsage);

        // 验证优化后的单个字段确实更小
        expect(optimizedStats.fieldStats.get('flag1').memory).toBe(1000); // Uint8: 1000 bytes
        expect(unoptimizedStats.fieldStats.get('flag1').memory).toBe(4000); // Float32: 4000 bytes

        // 计算节省的内存百分比
        const memorySaved = ((unoptimizedStats.memoryUsage - optimizedStats.memoryUsage) / unoptimizedStats.memoryUsage) * 100;
        expect(memorySaved).toBeGreaterThan(50); // 应该节省超过50%的内存
    });
});