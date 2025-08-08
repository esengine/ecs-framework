import { NetworkMessage } from './NetworkMessage';
import { NetworkConnection } from '../Core/NetworkConnection';
import { INetworkMessage, MessageData } from '../types/NetworkTypes';
import { createLogger } from '@esengine/ecs-framework';

/**
 * 消息处理器接口
 */
export interface IMessageHandler<T extends INetworkMessage = INetworkMessage> {
    /**
     * 处理消息
     * 
     * @param message - 网络消息
     * @param connection - 发送消息的连接（服务端有效）
     */
    handle(message: T, connection?: NetworkConnection): Promise<void> | void;
}

/**
 * 消息处理器注册信息
 */
interface MessageHandlerInfo<T extends MessageData = MessageData> {
    handler: IMessageHandler<INetworkMessage<T>>;
    messageClass: new (...args: any[]) => INetworkMessage<T>;
    priority: number;
}

/**
 * 消息处理器管理器
 * 
 * 负责注册、查找和调用消息处理器
 * 支持消息优先级和类型匹配
 */
export class MessageHandler {
    private static readonly logger = createLogger('MessageHandler');
    private static _instance: MessageHandler | null = null;
    private _handlers: Map<number, MessageHandlerInfo[]> = new Map();
    private _messageClasses: Map<number, new (...args: any[]) => INetworkMessage> = new Map();
    
    /**
     * 获取消息处理器单例
     */
    public static get Instance(): MessageHandler {
        if (!MessageHandler._instance) {
            MessageHandler._instance = new MessageHandler();
        }
        return MessageHandler._instance;
    }
    
    private constructor() {}
    
    /**
     * 注册消息处理器
     * 
     * @param messageType - 消息类型ID
     * @param messageClass - 消息类构造函数
     * @param handler - 消息处理器
     * @param priority - 处理优先级（数字越小优先级越高）
     */
    public registerHandler<TData extends MessageData, T extends INetworkMessage<TData>>(
        messageType: number,
        messageClass: new (...args: any[]) => T,
        handler: IMessageHandler<T>,
        priority: number = 0
    ): void {
        // 注册消息类
        this._messageClasses.set(messageType, messageClass);
        
        // 获取或创建处理器列表
        if (!this._handlers.has(messageType)) {
            this._handlers.set(messageType, []);
        }
        
        const handlers = this._handlers.get(messageType)!;
        
        // 检查是否已经注册了相同的处理器
        const existingIndex = handlers.findIndex(h => h.handler === handler);
        if (existingIndex !== -1) {
            MessageHandler.logger.warn(`消息类型 ${messageType} 的处理器已存在，将替换优先级`);
            handlers[existingIndex].priority = priority;
        } else {
                // 添加新处理器
            handlers.push({
                handler: handler as IMessageHandler<INetworkMessage>,
                messageClass: messageClass as new (...args: any[]) => INetworkMessage,
                priority
            });
        }
        
        // 按优先级排序（数字越小优先级越高）
        handlers.sort((a, b) => a.priority - b.priority);
        
        MessageHandler.logger.debug(`注册消息处理器: 类型=${messageType}, 优先级=${priority}`);
    }
    
    /**
     * 注销消息处理器
     * 
     * @param messageType - 消息类型ID
     * @param handler - 消息处理器
     */
    public unregisterHandler(messageType: number, handler: IMessageHandler): void {
        const handlers = this._handlers.get(messageType);
        if (!handlers) {
            return;
        }
        
        const index = handlers.findIndex(h => h.handler === handler);
        if (index !== -1) {
            handlers.splice(index, 1);
            MessageHandler.logger.debug(`注销消息处理器: 类型=${messageType}`);
        }
        
        // 如果没有处理器了，清理映射
        if (handlers.length === 0) {
            this._handlers.delete(messageType);
            this._messageClasses.delete(messageType);
        }
    }
    
