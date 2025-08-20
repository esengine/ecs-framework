/**
 * 安全防护管理器
 * 提供速率限制、IP黑名单、DDoS防护等安全机制
 */
import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '@esengine/network-shared';
import { ClientSession } from '../core/ConnectionManager';

/**
 * 速率限制规则
 */
export interface RateLimitRule {
    name: string;
    windowMs: number;      // 时间窗口（毫秒）
    maxRequests: number;   // 最大请求数
    action: 'throttle' | 'block' | 'ban';  // 处理动作
    banDuration?: number;  // 封禁持续时间（毫秒）
    message?: string;      // 提示消息
}

/**
 * IP信息
 */
export interface IPInfo {
    ip: string;
    country?: string;
    region?: string;
    city?: string;
    isp?: string;
    isProxy?: boolean;
    isTor?: boolean;
    threatLevel?: 'low' | 'medium' | 'high';
}

/**
 * 黑名单条目
 */
export interface BlacklistEntry {
    ip: string;
    reason: string;
    addedAt: number;
    expiresAt?: number;
    permanent: boolean;
    metadata?: Record<string, any>;
}

/**
 * 白名单条目
 */
export interface WhitelistEntry {
    ip: string;
    description: string;
    addedAt: number;
}

/**
 * 连接统计
 */
export interface ConnectionStats {
    ip: string;
    totalConnections: number;
    activeConnections: number;
    lastConnection: number;
    rejectedConnections: number;
    rateLimitViolations: number;
}

/**
 * 安全事件
 */
export interface SecurityEvent {
    id: string;
    type: 'rate_limit' | 'blacklist' | 'ddos' | 'suspicious' | 'brute_force';
    ip: string;
    timestamp: number;
    details: Record<string, any>;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 安全管理器配置
 */
export interface SecurityManagerConfig {
    rateLimiting: {
        enabled: boolean;
        globalRules: RateLimitRule[];
        perIpMaxConnections: number;
    };
    blacklisting: {
        enabled: boolean;
        autoBlacklistThreshold: number; // 触发自动黑名单的违规次数
        defaultBanDuration: number;     // 默认封禁时间（毫秒）
    };
    ddosProtection: {
        enabled: boolean;
        connectionThreshold: number;    // 连接数阈值
        requestThreshold: number;       // 请求数阈值
        timeWindow: number;            // 检测时间窗口（毫秒）
    };
    geoBlocking: {
        enabled: boolean;
        blockedCountries: string[];     // 被封禁的国家代码
        allowedCountries?: string[];    // 允许的国家代码（如果设置，则只允许这些国家）
    };
    monitoring: {
        enabled: boolean;
        eventRetention: number;         // 事件保留时间（毫秒）
        maxEvents: number;             // 最大事件数量
    };
}

/**
 * 安全管理器事件
 */
export interface SecurityManagerEvents {
    'security:event': (event: SecurityEvent) => void;
    'security:rate_limit': (ip: string, rule: RateLimitRule) => void;
    'security:blacklist:added': (entry: BlacklistEntry) => void;
    'security:blacklist:removed': (ip: string) => void;
    'security:ddos:detected': (ip: string, stats: ConnectionStats) => void;
    'security:connection:rejected': (ip: string, reason: string) => void;
    'security:suspicious:activity': (ip: string, activity: string) => void;
}

/**
 * 请求计数器
 */
interface RequestCounter {
    count: number;
    windowStart: number;
    violations: number;
}

/**
 * 安全防护管理器
 */
export class SecurityManager extends EventEmitter<SecurityManagerEvents> {
    private logger = createLogger('SecurityManager');
    private config: SecurityManagerConfig;
    
    // 数据存储
    private blacklist: Map<string, BlacklistEntry> = new Map();
    private whitelist: Map<string, WhitelistEntry> = new Map();
    private connectionStats: Map<string, ConnectionStats> = new Map();
    private requestCounters: Map<string, Map<string, RequestCounter>> = new Map(); // ip -> rule -> counter
    private securityEvents: SecurityEvent[] = [];
    
    // 定时器
    private cleanupTimer?: NodeJS.Timeout;
    private monitoringTimer?: NodeJS.Timeout;

