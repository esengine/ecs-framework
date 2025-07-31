import { TypeUtils } from '../../../src/Utils/Extensions/TypeUtils';

describe('TypeUtils - 类型工具类测试', () => {
    // 测试用的类和对象
    class TestClass {
        public value: number = 0;
        
        constructor(...args: unknown[]) {
            if (args.length >= 1) this.value = args[0] as number;
        }
    }

    class AnotherTestClass {
        public name: string = '';
        
        constructor(...args: unknown[]) {
            if (args.length >= 1) this.name = args[0] as string;
        }
    }

    function TestFunction() {
        // @ts-ignore
        this.prop = 'test';
    }

    describe('getType 方法测试', () => {
        it('应该能够获取基本类型对象的构造函数', () => {
            expect(TypeUtils.getType(42)).toBe(Number);
            expect(TypeUtils.getType('hello')).toBe(String);
            expect(TypeUtils.getType(true)).toBe(Boolean);
            expect(TypeUtils.getType(false)).toBe(Boolean);
        });

        it('应该能够获取数组的构造函数', () => {
            expect(TypeUtils.getType([])).toBe(Array);
            expect(TypeUtils.getType([1, 2, 3])).toBe(Array);
            expect(TypeUtils.getType(new Array())).toBe(Array);
        });

        it('应该能够获取对象的构造函数', () => {
            expect(TypeUtils.getType({})).toBe(Object);
            expect(TypeUtils.getType(new Object())).toBe(Object);
        });

        it('应该能够获取Date对象的构造函数', () => {
            expect(TypeUtils.getType(new Date())).toBe(Date);
        });

        it('应该能够获取RegExp对象的构造函数', () => {
            expect(TypeUtils.getType(/test/)).toBe(RegExp);
            expect(TypeUtils.getType(new RegExp('test'))).toBe(RegExp);
        });

        it('应该能够获取Error对象的构造函数', () => {
            expect(TypeUtils.getType(new Error())).toBe(Error);
            expect(TypeUtils.getType(new TypeError())).toBe(TypeError);
            expect(TypeUtils.getType(new ReferenceError())).toBe(ReferenceError);
        });

        it('应该能够获取Map和Set的构造函数', () => {
            expect(TypeUtils.getType(new Map())).toBe(Map);
            expect(TypeUtils.getType(new Set())).toBe(Set);
            expect(TypeUtils.getType(new WeakMap())).toBe(WeakMap);
            expect(TypeUtils.getType(new WeakSet())).toBe(WeakSet);
        });

        it('应该能够获取Promise的构造函数', () => {
            const promise = Promise.resolve(42);
            expect(TypeUtils.getType(promise)).toBe(Promise);
        });

        it('应该能够获取自定义类实例的构造函数', () => {
            const instance = new TestClass(42);
            expect(TypeUtils.getType(instance)).toBe(TestClass);
        });

        it('应该能够区分不同的自定义类', () => {
            const testInstance = new TestClass(42);
            const anotherInstance = new AnotherTestClass('test');
            
            expect(TypeUtils.getType(testInstance)).toBe(TestClass);
            expect(TypeUtils.getType(anotherInstance)).toBe(AnotherTestClass);
            expect(TypeUtils.getType(testInstance)).not.toBe(AnotherTestClass);
        });

        it('应该能够获取函数构造的对象的构造函数', () => {
            // @ts-ignore
            const instance = new TestFunction();
            expect(TypeUtils.getType(instance)).toBe(TestFunction);
        });

        it('应该能够获取内置类型包装器的构造函数', () => {
            expect(TypeUtils.getType(new Number(42))).toBe(Number);
            expect(TypeUtils.getType(new String('hello'))).toBe(String);
            expect(TypeUtils.getType(new Boolean(true))).toBe(Boolean);
        });

        it('应该能够获取Symbol的构造函数', () => {
            const sym = Symbol('test');
            expect(TypeUtils.getType(sym)).toBe(Symbol);
        });

        it('应该能够获取BigInt的构造函数', () => {
            const bigInt = BigInt(42);
            expect(TypeUtils.getType(bigInt)).toBe(BigInt);
        });

        it('应该处理具有修改过构造函数的对象', () => {
            const obj = {};
            // @ts-ignore - 测试边界情况
            obj.constructor = TestClass;
            expect(TypeUtils.getType(obj)).toBe(TestClass);
        });

        it('应该处理继承关系', () => {
            class Parent {
                public value: number = 0;
                
                constructor(...args: unknown[]) {
                    if (args.length >= 1) this.value = args[0] as number;
                }
            }
            
            class Child extends Parent {
                public name: string = '';
                
                constructor(...args: unknown[]) {
                    super(args[0]);
                    if (args.length >= 2) this.name = args[1] as string;
                }
            }
            
            const childInstance = new Child(42, 'test');
            expect(TypeUtils.getType(childInstance)).toBe(Child);
            expect(TypeUtils.getType(childInstance)).not.toBe(Parent);
        });

        it('应该处理原型链修改的情况', () => {
            class Original {}
            class Modified {}
            
            const instance = new Original();
            // 修改原型链
            Object.setPrototypeOf(instance, Modified.prototype);
            
            // 构造函数属性应该仍然指向Modified
            expect(TypeUtils.getType(instance)).toBe(Modified);
        });

        it('应该处理null原型的对象', () => {
            const nullProtoObj = Object.create(null);
            // 没有constructor属性的对象会返回undefined
            const result = TypeUtils.getType(nullProtoObj);
            expect(result).toBeUndefined();
        });

        it('应该处理ArrayBuffer和TypedArray', () => {
            expect(TypeUtils.getType(new ArrayBuffer(8))).toBe(ArrayBuffer);
            expect(TypeUtils.getType(new Uint8Array(8))).toBe(Uint8Array);
            expect(TypeUtils.getType(new Int32Array(8))).toBe(Int32Array);
            expect(TypeUtils.getType(new Float64Array(8))).toBe(Float64Array);
        });

        it('应该处理生成器函数和生成器对象', () => {
            function* generatorFunction() {
                yield 1;
                yield 2;
            }
            
            const generator = generatorFunction();
            expect(TypeUtils.getType(generator)).toBe(Object.getPrototypeOf(generator).constructor);
        });

        it('应该处理async函数返回的Promise', () => {
            async function asyncFunction() {
                return 42;
            }
            
            const asyncResult = asyncFunction();
            expect(TypeUtils.getType(asyncResult)).toBe(Promise);
        });
    });

    describe('边界情况和错误处理', () => {
        it('应该处理undefined输入', () => {
            expect(() => {
                TypeUtils.getType(undefined);
            }).toThrow();
        });

        it('应该处理null输入', () => {
            expect(() => {
                TypeUtils.getType(null);
            }).toThrow();
        });

        it('应该处理构造函数被删除的对象', () => {
            const obj = new TestClass();
            // @ts-ignore - 测试边界情况
            delete obj.constructor;
            
            // 应该回退到原型链上的constructor
            expect(TypeUtils.getType(obj)).toBe(TestClass);
        });

        it('应该处理constructor属性被重写为非函数的情况', () => {
            const obj = {};
            // @ts-ignore - 测试边界情况
            obj.constructor = 'not a function';
            
            expect(TypeUtils.getType(obj)).toBe('not a function');
        });
    });

    describe('性能测试', () => {
        it('大量类型获取应该高效', () => {
            const testObjects = [
                42, 'string', true, [], {}, new Date(), new TestClass(),
                new Map(), new Set(), Symbol('test'), BigInt(42)
            ];
            
            const startTime = performance.now();
            
            for (let i = 0; i < 10000; i++) {
                testObjects.forEach(obj => {
                    TypeUtils.getType(obj);
                });
            }
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
        });
    });

    describe('实际使用场景测试', () => {
        it('应该能够用于类型检查', () => {
            function isInstanceOf(obj: any, Constructor: any): boolean {
                return TypeUtils.getType(obj) === Constructor;
            }
            
            expect(isInstanceOf(42, Number)).toBe(true);
            expect(isInstanceOf('hello', String)).toBe(true);
            expect(isInstanceOf([], Array)).toBe(true);
            expect(isInstanceOf(new TestClass(), TestClass)).toBe(true);
            expect(isInstanceOf(new TestClass(), AnotherTestClass)).toBe(false);
        });

        it('应该能够用于多态类型识别', () => {
            class Animal {
                public name: string = '';
                
                constructor(...args: unknown[]) {
                    if (args.length >= 1) this.name = args[0] as string;
                }
            }
            
            class Dog extends Animal {
                public breed: string = '';
                
                constructor(...args: unknown[]) {
                    super(args[0]);
                    if (args.length >= 2) this.breed = args[1] as string;
                }
            }
            
            class Cat extends Animal {
                public color: string = '';
                
                constructor(...args: unknown[]) {
                    super(args[0]);
                    if (args.length >= 2) this.color = args[1] as string;
                }
            }
            
            const animals = [
                new Dog('Buddy', 'Golden Retriever'),
                new Cat('Whiskers', 'Orange'),
                new Animal('Generic')
            ];
            
            const types = animals.map(animal => TypeUtils.getType(animal));
            expect(types).toEqual([Dog, Cat, Animal]);
        });

        it('应该能够用于工厂模式', () => {
            class ComponentFactory {
                static create(type: any, ...args: any[]) {
                    return new type(...args);
                }
                
                static getTypeName(instance: any): string {
                    return TypeUtils.getType(instance).name;
                }
            }
            
            const testInstance = ComponentFactory.create(TestClass, 42);
            expect(testInstance).toBeInstanceOf(TestClass);
            expect(testInstance.value).toBe(42);
            expect(ComponentFactory.getTypeName(testInstance)).toBe('TestClass');
        });

        it('应该能够用于序列化/反序列化的类型信息', () => {
            function serialize(obj: any): string {
                return JSON.stringify({
                    type: TypeUtils.getType(obj).name,
                    data: obj
                });
            }
            
            function getTypeFromSerialized(serialized: string): string {
                return JSON.parse(serialized).type;
            }
            
            const testObj = new TestClass(42);
            const serialized = serialize(testObj);
            const typeName = getTypeFromSerialized(serialized);
            
            expect(typeName).toBe('TestClass');
        });
    });
});