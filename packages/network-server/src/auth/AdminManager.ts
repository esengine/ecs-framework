/**
 * 管理员操作管理器
 * 提供踢出、封禁、管理员命令等功能
 */
import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '@esengine/network-shared';
import { ClientSession } from '../core/ConnectionManager';
import { SessionManager, UserSession } from './SessionManager';
import { SecurityManager } from './SecurityManager';

/**
 * 管理员操作类型
 */
export type AdminActionType = 
    | 'kick'         // 踢出用户
    | 'ban'          // 封禁用户  
    | 'unban'        // 解封用户
    | 'mute'         // 禁言用户
    | 'unmute'       // 解除禁言
    | 'warn'         // 警告用户
    | 'broadcast';   // 广播消息

/**
 * 封禁记录
 */
export interface BanRecord {
    userId: string;
    username: string;
    adminId: string;
    adminUsername: string;
    reason: string;
    bannedAt: number;
    expiresAt?: number;
    permanent: boolean;
    ip?: string;
    metadata?: Record<string, any>;
}

/**
 * 禁言记录
 */
export interface MuteRecord {
    userId: string;
    username: string;
    adminId: string;
    adminUsername: string;
    reason: string;
    mutedAt: number;
    expiresAt?: number;
    permanent: boolean;
}

/**
 * 警告记录
 */
export interface WarningRecord {
    id: string;
    userId: string;
    username: string;
    adminId: string;
    adminUsername: string;
    reason: string;
    issuedAt: number;
    acknowledged: boolean;
    metadata?: Record<string, any>;
}

/**
 * 管理员操作记录
 */
export interface AdminActionRecord {
    id: string;
    actionType: AdminActionType;
    adminId: string;
    adminUsername: string;
    targetUserId?: string;
    targetUsername?: string;
    reason: string;
    timestamp: number;
    details: Record<string, any>;
    success: boolean;
}

/**
 * 管理员权限级别
 */
export enum AdminLevel {
    MODERATOR = 1,    // 版主
    ADMIN = 2,        // 管理员
    SUPER_ADMIN = 3   // 超级管理员
}

/**
 * 管理员信息
 */
export interface AdminInfo {
    userId: string;
    username: string;
    level: AdminLevel;
    permissions: string[];
    grantedBy?: string;
    grantedAt: number;
}

/**
 * 管理员管理器配置
 */
export interface AdminManagerConfig {
    maxWarningsBeforeAutoBan: number;
    defaultBanDuration: number;        // 默认封禁时间（毫秒）
    defaultMuteDuration: number;       // 默认禁言时间（毫秒）
    recordRetentionTime: number;       // 记录保留时间（毫秒）
    enableActionLogging: boolean;
    requireReasonForActions: boolean;
}

/**
 * 管理员管理器事件
 */
export interface AdminManagerEvents {
    'admin:action': (record: AdminActionRecord) => void;
    'admin:user:kicked': (userId: string, adminId: string, reason: string) => void;
    'admin:user:banned': (record: BanRecord) => void;
    'admin:user:unbanned': (userId: string, adminId: string) => void;
    'admin:user:muted': (record: MuteRecord) => void;
    'admin:user:unmuted': (userId: string, adminId: string) => void;
    'admin:user:warned': (record: WarningRecord) => void;
    'admin:broadcast': (message: string, adminId: string) => void;
    'admin:permission:denied': (adminId: string, action: string, reason: string) => void;
}

/**
 * 管理员操作管理器
 */
export class AdminManager extends EventEmitter<AdminManagerEvents> {
    private logger = createLogger('AdminManager');
    private config: AdminManagerConfig;
    private sessionManager?: SessionManager;
    private securityManager?: SecurityManager;
    
    // 数据存储
    private admins: Map<string, AdminInfo> = new Map();
    private banRecords: Map<string, BanRecord> = new Map(); // userId -> BanRecord
    private muteRecords: Map<string, MuteRecord> = new Map(); // userId -> MuteRecord
    private warnings: Map<string, WarningRecord[]> = new Map(); // userId -> WarningRecord[]
    private actionRecords: AdminActionRecord[] = [];
    
    // 定时器
    private cleanupTimer?: NodeJS.Timeout;

    constructor(config: AdminManagerConfig) {
        super();
        this.config = config;
        this.startCleanupTimer();
    }

    /**
     * 设置会话管理器
     */
    setSessionManager(sessionManager: SessionManager): void {
        this.sessionManager = sessionManager;
    }

