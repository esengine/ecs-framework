/**
 * 游戏状态快照系统
 * 用于保存和恢复游戏状态，支持断线重连
 */
import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '../utils/EventEmitter';

/**
 * 实体快照数据
 */
export interface EntitySnapshot {
    id: string;
    name?: string;
    enabled: boolean;
    components: ComponentSnapshot[];
    transform?: {
        position: { x: number; y: number; z?: number };
        rotation: { x?: number; y?: number; z?: number };
        scale: { x?: number; y?: number; z?: number };
    };
    metadata?: Record<string, any>;
}

/**
 * 组件快照数据
 */
export interface ComponentSnapshot {
    type: string;
    enabled: boolean;
    data: Record<string, any>;
    version?: number;
}

/**
 * 场景快照数据
 */
export interface SceneSnapshot {
    id: string;
    name: string;
    entities: EntitySnapshot[];
    systems: string[];
    sceneData: Record<string, any>;
    metadata?: Record<string, any>;
}

/**
 * 世界快照数据
 */
export interface WorldSnapshot {
    id: string;
    name: string;
    scenes: SceneSnapshot[];
    worldData: Record<string, any>;
    metadata?: Record<string, any>;
}

/**
 * 完整游戏状态快照
 */
export interface GameStateSnapshot {
    id: string;
    timestamp: number;
    version: string;
    worlds: WorldSnapshot[];
    players: PlayerSnapshot[];
    gameTime: number;
    gameState: 'lobby' | 'playing' | 'paused' | 'ended';
    globalData: Record<string, any>;
    metadata: {
        creator: string;
        reason: string;
        compressed: boolean;
        size: number;
        checksum?: string;
    };
}

/**
 * 玩家快照数据
 */
export interface PlayerSnapshot {
    playerId: string;
    username: string;
    entityId?: string;
    playerData: Record<string, any>;
    connectionState: 'connected' | 'disconnected' | 'reconnecting';
    lastActiveTime: number;
}

/**
 * 快照配置
 */
export interface SnapshotConfig {
    includeInactiveEntities: boolean;
    includeDisabledComponents: boolean;
    compressData: boolean;
    maxSnapshotSize: number; // 最大快照大小（字节）
    excludeComponentTypes?: string[];
    includeOnlyComponentTypes?: string[];
    customSerializers?: Map<string, ComponentSerializer>;
}

/**
 * 组件序列化器接口
 */
export interface ComponentSerializer {
    serialize(component: any): Record<string, any>;
    deserialize(data: Record<string, any>, component: any): void;
    getVersion(): number;
}

/**
 * 快照差异信息
 */
export interface SnapshotDiff {
    addedEntities: EntitySnapshot[];
    removedEntities: string[];
    modifiedEntities: {
        entityId: string;
        addedComponents: ComponentSnapshot[];
        removedComponents: string[];
        modifiedComponents: ComponentSnapshot[];
    }[];
    modifiedPlayers: PlayerSnapshot[];
    globalDataChanges: Record<string, any>;
}

/**
 * 快照统计信息
 */
export interface SnapshotStats {
    totalSize: number;
    entityCount: number;
    componentCount: number;
    playerCount: number;
    compressionRatio?: number;
    serializationTime: number;
}

/**
 * 状态快照管理器事件
 */
export interface StateSnapshotEvents {
    'snapshot:created': (snapshot: GameStateSnapshot, stats: SnapshotStats) => void;
    'snapshot:restored': (snapshotId: string, success: boolean) => void;
    'snapshot:error': (error: string, context: any) => void;
    'snapshot:size:exceeded': (size: number, maxSize: number) => void;
}

/**
 * 游戏状态快照管理器
 */
export class StateSnapshotManager extends EventEmitter<StateSnapshotEvents> {
    private logger = createLogger('StateSnapshotManager');
    private config: SnapshotConfig;
    private snapshots: Map<string, GameStateSnapshot> = new Map();
    private snapshotHistory: string[] = []; // 快照ID历史记录
    private maxHistorySize: number = 100;

    constructor(config: SnapshotConfig) {
        super();
        this.config = config;
    }

