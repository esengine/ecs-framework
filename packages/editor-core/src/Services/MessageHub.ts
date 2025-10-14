import type { IService } from '@esengine/ecs-framework';
import { Injectable } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';

const logger = createLogger('MessageHub');

/**
 * 消息处理器类型
 */
export type MessageHandler<T = any> = (data: T) => void | Promise<void>;

/**
 * 消息订阅
 */
interface MessageSubscription {
    topic: string;
    handler: MessageHandler;
    once: boolean;
}

/**
 * 消息总线
 *
 * 提供插件间的事件通信机制，支持订阅/发布模式。
 */
@Injectable()
export class MessageHub implements IService {
    private subscriptions: Map<string, MessageSubscription[]> = new Map();
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
     * 释放资源
     */
    public dispose(): void {
        this.subscriptions.clear();
        logger.info('MessageHub disposed');
    }
}
