import { Entity } from '../../src/ECS/Entity';
import { BigIntFactory } from '../../src/ECS/Utils/BigIntCompatibility';
import { ComponentType } from '../../src/ECS/Core/ComponentStorage';

describe('初始化方式性能对比', () => {
    test('对比不同初始化方式的性能', () => {
        const testCount = 10000;
        console.log(`\n=== 初始化方式对比 (${testCount}个实体) ===`);

        // 方式1：字段直接初始化（原来的方式）
        class EntityWithFieldInit {
            public name: string;
            public id: number;
            private _componentMask = BigIntFactory.zero();
            private _componentTypeToIndex = new Map<ComponentType, number>();

            constructor(name: string, id: number) {
                this.name = name;
                this.id = id;
            }
        }

        // 方式2：构造函数初始化（新方式）
        class EntityWithConstructorInit {
            public name: string;
            public id: number;
            private _componentMask: any;
            private _componentTypeToIndex: Map<ComponentType, number>;

            constructor(name: string, id: number) {
                this.name = name;
                this.id = id;
                this._componentMask = BigIntFactory.zero();
                this._componentTypeToIndex = new Map<ComponentType, number>();
            }
        }

        // 方式3：完全延迟初始化
        class EntityWithLazyInit {
            public name: string;
            public id: number;
            private _componentMask: any;
            private _componentTypeToIndex: Map<ComponentType, number> | undefined;

            constructor(name: string, id: number) {
                this.name = name;
                this.id = id;
                // 什么都不初始化
            }

            private ensureInit() {
                if (!this._componentTypeToIndex) {
                    this._componentMask = BigIntFactory.zero();
                    this._componentTypeToIndex = new Map<ComponentType, number>();
                }
            }
        }

        // 测试方式1：字段直接初始化
        let startTime = performance.now();
        const entities1 = [];
        for (let i = 0; i < testCount; i++) {
            entities1.push(new EntityWithFieldInit(`Entity_${i}`, i));
        }
        const fieldInitTime = performance.now() - startTime;

        // 测试方式2：构造函数初始化
        startTime = performance.now();
        const entities2 = [];
        for (let i = 0; i < testCount; i++) {
            entities2.push(new EntityWithConstructorInit(`Entity_${i}`, i));
        }
        const constructorInitTime = performance.now() - startTime;

        // 测试方式3：延迟初始化
        startTime = performance.now();
        const entities3 = [];
        for (let i = 0; i < testCount; i++) {
            entities3.push(new EntityWithLazyInit(`Entity_${i}`, i));
        }
        const lazyInitTime = performance.now() - startTime;

        // 测试方式4：只创建基本对象
        startTime = performance.now();
        const entities4 = [];
        for (let i = 0; i < testCount; i++) {
            entities4.push({ name: `Entity_${i}`, id: i });
        }
        const basicObjectTime = performance.now() - startTime;

        console.log(`字段直接初始化: ${fieldInitTime.toFixed(2)}ms`);
        console.log(`构造函数初始化: ${constructorInitTime.toFixed(2)}ms`);
        console.log(`延迟初始化: ${lazyInitTime.toFixed(2)}ms`);
        console.log(`基本对象创建: ${basicObjectTime.toFixed(2)}ms`);
        
        console.log(`\n性能对比:`);
        console.log(`构造函数 vs 字段初始化: ${(fieldInitTime / constructorInitTime).toFixed(2)}x`);
        console.log(`延迟 vs 构造函数: ${(constructorInitTime / lazyInitTime).toFixed(2)}x`);
        console.log(`延迟 vs 基本对象: ${(lazyInitTime / basicObjectTime).toFixed(2)}x`);
    });

    test('测试BigIntFactory.zero()的性能', () => {
        const testCount = 10000;
        console.log(`\n=== BigIntFactory.zero()性能测试 ===`);

        // 测试1：每次调用BigIntFactory.zero()
        let startTime = performance.now();
        const values1 = [];
        for (let i = 0; i < testCount; i++) {
            values1.push(BigIntFactory.zero());
        }
        const directCallTime = performance.now() - startTime;

        // 测试2：重复使用同一个实例
        const sharedZero = BigIntFactory.zero();
        startTime = performance.now();
        const values2 = [];
        for (let i = 0; i < testCount; i++) {
            values2.push(sharedZero);
        }
        const sharedInstanceTime = performance.now() - startTime;

        // 测试3：使用数字0
        startTime = performance.now();
        const values3 = [];
        for (let i = 0; i < testCount; i++) {
            values3.push(0);
        }
        const numberZeroTime = performance.now() - startTime;

        console.log(`每次调用BigIntFactory.zero(): ${directCallTime.toFixed(2)}ms`);
        console.log(`重复使用同一实例: ${sharedInstanceTime.toFixed(2)}ms`);
        console.log(`使用数字0: ${numberZeroTime.toFixed(2)}ms`);
        
        console.log(`性能提升:`);
        console.log(`共享实例 vs 每次调用: ${(directCallTime / sharedInstanceTime).toFixed(2)}x faster`);
        console.log(`数字0 vs BigIntFactory: ${(directCallTime / numberZeroTime).toFixed(2)}x faster`);
    });

    test('测试Map创建的性能', () => {
        const testCount = 10000;
        console.log(`\n=== Map创建性能测试 ===`);

        // 测试1：每次new Map()
        let startTime = performance.now();
        const maps1 = [];
        for (let i = 0; i < testCount; i++) {
            maps1.push(new Map());
        }
        const newMapTime = performance.now() - startTime;

        // 测试2：使用对象字面量
        startTime = performance.now();
        const objects = [];
        for (let i = 0; i < testCount; i++) {
            objects.push({});
        }
        const objectTime = performance.now() - startTime;

        // 测试3：延迟创建Map
        startTime = performance.now();
        const lazyMaps = [];
        for (let i = 0; i < testCount; i++) {
            lazyMaps.push(null); // 先不创建
        }
        const lazyTime = performance.now() - startTime;

        console.log(`每次new Map(): ${newMapTime.toFixed(2)}ms`);
        console.log(`对象字面量: ${objectTime.toFixed(2)}ms`);
        console.log(`延迟创建: ${lazyTime.toFixed(2)}ms`);
        
        console.log(`性能对比:`);
        console.log(`对象 vs Map: ${(newMapTime / objectTime).toFixed(2)}x faster`);
        console.log(`延迟 vs Map: ${(newMapTime / lazyTime).toFixed(2)}x faster`);
    });
});