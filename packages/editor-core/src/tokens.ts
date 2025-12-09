/**
 * Editor Core 服务令牌
 * Editor Core service tokens
 *
 * 定义 editor-core 模块导出的服务令牌和接口。
 * Defines service tokens and interfaces exported by editor-core module.
 *
 * 遵循 "谁定义接口，谁导出 Token" 的规范。
 * Follows the "who defines interface, who exports token" principle.
 *
 * @example
 * ```typescript
 * // 消费方导入 Token | Consumer imports Token
 * import { LocaleServiceToken, MessageHubToken, EntityStoreServiceToken } from '@esengine/editor-core';
 *
 * // 获取服务 | Get service
 * const localeService = context.services.get(LocaleServiceToken);
 * const messageHub = context.services.get(MessageHubToken);
 * ```
 */

import { createServiceToken } from '@esengine/engine-core';
import type { LocaleService, Locale, TranslationParams, PluginTranslations } from './Services/LocaleService';
import type { MessageHub, MessageHandler, RequestHandler } from './Services/MessageHub';
import type { EntityStoreService, EntityTreeNode } from './Services/EntityStoreService';

// ============================================================================
// LocaleService Token
// 国际化服务令牌
// ============================================================================

/**
 * LocaleService 接口
 * LocaleService interface
 *
 * 提供类型安全的服务访问接口。
 * Provides type-safe service access interface.
 */
export interface ILocaleService {
    /** 获取当前语言 | Get current locale */
    getLocale(): Locale;
    /** 设置当前语言 | Set current locale */
    setLocale(locale: Locale): void;
    /** 翻译文本 | Translate text */
    t(key: string, params?: TranslationParams, fallback?: string): string;
    /** 扩展翻译 | Extend translations */
    extendTranslations(namespace: string, translations: PluginTranslations): void;
    /** 监听语言变化 | Listen to locale changes */
    onLocaleChange(listener: (locale: Locale) => void): () => void;
}

/**
 * 国际化服务令牌
 * Localization service token
 *
 * 用于注册和获取国际化服务。
 * For registering and getting localization service.
 */
export const LocaleServiceToken = createServiceToken<ILocaleService>('localeService');

// ============================================================================
// MessageHub Token
// 消息总线令牌
// ============================================================================

/**
 * MessageHub 服务接口
 * MessageHub service interface
 *
 * 提供类型安全的消息通信接口。
 * Provides type-safe message communication interface.
 */
export interface IMessageHubService {
    /** 订阅消息 | Subscribe to message */
    subscribe<T = unknown>(topic: string, handler: MessageHandler<T>): () => void;
    /** 订阅一次性消息 | Subscribe to one-time message */
    subscribeOnce<T = unknown>(topic: string, handler: MessageHandler<T>): () => void;
    /** 发布消息 | Publish message */
    publish<T = unknown>(topic: string, data?: T): Promise<void>;
    /** 注册请求处理器 | Register request handler */
    registerRequest<TRequest = unknown, TResponse = unknown>(
        topic: string,
        handler: RequestHandler<TRequest, TResponse>
    ): () => void;
    /** 发送请求 | Send request */
    request<TRequest = unknown, TResponse = unknown>(
        topic: string,
        data?: TRequest,
        timeout?: number
    ): Promise<TResponse>;
}

/**
 * 消息总线服务令牌
 * Message hub service token
 *
 * 用于注册和获取消息总线服务。
 * For registering and getting message hub service.
 */
export const MessageHubToken = createServiceToken<IMessageHubService>('messageHub');

// ============================================================================
// EntityStoreService Token
// 实体存储服务令牌
// ============================================================================

/**
 * EntityStoreService 接口
 * EntityStoreService interface
 *
 * 提供类型安全的实体存储服务访问接口。
 * Provides type-safe entity store service access interface.
 */
export interface IEntityStoreService {
    /** 添加实体 | Add entity */
    addEntity(entity: unknown, parent?: unknown): void;
    /** 移除实体 | Remove entity */
    removeEntity(entity: unknown): void;
    /** 选择实体 | Select entity */
    selectEntity(entity: unknown | null): void;
    /** 获取选中的实体 | Get selected entity */
    getSelectedEntity(): unknown | null;
    /** 获取所有实体 | Get all entities */
    getAllEntities(): unknown[];
    /** 获取根实体 | Get root entities */
    getRootEntities(): unknown[];
    /** 根据ID获取实体 | Get entity by ID */
    getEntity(id: number): unknown | undefined;
    /** 清空实体 | Clear all entities */
    clear(): void;
    /** 构建实体树 | Build entity tree */
    buildEntityTree(): EntityTreeNode[];
}

/**
 * 实体存储服务令牌
 * Entity store service token
 *
 * 用于注册和获取实体存储服务。
 * For registering and getting entity store service.
 */
export const EntityStoreServiceToken = createServiceToken<IEntityStoreService>('entityStoreService');

// ============================================================================
// Re-export types for convenience
// 重新导出类型方便使用
// ============================================================================

export type { Locale, TranslationParams, PluginTranslations } from './Services/LocaleService';
export type { MessageHandler, RequestHandler } from './Services/MessageHub';
export type { EntityTreeNode } from './Services/EntityStoreService';

// Re-export classes for direct use (backwards compatibility)
// 重新导出类以供直接使用（向后兼容）
export { LocaleService } from './Services/LocaleService';
export { MessageHub } from './Services/MessageHub';
export { EntityStoreService } from './Services/EntityStoreService';
