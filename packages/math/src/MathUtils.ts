import { Vector2 } from './Vector2';

/**
 * 数学工具函数集合
 *
 * 提供常用的数学运算、插值、随机数生成等实用工具函数
 */
export class MathUtils {
    // 数学常量
    /** 圆周率 */
    static readonly PI = Math.PI;

    /** 2π */
    static readonly TWO_PI = Math.PI * 2;

    /** π/2 */
    static readonly HALF_PI = Math.PI * 0.5;

    /** π/4 */
    static readonly QUARTER_PI = Math.PI * 0.25;

    /** 角度到弧度转换系数 */
    static readonly DEG_TO_RAD = Math.PI / 180;

    /** 弧度到角度转换系数 */
    static readonly RAD_TO_DEG = 180 / Math.PI;

    /** 黄金比例 */
    static readonly GOLDEN_RATIO = (1 + Math.sqrt(5)) * 0.5;

    /** 默认浮点数比较容差 */
    static readonly EPSILON = Number.EPSILON;

    // 角度转换

    /**
   * 角度转弧度
   * @param degrees 角度值
   * @returns 弧度值
   */
    static degToRad(degrees: number): number {
        return degrees * MathUtils.DEG_TO_RAD;
    }

    /**
   * 弧度转角度
   * @param radians 弧度值
   * @returns 角度值
   */
    static radToDeg(radians: number): number {
        return radians * MathUtils.RAD_TO_DEG;
    }

    /**
   * 规范化角度到[0, 2π)范围
   * @param radians 角度（弧度）
   * @returns 规范化后的角度
   */
    static normalizeAngle(radians: number): number {
        while (radians < 0) radians += MathUtils.TWO_PI;
        while (radians >= MathUtils.TWO_PI) radians -= MathUtils.TWO_PI;
        return radians;
    }

    /**
   * 规范化角度到(-π, π]范围
   * @param radians 角度（弧度）
   * @returns 规范化后的角度
   */
    static normalizeAngleSigned(radians: number): number {
        while (radians <= -Math.PI) radians += MathUtils.TWO_PI;
        while (radians > Math.PI) radians -= MathUtils.TWO_PI;
        return radians;
    }

    /**
   * 计算两个角度之间的最短角度差
   * @param from 起始角度（弧度）
   * @param to 目标角度（弧度）
   * @returns 角度差（-π到π）
   */
    static angleDifference(from: number, to: number): number {
        let diff = to - from;
        diff = MathUtils.normalizeAngleSigned(diff);
        return diff;
    }

    /**
   * 角度插值（处理角度环绕）
   * @param from 起始角度（弧度）
   * @param to 目标角度（弧度）
   * @param t 插值参数（0到1）
   * @returns 插值结果角度
   */
    static lerpAngle(from: number, to: number, t: number): number {
        const diff = MathUtils.angleDifference(from, to);
        return from + diff * t;
    }

    // 数值操作

    /**
   * 限制数值在指定范围内
   * @param value 待限制的值
   * @param min 最小值
   * @param max 最大值
   * @returns 限制后的值
   */
    static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    /**
   * 限制数值在0到1之间
   * @param value 待限制的值
   * @returns 限制后的值
   */
    static clamp01(value: number): number {
        return Math.max(0, Math.min(1, value));
    }

    /**
   * 线性插值
   * @param a 起始值
   * @param b 目标值
   * @param t 插值参数（0到1）
   * @returns 插值结果
   */
    static lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    /**
   * 反向线性插值（获取插值参数）
   * @param a 起始值
   * @param b 目标值
   * @param value 当前值
   * @returns 插值参数
   */
    static inverseLerp(a: number, b: number, value: number): number {
        if (Math.abs(b - a) < MathUtils.EPSILON) {
            return 0;
        }
        return (value - a) / (b - a);
    }

