/**
 * 类型工具类
 * 提供类型相关的实用方法
 */
export class TypeUtils {
    /**
     * 获取对象的类型
     * @param obj 对象
     * @returns 对象的构造函数
     */
    public static getType(obj: any) {
        return obj.constructor;
    }
}