    constructor(config: SecurityManagerConfig) {
        super();
        this.config = config;
        this.startCleanupTimer();
        if (config.monitoring.enabled) {
            this.startMonitoringTimer();
        }
    }

    /**
     * 检查连接是否被允许
     */
    isConnectionAllowed(ip: string, ipInfo?: IPInfo): { allowed: boolean; reason?: string } {
        // 检查白名单
        if (this.whitelist.has(ip)) {
            return { allowed: true };
        }

        // 检查黑名单
        if (this.isIPBlacklisted(ip)) {
            this.recordSecurityEvent({
                type: 'blacklist',
                ip,
                details: { action: 'connection_rejected' },
                severity: 'medium'
            });
            this.emit('security:connection:rejected', ip, 'IP is blacklisted');
            return { allowed: false, reason: 'IP is blacklisted' };
        }

        // 检查地理位置封禁
        if (this.config.geoBlocking.enabled && ipInfo) {
            const geoResult = this.checkGeoBlocking(ipInfo);
            if (!geoResult.allowed) {
                this.recordSecurityEvent({
                    type: 'blacklist',
                    ip,
                    details: { action: 'geo_blocked', country: ipInfo.country },
                    severity: 'low'
                });
                this.emit('security:connection:rejected', ip, geoResult.reason!);
                return geoResult;
            }
        }

        // 检查连接数限制
        if (this.config.rateLimiting.enabled) {
            const stats = this.getConnectionStats(ip);
            if (stats.activeConnections >= this.config.rateLimiting.perIpMaxConnections) {
                this.recordSecurityEvent({
                    type: 'rate_limit',
                    ip,
                    details: { 
                        action: 'connection_limit_exceeded',
                        activeConnections: stats.activeConnections,
                        limit: this.config.rateLimiting.perIpMaxConnections
                    },
                    severity: 'medium'
                });
                this.emit('security:connection:rejected', ip, 'Too many concurrent connections');
                return { allowed: false, reason: 'Too many concurrent connections' };
            }
        }

        // 检查DDoS防护
        if (this.config.ddosProtection.enabled) {
            if (this.detectDDoS(ip)) {
                this.autoBlacklistIP(ip, 'DDoS attack detected', this.config.blacklisting.defaultBanDuration);
                this.recordSecurityEvent({
                    type: 'ddos',
                    ip,
                    details: { action: 'ddos_detected' },
                    severity: 'high'
                });
                this.emit('security:connection:rejected', ip, 'DDoS protection triggered');
                return { allowed: false, reason: 'DDoS protection triggered' };
            }
        }

        return { allowed: true };
    }

    /**
     * 记录新连接
     */
    recordConnection(ip: string, session: ClientSession): void {
        const stats = this.getConnectionStats(ip);
        stats.totalConnections++;
        stats.activeConnections++;
        stats.lastConnection = Date.now();
        
        this.connectionStats.set(ip, stats);
    }

    /**
     * 记录连接断开
     */
    recordDisconnection(ip: string): void {
        const stats = this.connectionStats.get(ip);
        if (stats && stats.activeConnections > 0) {
            stats.activeConnections--;
            this.connectionStats.set(ip, stats);
        }
    }

    /**
     * 检查请求速率限制
     */
    checkRateLimit(ip: string, ruleNames?: string[]): { allowed: boolean; rule?: RateLimitRule; action?: string } {
        if (!this.config.rateLimiting.enabled) {
            return { allowed: true };
        }

        const rules = ruleNames 
            ? this.config.rateLimiting.globalRules.filter(r => ruleNames.includes(r.name))
            : this.config.rateLimiting.globalRules;

        for (const rule of rules) {
            const result = this.checkRuleLimits(ip, rule);
            if (!result.allowed) {
                return { allowed: false, rule, action: result.action };
            }
        }

        return { allowed: true };
    }

    /**
     * 添加IP到黑名单
     */
    addToBlacklist(ip: string, reason: string, duration?: number): void {
        const now = Date.now();
        const entry: BlacklistEntry = {
            ip,
            reason,
            addedAt: now,
            expiresAt: duration ? now + duration : undefined,
            permanent: !duration
        };

        this.blacklist.set(ip, entry);
        this.emit('security:blacklist:added', entry);
        this.logger.warn(`IP加入黑名单: ${ip}, 原因: ${reason}`);
    }

