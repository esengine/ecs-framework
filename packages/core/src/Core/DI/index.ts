/**
 * 依赖注入模块
 *
 * 提供装饰器和工具函数，用于实现依赖注入模式
 */

export {
    Injectable,
    Inject,
    InjectProperty,
    Updatable,
    isInjectable,
    getInjectableMetadata,
    getInjectMetadata,
    isUpdatable,
    getUpdatableMetadata,
    createInstance,
    injectProperties,
    registerInjectable
} from './Decorators';

export type { InjectableMetadata, UpdatableMetadata } from './Decorators';
