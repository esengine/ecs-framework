/**
 * 结构性命令缓冲系统
 * 
 * 用于延迟和批处理ECS的结构性变更操作，只拦截结构性变更：
 * create/destroy/add/remove。数据字段的修改直接进行，不通过命令缓冲。
 * 
 * 特性：
 * - 帧内1-2个apply()栅栏
 * - apply()时按(entityId, opOrder)排序批处理
 * - 执行顺序：CREATE → ADD → REMOVE → DESTROY
 * - 集成EventSystem发送结构性变更事件
 */

import { Component } from '../../Component';
import { createLogger } from '../../../Utils/Logger';
import { 
    EntityId, 
    OpType, 
    Op, 
    AddOp, 
    RemoveOp, 
    CreateOp, 
    DestroyOp, 
    ICommandBufferContext 
} from './Types';

/**
 * 命令缓冲统计信息
 */
export interface CommandBufferStats {
    /** 当前缓冲的操作数量 */
    pendingOps: number;
    /** 已处理的操作总数 */
    totalProcessed: number;
    /** apply()调用次数 */
    applyCount: number;
    /** 各类操作的数量统计 */
    opCounts: {
        create: number;
        add: number;
        remove: number;
        destroy: number;
    };
}

/**
 * 结构性命令缓冲器
 * 
 * 负责收集和批处理ECS的结构性变更操作
 */
export class CommandBuffer {
    private static readonly _logger = createLogger('CommandBuffer');

    private _ops: Op[] = [];
    private _orderCounter: number = 0;
    private _context: ICommandBufferContext | null = null;
    private _stats: CommandBufferStats = {
        pendingOps: 0,
        totalProcessed: 0,
        applyCount: 0,
        opCounts: {
            create: 0,
            add: 0,
            remove: 0,
            destroy: 0
        }
    };

    /**
     * 创建命令缓冲器
     * @param context 执行上下文
     */
    constructor(context?: ICommandBufferContext) {
        this._context = context || null;
    }

    /**
     * 设置执行上下文
     * @param context 执行上下文
     */
    public setContext(context: ICommandBufferContext): void {
        this._context = context;
    }

    /**
     * 创建实体
     * @param name 实体名称
     * @param eHint 实体ID提示
     */
    public createEntity(name?: string, eHint?: EntityId): void {
        if (eHint !== undefined && (eHint < 0 || !Number.isInteger(eHint))) {
            CommandBuffer._logger.warn(`无效的实体ID提示: ${eHint}，忽略此提示`);
            eHint = undefined;
        }
        
        const op: CreateOp = {
            t: OpType.CREATE,
            eHint,
            name: name || 'Entity',
            order: this._orderCounter++
        };
        
        this._ops.push(op);
        this._stats.pendingOps++;
        this._stats.opCounts.create++;
    }

    /**
     * 销毁实体
     * @param e 实体ID
     */
    public destroyEntity(e: EntityId): void {
        if (e < 0 || !Number.isInteger(e)) {
            CommandBuffer._logger.warn(`无效的实体ID: ${e}，忽略销毁操作`);
            return;
        }
        
        const op: DestroyOp = {
            t: OpType.DESTROY,
            e,
            order: this._orderCounter++
        };
        
        this._ops.push(op);
        this._stats.pendingOps++;
        this._stats.opCounts.destroy++;
    }

    /**
     * 添加组件到实体
     * @param e 实体ID
     * @param C 组件构造函数
     * @param args 组件构造参数
     */
    public addComponent<T extends Component>(
        e: EntityId, 
        C: new (...args: any[]) => T, 
        ...args: any[]
    ): void {
        if (e < 0 || !Number.isInteger(e)) {
            CommandBuffer._logger.warn(`无效的实体ID: ${e}，忽略添加组件操作`);
            return;
        }
        
        if (!C || typeof C !== 'function') {
            CommandBuffer._logger.warn(`无效的组件构造函数:`, C);
            return;
        }
        
        const op: AddOp = {
            t: OpType.ADD,
            e,
            C,
            data: args.length > 0 ? args : undefined,
            order: this._orderCounter++
        };
        
        this._ops.push(op);
        this._stats.pendingOps++;
        this._stats.opCounts.add++;
    }

    /**
     * 从实体移除组件
     * @param e 实体ID
     * @param C 组件构造函数
     */
    public removeComponent<T extends Component>(
        e: EntityId, 
        C: new (...args: any[]) => T
    ): void {
        if (e < 0 || !Number.isInteger(e)) {
            CommandBuffer._logger.warn(`无效的实体ID: ${e}，忽略移除组件操作`);
            return;
        }
        
        if (!C || typeof C !== 'function') {
            CommandBuffer._logger.warn(`无效的组件构造函数:`, C);
            return;
        }
        
        const op: RemoveOp = {
            t: OpType.REMOVE,
            e,
            C,
            order: this._orderCounter++
        };
        
        this._ops.push(op);
        this._stats.pendingOps++;
        this._stats.opCounts.remove++;
    }

