

/**
 * ECS事件类型枚举
 * 定义实体组件系统中的所有事件类型
 */
export enum ECSEventType {
    // 实体相关事件
    ENTITY_CREATED = 'entity:created',
    ENTITY_DESTROYED = 'entity:destroyed',
    ENTITY_ENABLED = 'entity:enabled',
    ENTITY_DISABLED = 'entity:disabled',
    ENTITY_TAG_ADDED = 'entity:tag:added',
    ENTITY_TAG_REMOVED = 'entity:tag:removed',
    ENTITY_NAME_CHANGED = 'entity:name:changed',

    // 组件相关事件
    COMPONENT_ADDED = 'component:added',
    COMPONENT_REMOVED = 'component:removed',
    COMPONENT_MODIFIED = 'component:modified',
    COMPONENT_ENABLED = 'component:enabled',
    COMPONENT_DISABLED = 'component:disabled',

    // 系统相关事件
    SYSTEM_ADDED = 'system:added',
    SYSTEM_REMOVED = 'system:removed',
    SYSTEM_ENABLED = 'system:enabled',
    SYSTEM_DISABLED = 'system:disabled',
    SYSTEM_PROCESSING_START = 'system:processing:start',
    SYSTEM_PROCESSING_END = 'system:processing:end',
    SYSTEM_ERROR = 'system:error',

    // 场景相关事件
    SCENE_CREATED = 'scene:created',
    SCENE_DESTROYED = 'scene:destroyed',
    SCENE_ACTIVATED = 'scene:activated',
    SCENE_DEACTIVATED = 'scene:deactivated',
    SCENE_PAUSED = 'scene:paused',
    SCENE_RESUMED = 'scene:resumed',

    // 查询相关事件
    QUERY_EXECUTED = 'query:executed',
    QUERY_CACHE_HIT = 'query:cache:hit',
    QUERY_CACHE_MISS = 'query:cache:miss',
    QUERY_OPTIMIZED = 'query:optimized',

    // 性能相关事件
    PERFORMANCE_WARNING = 'performance:warning',
    PERFORMANCE_CRITICAL = 'performance:critical',
    MEMORY_USAGE_HIGH = 'memory:usage:high',
    FRAME_RATE_DROP = 'frame:rate:drop',

    // 索引相关事件
    INDEX_CREATED = 'index:created',
    INDEX_UPDATED = 'index:updated',
    INDEX_OPTIMIZED = 'index:optimized',

    // Archetype相关事件
    ARCHETYPE_CREATED = 'archetype:created',
    ARCHETYPE_ENTITY_ADDED = 'archetype:entity:added',
    ARCHETYPE_ENTITY_REMOVED = 'archetype:entity:removed',

    // 脏标记相关事件
    DIRTY_MARK_ADDED = 'dirty:mark:added',
    DIRTY_BATCH_PROCESSED = 'dirty:batch:processed',

    // 错误和警告事件
    ERROR_OCCURRED = 'error:occurred',
    WARNING_ISSUED = 'warning:issued',

    // 生命周期事件
    FRAMEWORK_INITIALIZED = 'framework:initialized',
    FRAMEWORK_SHUTDOWN = 'framework:shutdown',

    // 调试相关事件
    DEBUG_INFO = 'debug:info',
    DEBUG_STATS_UPDATED = 'debug:stats:updated'
}

/**
 * 事件优先级枚举
 * 定义事件处理的优先级级别
 */
export enum EventPriority {
    LOWEST = 0,
    LOW = 25,
    NORMAL = 50,
    HIGH = 75,
    HIGHEST = 100,
    CRITICAL = 200
}

/**
 * 预定义的事件类型常量
 * 提供类型安全的事件类型字符串
 */
export const EVENT_TYPES = {
    // 实体事件
    ENTITY: {
        CREATED: ECSEventType.ENTITY_CREATED,
        DESTROYED: ECSEventType.ENTITY_DESTROYED,
        ENABLED: ECSEventType.ENTITY_ENABLED,
        DISABLED: ECSEventType.ENTITY_DISABLED,
        TAG_ADDED: ECSEventType.ENTITY_TAG_ADDED,
        TAG_REMOVED: ECSEventType.ENTITY_TAG_REMOVED,
        NAME_CHANGED: ECSEventType.ENTITY_NAME_CHANGED
    },

    // 组件事件
    COMPONENT: {
        ADDED: ECSEventType.COMPONENT_ADDED,
        REMOVED: ECSEventType.COMPONENT_REMOVED,
        MODIFIED: ECSEventType.COMPONENT_MODIFIED,
        ENABLED: ECSEventType.COMPONENT_ENABLED,
        DISABLED: ECSEventType.COMPONENT_DISABLED
    },

    // 系统事件
    SYSTEM: {
        ADDED: ECSEventType.SYSTEM_ADDED,
        REMOVED: ECSEventType.SYSTEM_REMOVED,
        ENABLED: ECSEventType.SYSTEM_ENABLED,
        DISABLED: ECSEventType.SYSTEM_DISABLED,
        PROCESSING_START: ECSEventType.SYSTEM_PROCESSING_START,
        PROCESSING_END: ECSEventType.SYSTEM_PROCESSING_END,
        ERROR: ECSEventType.SYSTEM_ERROR
    },

    // 性能事件
    PERFORMANCE: {
        WARNING: ECSEventType.PERFORMANCE_WARNING,
        CRITICAL: ECSEventType.PERFORMANCE_CRITICAL,
        MEMORY_HIGH: ECSEventType.MEMORY_USAGE_HIGH,
        FRAME_DROP: ECSEventType.FRAME_RATE_DROP
    }
} as const;

/**
 * 事件类型验证器
 * 验证事件类型是否有效
 */
export class EventTypeValidator {
    private static validTypes = new Set<string>([
        ...Object.values(ECSEventType),
        ...Object.values(EVENT_TYPES.ENTITY),
        ...Object.values(EVENT_TYPES.COMPONENT),
        ...Object.values(EVENT_TYPES.SYSTEM),
        ...Object.values(EVENT_TYPES.PERFORMANCE)
    ]);

    /**
     * 验证事件类型是否有效
     * @param eventType 事件类型
     * @returns 是否有效
     */
    public static isValid(eventType: string): boolean {
        return this.validTypes.has(eventType);
    }

    /**
     * 获取所有有效的事件类型
     * @returns 事件类型数组
     */
    public static getAllValidTypes(): string[] {
        return Array.from(this.validTypes);
    }

    /**
     * 添加自定义事件类型
     * @param eventType 事件类型
     */
    public static addCustomType(eventType: string): void {
        this.validTypes.add(eventType);
    }

    /**
     * 移除自定义事件类型
     * @param eventType 事件类型
     */
    public static removeCustomType(eventType: string): void {
        this.validTypes.delete(eventType);
    }
}
