import { createLogger } from '../Utils/Logger';
import { isUpdatable as checkUpdatable, getUpdatableMetadata } from './DI';

const logger = createLogger('ServiceContainer');

/**
 * 服务基础接口
 * 所有通过 ServiceContainer 管理的服务都应该实现此接口
 */
export interface IService {
    /**
     * 释放服务占用的资源
     * 当服务被注销或容器被清空时调用
     */
    dispose(): void;
}

/**
 * 服务类型
 *
 * 支持任意构造函数签名，以便与依赖注入装饰器配合使用
 * 使用 any[] 以允许任意参数类型的构造函数
 */
export type ServiceType<T extends IService> = new (...args: any[]) => T;

/**
 * 服务生命周期
 */
export enum ServiceLifetime {
    /**
     * 单例模式 - 整个应用生命周期内只有一个实例
     */
    Singleton = 'singleton',

    /**
     * 瞬时模式 - 每次请求都创建新实例
     */
    Transient = 'transient'
}

/**
 * 服务注册信息
 */
interface ServiceRegistration<T extends IService> {
    /**
     * 服务类型
     */
    type: ServiceType<T>;

    /**
     * 服务实例（单例模式）
     */
    instance?: T;

    /**
     * 工厂函数
     */
    factory?: (container: ServiceContainer) => T;

    /**
     * 生命周期
     */
    lifetime: ServiceLifetime;
}

/**
 * 服务容器
 *
 * 负责管理所有服务的注册、解析和生命周期。
 * 支持依赖注入和服务定位模式。
 *
 * 特点：
 * - 单例和瞬时两种生命周期
 * - 支持工厂函数注册
 * - 支持实例注册
 * - 类型安全的服务解析
 *
 * @example
 * ```typescript
 * const container = new ServiceContainer();
 *
 * // 注册单例服务
 * container.registerSingleton(TimerManager);
 *
 * // 注册工厂函数
 * container.registerSingleton(Logger, (c) => createLogger('App'));
 *
 * // 注册实例
 * container.registerInstance(Config, new Config());
 *
 * // 解析服务
 * const timer = container.resolve(TimerManager);
 * ```
 */
export class ServiceContainer {
    /**
     * 服务注册表
     */
    private _services: Map<ServiceType<IService>, ServiceRegistration<IService>> = new Map();

    /**
     * 正在解析的服务栈（用于循环依赖检测）
     */
    private _resolving: Set<ServiceType<IService>> = new Set();

    /**
     * 可更新的服务列表
     *
     * 自动收集所有使用@Updatable装饰器标记的服务，供Core统一更新
     * 按优先级排序（数值越小越先执行）
     */
    private _updatableServices: Array<{ instance: IService; priority: number }> = [];

    /**
     * 注册单例服务
     *
     * @param type - 服务类型
     * @param factory - 可选的工厂函数
     *
     * @example
     * ```typescript
     * // 直接注册类型
     * container.registerSingleton(TimerManager);
     *
     * // 使用工厂函数
     * container.registerSingleton(Logger, (c) => {
     *     return createLogger('App');
     * });
     * ```
     */
    public registerSingleton<T extends IService>(
        type: ServiceType<T>,
        factory?: (container: ServiceContainer) => T
    ): void {
        if (this._services.has(type as ServiceType<IService>)) {
            logger.warn(`Service ${type.name} is already registered`);
            return;
        }

        this._services.set(type as ServiceType<IService>, {
            type: type as ServiceType<IService>,
            ...(factory && { factory: factory as (container: ServiceContainer) => IService }),
            lifetime: ServiceLifetime.Singleton
        });

        logger.debug(`Registered singleton service: ${type.name}`);
    }

    /**
     * 注册瞬时服务
     *
     * 每次解析都会创建新实例。
     *
     * @param type - 服务类型
     * @param factory - 可选的工厂函数
     *
     * @example
     * ```typescript
     * // 每次解析都创建新实例
     * container.registerTransient(Command);
     * ```
     */
    public registerTransient<T extends IService>(
        type: ServiceType<T>,
        factory?: (container: ServiceContainer) => T
    ): void {
        if (this._services.has(type as ServiceType<IService>)) {
            logger.warn(`Service ${type.name} is already registered`);
            return;
        }

        this._services.set(type as ServiceType<IService>, {
            type: type as ServiceType<IService>,
            ...(factory && { factory: factory as (container: ServiceContainer) => IService }),
            lifetime: ServiceLifetime.Transient
        });

        logger.debug(`Registered transient service: ${type.name}`);
    }

    /**
     * 注册服务实例
     *
     * 直接注册已创建的实例，自动视为单例。
     *
     * @param type - 服务类型（构造函数，仅用作标识）
     * @param instance - 服务实例
     *
     * @example
     * ```typescript
     * const config = new Config();
     * container.registerInstance(Config, config);
     * ```
     */
    public registerInstance<T extends IService>(type: ServiceType<T>, instance: T): void {
        if (this._services.has(type as ServiceType<IService>)) {
            logger.warn(`Service ${type.name} is already registered`);
            return;
        }

        this._services.set(type as ServiceType<IService>, {
            type: type as ServiceType<IService>,
            instance: instance as IService,
            lifetime: ServiceLifetime.Singleton
        });

        // 如果使用了@Updatable装饰器，添加到可更新列表
        if (checkUpdatable(type)) {
            const metadata = getUpdatableMetadata(type);
            const priority = metadata?.priority ?? 0;
            this._updatableServices.push({ instance, priority });

            // 按优先级排序（数值越小越先执行）
            this._updatableServices.sort((a, b) => a.priority - b.priority);

            logger.debug(`Service ${type.name} is updatable (priority: ${priority}), added to update list`);
        }

        logger.debug(`Registered service instance: ${type.name}`);
    }

