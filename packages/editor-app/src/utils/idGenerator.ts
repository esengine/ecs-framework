/**
 * ID Generator Utility
 * 提供安全可靠的ID生成机制
 */

/**
 * Generates unique sequential IDs for textures and other resources
 * 为纹理和其他资源生成唯一的顺序ID
 */
export class IdGenerator {
    private static counters = new Map<string, number>();
    private static usedIds = new Map<string, Set<number>>();

    /**
     * Generate next sequential ID for a given namespace
     * 为给定的命名空间生成下一个顺序ID
     */
    static nextId(namespace: string): number {
        const current = this.counters.get(namespace) || 1000;
        const next = current + 1;
        this.counters.set(namespace, next);

        // Track used IDs
        if (!this.usedIds.has(namespace)) {
            this.usedIds.set(namespace, new Set());
        }
        this.usedIds.get(namespace)!.add(next);

        return next;
    }

    /**
     * Generate UUID v4
     * 生成 UUID v4
     */
    static uuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Check if ID is already used
     * 检查ID是否已被使用
     */
    static isUsed(namespace: string, id: number): boolean {
        return this.usedIds.get(namespace)?.has(id) || false;
    }

    /**
     * Reserve a specific ID
     * 保留特定的ID
     */
    static reserve(namespace: string, id: number): void {
        if (!this.usedIds.has(namespace)) {
            this.usedIds.set(namespace, new Set());
        }
        this.usedIds.get(namespace)!.add(id);

        // Update counter if needed
        const current = this.counters.get(namespace) || 1000;
        if (id >= current) {
            this.counters.set(namespace, id);
        }
    }

    /**
     * Release an ID for reuse
     * 释放ID以供重用
     */
    static release(namespace: string, id: number): void {
        this.usedIds.get(namespace)?.delete(id);
    }

    /**
     * Reset a namespace
     * 重置命名空间
     */
    static reset(namespace: string): void {
        this.counters.delete(namespace);
        this.usedIds.delete(namespace);
    }

    /**
     * Get statistics for a namespace
     * 获取命名空间的统计信息
     */
    static getStats(namespace: string): { nextId: number; usedCount: number } {
        return {
            nextId: (this.counters.get(namespace) || 1000) + 1,
            usedCount: this.usedIds.get(namespace)?.size || 0
        };
    }
}