    /**
     * 创建游戏状态快照
     */
    createSnapshot(
        gameState: any,
        reason: string = 'manual',
        creator: string = 'system'
    ): GameStateSnapshot | null {
        const startTime = Date.now();
        
        try {
            const snapshotId = this.generateSnapshotId();
            
            // 序列化游戏状态
            const snapshot: GameStateSnapshot = {
                id: snapshotId,
                timestamp: startTime,
                version: '1.0.0',
                worlds: this.serializeWorlds(gameState.worlds || []),
                players: this.serializePlayers(gameState.players || []),
                gameTime: gameState.gameTime || 0,
                gameState: gameState.gameState || 'lobby',
                globalData: gameState.globalData ? { ...gameState.globalData } : {},
                metadata: {
                    creator,
                    reason,
                    compressed: this.config.compressData,
                    size: 0, // 将在后面计算
                }
            };

            // 计算快照大小
            const snapshotData = JSON.stringify(snapshot);
            const size = new Blob([snapshotData]).size;
            snapshot.metadata.size = size;

            // 检查大小限制
            if (size > this.config.maxSnapshotSize) {
                this.emit('snapshot:size:exceeded', size, this.config.maxSnapshotSize);
                this.logger.warn(`快照大小超限: ${size} > ${this.config.maxSnapshotSize}`);
                return null;
            }

            // 压缩数据（如果启用）
            if (this.config.compressData) {
                // 这里可以实现数据压缩逻辑
                snapshot.metadata.compressed = true;
            }

            // 计算校验和
            snapshot.metadata.checksum = this.calculateChecksum(snapshotData);

            // 存储快照
            this.snapshots.set(snapshotId, snapshot);
            this.snapshotHistory.push(snapshotId);

            // 限制历史记录数量
            if (this.snapshotHistory.length > this.maxHistorySize) {
                const oldSnapshotId = this.snapshotHistory.shift()!;
                this.snapshots.delete(oldSnapshotId);
            }

            const stats: SnapshotStats = {
                totalSize: size,
                entityCount: this.countEntities(snapshot.worlds),
                componentCount: this.countComponents(snapshot.worlds),
                playerCount: snapshot.players.length,
                compressionRatio: this.config.compressData ? 0.7 : 1.0, // 示例值
                serializationTime: Date.now() - startTime
            };

            this.emit('snapshot:created', snapshot, stats);
            this.logger.info(`创建快照: ${snapshotId}, 大小: ${size} bytes, 耗时: ${stats.serializationTime}ms`);

            return snapshot;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.emit('snapshot:error', errorMessage, { reason, creator });
            this.logger.error('创建快照失败:', error);
            return null;
        }
    }

    /**
     * 恢复游戏状态快照
     */
    restoreSnapshot(snapshotId: string): any | null {
        try {
            const snapshot = this.snapshots.get(snapshotId);
            if (!snapshot) {
                this.logger.warn(`快照不存在: ${snapshotId}`);
                return null;
            }

            // 验证快照完整性
            if (!this.validateSnapshot(snapshot)) {
                this.emit('snapshot:restored', snapshotId, false);
                return null;
            }

            // 反序列化游戏状态
            const gameState = {
                worlds: this.deserializeWorlds(snapshot.worlds),
                players: this.deserializePlayers(snapshot.players),
                gameTime: snapshot.gameTime,
                gameState: snapshot.gameState,
                globalData: { ...snapshot.globalData }
            };

            this.emit('snapshot:restored', snapshotId, true);
            this.logger.info(`恢复快照成功: ${snapshotId}`);

            return gameState;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.emit('snapshot:error', errorMessage, { snapshotId, operation: 'restore' });
            this.emit('snapshot:restored', snapshotId, false);
            this.logger.error('恢复快照失败:', error);
            return null;
        }
    }

    /**
     * 获取快照
     */
    getSnapshot(snapshotId: string): GameStateSnapshot | null {
        return this.snapshots.get(snapshotId) || null;
    }

    /**
     * 获取最新快照
     */
    getLatestSnapshot(): GameStateSnapshot | null {
        if (this.snapshotHistory.length === 0) {
            return null;
        }
        const latestId = this.snapshotHistory[this.snapshotHistory.length - 1];
        return this.getSnapshot(latestId);
    }

    /**
     * 获取快照列表
     */
    getSnapshotList(limit?: number): GameStateSnapshot[] {
        const snapshots = this.snapshotHistory
            .slice()
            .reverse()
            .slice(0, limit)
            .map(id => this.snapshots.get(id))
            .filter((snapshot): snapshot is GameStateSnapshot => snapshot !== undefined);

        return snapshots;
    }

    /**
     * 删除快照
     */
    deleteSnapshot(snapshotId: string): boolean {
        const deleted = this.snapshots.delete(snapshotId);
        if (deleted) {
            const index = this.snapshotHistory.indexOf(snapshotId);
            if (index !== -1) {
                this.snapshotHistory.splice(index, 1);
            }
            this.logger.info(`删除快照: ${snapshotId}`);
        }
        return deleted;
    }

