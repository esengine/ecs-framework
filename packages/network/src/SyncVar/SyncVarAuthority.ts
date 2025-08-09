import { AUTHORITY_CONFIG, SYNCVAR_CONFIG } from '../constants/NetworkConstants';
import { NetworkEnvironment } from '../Core/NetworkEnvironment';
import { NetworkIdentity } from '../Core/NetworkIdentity';
import { INetworkComponent, INetworkEntity, AuthorityContext as CoreAuthorityContext, AuthorityType as CoreAuthorityType, NetworkEnvironmentType } from '../types/CoreTypes';

const logger = { 
    info: console.log, 
    warn: console.warn, 
    error: console.error, 
    debug: console.debug 
};

/** 重新导出核心权限类型 */
export { AuthorityType } from '../types/CoreTypes';

/** 重新导出核心权限上下文 */
export { AuthorityContext } from '../types/CoreTypes';

/**
 * 权限规则
 */
export interface AuthorityRule {
    /** 规则名称 */
    name: string;
    /** 规则检查函数 */
    check: <T extends INetworkComponent>(component: T, context: CoreAuthorityContext) => boolean;
    /** 优先级（数值越大优先级越高） */
    priority: number;
    /** 是否启用 */
    enabled: boolean;
}

/**
 * SyncVar权限管理器
 * 
 * 提供灵活的权限检查机制，支持多种权限策略
 */
export class SyncVarAuthorityManager {
    private static _instance: SyncVarAuthorityManager | null = null;
    private _rules: AuthorityRule[] = [];
    private _cache: Map<string, { result: boolean; timestamp: number }> = new Map();
    private _cacheTimeout: number = SYNCVAR_CONFIG.DEFAULT_CACHE_TIMEOUT;
    
    private constructor() {
        this.initializeDefaultRules();
    }
    
    public static get Instance(): SyncVarAuthorityManager {
        if (!SyncVarAuthorityManager._instance) {
            SyncVarAuthorityManager._instance = new SyncVarAuthorityManager();
        }
        return SyncVarAuthorityManager._instance;
    }
    
    /**
     * 初始化默认权限规则
     */
    private initializeDefaultRules(): void {
        // 服务端权限规则
        this.addRule({
            name: 'server-full-authority',
            check: (component, context) => context.environment === 'server',
            priority: AUTHORITY_CONFIG.SERVER_AUTHORITY_PRIORITY,
            enabled: true
        });
        
        // 网络身份权限规则
        this.addRule({
            name: 'network-identity-authority',
            check: (component, context) => {
                if (context.environment !== 'client') return false;
                
                const networkIdentity = this.extractNetworkIdentity(component);
                if (!networkIdentity) return false;
                
                // 客户端只能控制属于自己的网络对象
                return networkIdentity.hasAuthority && 
                       networkIdentity.ownerId === context.clientId;
            },
            priority: AUTHORITY_CONFIG.NETWORK_IDENTITY_PRIORITY,
            enabled: true
        });
        
        // 组件自定义权限规则
        this.addRule({
            name: 'component-custom-authority',
            check: (component: any, context) => {
                if (typeof component.hasAuthority === 'function') {
                    return component.hasAuthority(context);
                }
                if (typeof component.checkAuthority === 'function') {
                    return component.checkAuthority(context);
                }
                return false;
            },
            priority: AUTHORITY_CONFIG.COMPONENT_CUSTOM_PRIORITY,
            enabled: true
        });
        
        // 实体所有者权限规则
        this.addRule({
            name: 'entity-owner-authority',
            check: (component, context) => {
                if (context.environment !== 'client') return false;
                
                const entity = component.entity;
                if (!entity) return false;
                
                // 检查实体的所有者信息
                if ((entity as INetworkEntity).ownerId && (entity as INetworkEntity).ownerId === context.clientId) {
                    return true;
                }
                
                return false;
            },
            priority: AUTHORITY_CONFIG.ENTITY_OWNER_PRIORITY,
            enabled: true
        });
        
        // 默认拒绝规则
        this.addRule({
            name: 'default-deny',
            check: () => false,
            priority: AUTHORITY_CONFIG.DEFAULT_DENY_PRIORITY,
            enabled: true
        });
    }
    
    /**
     * 检查组件权限
     * 
     * @param component - 组件实例
     * @param clientId - 客户端ID（可选）
     * @returns 是否有权限
     */
    public hasAuthority<T extends INetworkComponent>(component: T, clientId?: string): boolean {
        const context = this.createContext(component, clientId);
        const cacheKey = this.generateCacheKey(component, context);
        
        // 检查缓存
        const cached = this._cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this._cacheTimeout) {
            return cached.result;
        }
        
