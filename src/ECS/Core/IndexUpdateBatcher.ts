import { Entity } from '../Entity';

/**
 * 索引更新操作类型
 */
export enum IndexUpdateType {
    ADD_ENTITY = 'add_entity',
    REMOVE_ENTITY = 'remove_entity',
    UPDATE_ENTITY = 'update_entity'
}

/**
 * 索引更新操作
 */
export interface IndexUpdateOperation {
    type: IndexUpdateType;
    entity: Entity;
    oldMask?: bigint;
    newMask?: bigint;
}

/**
 * 延迟索引更新器，用于批量更新查询索引以提高性能
 */
export class IndexUpdateBatcher {
    private pendingOperations: IndexUpdateOperation[] = [];
    private isProcessing = false;
    private batchSize = 1000;
    private flushTimeout: NodeJS.Timeout | null = null;
    private flushDelay = 16; // 16ms，约60fps

    /**
     * 添加索引更新操作
     */
    addOperation(operation: IndexUpdateOperation): void {
        this.pendingOperations.push(operation);
        
        // 如果达到批量大小，立即处理
        if (this.pendingOperations.length >= this.batchSize) {
            this.flush();
        } else {
            // 否则延迟处理
            this.scheduleFlush();
        }
    }

    /**
     * 批量添加实体
     */
    addEntities(entities: Entity[]): void {
        for (const entity of entities) {
            this.pendingOperations.push({
                type: IndexUpdateType.ADD_ENTITY,
                entity
            });
        }
        
        if (this.pendingOperations.length >= this.batchSize) {
            this.flush();
        } else {
            this.scheduleFlush();
        }
    }

    /**
     * 批量移除实体
     */
    removeEntities(entities: Entity[]): void {
        for (const entity of entities) {
            this.pendingOperations.push({
                type: IndexUpdateType.REMOVE_ENTITY,
                entity
            });
        }
        
        if (this.pendingOperations.length >= this.batchSize) {
            this.flush();
        } else {
            this.scheduleFlush();
        }
    }

    /**
     * 批量更新实体
     */
    updateEntities(updates: Array<{ entity: Entity; oldMask: bigint; newMask: bigint }>): void {
        for (const update of updates) {
            this.pendingOperations.push({
                type: IndexUpdateType.UPDATE_ENTITY,
                entity: update.entity,
                oldMask: update.oldMask,
                newMask: update.newMask
            });
        }
        
        if (this.pendingOperations.length >= this.batchSize) {
            this.flush();
        } else {
            this.scheduleFlush();
        }
    }

    /**
     * 安排延迟刷新
     */
    private scheduleFlush(): void {
        if (this.flushTimeout) {
            return;
        }
        
        this.flushTimeout = setTimeout(() => {
            this.flush();
        }, this.flushDelay);
    }

    /**
     * 立即处理所有待处理的操作
     */
    flush(): void {
        if (this.isProcessing || this.pendingOperations.length === 0) {
            return;
        }

        this.isProcessing = true;
        
        if (this.flushTimeout) {
            clearTimeout(this.flushTimeout);
            this.flushTimeout = null;
        }

        try {
            this.processBatch();
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 处理批量操作
     */
    private processBatch(): void {
        const operations = this.pendingOperations;
        this.pendingOperations = [];

        // 按操作类型分组以优化处理
        const addOperations: Entity[] = [];
        const removeOperations: Entity[] = [];
        const updateOperations: Array<{ entity: Entity; oldMask: bigint; newMask: bigint }> = [];

        for (const operation of operations) {
            switch (operation.type) {
                case IndexUpdateType.ADD_ENTITY:
                    addOperations.push(operation.entity);
                    break;
                case IndexUpdateType.REMOVE_ENTITY:
                    removeOperations.push(operation.entity);
                    break;
                case IndexUpdateType.UPDATE_ENTITY:
                    if (operation.oldMask !== undefined && operation.newMask !== undefined) {
                        updateOperations.push({
                            entity: operation.entity,
                            oldMask: operation.oldMask,
                            newMask: operation.newMask
                        });
                    }
                    break;
            }
        }

        // 批量处理每种类型的操作
        if (addOperations.length > 0) {
            this.processBatchAdd(addOperations);
        }
        
        if (removeOperations.length > 0) {
            this.processBatchRemove(removeOperations);
        }
        
        if (updateOperations.length > 0) {
            this.processBatchUpdate(updateOperations);
        }
    }

    /**
     * 批量处理添加操作
     */
    private processBatchAdd(entities: Entity[]): void {
        // 这里应该调用QuerySystem的批量添加方法
        // 由于需要访问QuerySystem，这个方法应该由外部注入处理函数
        if (this.onBatchAdd) {
            this.onBatchAdd(entities);
        }
    }

    /**
     * 批量处理移除操作
     */
    private processBatchRemove(entities: Entity[]): void {
        if (this.onBatchRemove) {
            this.onBatchRemove(entities);
        }
    }

    /**
     * 批量处理更新操作
     */
    private processBatchUpdate(updates: Array<{ entity: Entity; oldMask: bigint; newMask: bigint }>): void {
        if (this.onBatchUpdate) {
            this.onBatchUpdate(updates);
        }
    }

    /**
     * 设置批量大小
     */
    setBatchSize(size: number): void {
        this.batchSize = Math.max(1, size);
    }

    /**
     * 设置刷新延迟
     */
    setFlushDelay(delay: number): void {
        this.flushDelay = Math.max(0, delay);
    }

    /**
     * 获取待处理操作数量
     */
    getPendingCount(): number {
        return this.pendingOperations.length;
    }

    /**
     * 清空所有待处理操作
     */
    clear(): void {
        this.pendingOperations.length = 0;
        if (this.flushTimeout) {
            clearTimeout(this.flushTimeout);
            this.flushTimeout = null;
        }
    }

    /**
     * 检查是否有待处理操作
     */
    hasPendingOperations(): boolean {
        return this.pendingOperations.length > 0;
    }

    // 回调函数，由外部设置
    public onBatchAdd?: (entities: Entity[]) => void;
    public onBatchRemove?: (entities: Entity[]) => void;
    public onBatchUpdate?: (updates: Array<{ entity: Entity; oldMask: bigint; newMask: bigint }>) => void;
} 