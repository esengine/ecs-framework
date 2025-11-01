/**
 * 数字扩展工具类
 * 提供数字转换的实用方法
 */
export class NumberExtension {
    /**
     * 将值转换为数字
     * @param value 要转换的值
     * @returns 转换后的数字，如果值为undefined则返回0
     */
    public static toNumber(value: unknown): number {
        if (value == undefined) return 0;
        return Number(value);
    }
}