        // 执行权限检查
        const result = this.checkAuthority(component, context);
        
        // 缓存结果
        this._cache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });
        
        logger.debug(`权限检查结果: ${component.constructor.name} -> ${result}`);
        return result;
    }
    
    /**
     * 执行权限检查
     */
    private checkAuthority<T extends INetworkComponent>(component: T, context: CoreAuthorityContext): boolean {
        const enabledRules = this._rules
            .filter(rule => rule.enabled)
            .sort((a, b) => b.priority - a.priority);
        
        for (const rule of enabledRules) {
            try {
                const result = rule.check(component, context);
                if (result) {
                    logger.debug(`权限规则 "${rule.name}" 通过`);
                    return true;
                }
            } catch (error) {
                logger.warn(`权限规则 "${rule.name}" 执行失败:`, error);
            }
        }
        
        logger.debug('所有权限规则都不匹配，拒绝权限');
        return false;
    }
    
    /**
     * 创建权限上下文
     */
    private createContext<T extends INetworkComponent>(component: T, clientId?: string): CoreAuthorityContext {
        const networkIdentity = this.extractNetworkIdentity(component);
        const entity = component.entity;
        
        return {
            environment: NetworkEnvironment.isServer ? 'server' : 'client' as NetworkEnvironmentType,
            networkId: networkIdentity?.networkId,
            entityId: entity?.id,
            clientId,
            level: CoreAuthorityType.ReadWrite,
            timestamp: Date.now(),
            metadata: {}
        };
    }
    
    /**
     * 提取网络身份
     */
    private extractNetworkIdentity<T extends INetworkComponent>(component: T): NetworkIdentity | null {
        try {
            // 直接检查组件的网络身份
            if ((component as any).networkIdentity instanceof NetworkIdentity) {
                return (component as any).networkIdentity;
            }
            
            // 检查组件实体的网络身份
            if (component.entity) {
                const networkIdentity = (component.entity as any).getComponent?.(NetworkIdentity);
                if (networkIdentity) {
                    return networkIdentity;
                }
            }
            
            return null;
        } catch (error) {
            logger.debug('提取网络身份时出错:', error);
            return null;
        }
    }
    
    /**
     * 生成缓存键
     */
    private generateCacheKey<T extends INetworkComponent>(component: T, context: CoreAuthorityContext): string {
        const parts = [
            component.constructor.name,
            context.environment,
            context.networkId || 'no-net-id',
            context.clientId || 'no-client-id'
        ];
        return parts.join('|');
    }
    
    /**
     * 添加权限规则
     */
    public addRule(rule: AuthorityRule): void {
        this._rules.push(rule);
        this._rules.sort((a, b) => b.priority - a.priority);
        this.clearCache();
        logger.debug(`添加权限规则: ${rule.name} (优先级: ${rule.priority})`);
    }
    
    /**
     * 移除权限规则
     */
    public removeRule(name: string): boolean {
        const index = this._rules.findIndex(rule => rule.name === name);
        if (index !== -1) {
            this._rules.splice(index, 1);
            this.clearCache();
            logger.debug(`移除权限规则: ${name}`);
            return true;
        }
        return false;
    }
    
    /**
     * 启用/禁用权限规则
     */
    public setRuleEnabled(name: string, enabled: boolean): boolean {
        const rule = this._rules.find(rule => rule.name === name);
        if (rule) {
            rule.enabled = enabled;
            this.clearCache();
            logger.debug(`${enabled ? '启用' : '禁用'}权限规则: ${name}`);
            return true;
        }
        return false;
    }
    
    /**
     * 获取所有权限规则
     */
    public getRules(): AuthorityRule[] {
        return [...this._rules];
    }
    
    /**
     * 清除权限缓存
     */
    public clearCache(): void {
        this._cache.clear();
        logger.debug('权限缓存已清除');
    }
    
    /**
     * 设置缓存超时时间
     */
    public setCacheTimeout(timeout: number): void {
        this._cacheTimeout = timeout;
        logger.debug(`权限缓存超时时间设为: ${timeout}ms`);
    }
    
    /**
     * 获取权限检查统计
     */
    public getStats(): {
        rulesCount: number;
        cacheSize: number;
        cacheTimeout: number;
        enabledRules: string[];
    } {
        return {
            rulesCount: this._rules.length,
            cacheSize: this._cache.size,
            cacheTimeout: this._cacheTimeout,
            enabledRules: this._rules
                .filter(rule => rule.enabled)
                .map(rule => rule.name)
        };
    }
}