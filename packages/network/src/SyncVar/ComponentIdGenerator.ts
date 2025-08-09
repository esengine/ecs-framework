import { Entity, createLogger } from '@esengine/ecs-framework';
import { NetworkEnvironment } from '../Core/NetworkEnvironment';
import { NetworkIdentity } from '../Core/NetworkIdentity';

const logger = createLogger('ComponentIdGenerator');

/**
 * 组件ID生成器配置
 */
export interface ComponentIdGeneratorConfig {
    useNetworkId: boolean;
    useEntityId: boolean;
    useTimestamp: boolean;
    useSequence: boolean;
    customPrefix?: string;
}

/**
 * 组件唯一ID生成器
 * 
 * 提供多种策略生成组件的唯一标识符
 * 可以集成网络ID系统、实体ID系统等
 */
export class ComponentIdGenerator {
    private static readonly DEFAULT_CONFIG: ComponentIdGeneratorConfig = {
        useNetworkId: true,
        useEntityId: true,
        useTimestamp: true,
        useSequence: true
    };

    private _config: ComponentIdGeneratorConfig;
    private _sequenceCounter: number = 0;
    private _generatedIds: Set<string> = new Set();
    
    constructor(config?: Partial<ComponentIdGeneratorConfig>) {
        this._config = { ...ComponentIdGenerator.DEFAULT_CONFIG, ...config };
    }

    /**
     * 为组件生成唯一ID
     * 
     * @param component - 组件实例
     * @returns 唯一ID字符串
     */
    public generateId(component: any): string {
        const parts: string[] = [];
        
        // 添加自定义前缀
        if (this._config.customPrefix) {
            parts.push(this._config.customPrefix);
        }

        // 添加组件类型名称
        parts.push(component.constructor.name);

        // 尝试使用网络ID
        if (this._config.useNetworkId) {
            const networkId = this.extractNetworkId(component);
            if (networkId) {
                parts.push(`net_${networkId}`);
            }
        }

        // 尝试使用实体ID
        if (this._config.useEntityId) {
            const entityId = this.extractEntityId(component);
            if (entityId !== null) {
                parts.push(`ent_${entityId}`);
            }
        }

        // 添加环境前缀
        const env = NetworkEnvironment.isServer ? 's' : 'c';
        parts.push(env);

        // 添加时间戳
        if (this._config.useTimestamp) {
            parts.push(Date.now().toString(36));
        }

        // 添加序列号
        if (this._config.useSequence) {
            parts.push((++this._sequenceCounter).toString(36));
        }

        // 生成基础ID
        let baseId = parts.join('_');
        
        // 确保ID唯一性
        let finalId = baseId;
        let counter = 0;
        while (this._generatedIds.has(finalId)) {
            finalId = `${baseId}_${counter}`;
            counter++;
        }

        // 记录生成的ID
        this._generatedIds.add(finalId);
        
        logger.debug(`为组件 ${component.constructor.name} 生成ID: ${finalId}`);
        return finalId;
    }

    /**
     * 从组件中提取网络ID
     * 
     * @param component - 组件实例
     * @returns 网络ID或null
     */
    private extractNetworkId(component: any): string | null {
        try {
            // 检查组件是否有网络身份
            if (component.networkIdentity && component.networkIdentity instanceof NetworkIdentity) {
                return component.networkIdentity.networkId;
            }

            // 检查组件的实体是否有网络身份
            if (component.entity) {
                const networkIdentity = component.entity.getComponent(NetworkIdentity);
                if (networkIdentity) {
                    return networkIdentity.networkId;
                }
            }

            // 检查组件本身是否有networkId属性
            if (component.networkId && typeof component.networkId === 'string') {
                return component.networkId;
            }

            return null;
        } catch (error) {
            logger.debug('提取网络ID时出错:', error);
            return null;
        }
    }

    /**
     * 从组件中提取实体ID
     * 
     * @param component - 组件实例
     * @returns 实体ID或null
     */
    private extractEntityId(component: any): number | null {
        try {
            // 检查组件是否有实体引用
            if (component.entity && component.entity instanceof Entity) {
                return component.entity.id;
            }

            // 检查组件本身是否有entityId属性
            if (typeof component.entityId === 'number') {
                return component.entityId;
            }

            return null;
        } catch (error) {
            logger.debug('提取实体ID时出错:', error);
            return null;
        }
    }

    /**
     * 检查ID是否已经生成过
     * 
     * @param id - 要检查的ID
     * @returns 是否已存在
     */
    public hasGenerated(id: string): boolean {
        return this._generatedIds.has(id);
    }

    /**
     * 清理已生成的ID记录
     * 
     * @param maxAge - 最大保留时间（毫秒），默认1小时
     */
    public cleanup(maxAge: number = 3600000): void {
        // 避免未使用参数警告
        void maxAge;
        // 简单实现：清空所有记录
        // 在实际应用中，可以根据时间戳进行更精细的清理
        this._generatedIds.clear();
        this._sequenceCounter = 0;
        logger.debug('已清理ID生成器缓存');
    }

    /**
     * 获取统计信息
     */
    public getStats(): {
        generatedCount: number;
        sequenceCounter: number;
        config: ComponentIdGeneratorConfig;
    } {
        return {
            generatedCount: this._generatedIds.size,
            sequenceCounter: this._sequenceCounter,
            config: { ...this._config }
        };
    }

    /**
     * 重置生成器状态
     */
    public reset(): void {
        this._generatedIds.clear();
        this._sequenceCounter = 0;
        logger.debug('ID生成器已重置');
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<ComponentIdGeneratorConfig>): void {
        this._config = { ...this._config, ...newConfig };
        logger.debug('ID生成器配置已更新');
    }
}