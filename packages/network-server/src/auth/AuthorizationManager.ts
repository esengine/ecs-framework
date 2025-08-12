/**
 * 权限管理器
 * 
 * 处理用户权限、角色管理、访问控制等功能
 */

import { EventEmitter } from 'events';
import { NetworkValue } from '@esengine/ecs-framework-network-shared';
import { UserInfo } from './AuthenticationManager';

/**
 * 权限类型
 */
export type Permission = string;

/**
 * 角色定义
 */
export interface Role {
  /** 角色ID */
  id: string;
  /** 角色名称 */
  name: string;
  /** 角色描述 */
  description?: string;
  /** 权限列表 */
  permissions: Permission[];
  /** 父角色ID */
  parentRoleId?: string;
  /** 是否系统角色 */
  isSystemRole: boolean;
  /** 角色元数据 */
  metadata: Record<string, NetworkValue>;
  /** 创建时间 */
  createdAt: Date;
}

/**
 * 权限检查上下文
 */
export interface PermissionContext {
  /** 用户ID */
  userId: string;
  /** 用户角色 */
  userRoles: string[];
  /** 请求的权限 */
  permission: Permission;
  /** 资源ID（可选） */
  resourceId?: string;
  /** 附加上下文数据 */
  context?: Record<string, NetworkValue>;
}

/**
 * 权限检查结果
 */
export interface PermissionResult {
  /** 是否允许 */
  granted: boolean;
  /** 原因 */
  reason?: string;
  /** 匹配的角色 */
  matchingRole?: string;
  /** 使用的权限 */
  usedPermission?: Permission;
}

/**
 * 权限管理器配置
 */
export interface AuthorizationConfig {
  /** 是否启用权限继承 */
  enableInheritance?: boolean;
  /** 是否启用权限缓存 */
  enableCache?: boolean;
  /** 缓存过期时间(毫秒) */
  cacheExpirationTime?: number;
  /** 默认权限策略 */
  defaultPolicy?: 'deny' | 'allow';
}

/**
 * 权限管理器事件
 */
export interface AuthorizationEvents {
  /** 权限被授予 */
  'permission-granted': (context: PermissionContext, result: PermissionResult) => void;
  /** 权限被拒绝 */
  'permission-denied': (context: PermissionContext, result: PermissionResult) => void;
  /** 角色创建 */
  'role-created': (role: Role) => void;
  /** 角色更新 */
  'role-updated': (roleId: string, updates: Partial<Role>) => void;
  /** 角色删除 */
  'role-deleted': (roleId: string) => void;
  /** 权限错误 */
  'authorization-error': (error: Error, context?: PermissionContext) => void;
}

/**
 * 权限缓存项
 */
interface CacheItem {
  result: PermissionResult;
  expiresAt: Date;
}

/**
 * 预定义权限
 */
export const Permissions = {
  // 系统权限
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_CONFIG: 'system:config',
  
  // 用户管理权限
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ROLES: 'user:manage-roles',
  
  // 房间权限
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_MANAGE: 'room:manage',
  ROOM_KICK_PLAYERS: 'room:kick-players',
  
  // 网络权限
  NETWORK_SEND_RPC: 'network:send-rpc',
  NETWORK_SYNC_VARS: 'network:sync-vars',
  NETWORK_BROADCAST: 'network:broadcast',
  
  // 聊天权限
  CHAT_SEND: 'chat:send',
  CHAT_MODERATE: 'chat:moderate',
  CHAT_PRIVATE: 'chat:private',
  
  // 文件权限
  FILE_UPLOAD: 'file:upload',
  FILE_DOWNLOAD: 'file:download',
  FILE_DELETE: 'file:delete'
} as const;

/**
 * 预定义角色
 */
export const SystemRoles = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
  GUEST: 'guest'
} as const;

/**
 * 权限管理器
 */