    /**
     * 设置安全管理器
     */
    setSecurityManager(securityManager: SecurityManager): void {
        this.securityManager = securityManager;
    }

    /**
     * 添加管理员
     */
    addAdmin(adminInfo: AdminInfo): void {
        this.admins.set(adminInfo.userId, adminInfo);
        this.logger.info(`添加管理员: ${adminInfo.username} (级别: ${adminInfo.level})`);
    }

    /**
     * 移除管理员
     */
    removeAdmin(userId: string): boolean {
        const admin = this.admins.get(userId);
        if (admin) {
            this.admins.delete(userId);
            this.logger.info(`移除管理员: ${admin.username}`);
            return true;
        }
        return false;
    }

    /**
     * 检查用户是否为管理员
     */
    isAdmin(userId: string): boolean {
        return this.admins.has(userId);
    }

    /**
     * 检查管理员权限
     */
    hasPermission(adminId: string, permission: string): boolean {
        const admin = this.admins.get(adminId);
        if (!admin) {
            return false;
        }
        return admin.permissions.includes(permission) || admin.permissions.includes('*');
    }

    /**
     * 检查管理员级别
     */
    hasMinimumLevel(adminId: string, requiredLevel: AdminLevel): boolean {
        const admin = this.admins.get(adminId);
        if (!admin) {
            return false;
        }
        return admin.level >= requiredLevel;
    }

    /**
     * 踢出用户
     */
    async kickUser(targetUserId: string, adminId: string, reason: string): Promise<boolean> {
        if (!this.hasPermission(adminId, 'kick') || !this.hasMinimumLevel(adminId, AdminLevel.MODERATOR)) {
            this.emit('admin:permission:denied', adminId, 'kick', 'Insufficient permissions');
            return false;
        }

        if (this.config.requireReasonForActions && !reason.trim()) {
            return false;
        }

        const admin = this.admins.get(adminId)!;
        let success = false;
        
        try {
            // 使用SessionManager踢出用户
            if (this.sessionManager) {
                const kickedCount = this.sessionManager.kickUser(targetUserId, 'admin_kick');
                success = kickedCount > 0;
            }

            // 记录操作
            const actionRecord = this.createActionRecord({
                actionType: 'kick',
                adminId,
                adminUsername: admin.username,
                targetUserId,
                reason,
                details: { success },
                success
            });

            this.emit('admin:user:kicked', targetUserId, adminId, reason);
            this.logger.info(`管理员 ${admin.username} 踢出用户: ${targetUserId}, 原因: ${reason}`);
            
            return success;
        } catch (error) {
            this.logger.error('踢出用户失败:', error);
            return false;
        }
    }

    /**
     * 封禁用户
     */
    async banUser(
        targetUserId: string, 
        targetUsername: string,
        adminId: string, 
        reason: string,
        duration?: number,
        ip?: string
    ): Promise<boolean> {
        if (!this.hasPermission(adminId, 'ban') || !this.hasMinimumLevel(adminId, AdminLevel.ADMIN)) {
            this.emit('admin:permission:denied', adminId, 'ban', 'Insufficient permissions');
            return false;
        }

        if (this.config.requireReasonForActions && !reason.trim()) {
            return false;
        }

        const admin = this.admins.get(adminId)!;
        const now = Date.now();
        const banDuration = duration || this.config.defaultBanDuration;

        const banRecord: BanRecord = {
            userId: targetUserId,
            username: targetUsername,
            adminId,
            adminUsername: admin.username,
            reason,
            bannedAt: now,
            expiresAt: banDuration > 0 ? now + banDuration : undefined,
            permanent: banDuration <= 0,
            ip
        };

        // 存储封禁记录
        this.banRecords.set(targetUserId, banRecord);

        // 如果有IP，也封禁IP
        if (ip && this.securityManager) {
            this.securityManager.addToBlacklist(ip, `User ban: ${reason}`, banDuration);
        }

        // 踢出用户的所有会话
        if (this.sessionManager) {
            this.sessionManager.kickUser(targetUserId, 'banned');
        }

        // 记录操作
        const actionRecord = this.createActionRecord({
            actionType: 'ban',
            adminId,
            adminUsername: admin.username,
            targetUserId,
            targetUsername,
            reason,
            details: { duration: banDuration, permanent: banRecord.permanent, ip },
            success: true
        });

        this.emit('admin:user:banned', banRecord);
        this.logger.info(`管理员 ${admin.username} 封禁用户: ${targetUsername}, 原因: ${reason}`);

        return true;
    }