    /**
     * 清理旧快照
     */
    cleanupOldSnapshots(maxAge: number): number {
        const now = Date.now();
        const toDelete: string[] = [];

        for (const [id, snapshot] of this.snapshots.entries()) {
            if (now - snapshot.timestamp > maxAge) {
                toDelete.push(id);
            }
        }

        for (const id of toDelete) {
            this.deleteSnapshot(id);
        }

        if (toDelete.length > 0) {
            this.logger.info(`清理了 ${toDelete.length} 个过期快照`);
        }

        return toDelete.length;
    }

    /**
     * 计算快照差异
     */
    calculateDiff(fromSnapshotId: string, toSnapshotId: string): SnapshotDiff | null {
        const fromSnapshot = this.snapshots.get(fromSnapshotId);
        const toSnapshot = this.snapshots.get(toSnapshotId);

        if (!fromSnapshot || !toSnapshot) {
            return null;
        }

        // 这里实现快照差异计算逻辑
        // 为了简化，返回一个基础的差异结构
        return {
            addedEntities: [],
            removedEntities: [],
            modifiedEntities: [],
            modifiedPlayers: [],
            globalDataChanges: {}
        };
    }

    /**
     * 序列化世界
     */
    private serializeWorlds(worlds: any[]): WorldSnapshot[] {
        return worlds.map(world => ({
            id: world.id || this.generateId(),
            name: world.name || 'Unknown World',
            scenes: this.serializeScenes(world.scenes || []),
            worldData: world.worldData ? { ...world.worldData } : {},
            metadata: world.metadata || {}
        }));
    }

    /**
     * 序列化场景
     */
    private serializeScenes(scenes: any[]): SceneSnapshot[] {
        return scenes.map(scene => ({
            id: scene.id || this.generateId(),
            name: scene.name || 'Unknown Scene',
            entities: this.serializeEntities(scene.entities || []),
            systems: scene.systems?.map((s: any) => s.name || s.constructor.name) || [],
            sceneData: scene.sceneData ? { ...scene.sceneData } : {},
            metadata: scene.metadata || {}
        }));
    }

    /**
     * 序列化实体
     */
    private serializeEntities(entities: any[]): EntitySnapshot[] {
        return entities
            .filter(entity => {
                // 根据配置过滤实体
                return this.config.includeInactiveEntities || entity.enabled !== false;
            })
            .map(entity => ({
                id: entity.id || this.generateId(),
                name: entity.name,
                enabled: entity.enabled !== false,
                components: this.serializeComponents(entity.components || []),
                transform: this.serializeTransform(entity.transform),
                metadata: entity.metadata || {}
            }));
    }

    /**
     * 序列化组件
     */
    private serializeComponents(components: any[]): ComponentSnapshot[] {
        return components
            .filter(component => {
                // 根据配置过滤组件
                if (!this.config.includeDisabledComponents && component.enabled === false) {
                    return false;
                }

                const componentType = component.constructor.name;
                
                if (this.config.excludeComponentTypes?.includes(componentType)) {
                    return false;
                }

                if (this.config.includeOnlyComponentTypes && 
                    !this.config.includeOnlyComponentTypes.includes(componentType)) {
                    return false;
                }

                return true;
            })
            .map(component => {
                const componentType = component.constructor.name;
                const customSerializer = this.config.customSerializers?.get(componentType);

                return {
                    type: componentType,
                    enabled: component.enabled !== false,
                    data: customSerializer ? 
                        customSerializer.serialize(component) : 
                        this.defaultSerializeComponent(component),
                    version: customSerializer?.getVersion() || 1
                };
            });
    }

    /**
     * 序列化变换组件
     */
    private serializeTransform(transform: any): EntitySnapshot['transform'] | undefined {
        if (!transform) {
            return undefined;
        }

        return {
            position: { ...transform.position },
            rotation: transform.rotation ? { ...transform.rotation } : undefined,
            scale: transform.scale ? { ...transform.scale } : undefined
        };
    }

    /**
     * 序列化玩家
     */
    private serializePlayers(players: any[]): PlayerSnapshot[] {
        return players.map(player => ({
            playerId: player.playerId || player.id,
            username: player.username || 'Unknown',
            entityId: player.entityId,
            playerData: player.playerData ? { ...player.playerData } : {},
            connectionState: player.connectionState || 'connected',
            lastActiveTime: player.lastActiveTime || Date.now()
        }));
    }