export class AuthorizationManager extends EventEmitter {
  private config: AuthorizationConfig;
  private roles = new Map<string, Role>();
  private permissionCache = new Map<string, CacheItem>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: AuthorizationConfig = {}) {
    super();
    
    this.config = {
      enableInheritance: true,
      enableCache: true,
      cacheExpirationTime: 5 * 60 * 1000, // 5分钟
      defaultPolicy: 'deny',
      ...config
    };

    this.initialize();
  }

  /**
   * 创建角色
   */
  async createRole(roleData: {
    id: string;
    name: string;
    description?: string;
    permissions: Permission[];
    parentRoleId?: string;
    metadata?: Record<string, NetworkValue>;
  }): Promise<Role> {
    const { id, name, description, permissions, parentRoleId, metadata = {} } = roleData;

    if (this.roles.has(id)) {
      throw new Error(`Role with id "${id}" already exists`);
    }

    // 验证父角色是否存在
    if (parentRoleId && !this.roles.has(parentRoleId)) {
      throw new Error(`Parent role "${parentRoleId}" not found`);
    }

    const role: Role = {
      id,
      name,
      description,
      permissions: [...permissions],
      parentRoleId,
      isSystemRole: false,
      metadata,
      createdAt: new Date()
    };

    this.roles.set(id, role);
    this.clearPermissionCache(); // 清除缓存
    
    console.log(`Role created: ${name} (${id})`);
    this.emit('role-created', role);
    
    return role;
  }

  /**
   * 获取角色
   */
  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  /**
   * 获取所有角色
   */
  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * 更新角色
   */
  async updateRole(roleId: string, updates: Partial<Role>): Promise<boolean> {
    const role = this.roles.get(roleId);
    if (!role) {
      return false;
    }

    // 系统角色不允许修改某些字段
    if (role.isSystemRole) {
      const { permissions, parentRoleId, ...allowedUpdates } = updates;
      Object.assign(role, allowedUpdates);
    } else {
      // 不允许更新某些字段
      const { id, createdAt, isSystemRole, ...allowedUpdates } = updates as any;
      Object.assign(role, allowedUpdates);
    }

    this.clearPermissionCache(); // 清除缓存
    
    console.log(`Role updated: ${role.name} (${roleId})`);
    this.emit('role-updated', roleId, updates);
    
    return true;
  }

  /**
   * 删除角色
   */
  async deleteRole(roleId: string): Promise<boolean> {
    const role = this.roles.get(roleId);
    if (!role) {
      return false;
    }

    if (role.isSystemRole) {
      throw new Error('Cannot delete system role');
    }

    // 检查是否有子角色依赖此角色
    const childRoles = Array.from(this.roles.values())
      .filter(r => r.parentRoleId === roleId);
    
    if (childRoles.length > 0) {
      throw new Error(`Cannot delete role "${roleId}": ${childRoles.length} child roles depend on it`);
    }

    this.roles.delete(roleId);
    this.clearPermissionCache(); // 清除缓存
    
    console.log(`Role deleted: ${role.name} (${roleId})`);
    this.emit('role-deleted', roleId);
    
    return true;
  }

  /**
   * 检查权限
   */
  async checkPermission(context: PermissionContext): Promise<PermissionResult> {
    try {
      // 检查缓存
      const cacheKey = this.getCacheKey(context);
      if (this.config.enableCache) {
        const cached = this.permissionCache.get(cacheKey);
        if (cached && cached.expiresAt > new Date()) {
          return cached.result;
        }
      }

      const result = await this.performPermissionCheck(context);

      // 缓存结果
      if (this.config.enableCache) {
        const expiresAt = new Date(Date.now() + this.config.cacheExpirationTime!);
        this.permissionCache.set(cacheKey, { result, expiresAt });
      }

      // 触发事件
      if (result.granted) {
        this.emit('permission-granted', context, result);
      } else {
        this.emit('permission-denied', context, result);
      }

      return result;

    } catch (error) {
      this.emit('authorization-error', error as Error, context);
      
      return {
        granted: this.config.defaultPolicy === 'allow',
        reason: `Authorization error: ${(error as Error).message}`
      };
    }
  }

  /**
   * 检查用户是否有权限
   */
  async hasPermission(user: UserInfo, permission: Permission, resourceId?: string): Promise<boolean> {
    const context: PermissionContext = {
      userId: user.id,
      userRoles: user.roles,
      permission,
      resourceId
    };

    const result = await this.checkPermission(context);
    return result.granted;
  }

  /**
   * 获取用户的所有权限
   */
  async getUserPermissions(user: UserInfo): Promise<Permission[]> {
    const permissions = new Set<Permission>();

    for (const roleId of user.roles) {
      const rolePermissions = await this.getRolePermissions(roleId);
      rolePermissions.forEach(p => permissions.add(p));
    }

    return Array.from(permissions);
  }

  /**
   * 获取角色的所有权限（包括继承的权限）
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const permissions = new Set<Permission>();
    const visited = new Set<string>();

    const collectPermissions = (currentRoleId: string) => {
      if (visited.has(currentRoleId)) {
        return; // 防止循环引用
      }
      visited.add(currentRoleId);

      const role = this.roles.get(currentRoleId);
      if (!role) {
        return;
      }

      // 添加当前角色的权限
      role.permissions.forEach(p => permissions.add(p));

      // 递归添加父角色的权限
      if (this.config.enableInheritance && role.parentRoleId) {
        collectPermissions(role.parentRoleId);
      }
    };

    collectPermissions(roleId);
    return Array.from(permissions);
  }

  /**
   * 为角色添加权限
   */
  async addPermissionToRole(roleId: string, permission: Permission): Promise<boolean> {
    const role = this.roles.get(roleId);
    if (!role) {
      return false;
    }

    if (!role.permissions.includes(permission)) {
      role.permissions.push(permission);
      this.clearPermissionCache();
      console.log(`Permission "${permission}" added to role "${roleId}"`);
    }

    return true;
  }

  /**
   * 从角色移除权限
   */
  async removePermissionFromRole(roleId: string, permission: Permission): Promise<boolean> {
    const role = this.roles.get(roleId);
    if (!role) {
      return false;
    }

    const index = role.permissions.indexOf(permission);
    if (index !== -1) {
      role.permissions.splice(index, 1);
      this.clearPermissionCache();
      console.log(`Permission "${permission}" removed from role "${roleId}"`);
    }

    return true;
  }

  /**
   * 检查用户是否有指定角色
   */
  hasRole(user: UserInfo, roleId: string): boolean {
    return user.roles.includes(roleId);
  }

  /**
   * 为用户添加角色
   */
  async addRoleToUser(user: UserInfo, roleId: string): Promise<boolean> {
    if (!this.roles.has(roleId)) {
      return false;
    }

    if (!user.roles.includes(roleId)) {
      user.roles.push(roleId);
      this.clearUserPermissionCache(user.id);
      console.log(`Role "${roleId}" added to user "${user.id}"`);
    }

    return true;
  }

  /**
   * 从用户移除角色
   */
  async removeRoleFromUser(user: UserInfo, roleId: string): Promise<boolean> {
    const index = user.roles.indexOf(roleId);
    if (index !== -1) {
      user.roles.splice(index, 1);
      this.clearUserPermissionCache(user.id);
      console.log(`Role "${roleId}" removed from user "${user.id}"`);
      return true;
    }

    return false;
  }

  /**
   * 清除权限缓存
   */
  clearPermissionCache(): void {
    this.permissionCache.clear();
  }

  /**
   * 清除指定用户的权限缓存
   */
  clearUserPermissionCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.permissionCache) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.permissionCache.delete(key));
  }

  /**
   * 销毁权限管理器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.roles.clear();
    this.permissionCache.clear();
    this.removeAllListeners();
  }

  /**
   * 初始化
   */
  private initialize(): void {
    // 创建系统角色
    this.createSystemRoles();

    // 启动缓存清理定时器（每30分钟清理一次）
    if (this.config.enableCache) {
      this.cleanupTimer = setInterval(() => {
        this.cleanupCache();
      }, 30 * 60 * 1000);
    }
  }

  /**
   * 创建系统角色
   */
  private createSystemRoles(): void {
    // 管理员角色
    const adminRole: Role = {
      id: SystemRoles.ADMIN,
      name: 'Administrator',
      description: 'Full system access',
      permissions: Object.values(Permissions),
      isSystemRole: true,
      metadata: {},
      createdAt: new Date()
    };

    // 版主角色
    const moderatorRole: Role = {
      id: SystemRoles.MODERATOR,
      name: 'Moderator',
      description: 'Room and user management',
      permissions: [
        Permissions.USER_READ,
        Permissions.ROOM_CREATE,
        Permissions.ROOM_JOIN,
        Permissions.ROOM_MANAGE,
        Permissions.ROOM_KICK_PLAYERS,
        Permissions.NETWORK_SEND_RPC,
        Permissions.NETWORK_SYNC_VARS,
        Permissions.CHAT_SEND,
        Permissions.CHAT_MODERATE,
        Permissions.CHAT_PRIVATE
      ],
      parentRoleId: SystemRoles.USER,
      isSystemRole: true,
      metadata: {},
      createdAt: new Date()
    };

    // 普通用户角色
    const userRole: Role = {
      id: SystemRoles.USER,
      name: 'User',
      description: 'Basic user permissions',
      permissions: [
        Permissions.ROOM_JOIN,
        Permissions.ROOM_LEAVE,
        Permissions.NETWORK_SEND_RPC,
        Permissions.NETWORK_SYNC_VARS,
        Permissions.CHAT_SEND,
        Permissions.FILE_DOWNLOAD
      ],
      parentRoleId: SystemRoles.GUEST,
      isSystemRole: true,
      metadata: {},
      createdAt: new Date()
    };

    // 访客角色
    const guestRole: Role = {
      id: SystemRoles.GUEST,
      name: 'Guest',
      description: 'Limited access for guests',
      permissions: [
        Permissions.ROOM_JOIN
      ],
      isSystemRole: true,
      metadata: {},
      createdAt: new Date()
    };

    this.roles.set(adminRole.id, adminRole);
    this.roles.set(moderatorRole.id, moderatorRole);
    this.roles.set(userRole.id, userRole);
    this.roles.set(guestRole.id, guestRole);

    console.log('System roles created');
  }

  /**
   * 执行权限检查
   */
  private async performPermissionCheck(context: PermissionContext): Promise<PermissionResult> {
    // 获取用户的所有角色权限
    const userPermissions = new Set<Permission>();
    
    for (const roleId of context.userRoles) {
      const rolePermissions = await this.getRolePermissions(roleId);
      rolePermissions.forEach(p => userPermissions.add(p));
    }

    // 直接权限匹配
    if (userPermissions.has(context.permission)) {
      return {
        granted: true,
        reason: 'Direct permission match',
        usedPermission: context.permission
      };
    }

    // 通配符权限匹配
    const wildcardPermissions = Array.from(userPermissions)
      .filter(p => p.endsWith('*'));

    for (const wildcardPerm of wildcardPermissions) {
      const prefix = wildcardPerm.slice(0, -1);
      if (context.permission.startsWith(prefix)) {
        return {
          granted: true,
          reason: 'Wildcard permission match',
          usedPermission: wildcardPerm
        };
      }
    }

    // 如果没有匹配的权限
    return {
      granted: this.config.defaultPolicy === 'allow',
      reason: this.config.defaultPolicy === 'allow' 
        ? 'Default allow policy' 
        : 'No matching permissions found'
    };
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(context: PermissionContext): string {
    const roleString = context.userRoles.sort().join(',');
    const resourcePart = context.resourceId ? `:${context.resourceId}` : '';
    return `${context.userId}:${roleString}:${context.permission}${resourcePart}`;
  }

  /**
   * 清理过期缓存
   */
  private cleanupCache(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, item] of this.permissionCache.entries()) {
      if (item.expiresAt < now) {
        this.permissionCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Permission cache cleanup: ${cleanedCount} entries removed`);
    }
  }

  /**
   * 类型安全的事件监听
   */
  override on<K extends keyof AuthorizationEvents>(event: K, listener: AuthorizationEvents[K]): this {
    return super.on(event, listener);
  }

  /**
   * 类型安全的事件触发
   */
  override emit<K extends keyof AuthorizationEvents>(event: K, ...args: Parameters<AuthorizationEvents[K]>): boolean {
    return super.emit(event, ...args);
  }
}