    /**
     * 解封用户
     */
    async unbanUser(targetUserId: string, adminId: string): Promise<boolean> {
        if (!this.hasPermission(adminId, 'unban') || !this.hasMinimumLevel(adminId, AdminLevel.ADMIN)) {
            this.emit('admin:permission:denied', adminId, 'unban', 'Insufficient permissions');
            return false;
        }

        const banRecord = this.banRecords.get(targetUserId);
        if (!banRecord) {
            return false;
        }

        const admin = this.admins.get(adminId)!;

        // 移除封禁记录
        this.banRecords.delete(targetUserId);

        // 如果封禁了IP，也解封IP
        if (banRecord.ip && this.securityManager) {
            this.securityManager.removeFromBlacklist(banRecord.ip);
        }

        // 记录操作
        const actionRecord = this.createActionRecord({
            actionType: 'unban',
            adminId,
            adminUsername: admin.username,
            targetUserId,
            targetUsername: banRecord.username,
            reason: 'Unbanned by admin',
            details: { originalBan: banRecord },
            success: true
        });

        this.emit('admin:user:unbanned', targetUserId, adminId);
        this.logger.info(`管理员 ${admin.username} 解封用户: ${banRecord.username}`);

        return true;
    }

    /**
     * 禁言用户
     */
    async muteUser(
        targetUserId: string,
        targetUsername: string,
        adminId: string,
        reason: string,
        duration?: number
    ): Promise<boolean> {
        if (!this.hasPermission(adminId, 'mute') || !this.hasMinimumLevel(adminId, AdminLevel.MODERATOR)) {
            this.emit('admin:permission:denied', adminId, 'mute', 'Insufficient permissions');
            return false;
        }

        if (this.config.requireReasonForActions && !reason.trim()) {
            return false;
        }

        const admin = this.admins.get(adminId)!;
        const now = Date.now();
        const muteDuration = duration || this.config.defaultMuteDuration;

        const muteRecord: MuteRecord = {
            userId: targetUserId,
            username: targetUsername,
            adminId,
            adminUsername: admin.username,
            reason,
            mutedAt: now,
            expiresAt: muteDuration > 0 ? now + muteDuration : undefined,
            permanent: muteDuration <= 0
        };

        // 存储禁言记录
        this.muteRecords.set(targetUserId, muteRecord);

        // 记录操作
        const actionRecord = this.createActionRecord({
            actionType: 'mute',
            adminId,
            adminUsername: admin.username,
            targetUserId,
            targetUsername,
            reason,
            details: { duration: muteDuration, permanent: muteRecord.permanent },
            success: true
        });

        this.emit('admin:user:muted', muteRecord);
        this.logger.info(`管理员 ${admin.username} 禁言用户: ${targetUsername}, 原因: ${reason}`);

        return true;
    }

    /**
     * 解除禁言
     */
    async unmuteUser(targetUserId: string, adminId: string): Promise<boolean> {
        if (!this.hasPermission(adminId, 'unmute') || !this.hasMinimumLevel(adminId, AdminLevel.MODERATOR)) {
            this.emit('admin:permission:denied', adminId, 'unmute', 'Insufficient permissions');
            return false;
        }

        const muteRecord = this.muteRecords.get(targetUserId);
        if (!muteRecord) {
            return false;
        }

        const admin = this.admins.get(adminId)!;

        // 移除禁言记录
        this.muteRecords.delete(targetUserId);

        // 记录操作
        const actionRecord = this.createActionRecord({
            actionType: 'unmute',
            adminId,
            adminUsername: admin.username,
            targetUserId,
            targetUsername: muteRecord.username,
            reason: 'Unmuted by admin',
            details: { originalMute: muteRecord },
            success: true
        });

        this.emit('admin:user:unmuted', targetUserId, adminId);
        this.logger.info(`管理员 ${admin.username} 解除禁言: ${muteRecord.username}`);

        return true;
    }

