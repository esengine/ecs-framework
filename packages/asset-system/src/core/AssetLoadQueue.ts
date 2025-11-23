/**
 * Priority-based asset loading queue
 * 基于优先级的资产加载队列
 */

import { AssetGUID, IAssetLoadOptions } from '../types/AssetTypes';
import { IAssetLoadQueue } from '../interfaces/IAssetManager';

/**
 * Queue item
 * 队列项
 */
interface QueueItem {
    guid: AssetGUID;
    priority: number;
    options?: IAssetLoadOptions;
    timestamp: number;
}

/**
 * Asset load queue implementation
 * 资产加载队列实现
 */
export class AssetLoadQueue implements IAssetLoadQueue {
    private readonly _queue: QueueItem[] = [];
    private readonly _guidToIndex = new Map<AssetGUID, number>();

    /**
     * Add to queue
     * 添加到队列
     */
    enqueue(guid: AssetGUID, priority: number, options?: IAssetLoadOptions): void {
        // 检查是否已在队列中 / Check if already in queue
        if (this._guidToIndex.has(guid)) {
            this.reprioritize(guid, priority);
            return;
        }

        const item: QueueItem = {
            guid,
            priority,
            options,
            timestamp: Date.now()
        };

        // 二分查找插入位置 / Binary search for insertion position
        const index = this.findInsertIndex(priority);
        this._queue.splice(index, 0, item);

        // 更新索引映射 / Update index mapping
        this.updateIndices(index);
    }

    /**
     * Remove from queue
     * 从队列移除
     */
    dequeue(): { guid: AssetGUID; options?: IAssetLoadOptions } | null {
        if (this._queue.length === 0) return null;

        const item = this._queue.shift();
        if (!item) return null;

        // 更新索引映射 / Update index mapping
        this._guidToIndex.delete(item.guid);
        this.updateIndices(0);

        return {
            guid: item.guid,
            options: item.options
        };
    }

    /**
     * Check if queue is empty
     * 检查队列是否为空
     */
    isEmpty(): boolean {
        return this._queue.length === 0;
    }

    /**
     * Get queue size
     * 获取队列大小
     */
    getSize(): number {
        return this._queue.length;
    }

    /**
     * Clear queue
     * 清空队列
     */
    clear(): void {
        this._queue.length = 0;
        this._guidToIndex.clear();
    }

    /**
     * Reprioritize item
     * 重新设置优先级
     */
    reprioritize(guid: AssetGUID, newPriority: number): void {
        const index = this._guidToIndex.get(guid);
        if (index === undefined) return;

        const item = this._queue[index];
        if (!item || item.priority === newPriority) return;

        // 移除旧项 / Remove old item
        this._queue.splice(index, 1);
        this._guidToIndex.delete(guid);

        // 重新插入 / Reinsert with new priority
        item.priority = newPriority;
        const newIndex = this.findInsertIndex(newPriority);
        this._queue.splice(newIndex, 0, item);

        // 更新索引 / Update indices
        this.updateIndices(Math.min(index, newIndex));
    }

    /**
     * Find insertion index for priority
     * 查找优先级的插入索引
     */
    private findInsertIndex(priority: number): number {
        let left = 0;
        let right = this._queue.length;

        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            // 高优先级在前 / Higher priority first
            if (this._queue[mid].priority >= priority) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }

        return left;
    }

    /**
     * Update indices after modification
     * 修改后更新索引
     */
    private updateIndices(startIndex: number): void {
        for (let i = startIndex; i < this._queue.length; i++) {
            this._guidToIndex.set(this._queue[i].guid, i);
        }
    }

    /**
     * Get queue items (for debugging)
     * 获取队列项（用于调试）
     */
    getItems(): ReadonlyArray<{
        guid: AssetGUID;
        priority: number;
        waitTime: number;
    }> {
        const now = Date.now();
        return this._queue.map((item) => ({
            guid: item.guid,
            priority: item.priority,
            waitTime: now - item.timestamp
        }));
    }

    /**
     * Remove specific item from queue
     * 从队列中移除特定项
     */
    remove(guid: AssetGUID): boolean {
        const index = this._guidToIndex.get(guid);
        if (index === undefined) return false;

        this._queue.splice(index, 1);
        this._guidToIndex.delete(guid);
        this.updateIndices(index);

        return true;
    }

    /**
     * Check if guid is in queue
     * 检查guid是否在队列中
     */
    contains(guid: AssetGUID): boolean {
        return this._guidToIndex.has(guid);
    }
}
