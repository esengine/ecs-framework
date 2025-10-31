/**
 * 依赖注入装饰器
 *
 * 提供 @Injectable、@Inject 和 @Updatable 装饰器，用于标记可注入的类和依赖注入点
 */

import type {ServiceContainer} from "../ServiceContainer";
import type {IService, ServiceType} from "../ServiceContainer";

/**
 * 依赖注入元数据存储
 */
type Constructor = abstract new (...args: unknown[]) => unknown;

const injectableMetadata = new WeakMap<Constructor, InjectableMetadata>();
const injectMetadata = new WeakMap<Constructor, Map<number, ServiceType<IService> | string | symbol>>();
const updatableMetadata = new WeakMap<Constructor, UpdatableMetadata>();

/**
 * 可注入元数据接口
 */
export interface InjectableMetadata {
    /**
     * 是否可注入
     */
    injectable: boolean;

    /**
     * 依赖列表
     */
    dependencies: Array<ServiceType<IService> | string | symbol>;

    /**
     * 属性注入映射
     * key: 属性名, value: 服务类型
     */
    properties?: Map<string | symbol, ServiceType<IService>>;
}

/**
 * 可更新元数据接口
 */
export interface UpdatableMetadata {
    /**
     * 是否可更新
     */
    updatable: boolean;

    /**
     * 更新优先级（数值越小越先执行，默认0）
     */
    priority: number;
}

/**
 * @Injectable() 装饰器
 *
 * 标记类为可注入的服务，使其可以通过ServiceContainer进行依赖注入
 *
 * @example
 * ```typescript
 * @Injectable()
 * class TimeService implements IService {
 *     constructor() {}
 *     dispose() {}
 * }
 *
 * @Injectable()
 * class PhysicsSystem extends EntitySystem {
 *     constructor(
 *         @Inject(TimeService) private timeService: TimeService
 *     ) {
 *         super();
 *     }
 * }
 * ```
 */
export function Injectable(): ClassDecorator {
    return function (target: Constructor): void {
        const existing = injectableMetadata.get(target);

        injectableMetadata.set(target as Constructor, {
            injectable: true,
            dependencies: [],
            ...(existing?.properties && {properties: existing.properties})
        });
    } as ClassDecorator;
}

/**
 * @Updatable() 装饰器
 *
 * 标记服务类为可更新的，使其在每帧自动被ServiceContainer调用update方法。
 * 使用此装饰器的类必须实现IUpdatable接口（包含update方法）。
 *
 * @param priority - 更新优先级（数值越小越先执行，默认0）
 * @throws 如果类没有实现update方法，将在运行时抛出错误
 *
 * @example
 * ```typescript
 * @Injectable()
 * @Updatable()
 * class TimerManager implements IService, IUpdatable {
 *     update(deltaTime?: number) {
 *         // 每帧更新逻辑
 *     }
 *     dispose() {}
 * }
 *
 * // 指定优先级
 * @Injectable()
 * @Updatable(10)
 * class PhysicsManager implements IService, IUpdatable {
 *     update() { }
 *     dispose() {}
 * }
 * ```
 */
export function Updatable(priority: number = 0): ClassDecorator {
    return function (target: Constructor): void {
        // 验证类原型上是否有update方法
        const prototype = (target as Constructor & { prototype: { update?: unknown } }).prototype;
        if (!prototype || typeof prototype.update !== "function") {
            throw new Error(
                `@Updatable() decorator requires class ${target.name} to implement IUpdatable interface with update() method. ` +
                "Please add 'implements IUpdatable' and define update(deltaTime?: number): void method."
            );
        }

        // 标记为可更新
        updatableMetadata.set(target as Constructor, {
            updatable: true,
            priority
        });
    } as ClassDecorator;
}

/**
 * @Inject() 装饰器
 *
 * 标记构造函数参数需要注入的服务类型
 *
 * @param serviceType 服务类型标识符
 */
export function Inject(serviceType: ServiceType<IService> | string | symbol): ParameterDecorator {
    return function (target: object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        // 获取或创建注入元数据
        let params = injectMetadata.get(target as Constructor);
        if (!params) {
            params = new Map();
            injectMetadata.set(target as Constructor, params);
        }

        // 记录参数索引和服务类型的映射
        params.set(parameterIndex, serviceType);
    };
}

/**
 * @InjectProperty() 装饰器
 *
 * 通过属性装饰器注入依赖
 *
 * 注入时机：在构造函数执行后、onInitialize() 调用前完成
 *
 * @param serviceType 服务类型
 */
