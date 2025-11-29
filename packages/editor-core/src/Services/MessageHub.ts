import type { IService } from '@esengine/ecs-framework';
import { Injectable } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';

const logger = createLogger('MessageHub');

/**
 * 消息处理器类型
 */
export type MessageHandler<T = any> = (data: T) => void | Promise<void>;

/**
 * 请求处理器类型（支持返回值）
 */
export type RequestHandler<TRequest = any, TResponse = any> = (data: TRequest) => TResponse | Promise<TResponse>;

/**
 * 消息订阅
 */
interface MessageSubscription {
    topic: string;
    handler: MessageHandler;
    once: boolean;
}

/**
 * 请求订阅
 */
interface RequestSubscription {
    topic: string;
    handler: RequestHandler;
}

/**
 * 消息总线
 *
 * 提供插件间的事件通信机制，支持订阅/发布模式。
 */
@Injectable()
export class MessageHub implements IService {
    private subscriptions: Map<string, MessageSubscription[]> = new Map();
    private requestHandlers: Map<string, RequestSubscription> = new Map();
    private subscriptionId: number = 0;

    /**
     * 订阅消息
     *
     * @param topic - 消息主题
     * @param handler - 消息处理器
     * @returns 取消订阅的函数
     */
    public subscribe<T = any>(topic: string, handler: MessageHandler<T>): () => void {
        return this.addSubscription(topic, handler, false);
    }

    /**
     * 订阅一次性消息
     *
     * @param topic - 消息主题
     * @param handler - 消息处理器
     * @returns 取消订阅的函数
     */
    public subscribeOnce<T = any>(topic: string, handler: MessageHandler<T>): () => void {
        return this.addSubscription(topic, handler, true);
    }

    /**
     * 添加订阅
     */
    private addSubscription(topic: string, handler: MessageHandler, once: boolean): () => void {
        const subscription: MessageSubscription = {
            topic,
            handler,
            once
        };

        let subs = this.subscriptions.get(topic);
        if (!subs) {
            subs = [];
            this.subscriptions.set(topic, subs);
        }
        subs.push(subscription);

        const subId = ++this.subscriptionId;
        logger.debug(`Subscribed to topic: ${topic} (id: ${subId}, once: ${once})`);

        return () => {
            this.unsubscribe(topic, subscription);
            logger.debug(`Unsubscribed from topic: ${topic} (id: ${subId})`);
        };
    }

    /**
     * 取消订阅
     */
    private unsubscribe(topic: string, subscription: MessageSubscription): void {
        const subs = this.subscriptions.get(topic);
        if (!subs) {
            return;
        }

        const index = subs.indexOf(subscription);
        if (index !== -1) {
            subs.splice(index, 1);
        }

        if (subs.length === 0) {
            this.subscriptions.delete(topic);
        }
    }

    /**
     * 发布消息
     *
     * @param topic - 消息主题
     * @param data - 消息数据
     */
    public async publish<T = any>(topic: string, data?: T): Promise<void> {
        const subs = this.subscriptions.get(topic);
        if (!subs || subs.length === 0) {
            logger.debug(`No subscribers for topic: ${topic}`);
            return;
        }

        logger.debug(`Publishing message to topic: ${topic} (${subs.length} subscribers)`);

        const onceSubscriptions: MessageSubscription[] = [];

        for (const sub of subs) {
            try {
                await sub.handler(data);
                if (sub.once) {
                    onceSubscriptions.push(sub);
                }
            } catch (error) {
                logger.error(`Error in message handler for topic ${topic}:`, error);
            }
        }

        for (const sub of onceSubscriptions) {
            this.unsubscribe(topic, sub);
        }
    }

    /**
     * 同步发布消息
     *
     * @param topic - 消息主题
     * @param data - 消息数据
     */
    public publishSync<T = any>(topic: string, data?: T): void {
        const subs = this.subscriptions.get(topic);
        if (!subs || subs.length === 0) {
            logger.debug(`No subscribers for topic: ${topic}`);
            return;
        }

        logger.debug(`Publishing sync message to topic: ${topic} (${subs.length} subscribers)`);

        const onceSubscriptions: MessageSubscription[] = [];

        for (const sub of subs) {
            try {
                const result = sub.handler(data);
                if (result instanceof Promise) {
                    logger.warn(`Async handler used with publishSync for topic: ${topic}`);
                }
                if (sub.once) {
                    onceSubscriptions.push(sub);
                }
            } catch (error) {
                logger.error(`Error in message handler for topic ${topic}:`, error);
            }
        }

        for (const sub of onceSubscriptions) {
            this.unsubscribe(topic, sub);
        }
    }

