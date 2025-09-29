import { EntitySystem, createLogger } from '@esengine/ecs-framework';
import { 
    SyncVarManager, 
    SyncBatch, 
    SyncVarSerializer,
    MessageType,
    INetworkMessage 
} from '@esengine/network-shared';
import { NetworkClient } from '../core/NetworkClient';

/**
 * 客户端同步系统配置
 */
export interface ClientSyncSystemConfig {
    /** 是否启用本地预测 */
    enablePrediction: boolean;
    /** 是否启用插值 */
    enableInterpolation: boolean;
    /** 插值时间窗口(毫秒) */
    interpolationWindow: number;
    /** 外推时间限制(毫秒) */
    extrapolationLimit: number;
    /** 是否启用回滚 */
    enableRollback: boolean;
    /** 最大回滚历史帧数 */
    maxRollbackFrames: number;
    /** 服务端权威检查阈值 */
    authorityThreshold: number;
}

/**
 * 远程实体状态
 */
interface RemoteEntityState {
    instanceId: string;
    instanceType: string;
    lastUpdateTime: number;
    serverTime: number;
    properties: { [key: string]: any };
    history: Array<{
        timestamp: number;
        properties: { [key: string]: any };
    }>;
}

/**
 * 本地预测状态
 */
interface PredictionState {
    instanceId: string;
    predictedValues: { [key: string]: any };
    lastConfirmedValues: { [key: string]: any };
    confirmationTime: number;
    pendingInputs: Array<{
        timestamp: number;
        input: any;
    }>;
}

/**
 * 插值状态
 */
interface InterpolationState {
    instanceId: string;
    fromValues: { [key: string]: any };
    toValues: { [key: string]: any };
    fromTime: number;
    toTime: number;
    currentValues: { [key: string]: any };
}

/**
 * 同步统计
 */
interface ClientSyncStats {
    remoteEntities: number;
    predictedEntities: number;
    interpolatingEntities: number;
    totalUpdatesReceived: number;
    predictionCorrections: number;
    averageLatency: number;
    networkJitter: number;
}

/**
 * 客户端同步系统
 * 负责接收和应用服务端同步数据，处理本地预测和插值
 */
export class ClientSyncSystem extends EntitySystem {
    private config: ClientSyncSystemConfig;
    private syncVarManager: SyncVarManager;
    private serializer: SyncVarSerializer;
    private networkClient?: NetworkClient;
    
    /** 远程实体状态 */
    private remoteEntities = new Map<string, RemoteEntityState>();
    
    /** 本地预测状态 */
    private predictions = new Map<string, PredictionState>();
    
    /** 插值状态 */
    private interpolations = new Map<string, InterpolationState>();
    
    /** 本地实体映射 */
    private localEntityMap = new Map<string, any>();
    
    /** 时间同步 */
    private serverTimeOffset = 0;
    private lastServerTime = 0;
    
    /** 统计信息 */
    private stats: ClientSyncStats = {
        remoteEntities: 0,
        predictedEntities: 0,
        interpolatingEntities: 0,
        totalUpdatesReceived: 0,
        predictionCorrections: 0,
        averageLatency: 0,
        networkJitter: 0
    };

    constructor(config: Partial<ClientSyncSystemConfig> = {}) {
        super();
        
        this.config = {
            enablePrediction: true,
            enableInterpolation: true,
            interpolationWindow: 100,
            extrapolationLimit: 50,
            enableRollback: true,
            maxRollbackFrames: 60,
            authorityThreshold: 0.1,
            ...config
        };
        
        this.syncVarManager = SyncVarManager.getInstance();
        this.serializer = new SyncVarSerializer({
            enableCompression: true,
            enableDeltaSync: true
        });
    }

    /**
     * 初始化系统
     */
    public override initialize(): void {
        super.initialize();
        this.logger.info('客户端同步系统初始化');
    }

