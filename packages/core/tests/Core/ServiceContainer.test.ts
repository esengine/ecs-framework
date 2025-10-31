import { ServiceContainer, ServiceLifetime } from '../../src/Core/ServiceContainer';

// 测试服务类
class TestService {
    public value: number = 0;

    constructor() {
        this.value = Math.random();
    }

    dispose() {
        // 清理资源
    }
}

class DependentService {
    public testService?: TestService;

    constructor(...args: unknown[]) {
        if (args[0] !== undefined) {
            this.testService = args[0] as TestService;
        }
    }

    dispose() {
        // 清理资源
    }
}

class DisposableService {
    public disposed = false;

    dispose() {
        this.disposed = true;
    }
}

describe('ServiceContainer - 服务容器测试', () => {
    let container: ServiceContainer;

    beforeEach(() => {
        container = new ServiceContainer();
    });

    describe('单例服务注册', () => {
        test('应该能够注册单例服务', () => {
            container.registerSingleton(TestService);
            expect(container.isRegistered(TestService)).toBe(true);
        });

        test('单例服务应该返回相同实例', () => {
            container.registerSingleton(TestService);

            const instance1 = container.resolve(TestService);
            const instance2 = container.resolve(TestService);

            expect(instance1).toBe(instance2);
            expect(instance1.value).toBe(instance2.value);
        });

        test('应该能够使用工厂函数注册单例', () => {
            const fixedValue = 42;
            container.registerSingleton(TestService, () => {
                const service = new TestService();
                service.value = fixedValue;
                return service;
            });

            const instance = container.resolve(TestService);
            expect(instance.value).toBe(fixedValue);
        });
    });

    describe('瞬时服务注册', () => {
        test('应该能够注册瞬时服务', () => {
            container.registerTransient(TestService);
            expect(container.isRegistered(TestService)).toBe(true);
        });

        test('瞬时服务应该每次返回新实例', () => {
            container.registerTransient(TestService);

            const instance1 = container.resolve(TestService);
            const instance2 = container.resolve(TestService);

            expect(instance1).not.toBe(instance2);
            expect(instance1.value).not.toBe(instance2.value);
        });
    });

    describe('实例注册', () => {
        test('应该能够注册已存在的实例', () => {
            const instance = new TestService();
            instance.value = 99;

            container.registerInstance(TestService, instance);

            const resolved = container.resolve(TestService);
            expect(resolved).toBe(instance);
            expect(resolved.value).toBe(99);
        });
    });

    describe('服务解析', () => {
        test('解析未注册的服务应该抛出错误', () => {
            expect(() => container.resolve(TestService)).toThrow(
                'Service TestService is not registered'
            );
        });

        test('tryResolve应该返回null而不是抛出错误', () => {
            const result = container.tryResolve(TestService);
            expect(result).toBeNull();
        });

        test('tryResolve应该返回已注册的服务', () => {
            container.registerSingleton(TestService);
            const result = container.tryResolve(TestService);
            expect(result).not.toBeNull();
            expect(result).toBeInstanceOf(TestService);
        });
    });

    describe('依赖注入', () => {
        test('工厂函数应该能够解析其他服务', () => {
            container.registerSingleton(TestService);
            container.registerSingleton(DependentService, (c) => {
                const testService = c.resolve(TestService);
                return new DependentService(testService);
            });

            const dependent = container.resolve(DependentService);
            const test = container.resolve(TestService);

            expect(dependent.testService).toBe(test);
        });
    });

    describe('循环依赖检测', () => {
        test('应该检测并报告循环依赖', () => {
            class ServiceA {
                constructor() {
                    // 在构造函数中尝试解析ServiceB会导致循环依赖
                }
                dispose() {}
            }

            class ServiceB {
                constructor() {}
                dispose() {}
            }

            container.registerSingleton(ServiceA, (c) => {
                c.resolve(ServiceB); // 尝试解析B
                return new ServiceA();
            });

            container.registerSingleton(ServiceB, (c) => {
                c.resolve(ServiceA); // 尝试解析A
                return new ServiceB();
            });

            expect(() => container.resolve(ServiceA)).toThrow(/Circular dependency detected/);
        });
    });

    describe('服务注销', () => {
        test('应该能够注销服务', () => {
            container.registerSingleton(TestService);
            expect(container.isRegistered(TestService)).toBe(true);

            const result = container.unregister(TestService);
            expect(result).toBe(true);
            expect(container.isRegistered(TestService)).toBe(false);
        });

        test('注销不存在的服务应该返回false', () => {
            const result = container.unregister(TestService);
            expect(result).toBe(false);
        });

        test('注销服务应该调用dispose方法', () => {
            const instance = new DisposableService();
            container.registerInstance(DisposableService, instance);

            container.unregister(DisposableService);
            expect(instance.disposed).toBe(true);
        });
    });

    describe('清空容器', () => {
        test('应该能够清空所有服务', () => {
            container.registerSingleton(TestService);
            container.registerTransient(DependentService);

            expect(container.getRegisteredServices().length).toBe(2);

            container.clear();

            expect(container.getRegisteredServices().length).toBe(0);
        });

        test('清空容器应该调用所有单例的dispose方法', () => {
            const instance = new DisposableService();
            container.registerInstance(DisposableService, instance);

            container.clear();
            expect(instance.disposed).toBe(true);
        });
    });

    describe('重复注册', () => {
        test('重复注册应该发出警告但不覆盖', () => {
            container.registerSingleton(TestService);
            const instance1 = container.resolve(TestService);

            // 尝试重复注册
            container.registerSingleton(TestService);
            const instance2 = container.resolve(TestService);

            // 应该返回相同的实例（没有被覆盖）
            expect(instance1).toBe(instance2);
        });
    });

    describe('获取已注册服务列表', () => {
        test('应该返回所有已注册的服务类型', () => {
            container.registerSingleton(TestService);
            container.registerTransient(DependentService);

            const services = container.getRegisteredServices();
            expect(services).toContain(TestService);
            expect(services).toContain(DependentService);
            expect(services.length).toBe(2);
        });
    });
});