    /**
     * 从黑名单移除IP
     */
    removeFromBlacklist(ip: string): boolean {
        const removed = this.blacklist.delete(ip);
        if (removed) {
            this.emit('security:blacklist:removed', ip);
            this.logger.info(`IP从黑名单移除: ${ip}`);
        }
        return removed;
    }

    /**
     * 添加IP到白名单
     */
    addToWhitelist(ip: string, description: string): void {
        const entry: WhitelistEntry = {
            ip,
            description,
            addedAt: Date.now()
        };

        this.whitelist.set(ip, entry);
        this.logger.info(`IP加入白名单: ${ip}, 描述: ${description}`);
    }

    /**
     * 从白名单移除IP
     */
    removeFromWhitelist(ip: string): boolean {
        const removed = this.whitelist.delete(ip);
        if (removed) {
            this.logger.info(`IP从白名单移除: ${ip}`);
        }
        return removed;
    }

    /**
     * 检查IP是否在黑名单中
     */
    private isIPBlacklisted(ip: string): boolean {
        const entry = this.blacklist.get(ip);
        if (!entry) {
            return false;
        }

        // 检查是否过期
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.blacklist.delete(ip);
            return false;
        }

        return true;
    }

    /**
     * 检查地理位置封禁
     */
    private checkGeoBlocking(ipInfo: IPInfo): { allowed: boolean; reason?: string } {
        if (!ipInfo.country) {
            return { allowed: true };
        }

        // 如果设置了允许的国家列表，则只允许这些国家
        if (this.config.geoBlocking.allowedCountries && this.config.geoBlocking.allowedCountries.length > 0) {
            const allowed = this.config.geoBlocking.allowedCountries.includes(ipInfo.country);
            return { 
                allowed, 
                reason: allowed ? undefined : `Country ${ipInfo.country} is not in allowed list`
            };
        }

        // 检查被封禁的国家
        if (this.config.geoBlocking.blockedCountries.includes(ipInfo.country)) {
            return { 
                allowed: false, 
                reason: `Country ${ipInfo.country} is blocked`
            };
        }

        return { allowed: true };
    }

    /**
     * 获取连接统计
     */
    private getConnectionStats(ip: string): ConnectionStats {
        return this.connectionStats.get(ip) || {
            ip,
            totalConnections: 0,
            activeConnections: 0,
            lastConnection: 0,
            rejectedConnections: 0,
            rateLimitViolations: 0
        };
    }

    /**
     * 检查单个规则的限制
     */
    private checkRuleLimits(ip: string, rule: RateLimitRule): { allowed: boolean; action?: string } {
        const now = Date.now();
        
        // 获取或创建IP的请求计数器
        if (!this.requestCounters.has(ip)) {
            this.requestCounters.set(ip, new Map());
        }
        const ipCounters = this.requestCounters.get(ip)!;
        
        let counter = ipCounters.get(rule.name);
        if (!counter) {
            counter = { count: 0, windowStart: now, violations: 0 };
            ipCounters.set(rule.name, counter);
        }

        // 检查是否需要重置窗口
        if (now - counter.windowStart >= rule.windowMs) {
            counter.count = 0;
            counter.windowStart = now;
        }

        // 增加计数
        counter.count++;

        // 检查是否超过限制
        if (counter.count > rule.maxRequests) {
            counter.violations++;
            
            // 记录安全事件
            this.recordSecurityEvent({
                type: 'rate_limit',
                ip,
                details: { 
                    rule: rule.name, 
                    count: counter.count, 
                    limit: rule.maxRequests,
                    violations: counter.violations
                },
                severity: 'medium'
            });

            this.emit('security:rate_limit', ip, rule);

            // 处理违规行为
            this.handleRateLimitViolation(ip, rule, counter);

            return { allowed: false, action: rule.action };
        }

        return { allowed: true };
    }

