import { IMessageHandler } from '../Messaging/MessageHandler';
import { SyncVarUpdateMessage } from '../Messaging/MessageTypes';
import { NetworkConnection } from '../Core/NetworkConnection';
import { NetworkIdentityRegistry } from '../Core/NetworkIdentity';
import { SyncVarManager } from './SyncVarManager';
import { NetworkEnvironment } from '../Core/NetworkEnvironment';
import { ComponentRegistry } from '@esengine/ecs-framework';
import { NetworkManager } from '../Core/NetworkManager';

/**
 * SyncVar更新消息处理器
 * 
 * 处理接收到的SyncVar更新消息，自动查找目标网络对象并应用更新
 */
export class SyncVarMessageHandler implements IMessageHandler<SyncVarUpdateMessage> {
    private _processedMessages: Set<string> = new Set();
    private _maxProcessedCache: number = 1000;
    
    /**
     * 处理SyncVar更新消息
     * 
     * @param message - SyncVar更新消息
     * @param connection - 发送消息的连接（服务端有效）
     */
    public async handle(message: SyncVarUpdateMessage, connection?: NetworkConnection): Promise<void> {
        try {
            // 生成消息唯一标识符用于去重
            const messageKey = this.generateMessageKey(message);
            if (this._processedMessages.has(messageKey)) {
                console.log(`[SyncVarMessageHandler] 跳过重复消息: ${messageKey}`);
                return;
            }
            
            // 添加到已处理缓存
            this.addToProcessedCache(messageKey);
            
            // 验证消息基本有效性
            if (!this.validateMessage(message)) {
                console.error('[SyncVarMessageHandler] 消息验证失败');
                return;
            }
            
            // 查找目标网络对象
            const targetIdentity = NetworkIdentityRegistry.Instance.find(message.networkId);
            if (!targetIdentity) {
                console.warn(`[SyncVarMessageHandler] 未找到网络对象: ${message.networkId}`);
                return;
            }
            
            // 权限检查
            if (!this.checkAuthority(message, connection, targetIdentity)) {
                console.warn(`[SyncVarMessageHandler] 权限检查失败: ${message.networkId}`);
                return;
            }
            
            // 查找目标组件
            const targetComponent = this.findTargetComponent(targetIdentity, message.componentType);
            if (!targetComponent) {
                console.warn(`[SyncVarMessageHandler] 未找到目标组件: ${message.componentType} on ${message.networkId}`);
                return;
            }
            
            // 应用SyncVar更新
            this.applySyncVarUpdates(targetComponent, message);
            
            // 更新网络对象的同步信息
            targetIdentity.updateSyncTime();
            if (message.syncSequence > targetIdentity.syncSequence) {
                targetIdentity.syncSequence = message.syncSequence;
            }
            
            // 如果是服务端接收的消息，需要转发给其他客户端
            if (NetworkEnvironment.isServer && connection) {
                await this.forwardToOtherClients(message, connection);
            }
            
            console.log(`[SyncVarMessageHandler] 成功处理SyncVar更新: ${message.networkId}.${message.componentType}, ${message.fieldUpdates.length}个字段`);
            
        } catch (error) {
            console.error('[SyncVarMessageHandler] 处理SyncVar更新失败:', error);
        }
    }
    
    /**
     * 生成消息唯一标识符
     */
    private generateMessageKey(message: SyncVarUpdateMessage): string {
        return `${message.networkId}_${message.componentType}_${message.syncSequence}_${message.timestamp}`;
    }
    
    /**
     * 添加到已处理消息缓存
     */
    private addToProcessedCache(messageKey: string): void {
        this._processedMessages.add(messageKey);
        
        // 限制缓存大小
        if (this._processedMessages.size > this._maxProcessedCache) {
            const toDelete = Array.from(this._processedMessages).slice(0, this._maxProcessedCache / 2);
            toDelete.forEach(key => this._processedMessages.delete(key));
        }
    }
    
    /**
     * 验证消息基本有效性
     */
    private validateMessage(message: SyncVarUpdateMessage): boolean {
        if (!message.networkId || !message.componentType) {
            console.error('[SyncVarMessageHandler] 消息缺少必要字段');
            return false;
        }
        
        if (!message.fieldUpdates || message.fieldUpdates.length === 0) {
            console.error('[SyncVarMessageHandler] 消息没有字段更新');
            return false;
        }
        
        // 检查时间戳合理性（不能是未来的时间，不能太久以前）
        const now = Date.now();
        const maxAge = 60000; // 1分钟
        if (message.timestamp > now + 5000 || message.timestamp < now - maxAge) {
            console.warn(`[SyncVarMessageHandler] 消息时间戳异常: ${message.timestamp}, 当前: ${now}`);
            return false;
        }
        
        return true;
    }
    