    /**
     * 反序列化世界
     */
    private deserializeWorlds(worlds: WorldSnapshot[]): any[] {
        return worlds.map(world => ({
            id: world.id,
            name: world.name,
            scenes: this.deserializeScenes(world.scenes),
            worldData: world.worldData,
            metadata: world.metadata
        }));
    }

    /**
     * 反序列化场景
     */
    private deserializeScenes(scenes: SceneSnapshot[]): any[] {
        return scenes.map(scene => ({
            id: scene.id,
            name: scene.name,
            entities: this.deserializeEntities(scene.entities),
            systems: scene.systems,
            sceneData: scene.sceneData,
            metadata: scene.metadata
        }));
    }

    /**
     * 反序列化实体
     */
    private deserializeEntities(entities: EntitySnapshot[]): any[] {
        return entities.map(entity => ({
            id: entity.id,
            name: entity.name,
            enabled: entity.enabled,
            components: this.deserializeComponents(entity.components),
            transform: entity.transform,
            metadata: entity.metadata
        }));
    }

    /**
     * 反序列化组件
     */
    private deserializeComponents(components: ComponentSnapshot[]): any[] {
        return components.map(comp => {
            const customSerializer = this.config.customSerializers?.get(comp.type);
            
            // 这里需要根据组件类型创建实际的组件实例
            // 简化实现，返回数据对象
            return {
                type: comp.type,
                enabled: comp.enabled,
                data: comp.data,
                version: comp.version
            };
        });
    }

    /**
     * 反序列化玩家
     */
    private deserializePlayers(players: PlayerSnapshot[]): any[] {
        return players.map(player => ({
            playerId: player.playerId,
            username: player.username,
            entityId: player.entityId,
            playerData: player.playerData,
            connectionState: player.connectionState,
            lastActiveTime: player.lastActiveTime
        }));
    }

    /**
     * 默认组件序列化
     */
    private defaultSerializeComponent(component: any): Record<string, any> {
        const data: Record<string, any> = {};
        
        // 序列化组件的所有可枚举属性
        for (const key in component) {
            if (component.hasOwnProperty(key) && key !== 'entity') {
                const value = component[key];
                if (this.isSerializable(value)) {
                    data[key] = this.cloneValue(value);
                }
            }
        }

        return data;
    }

    /**
     * 检查值是否可序列化
     */
    private isSerializable(value: any): boolean {
        const type = typeof value;
        return type === 'string' || 
               type === 'number' || 
               type === 'boolean' || 
               value === null ||
               Array.isArray(value) ||
               (type === 'object' && value.constructor === Object);
    }

    /**
     * 克隆值
     */
    private cloneValue(value: any): any {
        if (value === null || typeof value !== 'object') {
            return value;
        }
        
        if (Array.isArray(value)) {
            return value.map(item => this.cloneValue(item));
        }
        
        const cloned: any = {};
        for (const key in value) {
            if (value.hasOwnProperty(key)) {
                cloned[key] = this.cloneValue(value[key]);
            }
        }
        return cloned;
    }

    /**
     * 验证快照完整性
     */
    private validateSnapshot(snapshot: GameStateSnapshot): boolean {
        // 检查基本字段
        if (!snapshot.id || !snapshot.timestamp || !snapshot.version) {
            return false;
        }

        // 验证校验和（如果有）
        if (snapshot.metadata.checksum) {
            const calculatedChecksum = this.calculateChecksum(JSON.stringify({
                ...snapshot,
                metadata: { ...snapshot.metadata, checksum: undefined }
            }));
            
            if (calculatedChecksum !== snapshot.metadata.checksum) {
                this.logger.warn(`快照校验和不匹配: ${snapshot.id}`);
                return false;
            }
        }

        return true;
    }

    /**
     * 计算校验和
     */
    private calculateChecksum(data: string): string {
        // 简化的校验和实现
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * 统计实体数量
     */
    private countEntities(worlds: WorldSnapshot[]): number {
        return worlds.reduce((total, world) => 
            total + world.scenes.reduce((sceneTotal, scene) => 
                sceneTotal + scene.entities.length, 0), 0);
    }

    /**
     * 统计组件数量
     */
    private countComponents(worlds: WorldSnapshot[]): number {
        return worlds.reduce((total, world) => 
            total + world.scenes.reduce((sceneTotal, scene) => 
                sceneTotal + scene.entities.reduce((entityTotal, entity) => 
                    entityTotal + entity.components.length, 0), 0), 0);
    }

    /**
     * 生成快照ID
     */
    private generateSnapshotId(): string {
        return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 生成通用ID
     */
    private generateId(): string {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}