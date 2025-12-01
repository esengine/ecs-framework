import { AutoProfiler, Profile, ProfileClass } from '../../../src/Utils/Profiler/AutoProfiler';
import { ProfilerSDK } from '../../../src/Utils/Profiler/ProfilerSDK';
import { ProfileCategory } from '../../../src/Utils/Profiler/ProfilerTypes';

describe('AutoProfiler', () => {
    beforeEach(() => {
        AutoProfiler.resetInstance();
        ProfilerSDK.reset();
        ProfilerSDK.setEnabled(true);
    });

    afterEach(() => {
        AutoProfiler.resetInstance();
        ProfilerSDK.reset();
    });

    describe('getInstance', () => {
        test('should return singleton instance', () => {
            const instance1 = AutoProfiler.getInstance();
            const instance2 = AutoProfiler.getInstance();
            expect(instance1).toBe(instance2);
        });

        test('should accept custom config', () => {
            const instance = AutoProfiler.getInstance({ minDuration: 1.0 });
            expect(instance).toBeDefined();
        });
    });

    describe('resetInstance', () => {
        test('should reset the singleton instance', () => {
            const instance1 = AutoProfiler.getInstance();
            AutoProfiler.resetInstance();
            const instance2 = AutoProfiler.getInstance();
            expect(instance1).not.toBe(instance2);
        });
    });

    describe('setEnabled', () => {
        test('should enable/disable auto profiling', () => {
            AutoProfiler.setEnabled(false);
            const instance = AutoProfiler.getInstance();
            expect(instance).toBeDefined();

            AutoProfiler.setEnabled(true);
            expect(instance).toBeDefined();
        });
    });

    describe('wrapFunction', () => {
        test('should wrap a synchronous function', () => {
            ProfilerSDK.beginFrame();

            const originalFn = (a: number, b: number) => a + b;
            const wrappedFn = AutoProfiler.wrapFunction(originalFn, 'add', ProfileCategory.Custom);

            const result = wrappedFn(2, 3);
            expect(result).toBe(5);

            ProfilerSDK.endFrame();
        });

        test('should preserve function behavior', () => {
            const originalFn = (x: number) => x * 2;
            const wrappedFn = AutoProfiler.wrapFunction(originalFn, 'double', ProfileCategory.Script);

            ProfilerSDK.beginFrame();
            expect(wrappedFn(5)).toBe(10);
            expect(wrappedFn(0)).toBe(0);
            expect(wrappedFn(-3)).toBe(-6);
            ProfilerSDK.endFrame();
        });

        test('should handle async functions', async () => {
            const asyncFn = async (x: number) => {
                await new Promise((resolve) => setTimeout(resolve, 1));
                return x * 2;
            };

            const wrappedFn = AutoProfiler.wrapFunction(asyncFn, 'asyncDouble', ProfileCategory.Script);

            ProfilerSDK.beginFrame();
            const result = await wrappedFn(5);
            expect(result).toBe(10);
            ProfilerSDK.endFrame();
        });

        test('should handle function that throws error', () => {
            const errorFn = () => {
                throw new Error('Test error');
            };

            const wrappedFn = AutoProfiler.wrapFunction(errorFn, 'errorFn', ProfileCategory.Script);

            ProfilerSDK.beginFrame();
            expect(() => wrappedFn()).toThrow('Test error');
            ProfilerSDK.endFrame();
        });

        test('should return original function when disabled', () => {
            AutoProfiler.setEnabled(false);

            const originalFn = (x: number) => x + 1;
            const wrappedFn = AutoProfiler.wrapFunction(originalFn, 'increment', ProfileCategory.Script);

            expect(wrappedFn(5)).toBe(6);
        });
    });

    describe('wrapInstance', () => {
        test('should wrap all methods of an object', () => {
            class Calculator {
                add(a: number, b: number): number {
                    return a + b;
                }
                subtract(a: number, b: number): number {
                    return a - b;
                }
            }

            const calc = new Calculator();
            AutoProfiler.wrapInstance(calc, 'Calculator', ProfileCategory.Script);

            ProfilerSDK.beginFrame();
            expect(calc.add(5, 3)).toBe(8);
            expect(calc.subtract(5, 3)).toBe(2);
            ProfilerSDK.endFrame();
        });

        test('should not wrap already wrapped objects', () => {
            class MyClass {
                getValue(): number {
                    return 42;
                }
            }

            const obj = new MyClass();
            AutoProfiler.wrapInstance(obj, 'MyClass', ProfileCategory.Custom);
            AutoProfiler.wrapInstance(obj, 'MyClass', ProfileCategory.Custom);

            ProfilerSDK.beginFrame();
            expect(obj.getValue()).toBe(42);
            ProfilerSDK.endFrame();
        });

        test('should return object unchanged when disabled', () => {
            AutoProfiler.setEnabled(false);

            class MyClass {
                getValue(): number {
                    return 42;
                }
            }

            const obj = new MyClass();
            const wrapped = AutoProfiler.wrapInstance(obj, 'MyClass', ProfileCategory.Custom);

            expect(wrapped).toBe(obj);
        });

        test('should exclude methods matching exclude patterns', () => {
            class MyClass {
                getValue(): number {
                    return 42;
                }
                _privateMethod(): number {
                    return 1;
                }
                getName(): string {
                    return 'test';
                }
                isValid(): boolean {
                    return true;
                }
                hasData(): boolean {
                    return true;
                }
            }

            const obj = new MyClass();
            AutoProfiler.wrapInstance(obj, 'MyClass', ProfileCategory.Custom);

            ProfilerSDK.beginFrame();
            expect(obj.getValue()).toBe(42);
            expect(obj._privateMethod()).toBe(1);
            expect(obj.getName()).toBe('test');
            expect(obj.isValid()).toBe(true);
            expect(obj.hasData()).toBe(true);
            ProfilerSDK.endFrame();
        });
    });

    describe('registerClass', () => {
        test('should register a class for auto profiling', () => {
            class MySystem {
                update(): void {
                    // Do something
                }
            }

            const RegisteredClass = AutoProfiler.registerClass(MySystem, ProfileCategory.ECS);

            ProfilerSDK.beginFrame();
            const instance = new RegisteredClass();
            instance.update();
            ProfilerSDK.endFrame();

            expect(instance).toBeInstanceOf(MySystem);
        });

        test('should accept custom class name', () => {
            class MySystem {
                process(): number {
                    return 1;
                }
            }

            const RegisteredClass = AutoProfiler.registerClass(MySystem, ProfileCategory.ECS, 'CustomSystem');

            ProfilerSDK.beginFrame();
            const instance = new RegisteredClass();
            expect(instance.process()).toBe(1);
            ProfilerSDK.endFrame();
        });
    });

    describe('sampling profiler', () => {
        test('should start and stop sampling', () => {
            AutoProfiler.startSampling();
            const samples = AutoProfiler.stopSampling();

            expect(Array.isArray(samples)).toBe(true);
        });

        test('should return empty array when sampling was never started', () => {
            const samples = AutoProfiler.stopSampling();
            expect(samples).toEqual([]);
        });

        test('should collect samples during execution', async () => {
            AutoProfiler.startSampling();

            // Do some work
            for (let i = 0; i < 100; i++) {
                Math.sqrt(i);
            }

            // Wait a bit for samples to accumulate
            await new Promise((resolve) => setTimeout(resolve, 50));

            const samples = AutoProfiler.stopSampling();
            expect(Array.isArray(samples)).toBe(true);
        });
    });

    describe('dispose', () => {
        test('should clean up resources', () => {
            const instance = AutoProfiler.getInstance();
            instance.startSampling();
            instance.dispose();

            // After dispose, stopping sampling should return empty array
            const samples = instance.stopSampling();
            expect(samples).toEqual([]);
        });
    });

    describe('minDuration filtering', () => {
        test('should respect minDuration setting', () => {
            AutoProfiler.resetInstance();
            const instance = AutoProfiler.getInstance({ minDuration: 1000 });

            const quickFn = () => 1;
            const wrappedFn = instance.wrapFunction(quickFn, 'quickFn', ProfileCategory.Script);

            ProfilerSDK.beginFrame();
            expect(wrappedFn()).toBe(1);
            ProfilerSDK.endFrame();
        });
    });
});