    /**
     * 应用所有缓冲的操作
     * 
     * 在阶段/帧末调用，执行所有结构性变更
     * 注意：数据字段的修改直接即时写入，不通过CommandBuffer
     */
    public apply(): void {
        if (this._ops.length === 0) {
            return;
        }

        if (!this._context) {
            CommandBuffer._logger.error('CommandBuffer上下文未设置，无法执行操作');
            return;
        }

        const startTime = performance.now();
        const opCount = this._ops.length;

        // 稳定排序：entityId升序 + opOrder
        this._sortOperations();

        // 批处理执行
        let successCount = 0;
        for (const op of this._ops) {
            if (this._executeOperation(op)) {
                successCount++;
            }
        }

        // 清空操作缓冲
        this._ops.length = 0;
        this._orderCounter = 0;
        
        // 更新统计
        this._stats.pendingOps = 0;
        this._stats.totalProcessed += successCount;
        this._stats.applyCount++;

        const duration = performance.now() - startTime;
        CommandBuffer._logger.debug(
            `CommandBuffer应用完成: ${successCount}/${opCount}个操作成功, 耗时: ${duration.toFixed(2)}ms`
        );
    }

    /**
     * 清空所有缓冲的操作
     */
    public clear(): void {
        this._ops.length = 0;
        this._orderCounter = 0;
        this._stats.pendingOps = 0;
        this._stats.opCounts = {
            create: 0,
            add: 0,
            remove: 0,
            destroy: 0
        };
    }

    /**
     * 获取当前缓冲的操作数量
     */
    public get pendingCount(): number {
        return this._ops.length;
    }

    /**
     * 检查是否有缓冲的操作
     */
    public get isEmpty(): boolean {
        return this._ops.length === 0;
    }

    /**
     * 获取统计信息
     */
    public getStats(): Readonly<CommandBufferStats> {
        return { ...this._stats };
    }

    /**
     * 获取当前缓冲操作的只读副本
     */
    public getPendingOperations(): ReadonlyArray<Readonly<Op>> {
        return [...this._ops];
    }

    /**
     * 排序操作
     * 
     * 按照以下优先级排序：
     * 1. entityId升序（-1表示CREATE操作，排在最前）
     * 2. 操作类型优先级：CREATE → ADD → REMOVE → DESTROY
     * 3. 操作序号（稳定排序）
     */
    private _sortOperations(): void {
        this._ops.sort((a, b) => {
            // 获取实体ID，CREATE操作使用-1
            const entityA = this._getOperationEntityId(a);
            const entityB = this._getOperationEntityId(b);
            
            // 首先按实体ID排序
            if (entityA !== entityB) {
                return entityA - entityB;
            }
            
            // 相同实体ID时，按操作类型优先级排序
            if (a.t !== b.t) {
                return a.t - b.t;
            }
            
            // 相同操作类型时，按序号排序（稳定排序）
            const orderA = a.order || 0;
            const orderB = b.order || 0;
            return orderA - orderB;
        });
    }

    /**
     * 获取操作的实体ID
     */
    private _getOperationEntityId(op: Op): number {
        switch (op.t) {
            case OpType.CREATE:
                return op.eHint ?? -1; // CREATE操作优先级最高
            case OpType.ADD:
            case OpType.REMOVE:
            case OpType.DESTROY:
                return op.e;
            default:
                return -1;
        }
    }

    /**
     * 执行单个操作
     */
    private _executeOperation(op: Op): boolean {
        try {
            switch (op.t) {
                case OpType.CREATE:
                    return this._executeCreateOp(op);
                case OpType.ADD:
                    return this._executeAddOp(op);
                case OpType.REMOVE:
                    return this._executeRemoveOp(op);
                case OpType.DESTROY:
                    return this._executeDestroyOp(op);
                default:
                    CommandBuffer._logger.warn('未知的操作类型:', op);
                    return false;
            }
        } catch (error) {
            CommandBuffer._logger.error('执行CommandBuffer操作时发生错误:', error, '操作:', op);
            return false;
        }
    }

    /**
     * 执行创建实体操作
     */
    private _executeCreateOp(op: CreateOp): boolean {
        const entity = this._context!.createEntity(op.name, op.eHint);
        return entity !== null;
    }

    /**
     * 执行添加组件操作
     */
    private _executeAddOp(op: AddOp): boolean {
        const args = op.data || [];
        return this._context!.addComponent(op.e, op.C, ...args);
    }

    /**
     * 执行移除组件操作
     */
    private _executeRemoveOp(op: RemoveOp): boolean {
        return this._context!.removeComponent(op.e, op.C);
    }

    /**
     * 执行销毁实体操作
     */
    private _executeDestroyOp(op: DestroyOp): boolean {
        return this._context!.destroyEntity(op.e);
    }
}