    /**
     * 警告用户
     */
    async warnUser(
        targetUserId: string,
        targetUsername: string,
        adminId: string,
        reason: string
    ): Promise<WarningRecord | null> {
        if (!this.hasPermission(adminId, 'warn') || !this.hasMinimumLevel(adminId, AdminLevel.MODERATOR)) {
            this.emit('admin:permission:denied', adminId, 'warn', 'Insufficient permissions');
            return null;
        }

        if (this.config.requireReasonForActions && !reason.trim()) {
            return null;
        }

        const admin = this.admins.get(adminId)!;
        
        const warning: WarningRecord = {
            id: this.generateId(),
            userId: targetUserId,
            username: targetUsername,
            adminId,
            adminUsername: admin.username,
            reason,
            issuedAt: Date.now(),
            acknowledged: false
        };

        // 存储警告记录
        if (!this.warnings.has(targetUserId)) {
            this.warnings.set(targetUserId, []);
        }
        this.warnings.get(targetUserId)!.push(warning);

        // 检查是否需要自动封禁
        const userWarnings = this.warnings.get(targetUserId)!;
        if (userWarnings.length >= this.config.maxWarningsBeforeAutoBan) {
            await this.banUser(
                targetUserId, 
                targetUsername,
                adminId, 
                `Too many warnings (${userWarnings.length})`,
                this.config.defaultBanDuration
            );
        }

        // 记录操作
        const actionRecord = this.createActionRecord({
            actionType: 'warn',
            adminId,
            adminUsername: admin.username,
            targetUserId,
            targetUsername,
            reason,
            details: { warningId: warning.id, totalWarnings: userWarnings.length },
            success: true
        });

        this.emit('admin:user:warned', warning);
        this.logger.info(`管理员 ${admin.username} 警告用户: ${targetUsername}, 原因: ${reason}`);

        return warning;
    }

    /**
     * 检查用户是否被封禁
     */
    isUserBanned(userId: string): boolean {
        const banRecord = this.banRecords.get(userId);
        if (!banRecord) {
            return false;
        }

        // 检查是否过期
        if (banRecord.expiresAt && Date.now() > banRecord.expiresAt) {
            this.banRecords.delete(userId);
            return false;
        }

        return true;
    }

    /**
     * 检查用户是否被禁言
     */
    isUserMuted(userId: string): boolean {
        const muteRecord = this.muteRecords.get(userId);
        if (!muteRecord) {
            return false;
        }

        // 检查是否过期
        if (muteRecord.expiresAt && Date.now() > muteRecord.expiresAt) {
            this.muteRecords.delete(userId);
            return false;
        }

        return true;
    }

    /**
     * 获取用户警告记录
     */
    getUserWarnings(userId: string): WarningRecord[] {
        return this.warnings.get(userId) || [];
    }

    /**
     * 获取用户封禁记录
     */
    getUserBanRecord(userId: string): BanRecord | null {
        return this.banRecords.get(userId) || null;
    }

    /**
     * 获取用户禁言记录
     */
    getUserMuteRecord(userId: string): MuteRecord | null {
        return this.muteRecords.get(userId) || null;
    }

    /**
     * 创建操作记录
     */
    private createActionRecord(data: Omit<AdminActionRecord, 'id' | 'timestamp'>): AdminActionRecord {
        const record: AdminActionRecord = {
            id: this.generateId(),
            timestamp: Date.now(),
            ...data
        };

        if (this.config.enableActionLogging) {
            this.actionRecords.push(record);
            
            // 限制记录数量
            if (this.actionRecords.length > 10000) {
                this.actionRecords = this.actionRecords.slice(-5000);
            }
        }

        this.emit('admin:action', record);
        return record;
    }

    /**
     * 生成唯一ID
     */
    private generateId(): string {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 启动清理定时器
     */
    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpiredRecords();
        }, 10 * 60 * 1000); // 每10分钟清理一次
    }

    /**
     * 清理过期记录
     */
    private cleanupExpiredRecords(): void {
        const now = Date.now();

        // 清理过期的封禁记录
        for (const [userId, banRecord] of this.banRecords.entries()) {
            if (banRecord.expiresAt && now > banRecord.expiresAt) {
                this.banRecords.delete(userId);
                this.logger.info(`自动解封过期用户: ${banRecord.username}`);
            }
        }

        // 清理过期的禁言记录
        for (const [userId, muteRecord] of this.muteRecords.entries()) {
            if (muteRecord.expiresAt && now > muteRecord.expiresAt) {
                this.muteRecords.delete(userId);
                this.logger.info(`自动解除过期禁言: ${muteRecord.username}`);
            }
        }

        // 清理过期的操作记录
        const retentionTime = this.config.recordRetentionTime;
        this.actionRecords = this.actionRecords.filter(
            record => now - record.timestamp <= retentionTime
        );
    }

    /**
     * 销毁管理器
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.logger.info('管理员管理器已销毁');
    }
}