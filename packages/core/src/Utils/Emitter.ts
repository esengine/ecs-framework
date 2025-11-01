/**
 * 用于包装事件的一个小类
 */
export class FuncPack<TContext = unknown> {
    /** 函数 */
    public func: Function;
    /** 上下文 */
    public context: TContext;

    constructor(func: Function, context: TContext) {
        this.func = func;
        this.context = context;
    }
}

/**
 * 用于事件管理
 */
export class Emitter<T, TContext = unknown> {
    private _messageTable: Map<T, FuncPack<TContext>[]>;

    constructor() {
        this._messageTable = new Map<T, FuncPack<TContext>[]>();
    }

    /**
     * 开始监听项
     * @param eventType 监听类型
     * @param handler 监听函数
     * @param context 监听上下文
     */
    public addObserver(eventType: T, handler: Function, context: TContext) {
        let list = this._messageTable.get(eventType);
        if (!list) {
            list = [];
            this._messageTable.set(eventType, list);
        }

        if (!this.hasObserver(eventType, handler)) {
            list.push(new FuncPack<TContext>(handler, context));
        }
    }

    /**
     * 移除监听项
     * @param eventType 事件类型
     * @param handler 事件函数
     */
    public removeObserver(eventType: T, handler: Function) {
        const messageData = this._messageTable.get(eventType);
        if (messageData) {
            const index = messageData.findIndex((data) => data.func == handler);
            if (index != -1)
                messageData.splice(index, 1);
        }
    }

    /**
     * 触发该事件
     * @param eventType 事件类型
     * @param data 事件数据
     */
    public emit<TData = unknown>(eventType: T, ...data: TData[]) {
        const list = this._messageTable.get(eventType);
        if (list) {
            for (const observer of list) {
                observer.func.call(observer.context, ...data);
            }
        }
    }

    /**
     * 判断是否存在该类型的观察者
     * @param eventType 事件类型
     * @param handler 事件函数
     */
    public hasObserver(eventType: T, handler: Function): boolean {
        const list = this._messageTable.get(eventType);
        return list ? list.some((observer) => observer.func === handler) : false;
    }

    /**
     * 移除指定事件类型的所有监听器
     * @param eventType 事件类型
     */
    public removeAllObservers(eventType?: T): void {
        if (eventType !== undefined) {
            this._messageTable.delete(eventType);
        } else {
            this._messageTable.clear();
        }
    }

    /**
     * 释放所有资源，清理所有监听器
     */
    public dispose(): void {
        this._messageTable.clear();
    }

    /**
     * 获取事件类型数量
     */
    public getEventTypeCount(): number {
        return this._messageTable.size;
    }

    /**
     * 获取指定事件类型的监听器数量
     * @param eventType 事件类型
     */
    public getObserverCount(eventType: T): number {
        const list = this._messageTable.get(eventType);
        return list ? list.length : 0;
    }
}