export function InjectProperty(serviceType: ServiceType<IService>): PropertyDecorator {
    return function (target: object, propertyKey: string | symbol) {
        let metadata = injectableMetadata.get((target as { constructor: Constructor }).constructor);

        if (!metadata) {
            metadata = {
                injectable: true,
                dependencies: []
            };
            injectableMetadata.set((target as { constructor: Constructor }).constructor, metadata);
        }

        if (!metadata.properties) {
            metadata.properties = new Map();
        }

        metadata.properties.set(propertyKey, serviceType);
    };
}

/**
 * 检查类是否标记为可注入
 *
 * @param target 目标类
 * @returns 是否可注入
 */
export function isInjectable(target: Constructor): boolean {
    const metadata = injectableMetadata.get(target);
    return metadata?.injectable ?? false;
}

/**
 * 获取类的依赖注入元数据
 *
 * @param target 目标类
 * @returns 依赖注入元数据
 */
export function getInjectableMetadata(target: Constructor): InjectableMetadata | undefined {
    return injectableMetadata.get(target);
}

/**
 * 获取构造函数参数的注入元数据
 *
 * @param target 目标类
 * @returns 参数索引到服务类型的映射
 */
export function getInjectMetadata(target: Constructor): Map<number, ServiceType<IService> | string | symbol> {
    return injectMetadata.get(target) || new Map();
}

/**
 * 创建实例并自动注入依赖
 *
 * @param constructor 构造函数
 * @param container 服务容器
 * @returns 创建的实例
 *
 * @example
 * ```typescript
 * const instance = createInstance(MySystem, container);
 * ```
 */
export function createInstance<T>(
    constructor: new (...args: any[]) => T,
    container: ServiceContainer
): T {
    // 获取参数注入元数据
    const injectParams = getInjectMetadata(constructor as Constructor);

    // 解析依赖
    const dependencies: unknown[] = [];

    // 获取构造函数参数数量
    const paramCount = constructor.length;

    for (let i = 0; i < paramCount; i++) {
        const serviceType = injectParams.get(i);

        if (serviceType) {
            // 如果有显式的@Inject标记，使用标记的类型
            if (typeof serviceType === "string" || typeof serviceType === "symbol") {
                // 字符串或Symbol类型的服务标识
                throw new Error(
                    "String and Symbol service identifiers are not yet supported in constructor injection. " +
                    `Please use class types for ${constructor.name} parameter ${i}`
                );
            } else {
                // 类类型
                dependencies.push(container.resolve(serviceType as ServiceType<IService>));
            }
        } else {
            // 没有@Inject标记，传入undefined
            dependencies.push(undefined);
        }
    }

    // 创建实例
    return new constructor(...dependencies);
}

/**
 * 为实例注入属性依赖
 *
 * @param instance 目标实例
 * @param container 服务容器
 */
export function injectProperties<T extends object>(instance: T, container: ServiceContainer): void {
    const constructor = (instance as { constructor: Constructor }).constructor;
    const metadata = getInjectableMetadata(constructor);

    if (!metadata?.properties || metadata.properties.size === 0) {
        return;
    }

    for (const [propertyKey, serviceType] of metadata.properties) {
        const service = container.resolve(serviceType);

        if (service !== null) {
            (instance as Record<string | symbol, unknown>)[propertyKey] = service;
        }
    }
}

/**
 * 检查类是否标记为可更新
 *
 * @param target 目标类
 * @returns 是否可更新
 */
export function isUpdatable(target: Constructor): boolean {
    const metadata = updatableMetadata.get(target);
    return metadata?.updatable ?? false;
}

/**
 * 获取类的可更新元数据
 *
 * @param target 目标类
 * @returns 可更新元数据
 */
export function getUpdatableMetadata(target: Constructor): UpdatableMetadata | undefined {
    return updatableMetadata.get(target);
}

/**
 * 注册可注入的服务到容器
 *
 * 自动检测@Injectable装饰器并注册服务
 *
 * @param container 服务容器
 * @param serviceType 服务类型
 * @param singleton 是否注册为单例（默认true）
 *
 * @example
 * ```typescript
 * @Injectable()
 * class MyService implements IService {
 *     dispose() {}
 * }
 *
 * // 自动注册
 * registerInjectable(Core.services, MyService);
 * ```
 */
export function registerInjectable<T extends IService>(
    container: ServiceContainer,
    serviceType: ServiceType<T>,
    singleton: boolean = true
): void {
    if (!isInjectable(serviceType)) {
        throw new Error(
            `${serviceType.name} is not marked as @Injectable(). ` +
            "Please add @Injectable() decorator to the class."
        );
    }

    // 创建工厂函数，使用createInstance自动解析依赖
    const factory = (c: ServiceContainer) => createInstance(serviceType, c);

    // 注册到容器
    if (singleton) {
        container.registerSingleton(serviceType, factory);
    } else {
        container.registerTransient(serviceType, factory);
    }
}
