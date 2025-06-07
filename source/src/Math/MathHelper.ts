/**
 * 数学辅助工具类
 * 提供常用的数学计算函数和常量
 */
export class MathHelper {
    /**
     * 角度转弧度的转换系数
     */
    public static readonly DEG_TO_RAD = Math.PI / 180;

    /**
     * 弧度转角度的转换系数
     */
    public static readonly RAD_TO_DEG = 180 / Math.PI;

    /**
     * 浮点数比较的默认精度值
     */
    public static readonly EPSILON = 0.00001;

    /**
     * 将角度转换为弧度
     * @param degrees 角度值
     * @returns 对应的弧度值
     */
    public static toRadians(degrees: number): number {
        return degrees * MathHelper.DEG_TO_RAD;
    }

    /**
     * 将弧度转换为角度
     * @param radians 弧度值
     * @returns 对应的角度值
     */
    public static toDegrees(radians: number): number {
        return radians * MathHelper.RAD_TO_DEG;
    }

    /**
     * 将数值限制在指定范围内
     * @param value 要限制的值
     * @param min 最小值
     * @param max 最大值
     * @returns 限制后的值
     */
    public static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * 将数值限制在0到1之间
     * @param value 要限制的值
     * @returns 限制在[0,1]范围内的值
     */
    public static clamp01(value: number): number {
        return MathHelper.clamp(value, 0, 1);
    }

    /**
     * 在两个值之间进行线性插值
     * @param a 起始值
     * @param b 结束值
     * @param t 插值参数，会被限制在[0,1]范围内
     * @returns 插值结果
     */
    public static lerp(a: number, b: number, t: number): number {
        return a + (b - a) * MathHelper.clamp01(t);
    }

    /**
     * 检查两个浮点数是否在指定精度内相等
     * @param a 第一个数值
     * @param b 第二个数值
     * @param tolerance 容差值，默认为EPSILON
     * @returns 如果两个数值在容差范围内相等返回true，否则返回false
     */
    public static approximately(a: number, b: number, tolerance: number = MathHelper.EPSILON): boolean {
        return Math.abs(a - b) < tolerance;
    }

    /**
     * 生成指定范围内的随机数
     * @param min 最小值，默认为0
     * @param max 最大值，默认为1
     * @returns 范围内的随机数
     */
    public static random(min: number = 0, max: number = 1): number {
        return Math.random() * (max - min) + min;
    }

    /**
     * 生成指定范围内的随机整数
     * @param min 最小值（包含）
     * @param max 最大值（包含）
     * @returns 范围内的随机整数
     */
    public static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
} 