describe('@Profile decorator', () => {
    beforeEach(() => {
        ProfilerSDK.reset();
        ProfilerSDK.setEnabled(true);
    });

    afterEach(() => {
        ProfilerSDK.reset();
    });

    test('should profile decorated methods', () => {
        class TestClass {
            @Profile()
            calculate(): number {
                return 42;
            }
        }

        const instance = new TestClass();

        ProfilerSDK.beginFrame();
        const result = instance.calculate();
        ProfilerSDK.endFrame();

        expect(result).toBe(42);
    });

    test('should use custom name when provided', () => {
        class TestClass {
            @Profile('CustomMethodName', ProfileCategory.Physics)
            compute(): number {
                return 100;
            }
        }

        const instance = new TestClass();

        ProfilerSDK.beginFrame();
        expect(instance.compute()).toBe(100);
        ProfilerSDK.endFrame();
    });

    test('should handle async methods', async () => {
        class TestClass {
            @Profile()
            async asyncMethod(): Promise<number> {
                await new Promise((resolve) => setTimeout(resolve, 1));
                return 99;
            }
        }

        const instance = new TestClass();

        ProfilerSDK.beginFrame();
        const result = await instance.asyncMethod();
        ProfilerSDK.endFrame();

        expect(result).toBe(99);
    });

    test('should handle method that throws error', () => {
        class TestClass {
            @Profile()
            throwingMethod(): void {
                throw new Error('Decorated error');
            }
        }

        const instance = new TestClass();

        ProfilerSDK.beginFrame();
        expect(() => instance.throwingMethod()).toThrow('Decorated error');
        ProfilerSDK.endFrame();
    });

    test('should skip profiling when ProfilerSDK is disabled', () => {
        ProfilerSDK.setEnabled(false);

        class TestClass {
            @Profile()
            simpleMethod(): number {
                return 1;
            }
        }

        const instance = new TestClass();
        expect(instance.simpleMethod()).toBe(1);
    });
});

describe('@ProfileClass decorator', () => {
    beforeEach(() => {
        AutoProfiler.resetInstance();
        ProfilerSDK.reset();
        ProfilerSDK.setEnabled(true);
    });

    afterEach(() => {
        AutoProfiler.resetInstance();
        ProfilerSDK.reset();
    });

    test('should profile all methods of decorated class', () => {
        @ProfileClass(ProfileCategory.ECS)
        class GameSystem {
            update(): void {
                // Update logic
            }

            render(): number {
                return 1;
            }
        }

        ProfilerSDK.beginFrame();
        const system = new GameSystem();
        system.update();
        expect(system.render()).toBe(1);
        ProfilerSDK.endFrame();
    });

    test('should use default category when not specified', () => {
        @ProfileClass()
        class DefaultSystem {
            process(): boolean {
                return true;
            }
        }

        ProfilerSDK.beginFrame();
        const system = new DefaultSystem();
        expect(system.process()).toBe(true);
        ProfilerSDK.endFrame();
    });
});
