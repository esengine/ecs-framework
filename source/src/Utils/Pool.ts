module es {
    /**
     * 用于池任何对象
     */
    export class Pool<T> {
        private static _objectQueue = [];

        /**
         * 预热缓存，使用最大的cacheCount对象填充缓存
         * @param type
         * @param cacheCount
         */
        public static warmCache(type: any, cacheCount: number){
            cacheCount -= this._objectQueue.length;
            if (cacheCount > 0) {
                for (let i = 0; i < cacheCount; i++) {
                    this._objectQueue.unshift(new type());
                }
            }
        }

        /**
         * 将缓存修剪为cacheCount项目
         * @param cacheCount
         */
        public static trimCache(cacheCount: number){
            while (cacheCount > this._objectQueue.length)
                this._objectQueue.shift();
        }

        /**
         * 清除缓存
         */
        public static clearCache() {
            this._objectQueue.length = 0;
        }

        /**
         * 如果可以的话，从堆栈中弹出一个项
         */
        public static obtain<T>(type: any): T {
            if (this._objectQueue.length > 0)
                return this._objectQueue.shift();

            return new type() as T;
        }

        /**
         * 将项推回堆栈
         * @param obj
         */
        public static free<T>(obj: T) {
            this._objectQueue.unshift(obj);

            if (egret.is(obj, "IPoolable")){
                obj["reset"]();
            }
        }
    }

    export interface IPoolable {
        /**
         * 重置对象以供重用。对象引用应该为空，字段可以设置为默认值
         */
        reset();
    }
}