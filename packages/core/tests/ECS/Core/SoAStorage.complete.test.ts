import { Component } from '../../../src/ECS/Component';
import { ComponentStorageManager } from '../../../src/ECS/Core/ComponentStorage';
import {
    EnableSoA,
    Float64,
    Int32,
    SerializeMap,
    SerializeSet,
    SerializeArray,
    DeepCopy,
    SoAStorage
} from '../../../src/ECS/Core/SoAStorage';

/**
 * SoA存储完整测试套件
 */

// 测试组件定义
@EnableSoA
class BasicTypesComponent extends Component {
    public intNumber: number;
    public floatNumber: number;
    public boolValue: boolean;
    public stringValue: string;
    public nullValue: null;
    public undefinedValue: undefined;

    constructor(...args: unknown[]) {
        super();
        const [
            intNumber = 42,
            floatNumber = 3.14,
            boolValue = true,
            stringValue = 'test',
            nullValue = null,
            undefinedValue = undefined
        ] = args as [number?, number?, boolean?, string?, null?, undefined?];

        this.intNumber = intNumber;
        this.floatNumber = floatNumber;
        this.boolValue = boolValue;
        this.stringValue = stringValue;
        this.nullValue = nullValue;
        this.undefinedValue = undefinedValue;
    }
}

@EnableSoA
class DecoratedNumberComponent extends Component {
    public normalFloat: number;

    @Float64
    public highPrecisionNumber: number;

    @Float64
    public preciseFloat: number;

    @Int32
    public integerValue: number;

    constructor(...args: unknown[]) {
        super();
        const [
            normalFloat = 3.14,
            highPrecisionNumber = Number.MAX_SAFE_INTEGER,
            preciseFloat = Math.PI,
            integerValue = 42
        ] = args as [number?, number?, number?, number?];

        this.normalFloat = normalFloat;
        this.highPrecisionNumber = highPrecisionNumber;
        this.preciseFloat = preciseFloat;
        this.integerValue = integerValue;
    }
}

@EnableSoA
class CollectionComponent extends Component {
    @SerializeMap
    public mapData: Map<string, any>;

    @SerializeSet
    public setData: Set<any>;

    @SerializeArray
    public arrayData: any[];

    @DeepCopy
    public deepCopyData: any;

    constructor(...args: unknown[]) {
        super();
        const [
            mapData = new Map(),
            setData = new Set(),
            arrayData = [],
            deepCopyData = null
        ] = args as [Map<string, any>?, Set<any>?, any[]?, any?];

        this.mapData = mapData;
        this.setData = setData;
        this.arrayData = arrayData;
        this.deepCopyData = deepCopyData;
    }
}

class MockNode {
    public name: string;
    public active: boolean;

    constructor(name: string) {
        this.name = name;
        this.active = true;
    }
}

@EnableSoA
class ComplexObjectComponent extends Component {
    public x: number;
    public y: number;
    public node: MockNode | null;
    public callback: Function | null;
    public data: any;

    constructor(...args: unknown[]) {
        super();
        const [
            x = 0,
            y = 0,
            node = null as MockNode | null,
            callback = null as Function | null,
            data = null as any
        ] = args as [number?, number?, (MockNode | null)?, (Function | null)?, any?];

        this.x = x;
        this.y = y;
        this.node = node;
        this.callback = callback;
        this.data = data;
    }
}

@EnableSoA
class MixedComponent extends Component {
    @Float64
    public bigIntId: number;

    @Float64
    public preciseValue: number;

    @Int32
    public intValue: number;

    @SerializeMap
    public gameMap: Map<string, any>;

    @SerializeSet
    public flags: Set<number>;

    @SerializeArray
    public items: any[];

    @DeepCopy
    public config: any;

    public normalFloat: number;
    public boolFlag: boolean;
    public text: string;

    constructor(...args: unknown[]) {
        super();
        const [
            bigIntId = 0,
            preciseValue = 0,
            intValue = 0,
            normalFloat = 0,
            boolFlag = false,
            text = ''
        ] = args as [number?, number?, number?, number?, boolean?, string?];

        this.bigIntId = bigIntId;
        this.preciseValue = preciseValue;
        this.intValue = intValue;
        this.gameMap = new Map();
        this.flags = new Set();
        this.items = [];
        this.config = null;
        this.normalFloat = normalFloat;
        this.boolFlag = boolFlag;
        this.text = text;
    }
}

