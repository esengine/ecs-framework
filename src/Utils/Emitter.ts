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
        let messageData = this._messageTable.get(eventType);
        if (messageData) {
            let index = messageData.findIndex(data => data.func == handler);
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
        let list = this._messageTable.get(eventType);
        if (list) {
            for (let observer of list) {
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
        let list = this._messageTable.get(eventType);
        return list ? list.some(observer => observer.func === handler) : false;
    }
}