    /**
     * 取消所有指定主题的订阅
     *
     * @param topic - 消息主题
     */
    public unsubscribeAll(topic: string): void {
        const deleted = this.subscriptions.delete(topic);
        if (deleted) {
            logger.debug(`Unsubscribed all from topic: ${topic}`);
        }
    }

    /**
     * 检查主题是否有订阅者
     *
     * @param topic - 消息主题
     * @returns 是否有订阅者
     */
    public hasSubscribers(topic: string): boolean {
        const subs = this.subscriptions.get(topic);
        return subs !== undefined && subs.length > 0;
    }

    /**
     * 获取所有主题
     *
     * @returns 主题列表
     */
    public getTopics(): string[] {
        return Array.from(this.subscriptions.keys());
    }

    /**
     * 获取主题的订阅者数量
     *
     * @param topic - 消息主题
     * @returns 订阅者数量
     */
    public getSubscriberCount(topic: string): number {
        const subs = this.subscriptions.get(topic);
        return subs ? subs.length : 0;
    }

    /**
     * 注册请求处理器（用于请求-响应模式）
     *
     * @param topic - 请求主题
     * @param handler - 请求处理器，可以返回响应数据
     * @returns 取消注册的函数
     */
    public onRequest<TRequest = any, TResponse = any>(
        topic: string,
        handler: RequestHandler<TRequest, TResponse>
    ): () => void {
        if (this.requestHandlers.has(topic)) {
            logger.warn(`Request handler for topic "${topic}" already exists, replacing...`);
        }

        const subscription: RequestSubscription = {
            topic,
            handler
        };

        this.requestHandlers.set(topic, subscription);
        logger.debug(`Registered request handler for topic: ${topic}`);

        return () => {
            if (this.requestHandlers.get(topic) === subscription) {
                this.requestHandlers.delete(topic);
                logger.debug(`Unregistered request handler for topic: ${topic}`);
            }
        };
    }

    /**
     * 发送请求并等待响应（请求-响应模式）
     *
     * @param topic - 请求主题
     * @param data - 请求数据
     * @param timeout - 超时时间（毫秒），默认 5000ms
     * @returns 响应数据
     * @throws 如果没有处理器或超时则抛出错误
     */
    public async request<TRequest = any, TResponse = any>(
        topic: string,
        data?: TRequest,
        timeout: number = 5000
    ): Promise<TResponse> {
        const subscription = this.requestHandlers.get(topic);

        if (!subscription) {
            throw new Error(`No request handler registered for topic: ${topic}`);
        }

        logger.debug(`Sending request to topic: ${topic}`);

        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Request to topic "${topic}" timed out after ${timeout}ms`));
            }, timeout);
        });

        const responsePromise = Promise.resolve(subscription.handler(data));

        return Promise.race([responsePromise, timeoutPromise]);
    }

    /**
     * 尝试发送请求（如果有处理器则发送，否则返回 undefined）
     *
     * @param topic - 请求主题
     * @param data - 请求数据
     * @param timeout - 超时时间（毫秒），默认 5000ms
     * @returns 响应数据或 undefined
     */
    public async tryRequest<TRequest = any, TResponse = any>(
        topic: string,
        data?: TRequest,
        timeout: number = 5000
    ): Promise<TResponse | undefined> {
        if (!this.requestHandlers.has(topic)) {
            logger.debug(`No request handler for topic: ${topic}, returning undefined`);
            return undefined;
        }

        try {
            return await this.request<TRequest, TResponse>(topic, data, timeout);
        } catch (error) {
            logger.warn(`Request to topic "${topic}" failed:`, error);
            return undefined;
        }
    }

    /**
     * 检查是否有请求处理器
     *
     * @param topic - 请求主题
     * @returns 是否有处理器
     */
    public hasRequestHandler(topic: string): boolean {
        return this.requestHandlers.has(topic);
    }

    /**
     * 释放资源
     */
    public dispose(): void {
        this.subscriptions.clear();
        this.requestHandlers.clear();
        logger.info('MessageHub disposed');
    }
}

// Service identifier for DI registration (用于跨包插件访问)
// 使用 Symbol.for 确保跨包共享同一个 Symbol
export const IMessageHub = Symbol.for('IMessageHub');
