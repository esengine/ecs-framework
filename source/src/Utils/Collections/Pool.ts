module es {
    /**
     * 用于池任何对象
     */
    export class Pool {
        private static _objectQueue: Map<any, any[]> = new Map();

        /**
         * 预热缓存，使用最大的cacheCount对象填充缓存
         * @param type
         * @param cacheCount
         */
        public static warmCache<T>(type: new (...args) => T, cacheCount: number) {
            this.checkCreate(type);
            cacheCount -= this._objectQueue.get(type).length;
            if (cacheCount > 0) {
                for (let i = 0; i < cacheCount; i++) {
                    this._objectQueue.get(type).unshift(new type());
                }
            }
        }

        /**
         * 将缓存修剪为cacheCount项目
         * @param cacheCount
         */
        public static trimCache<T>(type: new (...args) => T, cacheCount: number) {
            this.checkCreate(type);
            while (cacheCount > this._objectQueue.get(type).length)
                this._objectQueue.get(type).shift();
        }

        /**
         * 清除缓存
         */
        public static clearCache<T>(type: new (...args) => T) {
            this.checkCreate(type);
            this._objectQueue.get(type).length = 0;
        }

        /**
         * 如果可以的话，从堆栈中弹出一个项
         */
        public static obtain<T>(type: new (...args) => T): T {
            this.checkCreate(type);
            if (this._objectQueue.get(type).length > 0)
                return this._objectQueue.get(type).shift();

            return new type() as T;
        }

        /**
         * 将项推回堆栈
         * @param obj
         */
        public static free<T>(type: new (...args) => T, obj: T) {
            this.checkCreate(type);
            this._objectQueue.get(type).unshift(obj);

            if (isIPoolable(obj)) {
                obj["reset"]();
            }
        }

        private static checkCreate<T>(type: new (...args) => T) {
            if (!this._objectQueue.get(type))
                this._objectQueue.set(type, []);
        }
    }

    export interface IPoolable {
        /**
         * 重置对象以供重用。对象引用应该为空，字段可以设置为默认值
         */
        reset();
    }

    export var isIPoolable = (props: any): props is IPoolable => typeof (props as IPoolable)['reset'] !== 'undefined';
}