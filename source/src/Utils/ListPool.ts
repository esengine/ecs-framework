/**
 * 可以用于列表池的简单类
 */
class ListPool {
    private static readonly _objectQueue = [];

    /**
     * 预热缓存，使用最大的cacheCount对象填充缓存
     * @param cacheCount 
     */
    public static warmCache(cacheCount: number){
        cacheCount -= this._objectQueue.length;
        if (cacheCount > 0){
            for (let i = 0; i < cacheCount; i ++){
                this._objectQueue.unshift([]);
            }
        }
    }

    /**
     * 将缓存修剪为cacheCount项目
     * @param cacheCount 
     */
    public static trimCache(cacheCount){
        while (cacheCount > this._objectQueue.length)
            this._objectQueue.shift();
    }

    /**
     * 清除缓存
     */
    public static clearCache(){
        this._objectQueue.length = 0;
    }

    /**
     * 如果可以的话，从堆栈中弹出一个项
     */
    public static obtain<T>(): Array<T>{
        if (this._objectQueue.length > 0)
            return this._objectQueue.shift();

        return [];
    }

    /**
     * 将项推回堆栈
     * @param obj 
     */
    public static free<T>(obj: Array<T>){
        this._objectQueue.unshift(obj);
        obj.length = 0;
    }
}