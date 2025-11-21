import { Injectable, InjectProperty, isInjectable, getPropertyInjectMetadata, createInstance, registerInjectable } from '../../src/Core/DI';
import { ServiceContainer } from '../../src/Core/ServiceContainer';
import type { IService } from '../../src/Core/ServiceContainer';

// 测试服务类
@Injectable()
class SimpleService implements IService {
    public value: string = 'simple';

    dispose() {
        // 清理资源
    }
}

@Injectable()
class DependentService implements IService {
    @InjectProperty(SimpleService)
    public simpleService!: SimpleService;

    dispose() {
        // 清理资源
    }
}

@Injectable()
class MultiDependencyService implements IService {
    @InjectProperty(SimpleService)
    public service1!: SimpleService;

    @InjectProperty(DependentService)
    public service2!: DependentService;

    dispose() {
        // 清理资源
    }
}

// 非Injectable类（用于测试错误情况）
class NonInjectableService implements IService {
    dispose() {}
}

describe('DI - 依赖注入装饰器测试', () => {
    let container: ServiceContainer;

    beforeEach(() => {
        container = new ServiceContainer();
    });

    describe('@Injectable 装饰器', () => {
        test('应该正确标记类为可注入', () => {
            expect(isInjectable(SimpleService as any)).toBe(true);
            expect(isInjectable(DependentService as any)).toBe(true);
        });

        test('未标记的类不应该是可注入的', () => {
            expect(isInjectable(NonInjectableService as any)).toBe(false);
        });
    });

    describe('@InjectProperty 装饰器', () => {
        test('应该记录属性注入元数据', () => {
            const metadata = getPropertyInjectMetadata(DependentService as any);
            expect(metadata.size).toBe(1);
            expect(metadata.get('simpleService')).toBe(SimpleService);
        });

        test('应该记录多个属性的注入元数据', () => {
            const metadata = getPropertyInjectMetadata(MultiDependencyService as any);
            expect(metadata.size).toBe(2);
            expect(metadata.get('service1')).toBe(SimpleService);
            expect(metadata.get('service2')).toBe(DependentService);
        });
    });

    describe('createInstance', () => {
        test('应该创建无依赖的实例', () => {
            container.registerSingleton(SimpleService);
            const instance = createInstance(SimpleService, container);

            expect(instance).toBeInstanceOf(SimpleService);
            expect(instance.value).toBe('simple');
        });

        test('应该创建有依赖的实例', () => {
            container.registerSingleton(SimpleService);
            container.registerSingleton(DependentService, () =>
                createInstance(DependentService, container)
            );

            const instance = createInstance(DependentService, container);

            expect(instance).toBeInstanceOf(DependentService);
            expect(instance.simpleService).toBeInstanceOf(SimpleService);
        });

        test('应该创建有多个依赖的实例', () => {
            container.registerSingleton(SimpleService);
            container.registerSingleton(DependentService, () =>
                createInstance(DependentService, container)
            );
            container.registerSingleton(MultiDependencyService, () =>
                createInstance(MultiDependencyService, container)
            );

            const instance = createInstance(MultiDependencyService, container);

            expect(instance).toBeInstanceOf(MultiDependencyService);
            expect(instance.service1).toBeInstanceOf(SimpleService);
            expect(instance.service2).toBeInstanceOf(DependentService);
        });

        test('依赖应该正确解析为单例', () => {
            container.registerSingleton(SimpleService);
            container.registerSingleton(DependentService, () =>
                createInstance(DependentService, container)
            );

            const simple1 = container.resolve(SimpleService);
            const dependent = createInstance(DependentService, container);

            expect(dependent.simpleService).toBe(simple1);
        });
    });

    describe('registerInjectable', () => {
        test('应该注册可注入的服务', () => {
            registerInjectable(container, SimpleService);

            expect(container.isRegistered(SimpleService)).toBe(true);
        });

        test('应该自动解析依赖', () => {
            registerInjectable(container, SimpleService);
            registerInjectable(container, DependentService);

            const instance = container.resolve(DependentService);

            expect(instance).toBeInstanceOf(DependentService);
            expect(instance.simpleService).toBeInstanceOf(SimpleService);
        });

        test('应该正确处理多层依赖', () => {
            registerInjectable(container, SimpleService);
            registerInjectable(container, DependentService);
            registerInjectable(container, MultiDependencyService);

            const instance = container.resolve(MultiDependencyService);

            expect(instance).toBeInstanceOf(MultiDependencyService);
            expect(instance.service1).toBeInstanceOf(SimpleService);
            expect(instance.service2).toBeInstanceOf(DependentService);
            expect(instance.service2.simpleService).toBeInstanceOf(SimpleService);
        });

        test('依赖应该是单例的', () => {
            registerInjectable(container, SimpleService);
            registerInjectable(container, DependentService);

            const instance1 = container.resolve(DependentService);
            const instance2 = container.resolve(DependentService);
            const simple = container.resolve(SimpleService);

            expect(instance1).toBe(instance2);
            expect(instance1.simpleService).toBe(simple);
        });

        test('注册瞬时服务应该每次创建新实例', () => {
            registerInjectable(container, SimpleService);
            registerInjectable(container, DependentService, false); // 瞬时

            const instance1 = container.resolve(DependentService);
            const instance2 = container.resolve(DependentService);

            expect(instance1).not.toBe(instance2);
            expect(instance1.simpleService).toBe(instance2.simpleService); // 依赖仍然是单例
        });

        test('注册非Injectable类应该抛出错误', () => {
            expect(() => {
                registerInjectable(container, NonInjectableService as any);
            }).toThrow(/not marked as @Injectable/);
        });
    });

    describe('集成测试', () => {
        test('完整的DI流程应该正常工作', () => {
            // 1. 注册所有服务
            registerInjectable(container, SimpleService);
            registerInjectable(container, DependentService);
            registerInjectable(container, MultiDependencyService);

            // 2. 解析服务
            const multi = container.resolve(MultiDependencyService);

            // 3. 验证依赖树
            expect(multi).toBeInstanceOf(MultiDependencyService);
            expect(multi.service1).toBeInstanceOf(SimpleService);
            expect(multi.service2).toBeInstanceOf(DependentService);
            expect(multi.service2.simpleService).toBe(multi.service1); // 同一个实例

            // 4. 验证服务功能
            expect(multi.service1.value).toBe('simple');
        });
    });
});