    /**
     * 处理原始消息数据
     * 
     * @param data - 原始消息数据
     * @param connection - 发送消息的连接（服务端有效）
     * @returns 是否成功处理
     */
    public async handleRawMessage(data: Uint8Array, connection?: NetworkConnection): Promise<boolean> {
        if (data.length < 4) {
            MessageHandler.logger.error('消息数据长度不足，至少需要4字节消息类型');
            return false;
        }
        
        // 读取消息类型（前4字节）
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        const messageType = view.getUint32(0, true);
        
        // 查找消息类
        const MessageClass = this._messageClasses.get(messageType);
        if (!MessageClass) {
            MessageHandler.logger.warn(`未知的消息类型: ${messageType}`);
            return false;
        }
        
        // 创建消息实例并反序列化
        try {
            const message = new MessageClass();
            message.deserialize(data);
            
            return await this.handleMessage(message, connection);
        } catch (error) {
            MessageHandler.logger.error(`消息反序列化失败 (类型=${messageType}):`, error);
            return false;
        }
    }
    
    /**
     * 处理网络消息
     * 
     * @param message - 网络消息
     * @param connection - 发送消息的连接（服务端有效）
     * @returns 是否成功处理
     */
    public async handleMessage(message: INetworkMessage, connection?: NetworkConnection): Promise<boolean> {
        const messageType = message.messageType;
        const handlers = this._handlers.get(messageType);
        
        if (!handlers || handlers.length === 0) {
            MessageHandler.logger.warn(`没有找到消息类型 ${messageType} 的处理器`);
            return false;
        }
        
        let handledCount = 0;
        
        // 按优先级顺序执行所有处理器
        for (const handlerInfo of handlers) {
            try {
                const result = handlerInfo.handler.handle(message, connection);
                
                // 支持异步处理器
                if (result instanceof Promise) {
                    await result;
                }
                
                handledCount++;
            } catch (error) {
                MessageHandler.logger.error(`处理器执行错误 (类型=${messageType}, 优先级=${handlerInfo.priority}):`, error);
                // 继续执行其他处理器
            }
        }
        
        return handledCount > 0;
    }
    
    /**
     * 获取已注册的消息类型列表
     * 
     * @returns 消息类型数组
     */
    public getRegisteredMessageTypes(): number[] {
        return Array.from(this._messageClasses.keys());
    }
    
    /**
     * 检查消息类型是否已注册
     * 
     * @param messageType - 消息类型ID
     * @returns 是否已注册
     */
    public isMessageTypeRegistered(messageType: number): boolean {
        return this._messageClasses.has(messageType);
    }
    
    /**
     * 获取消息类型的处理器数量
     * 
     * @param messageType - 消息类型ID
     * @returns 处理器数量
     */
    public getHandlerCount(messageType: number): number {
        const handlers = this._handlers.get(messageType);
        return handlers ? handlers.length : 0;
    }
    
    /**
     * 清除所有处理器
     */
    public clear(): void {
        this._handlers.clear();
        this._messageClasses.clear();
        MessageHandler.logger.info('已清除所有消息处理器');
    }
    
    /**
     * 获取消息处理器统计信息
     * 
     * @returns 统计信息
     */
    public getStats(): {
        totalMessageTypes: number;
        totalHandlers: number;
        messageTypes: Array<{
            type: number;
            handlerCount: number;
            className: string;
        }>;
    } {
        let totalHandlers = 0;
        const messageTypes: Array<{ type: number; handlerCount: number; className: string }> = [];
        
        for (const [type, handlers] of this._handlers) {
            const handlerCount = handlers.length;
            totalHandlers += handlerCount;
            
            const MessageClass = this._messageClasses.get(type);
            const className = MessageClass ? MessageClass.name : 'Unknown';
            
            messageTypes.push({
                type,
                handlerCount,
                className
            });
        }
        
        return {
            totalMessageTypes: this._messageClasses.size,
            totalHandlers,
            messageTypes
        };
    }
}

/**
 * 消息处理器装饰器
 * 
 * 用于自动注册消息处理器
 * 
 * @param messageType - 消息类型ID
 * @param messageClass - 消息类构造函数
 * @param priority - 处理优先级
 */
export function MessageHandlerDecorator<TData extends MessageData, T extends INetworkMessage<TData>>(
    messageType: number,
    messageClass: new (...args: any[]) => T,
    priority: number = 0
) {
    return function(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        
        if (typeof originalMethod !== 'function') {
            throw new Error(`[MessageHandlerDecorator] ${propertyKey} is not a function`);
        }
        
        // 注册处理器
        const handler: IMessageHandler<T> = {
            handle: async (message: T, connection?: NetworkConnection) => {
                return await originalMethod.call(target, message, connection);
            }
        };
        
        MessageHandler.Instance.registerHandler(messageType, messageClass, handler, priority);
        
        return descriptor;
    };
}