describe('SoAStorage - SoA存储测试', () => {
    let manager: ComponentStorageManager;

    beforeEach(() => {
        manager = new ComponentStorageManager();
    });

    describe('基础数据类型', () => {
        test('应该正确存储和检索number类型', () => {
            const component = new BasicTypesComponent(999, 2.718);

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, BasicTypesComponent);

            expect(retrieved?.intNumber).toBe(999);
            expect(retrieved?.floatNumber).toBeCloseTo(2.718);
        });

        test('应该正确存储和检索boolean类型', () => {
            const component = new BasicTypesComponent(0, 0, false);

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, BasicTypesComponent);

            expect(retrieved?.boolValue).toBe(false);
        });

        test('应该正确存储和检索string类型', () => {
            const testString = '测试中文字符串 with emoji 🎉';
            const component = new BasicTypesComponent(0, 0, true, testString);

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, BasicTypesComponent);

            expect(retrieved?.stringValue).toBe(testString);
        });

        test('应该正确处理null和undefined', () => {
            const component = new BasicTypesComponent();

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, BasicTypesComponent);

            expect(retrieved?.nullValue).toBe(null);
            // undefined在SoA存储中保持为undefined，不会序列化
            expect(retrieved?.undefinedValue).toBeUndefined();
        });

        test('应该正确处理空字符串', () => {
            const component = new BasicTypesComponent(0, 0, true, '');

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, BasicTypesComponent);

            expect(retrieved?.stringValue).toBe('');
        });

        test('应该正确处理数值边界值', () => {
            // Float32可精确表示的最大整数约为2^24 (16777216)
            // Float32最小正值约为1.4e-45，Number.MIN_VALUE (5e-324)会被截断为0
            const maxFloat32Int = 16777216;
            const minFloat32 = 1.401298464324817e-45;
            const component = new BasicTypesComponent(
                maxFloat32Int,
                minFloat32
            );

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, BasicTypesComponent);

            expect(retrieved?.intNumber).toBe(maxFloat32Int);
            expect(retrieved?.floatNumber).toBeCloseTo(minFloat32, 45);
        });

        test('应该正确处理特殊字符串', () => {
            const specialString = '\n\t\r"\'\\\\';
            const component = new BasicTypesComponent(0, 0, true, specialString);

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, BasicTypesComponent);

            expect(retrieved?.stringValue).toBe(specialString);
        });

        test('应该正确处理长字符串', () => {
            const longString = 'a'.repeat(1000);
            const component = new BasicTypesComponent(0, 0, true, longString);

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, BasicTypesComponent);

            expect(retrieved?.stringValue).toBe(longString);
        });
    });

    describe('数值类型装饰器', () => {
        test('@Float64应该保持高精度数值', () => {
            const component = new DecoratedNumberComponent(
                0,
                Number.MAX_SAFE_INTEGER
            );

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, DecoratedNumberComponent);

            expect(retrieved?.highPrecisionNumber).toBe(Number.MAX_SAFE_INTEGER);
        });

        test('@Float64应该使用双精度浮点存储', () => {
            const component = new DecoratedNumberComponent(0, 0, Math.PI);

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, DecoratedNumberComponent);

            expect(retrieved?.preciseFloat).toBeCloseTo(Math.PI, 15);
        });

        test('@Int32应该使用32位整数存储', () => {
            const component = new DecoratedNumberComponent(0, 0, 0, -2147483648);

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, DecoratedNumberComponent);

            expect(retrieved?.integerValue).toBe(-2147483648);
        });

        test('默认应该使用Float32存储', () => {
            const component = new DecoratedNumberComponent(3.14159);

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, DecoratedNumberComponent);

            expect(retrieved?.normalFloat).toBeCloseTo(3.14159, 5);
        });

        test('应该使用正确的TypedArray类型', () => {
            const component = new DecoratedNumberComponent();
            manager.addComponent(1, component);

            const storage = manager.getStorage(DecoratedNumberComponent) as SoAStorage<DecoratedNumberComponent>;

            expect(storage.getFieldArray('normalFloat')).toBeInstanceOf(Float32Array);
            expect(storage.getFieldArray('preciseFloat')).toBeInstanceOf(Float64Array);
            expect(storage.getFieldArray('integerValue')).toBeInstanceOf(Int32Array);
            expect(storage.getFieldArray('highPrecisionNumber')).toBeInstanceOf(Float64Array);
        });
    });

    describe('集合类型序列化', () => {
        test('@SerializeMap应该正确序列化Map', () => {
            const component = new CollectionComponent();
            component.mapData.set('key1', 'value1');
            component.mapData.set('key2', 123);
            component.mapData.set('key3', { nested: 'object' });

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, CollectionComponent);

            expect(retrieved?.mapData).toBeInstanceOf(Map);
            expect(retrieved?.mapData.size).toBe(3);
            expect(retrieved?.mapData.get('key1')).toBe('value1');
            expect(retrieved?.mapData.get('key2')).toBe(123);
            expect(retrieved?.mapData.get('key3')).toEqual({ nested: 'object' });
        });

        test('@SerializeSet应该正确序列化Set', () => {
            const component = new CollectionComponent();
            component.setData.add('item1');
            component.setData.add('item2');
            component.setData.add(123);

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, CollectionComponent);

            expect(retrieved?.setData).toBeInstanceOf(Set);
            expect(retrieved?.setData.size).toBe(3);
            expect(retrieved?.setData.has('item1')).toBe(true);
            expect(retrieved?.setData.has('item2')).toBe(true);
            expect(retrieved?.setData.has(123)).toBe(true);
        });

        test('@SerializeArray应该正确序列化Array', () => {
            const component = new CollectionComponent();
            component.arrayData = ['item1', 'item2', 123, { nested: 'object' }];

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, CollectionComponent);

            expect(Array.isArray(retrieved?.arrayData)).toBe(true);
            expect(retrieved?.arrayData).toEqual(['item1', 'item2', 123, { nested: 'object' }]);
        });

        test('@DeepCopy应该创建深拷贝', () => {
            const component = new CollectionComponent();
            component.deepCopyData = { level1: { level2: { value: 42 } } };
            const originalRef = component.deepCopyData;

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, CollectionComponent);

            expect(retrieved?.deepCopyData).toEqual(component.deepCopyData);
            expect(retrieved?.deepCopyData).not.toBe(originalRef);

            component.deepCopyData.level1.level2.value = 100;
            expect(retrieved?.deepCopyData.level1.level2.value).toBe(42);
        });

        test('Map应该正确处理边界值', () => {
            const component = new CollectionComponent();
            component.mapData.set('null', null);
            component.mapData.set('undefined', undefined);
            component.mapData.set('empty', '');
            component.mapData.set('zero', 0);
            component.mapData.set('false', false);

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, CollectionComponent);

            expect(retrieved?.mapData.get('null')).toBe(null);
            expect(retrieved?.mapData.get('undefined')).toBe(null);
            expect(retrieved?.mapData.get('empty')).toBe('');
            expect(retrieved?.mapData.get('zero')).toBe(0);
            expect(retrieved?.mapData.get('false')).toBe(false);
        });

        test('Set应该支持数值0', () => {
            const component = new CollectionComponent();
            component.setData.add(0);
            component.setData.add(1);

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, CollectionComponent);

            expect(retrieved?.setData.has(0)).toBe(true);
            expect(retrieved?.setData.has(1)).toBe(true);
        });

        test('Array应该正确处理null和undefined', () => {
            const component = new CollectionComponent();
            component.arrayData = [null, undefined, '', 0, false];

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, CollectionComponent);

            expect(retrieved?.arrayData).toEqual([null, null, '', 0, false]);
        });
    });

    describe('复杂对象处理', () => {
        test('应该正确保存复杂对象引用', () => {
            const node = new MockNode('testNode');
            const callback = () => console.log('test');
            const data = { complex: 'object' };

            const component = new ComplexObjectComponent(100, 200, node, callback, data);

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, ComplexObjectComponent);

            expect(retrieved?.x).toBe(100);
            expect(retrieved?.y).toBe(200);
            expect(retrieved?.node?.name).toBe('testNode');
            expect(retrieved?.node?.active).toBe(true);
            expect(retrieved?.callback).toBe(callback);
            expect(retrieved?.data).toEqual(data);
        });

        test('应该正确处理null对象', () => {
            const component = new ComplexObjectComponent(0, 0, null, null, null);

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, ComplexObjectComponent);

            expect(retrieved?.node).toBe(null);
            expect(retrieved?.callback).toBe(null);
            expect(retrieved?.data).toBe(null);
        });
    });

    describe('混合装饰器使用', () => {
        test('应该支持多种装饰器混合使用', () => {
            const component = new MixedComponent(
                Number.MAX_SAFE_INTEGER,
                Math.PI,
                -2147483648,
                1.23,
                true,
                'test'
            );

            component.gameMap.set('player1', { level: 10 });
            component.flags.add(1);
            component.flags.add(2);
            component.items.push('item1');
            component.config = { settings: { volume: 0.8 } };

            manager.addComponent(1, component);
            const retrieved = manager.getComponent(1, MixedComponent);

            expect(retrieved?.bigIntId).toBe(Number.MAX_SAFE_INTEGER);
            expect(retrieved?.preciseValue).toBeCloseTo(Math.PI, 15);
            expect(retrieved?.intValue).toBe(-2147483648);
            expect(retrieved?.normalFloat).toBeCloseTo(1.23, 5);
            expect(retrieved?.boolFlag).toBe(true);
            expect(retrieved?.text).toBe('test');

            expect(retrieved?.gameMap.get('player1')).toEqual({ level: 10 });
            expect(retrieved?.flags.has(1)).toBe(true);
            expect(retrieved?.flags.has(2)).toBe(true);
            expect(retrieved?.items).toContain('item1');
            expect(retrieved?.config.settings.volume).toBe(0.8);
        });
    });

    describe('存储管理', () => {
        test('应该正确统计存储信息', () => {
            const storage = manager.getStorage(MixedComponent) as SoAStorage<MixedComponent>;

            for (let i = 1; i <= 5; i++) {
                const component = new MixedComponent(i, i * Math.PI, i * 10);
                manager.addComponent(i, component);
            }

            const stats = storage.getStats();

            expect(stats.size).toBe(5);
            expect(stats.capacity).toBeGreaterThanOrEqual(5);
            expect(stats.memoryUsage).toBeGreaterThan(0);
        });

        test('应该支持压缩操作', () => {
            const storage = manager.getStorage(MixedComponent) as SoAStorage<MixedComponent>;

            for (let i = 1; i <= 5; i++) {
                const component = new MixedComponent();
                manager.addComponent(i, component);
            }

            storage.removeComponent(2);
            storage.removeComponent(4);

            const statsBefore = storage.getStats();
            storage.compact();
            const statsAfter = storage.getStats();

            expect(statsAfter.size).toBe(3);
            expect(statsAfter.size).toBeLessThan(statsBefore.capacity);
        });

        test('应该正确处理循环引用', () => {
            const component = new MixedComponent();
            const cyclicObject: any = { name: 'test' };
            cyclicObject.self = cyclicObject;
            component.items.push(cyclicObject);

            expect(() => {
                manager.addComponent(1, component);
            }).not.toThrow();

            const retrieved = manager.getComponent(1, MixedComponent);
            expect(retrieved).toBeDefined();
        });
    });

    describe('性能测试', () => {
        test('大容量创建性能应该可接受', () => {
            const entityCount = 2000;
            const startTime = performance.now();

            for (let i = 1; i <= entityCount; i++) {
                const component = new MixedComponent(i, i * 0.1, i * 10);
                component.gameMap.set(`key${i}`, i);
                manager.addComponent(i, component);
            }

            const createTime = performance.now() - startTime;

            expect(createTime).toBeLessThan(1000);

            const storage = manager.getStorage(MixedComponent) as SoAStorage<MixedComponent>;
            const stats = storage.getStats();
            expect(stats.size).toBe(entityCount);
        });

        test('随机访问性能应该可接受', () => {
            const entityCount = 2000;

            for (let i = 1; i <= entityCount; i++) {
                const component = new MixedComponent(i);
                manager.addComponent(i, component);
            }

            const startTime = performance.now();
            for (let i = 0; i < 100; i++) {
                const randomId = Math.floor(Math.random() * entityCount) + 1;
                const component = manager.getComponent(randomId, MixedComponent);
                expect(component?.bigIntId).toBe(randomId);
            }
            const readTime = performance.now() - startTime;

            expect(readTime).toBeLessThan(100);
        });

        test('向量化批量操作应该正确执行', () => {
            const storage = manager.getStorage(MixedComponent) as SoAStorage<MixedComponent>;

            for (let i = 1; i <= 10; i++) {
                const component = new MixedComponent(0, 0, i * 10, i);
                manager.addComponent(i, component);
            }

            let operationExecuted = false;
            storage.performVectorizedOperation((fieldArrays, activeIndices) => {
                operationExecuted = true;

                const normalFloatArray = fieldArrays.get('normalFloat') as Float32Array;
                const intArray = fieldArrays.get('intValue') as Int32Array;

                expect(normalFloatArray).toBeInstanceOf(Float32Array);
                expect(intArray).toBeInstanceOf(Int32Array);
                expect(activeIndices.length).toBe(10);

                for (let i = 0; i < activeIndices.length; i++) {
                    const idx = activeIndices[i];
                    normalFloatArray[idx] *= 2;
                    intArray[idx] += 5;
                }
            });

            expect(operationExecuted).toBe(true);

            const component = manager.getComponent(5, MixedComponent);
            expect(component?.normalFloat).toBe(10);
            expect(component?.intValue).toBe(55);
        });
    });
});