    /**
     * 处理速率限制违规
     */
    private handleRateLimitViolation(ip: string, rule: RateLimitRule, counter: RequestCounter): void {
        const stats = this.getConnectionStats(ip);
        stats.rateLimitViolations++;
        this.connectionStats.set(ip, stats);

        switch (rule.action) {
            case 'ban':
                const banDuration = rule.banDuration || this.config.blacklisting.defaultBanDuration;
                this.addToBlacklist(ip, `Rate limit violation: ${rule.name}`, banDuration);
                break;
            case 'block':
                // 暂时阻止请求，不添加到黑名单
                break;
            case 'throttle':
                // 减慢请求速度，这里可以实现延迟逻辑
                break;
        }

        // 检查是否达到自动黑名单阈值
        if (counter.violations >= this.config.blacklisting.autoBlacklistThreshold) {
            this.autoBlacklistIP(ip, `Repeated rate limit violations: ${rule.name}`);
        }
    }

    /**
     * 检测DDoS攻击
     */
    private detectDDoS(ip: string): boolean {
        const stats = this.getConnectionStats(ip);
        const now = Date.now();
        
        // 检查连接数阈值
        if (stats.activeConnections >= this.config.ddosProtection.connectionThreshold) {
            return true;
        }

        // 检查请求频率
        const timeWindow = this.config.ddosProtection.timeWindow;
        if (now - stats.lastConnection < timeWindow) {
            const requestRate = stats.totalConnections / (timeWindow / 1000);
            if (requestRate >= this.config.ddosProtection.requestThreshold) {
                return true;
            }
        }

        return false;
    }

    /**
     * 自动将IP添加到黑名单
     */
    private autoBlacklistIP(ip: string, reason: string, duration?: number): void {
        if (!this.config.blacklisting.enabled) {
            return;
        }

        const banDuration = duration || this.config.blacklisting.defaultBanDuration;
        this.addToBlacklist(ip, reason, banDuration);
        
        this.recordSecurityEvent({
            type: 'blacklist',
            ip,
            details: { action: 'auto_blacklisted', reason, duration: banDuration },
            severity: 'high'
        });
    }

    /**
     * 记录安全事件
     */
    private recordSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
        if (!this.config.monitoring.enabled) {
            return;
        }

        const event: SecurityEvent = {
            id: this.generateEventId(),
            timestamp: Date.now(),
            ...eventData
        };

        this.securityEvents.push(event);

        // 限制事件数量
        if (this.securityEvents.length > this.config.monitoring.maxEvents) {
            this.securityEvents = this.securityEvents.slice(-this.config.monitoring.maxEvents);
        }

        this.emit('security:event', event);
    }

    /**
     * 生成事件ID
     */
    private generateEventId(): string {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 启动清理定时器
     */
    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpiredData();
        }, 5 * 60 * 1000); // 每5分钟清理一次
    }

    /**
     * 启动监控定时器
     */
    private startMonitoringTimer(): void {
        this.monitoringTimer = setInterval(() => {
            this.performSecurityAnalysis();
        }, 60 * 1000); // 每分钟分析一次
    }

    /**
     * 清理过期数据
     */
    private cleanupExpiredData(): void {
        const now = Date.now();

        // 清理过期的黑名单条目
        for (const [ip, entry] of this.blacklist.entries()) {
            if (entry.expiresAt && now > entry.expiresAt) {
                this.blacklist.delete(ip);
            }
        }

        // 清理过期的安全事件
        const retentionTime = this.config.monitoring.eventRetention;
        this.securityEvents = this.securityEvents.filter(
            event => now - event.timestamp <= retentionTime
        );

        // 清理过期的请求计数器
        for (const [ip, counters] of this.requestCounters.entries()) {
            for (const [ruleName, counter] of counters.entries()) {
                if (now - counter.windowStart > 60 * 60 * 1000) { // 1小时后清理
                    counters.delete(ruleName);
                }
            }
            if (counters.size === 0) {
                this.requestCounters.delete(ip);
            }
        }
    }

    /**
     * 执行安全分析
     */
    private performSecurityAnalysis(): void {
        // 这里可以实现更复杂的安全分析逻辑
        // 例如：检测异常模式、分析攻击趋势等
    }

    /**
     * 销毁安全管理器
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
        }
        this.logger.info('安全管理器已销毁');
    }
}