    /**
     * 解析服务
     *
     * @param type - 服务类型
     * @returns 服务实例
     * @throws 如果服务未注册或存在循环依赖
     *
     * @example
     * ```typescript
     * const timer = container.resolve(TimerManager);
     * ```
     */
    public resolve<T extends IService>(type: ServiceType<T>): T {
        const registration = this._services.get(type as ServiceType<IService>);

        if (!registration) {
            throw new Error(`Service ${type.name} is not registered`);
        }

        // 检测循环依赖
        if (this._resolving.has(type as ServiceType<IService>)) {
            const chain = Array.from(this._resolving).map(t => t.name).join(' -> ');
            throw new Error(`Circular dependency detected: ${chain} -> ${type.name}`);
        }

        // 如果是单例且已经有实例，直接返回
        if (registration.lifetime === ServiceLifetime.Singleton && registration.instance) {
            return registration.instance as T;
        }

        // 添加到解析栈
        this._resolving.add(type as ServiceType<IService>);

        try {
            // 创建实例
            let instance: IService;

            if (registration.factory) {
                // 使用工厂函数
                instance = registration.factory(this);
            } else {
                // 直接构造
                instance = new (registration.type)();
            }

            // 如果是单例，缓存实例
            if (registration.lifetime === ServiceLifetime.Singleton) {
                registration.instance = instance;

                // 如果使用了@Updatable装饰器，添加到可更新列表
                if (checkUpdatable(registration.type)) {
                    const metadata = getUpdatableMetadata(registration.type);
                    const priority = metadata?.priority ?? 0;
                    this._updatableServices.push({ instance, priority });

                    // 按优先级排序（数值越小越先执行）
                    this._updatableServices.sort((a, b) => a.priority - b.priority);

                    logger.debug(`Service ${type.name} is updatable (priority: ${priority}), added to update list`);
                }
            }

            return instance as T;
        } finally {
            // 从解析栈移除
            this._resolving.delete(type as ServiceType<IService>);
        }
    }

    /**
     * 尝试解析服务
     *
     * 如果服务未注册，返回null而不是抛出异常。
     *
     * @param type - 服务类型
     * @returns 服务实例或null
     *
     * @example
     * ```typescript
     * const timer = container.tryResolve(TimerManager);
     * if (timer) {
     *     timer.schedule(...);
     * }
     * ```
     */
    public tryResolve<T extends IService>(type: ServiceType<T>): T | null {
        try {
            return this.resolve(type);
        } catch {
            return null;
        }
    }

    /**
     * 检查服务是否已注册
     *
     * @param type - 服务类型
     * @returns 是否已注册
     */
    public isRegistered<T extends IService>(type: ServiceType<T>): boolean {
        return this._services.has(type as ServiceType<IService>);
    }

    /**
     * 注销服务
     *
     * @param type - 服务类型
     * @returns 是否成功注销
     */
    public unregister<T extends IService>(type: ServiceType<T>): boolean {
        const registration = this._services.get(type as ServiceType<IService>);
        if (!registration) {
            return false;
        }

        // 如果有单例实例，调用 dispose
        if (registration.instance) {
            // 从可更新列表中移除
            const index = this._updatableServices.findIndex(item => item.instance === registration.instance);
            if (index !== -1) {
                this._updatableServices.splice(index, 1);
            }

            registration.instance.dispose();
        }

        this._services.delete(type as ServiceType<IService>);
        logger.debug(`Unregistered service: ${type.name}`);
        return true;
    }

    /**
     * 清空所有服务
     */
    public clear(): void {
        // 清理所有单例实例
        for (const [, registration] of this._services) {
            if (registration.instance) {
                registration.instance.dispose();
            }
        }

        this._services.clear();
        this._updatableServices = [];
        logger.debug('Cleared all services');
    }

    /**
     * 获取所有已注册的服务类型
     *
     * @returns 服务类型数组
     */
    public getRegisteredServices(): ServiceType<IService>[] {
        return Array.from(this._services.keys());
    }

    /**
     * 更新所有使用@Updatable装饰器标记的服务
     *
     * 此方法会按优先级顺序遍历所有可更新的服务并调用它们的update方法。
     * 所有服务在注册时已经由@Updatable装饰器验证过必须实现IUpdatable接口。
     * 通常在Core的主更新循环中调用。
     *
     * @param deltaTime - 可选的帧时间间隔（秒）
     *
     * @example
     * ```typescript
     * // 在Core的update方法中
     * this._serviceContainer.updateAll(deltaTime);
     * ```
     */
    public updateAll(deltaTime?: number): void {
        for (const { instance } of this._updatableServices) {
            (instance as IService & { update: (deltaTime?: number) => void }).update(deltaTime);
        }
    }

    /**
     * 获取所有可更新的服务数量
     *
     * @returns 可更新服务的数量
     */
    public getUpdatableCount(): number {
        return this._updatableServices.length;
    }

    /**
     * 获取所有已实例化的服务实例
     *
     * @returns 所有服务实例的数组
     */
    public getAll(): IService[] {
        const instances: IService[] = [];

        for (const descriptor of this._services.values()) {
            if (descriptor.instance) {
                instances.push(descriptor.instance);
            }
        }

        return instances;
    }
}
