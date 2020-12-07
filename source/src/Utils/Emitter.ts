module es {
    /**
     * 用于事件管理
     */
    export class Emitter<T> {
        private _messageTable: Map<T, Function[]>;

        constructor() {
            this._messageTable = new Map<T, Function[]>();
        }

        /**
         * 开始监听项
         * @param eventType 监听类型
         * @param handler 监听函数
         * @param context 监听上下文
         */
        public addObserver(eventType: T, handler: Function, context: any) {
            handler.bind(context);
            
            let list: Function[] = this._messageTable.get(eventType);
            if (!list) {
                list = [];
                this._messageTable.set(eventType, list);
            }

            if (new linq.List(list).contains(handler))
                console.warn("您试图添加相同的观察者两次");
            list.push(handler);
        }

        /**
         * 移除监听项
         * @param eventType 事件类型
         * @param handler 事件函数
         */
        public removeObserver(eventType: T, handler: Function) {
            let messageData = this._messageTable.get(eventType);
            new linq.List(messageData).remove(handler);
        }

        /**
         * 触发该事件
         * @param eventType 事件类型
         * @param data 事件数据
         */
        public emit(eventType: T, data?: any) {
            let list: Function[] = this._messageTable.get(eventType);
            if (list) {
                for (let i = list.length - 1; i >= 0; i--)
                    list[i](data);
            }
        }
    }
}
