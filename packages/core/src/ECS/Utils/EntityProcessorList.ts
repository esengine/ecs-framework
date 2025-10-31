import { EntitySystem } from '../Systems/EntitySystem';
import { createLogger } from '../../Utils/Logger';
import { getSystemInstanceTypeName } from '../Decorators';

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
        for (const processor of this._processors) {
            try {
                processor.reset();
            } catch (error) {
                EntityProcessorList._logger.error(`Error in processor ${getSystemInstanceTypeName(processor)}:`, error);
            }
        }
        this._isDirty = false;
        this._processors.length = 0;
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
     */
    private sortProcessors(): void {
        if (this._isDirty) {
            this._processors.sort((a, b) => a.updateOrder - b.updateOrder);
            this._isDirty = false;
        }
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
