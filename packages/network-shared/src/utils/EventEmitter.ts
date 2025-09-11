/**
 * 网络层专用的EventEmitter实现
 * 继承自core库的Emitter，提供简单的事件API
 */
import { Emitter } from '@esengine/ecs-framework';

/**
 * 网络事件发射器，专为网络层设计
 * 使用字符串或symbol作为事件类型，简化API
 */
export class EventEmitter extends Emitter<string | symbol, void> {
    constructor() {
        super();
    }

    /**
     * 添加事件监听器
     * @param event - 事件名称
     * @param listener - 监听函数
     */
    public on(event: string | symbol, listener: Function): this {
        this.addObserver(event, listener, undefined as void);
        return this;
    }

    /**
     * 添加一次性事件监听器
     * @param event - 事件名称  
     * @param listener - 监听函数
     */
    public once(event: string | symbol, listener: Function): this {
        const onceWrapper = (...args: any[]) => {
            listener.apply(this, args);
            this.removeObserver(event, onceWrapper);
        };
        this.addObserver(event, onceWrapper, undefined as void);
        return this;
    }

    /**
     * 移除事件监听器
     * @param event - 事件名称
     * @param listener - 监听函数，不传则移除所有
     */
    public off(event: string | symbol, listener?: Function): this {
        if (listener) {
            this.removeObserver(event, listener);
        } else {
            this.removeAllObservers(event);
        }
        return this;
    }

    /**
     * 移除事件监听器（别名）
     */
    public removeListener(event: string | symbol, listener: Function): this {
        return this.off(event, listener);
    }

    /**
     * 移除所有监听器
     */
    public removeAllListeners(event?: string | symbol): this {
        this.removeAllObservers(event);
        return this;
    }

    /**
     * 获取监听器数量
     */
    public listenerCount(event: string | symbol): number {
        return this.getObserverCount(event);
    }

    /**
     * 发射事件（兼容Node.js EventEmitter）
     * @param event - 事件名称
     * @param args - 事件参数
     */
    public override emit(event: string | symbol, ...args: any[]): boolean {
        super.emit(event, ...args);
        return true;
    }
}