    /**
     * 系统更新
     */
    protected override process(): void {
        const currentTime = this.getCurrentTime();
        
        this.updateInterpolations(currentTime);
        this.updatePredictions(currentTime);
        this.cleanupOldData(currentTime);
        this.updateStats();
    }

    /**
     * 设置网络客户端
     */
    public setNetworkClient(client: NetworkClient): void {
        this.networkClient = client;
        
        // 监听同步消息
        client.on('messageReceived', (message: INetworkMessage) => {
            if (message.type === MessageType.SYNC_BATCH) {
                this.handleSyncBatch(message);
            }
        });
    }

    /**
     * 注册本地实体
     */
    public registerLocalEntity(instanceId: string, entity: any): void {
        this.localEntityMap.set(instanceId, entity);
        this.syncVarManager.registerInstance(entity);
    }

    /**
     * 注销本地实体
     */
    public unregisterLocalEntity(instanceId: string): void {
        const entity = this.localEntityMap.get(instanceId);
        if (entity) {
            this.localEntityMap.delete(instanceId);
            this.syncVarManager.unregisterInstance(entity);
        }
        
        this.remoteEntities.delete(instanceId);
        this.predictions.delete(instanceId);
        this.interpolations.delete(instanceId);
    }

    /**
     * 创建远程实体
     */
    public createRemoteEntity(instanceId: string, instanceType: string, properties: any): any {
        // 这里需要根据instanceType创建对应的实体
        // 简化实现，返回一个通用对象
        const entity = {
            instanceId,
            instanceType,
            ...properties
        };
        
        this.localEntityMap.set(instanceId, entity);
        
        // 注册到SyncVar管理器
        this.syncVarManager.registerInstance(entity);
        
        this.logger.debug(`创建远程实体: ${instanceId} (${instanceType})`);
        return entity;
    }

    /**
     * 销毁远程实体
     */
    public destroyRemoteEntity(instanceId: string): void {
        const entity = this.localEntityMap.get(instanceId);
        if (entity) {
            this.unregisterLocalEntity(instanceId);
            this.logger.debug(`销毁远程实体: ${instanceId}`);
        }
    }

    /**
     * 开始本地预测
     */
    public startPrediction(instanceId: string, input: any): void {
        if (!this.config.enablePrediction) {
            return;
        }
        
        const entity = this.localEntityMap.get(instanceId);
        if (!entity) {
            return;
        }
        
        let prediction = this.predictions.get(instanceId);
        if (!prediction) {
            prediction = {
                instanceId,
                predictedValues: {},
                lastConfirmedValues: {},
                confirmationTime: this.getCurrentTime(),
                pendingInputs: []
            };
            this.predictions.set(instanceId, prediction);
        }
        
        // 记录输入
        prediction.pendingInputs.push({
            timestamp: this.getCurrentTime(),
            input
        });
        
        // 应用本地预测
        this.applyPrediction(entity, prediction, input);
    }

    /**
     * 设置服务端时间偏移
     */
    public setServerTimeOffset(offset: number): void {
        this.serverTimeOffset = offset;
    }

    /**
     * 获取统计信息
     */
    public getStats(): ClientSyncStats {
        return { ...this.stats };
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this.stats = {
            remoteEntities: this.remoteEntities.size,
            predictedEntities: this.predictions.size,
            interpolatingEntities: this.interpolations.size,
            totalUpdatesReceived: 0,
            predictionCorrections: 0,
            averageLatency: 0,
            networkJitter: 0
        };
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<ClientSyncSystemConfig>): void {
        Object.assign(this.config, newConfig);
    }

    /**
     * 销毁系统
     */
    public override destroy(): void {
        this.remoteEntities.clear();
        this.predictions.clear();
        this.interpolations.clear();
        this.localEntityMap.clear();
        super.destroy();
    }

    protected override getLoggerName(): string {
        return 'ClientSyncSystem';
    }

