module es {
    /**
     * 用于包装事件的一个小类
     */
    export class FuncPack {
        /** 函数 */
        public func: Function;
        /** 上下文 */
        public context: any;

        constructor(func: Function, context: any) {
            this.func = func;
            this.context = context;
        }
    }

    /**
     * 用于事件管理
     */
    export class Emitter<T> {
        private _messageTable: Map<T, FuncPack[]>;

        constructor() {
            this._messageTable = new Map<T, FuncPack[]>();
        }

        /**
         * 开始监听项
         * @param eventType 监听类型
         * @param handler 监听函数
         * @param context 监听上下文
         */
        public addObserver(eventType: T, handler: Function, context: any) {
            let list: FuncPack[] = this._messageTable.get(eventType);
            if (!list) {
                list = [];
                this._messageTable.set(eventType, list);
            }

            Insist.isFalse(list.findIndex(funcPack => funcPack.func == handler) != -1, "您试图添加相同的观察者两次");
            list.push(new FuncPack(handler, context));
        }

        /**
         * 移除监听项
         * @param eventType 事件类型
         * @param handler 事件函数
         */
        public removeObserver(eventType: T, handler: Function) {
            let messageData = this._messageTable.get(eventType);
            let index = messageData.findIndex(data => data.func == handler);
            if (index != -1)
                new es.List(messageData).removeAt(index);
        }

        /**
         * 触发该事件
         * @param eventType 事件类型
         * @param data 事件数据
         */
        public emit(eventType: T, ...data: any[]) {
            let list: FuncPack[] = this._messageTable.get(eventType);
            if (list) {
                for (let i = list.length - 1; i >= 0; i--)
                    list[i].func.call(list[i].context, ...data);
            }
        }
    }
}
