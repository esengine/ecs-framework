module es {
    export class Pool {
        private static _objectQueue = new Map<new () => any, any[]>();

        /**
         * 预热缓存，使用最大的cacheCount对象填充缓存
         * @param type 要预热的类型
         * @param cacheCount 预热缓存数量
         */
        public static warmCache<T>(type: new (...args: any[]) => T, cacheCount: number) {
            this.checkCreate(type);
            const queue = this._objectQueue.get(type);
            cacheCount -= queue.length;

            // 如果需要预热更多的对象，则创建并添加到缓存
            if (cacheCount > 0) {
                for (let i = 0; i < cacheCount; i++) {
                    queue.push(new type());
                }
            }
        }

        /**
        * 将缓存修剪为cacheCount项目
        * @param type 要修剪的类型
        * @param cacheCount 修剪后的缓存数量
        */
        public static trimCache<T>(type: new (...args) => T, cacheCount: number) {
            this.checkCreate(type);
            const objectQueue = this._objectQueue.get(type);

            // 如果需要修剪缓存，则弹出多余的对象
            while (cacheCount < objectQueue.length) {
                objectQueue.pop();
            }
        }

        /**
         * 清除缓存
         * @param type 要清除缓存的类型
         */
        public static clearCache<T>(type: new (...args) => T) {
            this.checkCreate(type);
            const objectQueue = this._objectQueue.get(type);

            // 清空缓存数组
            objectQueue.length = 0;
        }

        /**
         * 如果可以的话，从缓存中获取一个对象
         * @param type 要获取的类型
         */
        public static obtain<T>(type: new (...args) => T): T {
            this.checkCreate(type);
            const objectQueue = this._objectQueue.get(type);

            // 如果缓存中有对象，弹出一个并返回
            if (objectQueue.length > 0) {
                return objectQueue.pop();
            }

            // 如果没有缓存对象，则创建一个新的对象并返回
            return new type() as T;
        }

        /**
         * 将对象推回缓存
         * @param type 对象的类型
         * @param obj 要推回的对象
         */
        public static free<T>(type: new (...args) => T, obj: T) {
            this.checkCreate(type);
            const objectQueue = this._objectQueue.get(type);

            // 将对象推回缓存
            objectQueue.push(obj);

            // 如果对象实现了IPoolable接口，则调用reset方法重置对象
            if (isIPoolable(obj)) {
                obj.reset();
            }
        }

        /**
         * 检查缓存中是否已存在给定类型的对象池，如果不存在则创建一个
         * @param type 要检查的类型
         */
        private static checkCreate<T>(type: new (...args: any[]) => T) {
            if (!this._objectQueue.has(type)) {
                this._objectQueue.set(type, []);
            }
        }
    }

    export interface IPoolable {
        reset(): void;
    }

    export const isIPoolable = (props: any): props is IPoolable => {
        return typeof props.reset === 'function';
    };
}