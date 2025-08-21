import { EntitySystem } from '../Systems/EntitySystem';
import { createLogger } from '../../Utils/Logger';
import { getSystemInstanceTypeName } from '../Decorators';
import { SystemDependencySorter } from './SystemDependencySorter';
import { Core } from '../../Core';

/**
 * 实体处理器列表管理器
 * 管理场景中的所有实体系统
 */
export class EntityProcessorList {
    private static readonly _logger = createLogger('EntityProcessorList');
    private _processors: EntitySystem[] = [];
    private _isDirty = false;

    /**
     * 设置为脏状态，需要重新排序
     */
    public setDirty(): void {
        this._isDirty = true;
    }

    /**
     * 添加实体处理器
     * @param processor 要添加的处理器
     */
    public add(processor: EntitySystem): void {
        this._processors.push(processor);
        this.setDirty();
    }

    /**
     * 移除实体处理器
     * @param processor 要移除的处理器
     */
    public remove(processor: EntitySystem): void {
        const index = this._processors.indexOf(processor);
        if (index !== -1) {
            this._processors.splice(index, 1);
        }
    }

    /**
     * 获取指定类型的处理器
     * @param type 处理器类型
     */
    public getProcessor<T extends EntitySystem>(type: new (...args: unknown[]) => T): T | null {
        for (const processor of this._processors) {
            if (processor instanceof type) {
                return processor as T;
            }
        }
        return null;
    }

    /**
     * 开始处理
     * 
     * 对所有处理器进行排序以确保正确的执行顺序。
     */
    public begin(): void {
        this.sortProcessors();
    }

    /**
     * 结束处理
     */
    public end(): void {
        // 清理处理器
    }

    /**
     * 更新所有处理器
     */
    public update(): void {
        this.sortProcessors();
        for (const processor of this._processors) {
            try {
                processor.update();
            } catch (error) {
                EntityProcessorList._logger.error(`Error in processor ${getSystemInstanceTypeName(processor)}:`, error);
            }
        }
    }

    /**
     * 后期更新所有处理器
     */
    public lateUpdate(): void {
        for (const processor of this._processors) {
            processor.lateUpdate();
        }
    }

    /**
     * 排序处理器
     * 根据配置选择使用确定性排序或传统排序
     */
    private sortProcessors(): void {
        if (this._isDirty) {
            EntityProcessorList._logger.debug('开始系统排序', { 
                systemCount: this._processors.length,
                deterministicSorting: Core.deterministicSortingEnabled
            });
            
            const sortStartTime = performance.now();
            
            if (Core.deterministicSortingEnabled) {
                // 使用确定性排序算法（包含依赖拓扑排序）
                this._processors = SystemDependencySorter.sort(this._processors);
            } else {
                // 使用传统排序（仅按updateOrder排序）
                this._processors = this.traditionalSort(this._processors);
            }
            
            const sortEndTime = performance.now();
            EntityProcessorList._logger.debug('系统排序完成', { 
                duration: (sortEndTime - sortStartTime).toFixed(2) + 'ms',
                sortingType: Core.deterministicSortingEnabled ? 'deterministic' : 'traditional',
                finalOrder: this._processors.map(p => ({
                    name: p.systemName,
                    updateOrder: p.updateOrder
                }))
            });
            
            this._isDirty = false;
        }
    }

    /**
     * 传统排序方法（仅按updateOrder排序）
     */
    private traditionalSort(systems: EntitySystem[]): EntitySystem[] {
        return [...systems].sort((a, b) => {
            // 仅按updateOrder排序
            if (a.updateOrder !== b.updateOrder) {
                return a.updateOrder - b.updateOrder;
            }
            // updateOrder相同时保持原有顺序
            return 0;
        });
    }

    /** 获取处理器列表 */
    public get processors() {
        return this._processors;
    }

    /** 获取处理器数量 */
    public get count() {
        return this._processors.length;
    }


}