    /**
     * 处理同步批次
     */
    private handleSyncBatch(message: INetworkMessage): void {
        try {
            const result = this.serializer.parseSyncMessage(message);
            if (!result.success || !result.data) {
                this.logger.warn('解析同步消息失败:', result.errors);
                return;
            }
            
            const batch = result.data;
            this.applySyncBatch(batch);
            
            this.stats.totalUpdatesReceived++;
            
        } catch (error) {
            this.logger.error('处理同步批次失败:', error);
        }
    }

    /**
     * 应用同步批次
     */
    private applySyncBatch(batch: SyncBatch): void {
        const entity = this.localEntityMap.get(batch.instanceId);
        if (!entity) {
            // 尝试创建远程实体
            this.createRemoteEntity(batch.instanceId, batch.instanceType, batch.changes);
            return;
        }
        
        const currentTime = this.getCurrentTime();
        
        // 更新远程实体状态
        let remoteState = this.remoteEntities.get(batch.instanceId);
        if (!remoteState) {
            remoteState = {
                instanceId: batch.instanceId,
                instanceType: batch.instanceType,
                lastUpdateTime: currentTime,
                serverTime: batch.timestamp,
                properties: {},
                history: []
            };
            this.remoteEntities.set(batch.instanceId, remoteState);
        }
        
        // 更新历史记录
        remoteState.history.push({
            timestamp: batch.timestamp,
            properties: { ...batch.changes }
        });
        
        // 保持历史记录大小
        if (remoteState.history.length > this.config.maxRollbackFrames) {
            remoteState.history.shift();
        }
        
        remoteState.lastUpdateTime = currentTime;
        remoteState.serverTime = batch.timestamp;
        Object.assign(remoteState.properties, batch.changes);
        
        // 处理本地预测确认
        if (this.config.enablePrediction) {
            this.confirmPrediction(batch.instanceId, batch.changes, batch.timestamp);
        }
        
        // 开始插值
        if (this.config.enableInterpolation) {
            this.startInterpolation(batch.instanceId, batch.changes);
        } else {
            // 直接应用值
            this.applyValuesToEntity(entity, batch.changes);
        }
    }

    /**
     * 确认本地预测
     */
    private confirmPrediction(instanceId: string, serverValues: any, serverTime: number): void {
        const prediction = this.predictions.get(instanceId);
        if (!prediction) {
            return;
        }
        
        // 检查预测准确性
        let hasCorrection = false;
        for (const [key, serverValue] of Object.entries(serverValues)) {
            const predictedValue = prediction.predictedValues[key];
            if (predictedValue !== undefined && 
                typeof predictedValue === 'number' && 
                typeof serverValue === 'number' &&
                Math.abs(predictedValue - serverValue) > this.config.authorityThreshold) {
                hasCorrection = true;
                break;
            }
        }
        
        if (hasCorrection) {
            this.stats.predictionCorrections++;
            
            // 执行回滚和重放
            if (this.config.enableRollback) {
                this.performRollbackAndReplay(instanceId, serverValues, serverTime);
            }
        }
        
        // 更新确认值
        Object.assign(prediction.lastConfirmedValues, serverValues);
        prediction.confirmationTime = serverTime;
        
        // 清理已确认的输入
        prediction.pendingInputs = prediction.pendingInputs.filter(
            input => input.timestamp > serverTime
        );
    }

    /**
     * 执行回滚和重放
     */
    private performRollbackAndReplay(instanceId: string, serverValues: any, serverTime: number): void {
        const entity = this.localEntityMap.get(instanceId);
        const prediction = this.predictions.get(instanceId);
        
        if (!entity || !prediction) {
            return;
        }
        
        // 回滚到服务端状态
        this.applyValuesToEntity(entity, serverValues);
        
        // 重放未确认的输入
        for (const input of prediction.pendingInputs) {
            if (input.timestamp > serverTime) {
                this.applyPrediction(entity, prediction, input.input);
            }
        }
        
        this.logger.debug(`执行回滚和重放: ${instanceId}`);
    }