    /**
   * 重映射数值从一个范围到另一个范围
   * @param value 输入值
   * @param inMin 输入范围最小值
   * @param inMax 输入范围最大值
   * @param outMin 输出范围最小值
   * @param outMax 输出范围最大值
   * @returns 重映射后的值
   */
    static remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
        const t = MathUtils.inverseLerp(inMin, inMax, value);
        return MathUtils.lerp(outMin, outMax, t);
    }

    /**
   * 平滑阶跃函数（Hermite插值）
   * @param t 输入参数（0到1）
   * @returns 平滑输出（0到1）
   */
    static smoothStep(t: number): number {
        t = MathUtils.clamp01(t);
        return t * t * (3 - 2 * t);
    }

    /**
   * 更平滑的阶跃函数
   * @param t 输入参数（0到1）
   * @returns 平滑输出（0到1）
   */
    static smootherStep(t: number): number {
        t = MathUtils.clamp01(t);
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    // 比较操作

    /**
   * 浮点数相等比较
   * @param a 数值a
   * @param b 数值b
   * @param epsilon 容差，默认为EPSILON
   * @returns 是否相等
   */
    static approximately(a: number, b: number, epsilon: number = MathUtils.EPSILON): boolean {
        return Math.abs(a - b) < epsilon;
    }

    /**
   * 检查数值是否为零
   * @param value 数值
   * @param epsilon 容差，默认为EPSILON
   * @returns 是否为零
   */
    static isZero(value: number, epsilon: number = MathUtils.EPSILON): boolean {
        return Math.abs(value) < epsilon;
    }

    /**
   * 获取数值的符号
   * @param value 数值
   * @returns 1、-1或0
   */
    static sign(value: number): number {
        return value > 0 ? 1 : value < 0 ? -1 : 0;
    }

    // 随机数生成

    /**
   * 生成指定范围内的随机数
   * @param min 最小值（包含）
   * @param max 最大值（不包含）
   * @returns 随机数
   */
    static random(min: number = 0, max: number = 1): number {
        return Math.random() * (max - min) + min;
    }

    /**
   * 生成指定范围内的随机整数
   * @param min 最小值（包含）
   * @param max 最大值（包含）
   * @returns 随机整数
   */
    static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
   * 随机选择数组中的一个元素
   * @param array 数组
   * @returns 随机元素
   */
    static randomChoice<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
   * 生成随机布尔值
   * @param probability 为true的概率（0到1），默认0.5
   * @returns 随机布尔值
   */
    static randomBoolean(probability: number = 0.5): boolean {
        return Math.random() < probability;
    }

    /**
   * 生成单位圆内的随机点
   * @returns 随机向量
   */
    static randomInUnitCircle(): Vector2 {
        const angle = Math.random() * MathUtils.TWO_PI;
        const radius = Math.sqrt(Math.random());
        return Vector2.fromPolar(radius, angle);
    }

    /**
   * 生成单位圆上的随机点
   * @returns 随机单位向量
   */
    static randomOnUnitCircle(): Vector2 {
        const angle = Math.random() * MathUtils.TWO_PI;
        return Vector2.fromAngle(angle);
    }

    // 数学函数

    /**
   * 快速平方根倒数（用于归一化）
   * @param value 输入值
   * @returns 平方根倒数
   */
    static fastInverseSqrt(value: number): number {
    // 简化版本，现代JavaScript引擎优化很好
        return 1 / Math.sqrt(value);
    }

    /**
   * 快速幂运算（整数指数）
   * @param base 底数
   * @param exponent 指数（整数）
   * @returns 幂运算结果
   */
    static fastPow(base: number, exponent: number): number {
        if (exponent === 0) return 1;
        if (exponent === 1) return base;
        if (exponent === 2) return base * base;
        if (exponent === 3) return base * base * base;

        return Math.pow(base, exponent);
    }

    /**
   * 阶乘
   * @param n 非负整数
   * @returns 阶乘结果
   */
    static factorial(n: number): number {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;

        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    /**
   * 最大公约数
   * @param a 整数a
   * @param b 整数b
   * @returns 最大公约数
   */
    static gcd(a: number, b: number): number {
        a = Math.abs(Math.floor(a));
        b = Math.abs(Math.floor(b));

        while (b !== 0) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }

    /**
   * 最小公倍数
   * @param a 整数a
   * @param b 整数b
   * @returns 最小公倍数
   */
    static lcm(a: number, b: number): number {
        return Math.abs(a * b) / MathUtils.gcd(a, b);
    }

    // 序列和级数

    /**
   * 斐波那契数列
   * @param n 项数
   * @returns 第n项斐波那契数
   */
    static fibonacci(n: number): number {
        if (n <= 0) return 0;
        if (n === 1) return 1;

        let a = 0, b = 1;
        for (let i = 2; i <= n; i++) {
            const temp = a + b;
            a = b;
            b = temp;
        }
        return b;
    }

    /**
   * 等差数列求和
   * @param first 首项
   * @param last 末项
   * @param count 项数
   * @returns 等差数列和
   */
    static arithmeticSum(first: number, last: number, count: number): number {
        return (first + last) * count * 0.5;
    }

    /**
   * 等比数列求和
   * @param first 首项
   * @param ratio 公比
   * @param count 项数
   * @returns 等比数列和
   */
    static geometricSum(first: number, ratio: number, count: number): number {
        if (Math.abs(ratio - 1) < MathUtils.EPSILON) {
            return first * count;
        }
        return first * (1 - Math.pow(ratio, count)) / (1 - ratio);
    }

    // 曲线和插值

    /**
   * 贝塞尔二次曲线
   * @param p0 控制点0
   * @param p1 控制点1
   * @param p2 控制点2
   * @param t 参数（0到1）
   * @returns 曲线上的点
   */
    static quadraticBezier(p0: Vector2, p1: Vector2, p2: Vector2, t: number): Vector2 {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;

        return new Vector2(
            uu * p0.x + 2 * u * t * p1.x + tt * p2.x,
            uu * p0.y + 2 * u * t * p1.y + tt * p2.y
        );
    }

    /**
   * 贝塞尔三次曲线
   * @param p0 控制点0
   * @param p1 控制点1
   * @param p2 控制点2
   * @param p3 控制点3
   * @param t 参数（0到1）
   * @returns 曲线上的点
   */
    static cubicBezier(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, t: number): Vector2 {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;

        return new Vector2(
            uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
            uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
        );
    }

    /**
   * Catmull-Rom样条插值
   * @param p0 控制点0
   * @param p1 控制点1
   * @param p2 控制点2
   * @param p3 控制点3
   * @param t 参数（0到1）
   * @returns 插值结果点
   */
    static catmullRom(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, t: number): Vector2 {
        const t2 = t * t;
        const t3 = t2 * t;

        const x = 0.5 * (
            (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        );

        const y = 0.5 * (
            (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );

        return new Vector2(x, y);
    }

    // 噪声函数

    /**
   * 简单伪随机噪声（基于种子）
   * @param x 输入X
   * @param y 输入Y
   * @param seed 种子
   * @returns 噪声值（0到1）
   */
    static noise(x: number, y: number = 0, seed: number = 0): number {
        const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
        return n - Math.floor(n);
    }

    /**
   * 平滑噪声
   * @param x 输入X
   * @param y 输入Y
   * @param seed 种子
   * @returns 平滑噪声值（0到1）
   */
    static smoothNoise(x: number, y: number = 0, seed: number = 0): number {
        const intX = Math.floor(x);
        const intY = Math.floor(y);
        const fracX = x - intX;
        const fracY = y - intY;

        const a = MathUtils.noise(intX, intY, seed);
        const b = MathUtils.noise(intX + 1, intY, seed);
        const c = MathUtils.noise(intX, intY + 1, seed);
        const d = MathUtils.noise(intX + 1, intY + 1, seed);

        const i1 = MathUtils.lerp(a, b, fracX);
        const i2 = MathUtils.lerp(c, d, fracX);

        return MathUtils.lerp(i1, i2, fracY);
    }

    // 实用工具

    /**
   * 将数值转换为指定精度
   * @param value 数值
   * @param precision 精度（小数位数）
   * @returns 转换后的数值
   */
    static toPrecision(value: number, precision: number): number {
        const factor = Math.pow(10, precision);
        return Math.round(value * factor) / factor;
    }

    /**
   * 检查数值是否在指定范围内
   * @param value 数值
   * @param min 最小值
   * @param max 最大值
   * @returns 是否在范围内
   */
    static inRange(value: number, min: number, max: number): boolean {
        return value >= min && value <= max;
    }

    /**
   * 获取数组中的最小值
   * @param values 数值数组
   * @returns 最小值
   */
    static min(...values: number[]): number {
        return Math.min(...values);
    }

    /**
   * 获取数组中的最大值
   * @param values 数值数组
   * @returns 最大值
   */
    static max(...values: number[]): number {
        return Math.max(...values);
    }

    /**
   * 计算数组的平均值
   * @param values 数值数组
   * @returns 平均值
   */
    static average(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    /**
   * 计算数组的中位数
   * @param values 数值数组
   * @returns 中位数
   */
    static median(values: number[]): number {
        if (values.length === 0) return 0;

        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        return sorted[middle];
    }
}