    /**
     * 检查操作权限
     */
    private checkAuthority(
        message: SyncVarUpdateMessage, 
        connection: NetworkConnection | undefined, 
        targetIdentity: any
    ): boolean {
        // 服务端始终有权限处理消息
        if (NetworkEnvironment.isServer) {
            // 但需要检查客户端发送的消息是否有权限修改对象
            if (connection) {
                // 检查是否是对象拥有者
                if (targetIdentity.ownerId && targetIdentity.ownerId !== connection.connectionId) {
                    // 非拥有者只能发送非权威字段更新
                    const hasAuthorityOnlyUpdates = message.fieldUpdates.some(update => update.authorityOnly);
                    if (hasAuthorityOnlyUpdates) {
                        console.warn(`[SyncVarMessageHandler] 非拥有者 ${connection.connectionId} 尝试修改权威字段`);
                        return false;
                    }
                }
            }
            return true;
        }
        
        // 客户端接收到的消息通常来自服务端，应该允许
        if (NetworkEnvironment.isClient) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 查找目标组件
     */
    private findTargetComponent(targetIdentity: any, componentType: string): any {
        const entity = targetIdentity.entity;
        if (!entity || typeof entity.getComponent !== 'function') {
            console.error('[SyncVarMessageHandler] NetworkIdentity缺少有效的Entity引用');
            return null;
        }
        
        try {
            // 获取组件类
            const ComponentClass = this.getComponentClassByName(componentType);
            if (!ComponentClass) {
                return null;
            }
            
            // 使用Entity的getComponent方法查找组件
            const component = entity.getComponent(ComponentClass);
            if (!component) {
                console.warn(`[SyncVarMessageHandler] Entity ${entity.id} 上未找到组件: ${componentType}`);
                return null;
            }
            
            return component;
        } catch (error) {
            console.error(`[SyncVarMessageHandler] 查找组件失败: ${componentType}`, error);
            return null;
        }
    }
    
    /**
     * 根据组件名称获取组件类
     */
    private getComponentClassByName(componentType: string): any {
        const componentClass = ComponentRegistry.getComponentType(componentType);
        
        if (!componentClass) {
            console.warn(`[SyncVarMessageHandler] 未找到组件类型: ${componentType}`);
            return null;
        }
        
        return componentClass;
    }
    
    /**
     * 应用SyncVar更新到组件
     */
    private applySyncVarUpdates(targetComponent: any, message: SyncVarUpdateMessage): void {
        const syncVarManager = SyncVarManager.Instance;
        
        try {
            syncVarManager.applySyncVarUpdateMessage(targetComponent, message);
        } catch (error) {
            console.error('[SyncVarMessageHandler] 应用SyncVar更新失败:', error);
            throw error;
        }
    }
    
    /**
     * 转发消息给其他客户端（服务端专用）
     */
    private async forwardToOtherClients(
        message: SyncVarUpdateMessage, 
        senderConnection: NetworkConnection
    ): Promise<void> {
        try {
            // 获取NetworkServer实例
            const server = NetworkManager.GetServer();
            
            if (!server || !server.isRunning) {
                console.warn('[SyncVarMessageHandler] NetworkServer未运行，无法转发消息');
                return;
            }
            
            // 使用NetworkServer的broadcastSyncVarMessageExcept方法排除发送者
            const successCount = await server.broadcastSyncVarMessageExcept(message, senderConnection.connectionId);
            
            if (successCount > 0) {
                console.log(`[SyncVarMessageHandler] 成功转发消息给 ${successCount} 个其他客户端 (发送者: ${senderConnection.connectionId})`);
            } else {
                console.log(`[SyncVarMessageHandler] 没有其他客户端需要转发消息 (发送者: ${senderConnection.connectionId})`);
            }
        } catch (error) {
            console.error(`[SyncVarMessageHandler] 转发消息失败 (发送者: ${senderConnection.connectionId}):`, error);
        }
    }
    
    /**
     * 获取处理器统计信息
     */
    public getStats(): {
        processedMessages: number;
        cacheSize: number;
        maxCacheSize: number;
    } {
        return {
            processedMessages: this._processedMessages.size,
            cacheSize: this._processedMessages.size,
            maxCacheSize: this._maxProcessedCache
        };
    }
    
    /**
     * 清理已处理消息缓存
     */
    public clearProcessedCache(): void {
        this._processedMessages.clear();
        console.log('[SyncVarMessageHandler] 已清理消息处理缓存');
    }
    
    /**
     * 设置最大缓存大小
     */
    public setMaxCacheSize(maxSize: number): void {
        this._maxProcessedCache = Math.max(100, maxSize);
        
        // 如果当前缓存超过新的最大值，进行清理
        if (this._processedMessages.size > this._maxProcessedCache) {
            const toDelete = Array.from(this._processedMessages).slice(0, this._processedMessages.size - this._maxProcessedCache);
            toDelete.forEach(key => this._processedMessages.delete(key));
        }
    }
}