    /**
     * 开始插值
     */
    private startInterpolation(instanceId: string, targetValues: any): void {
        const entity = this.localEntityMap.get(instanceId);
        if (!entity) {
            return;
        }
        
        // 获取当前值
        const currentValues: { [key: string]: any } = {};
        for (const key of Object.keys(targetValues)) {
            currentValues[key] = entity[key];
        }
        
        const interpolation: InterpolationState = {
            instanceId,
            fromValues: currentValues,
            toValues: targetValues,
            fromTime: this.getCurrentTime(),
            toTime: this.getCurrentTime() + this.config.interpolationWindow,
            currentValues: { ...currentValues }
        };
        
        this.interpolations.set(instanceId, interpolation);
    }

    /**
     * 更新插值
     */
    private updateInterpolations(currentTime: number): void {
        for (const [instanceId, interpolation] of this.interpolations) {
            const entity = this.localEntityMap.get(instanceId);
            if (!entity) {
                this.interpolations.delete(instanceId);
                continue;
            }
            
            const progress = Math.min(
                (currentTime - interpolation.fromTime) / 
                (interpolation.toTime - interpolation.fromTime),
                1
            );
            
            // 计算插值
            for (const [key, fromValue] of Object.entries(interpolation.fromValues)) {
                const toValue = interpolation.toValues[key];
                
                if (typeof fromValue === 'number' && typeof toValue === 'number') {
                    interpolation.currentValues[key] = fromValue + (toValue - fromValue) * progress;
                } else {
                    interpolation.currentValues[key] = progress < 0.5 ? fromValue : toValue;
                }
            }
            
            // 应用插值结果
            this.applyValuesToEntity(entity, interpolation.currentValues);
            
            // 检查插值是否完成
            if (progress >= 1) {
                this.interpolations.delete(instanceId);
            }
        }
    }

    /**
     * 更新本地预测
     */
    private updatePredictions(currentTime: number): void {
        for (const [instanceId, prediction] of this.predictions) {
            // 清理过期的输入
            prediction.pendingInputs = prediction.pendingInputs.filter(
                input => currentTime - input.timestamp < 1000
            );
            
            // 如果没有待处理的输入，移除预测状态
            if (prediction.pendingInputs.length === 0 && 
                currentTime - prediction.confirmationTime > 1000) {
                this.predictions.delete(instanceId);
            }
        }
    }

    /**
     * 应用本地预测
     */
    private applyPrediction(entity: any, prediction: PredictionState, input: any): void {
        // 这里应该根据具体的游戏逻辑实现预测
        // 简化实现，直接应用输入
        if (input.movement) {
            prediction.predictedValues.x = (entity.x || 0) + input.movement.x;
            prediction.predictedValues.y = (entity.y || 0) + input.movement.y;
            
            this.applyValuesToEntity(entity, prediction.predictedValues);
        }
    }

    /**
     * 应用值到实体
     */
    private applyValuesToEntity(entity: any, values: any): void {
        for (const [key, value] of Object.entries(values)) {
            entity[key] = value;
        }
    }

    /**
     * 清理过期数据
     */
    private cleanupOldData(currentTime: number): void {
        const maxAge = 5000; // 5秒
        
        // 清理远程实体历史
        for (const [instanceId, remoteState] of this.remoteEntities) {
            if (currentTime - remoteState.lastUpdateTime > maxAge) {
                this.remoteEntities.delete(instanceId);
                continue;
            }
            
            // 清理历史记录
            remoteState.history = remoteState.history.filter(
                record => currentTime - record.timestamp < maxAge
            );
        }
    }

    /**
     * 更新统计信息
     */
    private updateStats(): void {
        this.stats.remoteEntities = this.remoteEntities.size;
        this.stats.predictedEntities = this.predictions.size;
        this.stats.interpolatingEntities = this.interpolations.size;
    }

    /**
     * 获取当前时间（包含服务端偏移）
     */
    private getCurrentTime(): number {
        return Date.now() + this.serverTimeOffset;
    }
}