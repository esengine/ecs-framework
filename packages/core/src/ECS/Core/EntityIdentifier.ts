/**
 * 复合实体标识符
 * 
 * 用于在序列化时唯一标识跨World和Scene的实体。
 * 保持轻量级设计，只在序列化/反序列化时使用。
 */
export interface CompositeEntityId {
    /** World标识符 */
    readonly worldId: string;
    /** Scene标识符 */
    readonly sceneId: string;
    /** 本地实体ID（IdentifierPool分配的） */
    readonly localId: number;
}

/**
 * 实体标识符工具类
 * 
 * 提供复合标识符的创建、比较和序列化功能。
 */
export class EntityIdentifier {
    /**
     * 创建复合实体标识符
     * 
     * @param worldId World标识符
     * @param sceneId Scene标识符
     * @param localId 本地实体ID
     * @returns 复合实体标识符
     */
    static create(worldId: string, sceneId: string, localId: number): CompositeEntityId {
        return {
            worldId,
            sceneId,
            localId
        };
    }

    /**
     * 将复合标识符转换为字符串键
     * 
     * @param id 复合实体标识符
     * @returns 字符串形式的唯一键
     */
    static toKey(id: CompositeEntityId): string {
        return `${id.worldId}:${id.sceneId}:${id.localId}`;
    }

    /**
     * 从字符串键解析复合标识符
     * 
     * @param key 字符串形式的标识符
     * @returns 复合实体标识符，如果格式无效返回null
     */
    static fromKey(key: string): CompositeEntityId | null {
        const parts = key.split(':');
        if (parts.length !== 3) {
            return null;
        }

        const localId = parseInt(parts[2], 10);
        if (isNaN(localId)) {
            return null;
        }

        return {
            worldId: parts[0],
            sceneId: parts[1],
            localId
        };
    }

    /**
     * 比较两个复合标识符是否相等
     * 
     * @param a 第一个标识符
     * @param b 第二个标识符
     * @returns 是否相等
     */
    static equals(a: CompositeEntityId, b: CompositeEntityId): boolean {
        return a.worldId === b.worldId && 
               a.sceneId === b.sceneId && 
               a.localId === b.localId;
    }

    /**
     * 检查标识符是否有效
     * 
     * @param id 复合实体标识符
     * @returns 是否有效
     */
    static isValid(id: CompositeEntityId): boolean {
        return Boolean(
            id.worldId && 
            id.sceneId && 
            typeof id.localId === 'number' && 
            id.localId > 0
        );
    }

    /**
     * 创建实体位置信息的哈希值
     * 用于快速查找和比较
     * 
     * @param id 复合实体标识符
     * @returns 32位哈希值
     */
    static hash(id: CompositeEntityId): number {
        const key = this.toKey(id);
        let hash = 0;
        
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        return hash;
    }

    /**
     * 批量转换本地ID到复合标识符
     * 
     * @param worldId World标识符
     * @param sceneId Scene标识符
     * @param localIds 本地ID数组
     * @returns 复合标识符数组
     */
    static batchCreate(worldId: string, sceneId: string, localIds: number[]): CompositeEntityId[] {
        return localIds.map(localId => this.create(worldId, sceneId, localId));
    }

    /**
     * 从复合标识符数组中提取本地ID
     * 
     * @param ids 复合标识符数组
     * @returns 本地ID数组
     */
    static extractLocalIds(ids: CompositeEntityId[]): number[] {
        return ids.map(id => id.localId);
    }

    /**
     * 按World和Scene分组复合标识符
     * 
     * @param ids 复合标识符数组
     * @returns 按位置分组的映射
     */
    static groupByLocation(ids: CompositeEntityId[]): Map<string, CompositeEntityId[]> {
        const groups = new Map<string, CompositeEntityId[]>();
        
        for (const id of ids) {
            const locationKey = `${id.worldId}:${id.sceneId}`;
            const group = groups.get(locationKey) || [];
            group.push(id);
            groups.set(locationKey, group);
        }
        
        return groups;
    }
}