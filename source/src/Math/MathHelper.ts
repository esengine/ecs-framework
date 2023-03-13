module es {
    export class MathHelper {
        public static readonly Epsilon: number = 0.00001;
        public static readonly Rad2Deg = 57.29578;
        public static readonly Deg2Rad = 0.0174532924;
        /**
         * 表示pi除以2的值(1.57079637)
         */
        public static readonly PiOver2 = Math.PI / 2;

        /**
         * 将弧度转换成角度。
         * @param radians 用弧度表示的角
         */
        public static toDegrees(radians: number) {
            return radians * 57.295779513082320876798154814105;
        }

        /**
         * 将角度转换为弧度
         * @param degrees
         */
        public static toRadians(degrees: number) {
            return degrees * 0.017453292519943295769236907684886;
        }

        /**
         * 计算三角形上给定两个归一化重心坐标所确定点在某个轴上的笛卡尔坐标
         * @param value1 三角形上某个顶点在该轴上的笛卡尔坐标
         * @param value2 三角形上另一个顶点在该轴上的笛卡尔坐标
         * @param value3 三角形上第三个顶点在该轴上的笛卡尔坐标
         * @param amount1 第一个重心坐标，即点相对于三角形边2的面积比例
         * @param amount2 第二个重心坐标，即点相对于三角形边1的面积比例
         * @returns 计算出的点在该轴上的笛卡尔坐标
         */
        public static barycentric(value1: number, value2: number, value3: number, amount1: number, amount2: number) {
            // 计算边2上的点的笛卡尔坐标
            const point2 = value2 + (value3 - value2) * amount2;

            // 计算从边1起点到点的向量
            const vector = (point2 - value1) * (amount1 / (1 - amount1));

            // 返回点在该轴上的笛卡尔坐标
            return value1 + vector;
        }

        /**
         * 使用Catmull-Rom插值算法在指定的四个数值之间进行插值，返回给定位置的插值结果
         * @param value1 插值范围中的第一个数据点
         * @param value2 插值范围中的第二个数据点
         * @param value3 插值范围中的第三个数据点
         * @param value4 插值范围中的第四个数据点
         * @param amount 插值位置的值，取值范围为[0, 1]，表示该位置在value2和value3之间的相对位置
         * @returns 经过Catmull-Rom插值计算后在给定位置的插值结果
         */
        public static catmullRom(value1: number, value2: number, value3: number, value4: number, amount: number) {
            // 计算输入参数amount的平方和立方值
            const amountSquared = amount * amount;
            const amountCubed = amountSquared * amount;

            // 使用Catmull-Rom插值算法计算插值结果
            const p0 = (-value1 + 3 * value2 - 3 * value3 + value4) / 2;
            const p1 = 2 * value1 - 5 * value2 + 4 * value3 - value4 / 2;
            const p2 = (-value1 + value3) / 2;
            const p3 = (value2 - value1 + value3 - value4) / 2;
            return p0 * amountCubed + p1 * amountSquared + p2 * amount + p3;
        }

        /**
         * 对给定值进行范围映射。
         * @param value 要映射的值。
         * @param leftMin 输入范围的最小值。
         * @param leftMax 输入范围的最大值。
         * @param rightMin 输出范围的最小值。
         * @param rightMax 输出范围的最大值。
         * @returns 映射后的值。
         */
        public static map(value: number, leftMin: number, leftMax: number, rightMin: number, rightMax: number) {
            // 使用线性插值公式进行映射
            return rightMin + (value - leftMin) * (rightMax - rightMin) / (leftMax - leftMin);
        }

        /**
         * 将值从任意范围映射到0到1范围 
         * @param value 
         * @param min 
         * @param max 
         * @returns 
         */
        public static map01(value: number, min: number, max: number) {
            return (value - min) * 1 / (max - min);
        }

        /**
         * 接收一个值value和两个边界min和max作为参数。它将value映射到0到1的范围内，然后返回1减去该结果的值，因此该函数的结果将在1到0之间
         * @param value 
         * @param min 
         * @param max 
         * @returns 
         */
        public static map10(value: number, min: number, max: number) {
            // 将 value 映射到 0 到 1 的范围内
            const mappedValue = this.map01(value, min, max);
            // 返回 1 减去 mappedValue 的值，结果将在 1 到 0 之间
            return 1 - mappedValue;
        }

        /**
         * 在两个值之间进行平滑的线性插值。与 lerp 相似，但具有平滑过渡的特点，当 t 在 0 和 1 之间时，返回 [value1, value2] 之间平滑插值后的结果。
         * @param value1 起始值
         * @param value2 结束值
         * @param amount 插值的程度，范围在 0 到 1 之间。
         * @returns 两个值之间进行平滑的线性插值后的结果。
         */
        public static smoothStep(value1: number, value2: number, amount: number): number {
            amount = this.clamp01(amount); // 将 amount 的值限制在 0 到 1 之间
            amount = this.hermite(value1, 0, value2, 0, amount); // 使用 hermite 函数进行平滑插值
            return amount; // 返回插值后的结果
        }

        /**
         * 将给定角度减小到π到-π之间的值
         * @param angle 给定角度值
         * @returns 减小后的角度值，保证在[-π, π]的范围内
         */
        public static wrapAngle(angle: number) {
            // 将角度值限制在[-2π, 2π]的范围内，这样可以保证取余运算得到的结果始终为正数
            const angleMod = (angle + 2 * Math.PI) % (2 * Math.PI);

            // 如果计算出的余数大于π，则将其减去2π，使得结果在[-π, π]的范围内
            if (angleMod > Math.PI) {
                return angleMod - 2 * Math.PI;
            } else {
                return angleMod;
            }
        }

        /**
         * 判断给定的数值是否是2的幂
         * @param value 
         * @returns 
         */
        public static isPowerOfTwo(value: number) {
            // 确保值大于0
            if (value <= 0) {
                return false;
            }
        
            // 检查是否为2的幂
            return (value & (value - 1)) == 0;
        }

        /**
         * 线性插值
         * @param from 
         * @param to 
         * @param t 
         * @returns 
         */
        public static lerp(from: number, to: number, t: number): number {
            // 计算在 from 和 to 之间 t 所占的比例
            const clampedT = MathHelper.clamp01(t);
            // 计算 from 到 to 的差值，再乘以比例，得到从 from 到 to 之间 t 所在的位置
            return from + (to - from) * clampedT;
        }

        /**
         * 线性插值前检查两个数的差是否小于一个给定的epsilon值，如果小于，则直接返回结束值b，否则执行线性插值并返回插值结果。
         * @param a 起始值
         * @param b 结束值
         * @param t 插值因子
         * @param epsilon 差值阈值，当两个数的差小于epsilon时直接返回结束值b。
         * @returns 如果a和b的差小于给定的epsilon值，则返回b，否则返回a到b的插值结果。
         */
        public static betterLerp(a: number, b: number, t: number, epsilon: number): number {
            return Math.abs(a - b) < epsilon ? b : MathHelper.lerp(a, b, t);
        }

        /**
         * 在两个角度之间进行插值，使用角度值表示角度
         * @param a 起始角度
         * @param b 结束角度
         * @param t 插值比例，范围[0, 1]
         * @returns 两个角度之间插值后的角度，使用角度值表示
         */
        public static lerpAngle(a: number, b: number, t: number): number {
            // 计算从a到b的差值，对于超过360的值，需要进行修正
            let deltaAngle = this.repeat(b - a, 360);
            if (deltaAngle > 180) {
                deltaAngle -= 360;
            }

            // 返回经过插值后的角度
            return a + deltaAngle * this.clamp01(t);
        }

        /**
         * 在两个角度之间进行插值，使用弧度值表示角度
         * @param a 起始角度
         * @param b 结束角度
         * @param t 插值比例，范围[0, 1]
         * @returns 两个角度之间插值后的角度，使用弧度值表示
         */
        public static lerpAngleRadians(a: number, b: number, t: number): number {
            // 计算从a到b的差值，对于超过2π的值，需要进行修正
            let deltaAngle = this.repeat(b - a, Math.PI * 2);
            if (deltaAngle > Math.PI) {
                deltaAngle -= Math.PI * 2;
            }

            // 返回经过插值后的角度
            return a + deltaAngle * this.clamp01(t);
        }

        /**
         * 指定长度上来回“弹跳”（ping-pong）一个变量
         * 因为弹跳的过程是来回循环的。最后，根据t在弹跳过程中相对于length的位置
         * @param t 变量的当前值
         * @param length 指定的长度
         * @returns 0到length之间变化的值
         */
        public static pingPong(t: number, length: number) {
            // 将t的值限制在0到length*2的范围内
            t = this.repeat(t, length * 2);
            // 返回length和t-length的差的绝对值
            return length - Math.abs(t - length);
        }

        /**
         * 当value的绝对值大于等于threshold时返回value的符号，否则返回0
         * @param value - 输入的值
         * @param threshold - 阈值
         * @returns value的符号或0
         */
        public static signThreshold(value: number, threshold: number) {
            if (Math.abs(value) >= threshold) // 如果绝对值大于等于阈值
                return Math.sign(value); // 返回value的符号
            else
                return 0; // 否则返回0
        }

        /**
         * 计算t值在[from, to]区间内的插值比例
         * @param from 插值区间的起点
         * @param to 插值区间的终点
         * @param t 需要计算插值比例的数值
         * @returns t值在[from, to]区间内的插值比例，取值范围在[0, 1]之间
         */
        public static inverseLerp(from: number, to: number, t: number) {
            // 计算插值区间的长度
            const length = to - from;

            // 如果插值区间的长度为0，则返回0
            if (length === 0) {
                return 0;
            }

            // 计算t在插值区间中的相对位置，并返回插值比例
            return (t - from) / length;
        }

        /**
         * 精确的线性插值，避免出现累积误差
         * @param value1 起始值
         * @param value2 结束值
         * @param amount 插值比例
         * @returns 两个值的线性插值结果
         */
        public static lerpPrecise(value1: number, value2: number, amount: number) {
            return ((1 - amount) * value1) + (value2 * amount);
        }

        /**
         * 将给定值限制在指定范围内
         * @param value 需要被限制的值
         * @param min 最小值
         * @param max 最大值
         * @returns 限制后的值
         */
        public static clamp(value: number, min: number, max: number): number {
            if (value < min) { // 如果值小于最小值，则返回最小值
                return min;
            } else if (value > max) { // 如果值大于最大值，则返回最大值
                return max;
            } else { // 否则返回原始值
                return value;
            }
        }

        /**
         * 按照指定增量取整到最接近的整数倍数
         * @param value 
         * @param increment 
         * @returns 
         */
        public static snap(value: number, increment: number) {
            // 将给定值除以增量取整后再乘以增量，得到最接近给定值的整数倍
            return Math.round(value / increment) * increment;
        }

        /**
         * 如果值为偶数，返回true
         * @param value
         */
        public static isEven(value: number) {
            return value % 2 == 0;
        }

        /**
         * 如果值是奇数，则返回true 
         * @param value 
         * @returns 
         */
        public static isOdd(value: number) {
            return value % 2 != 0;
        }

        /**
         * 将数值四舍五入到最接近的整数，并计算四舍五入的数量
         * @param value 要四舍五入的数值
         * @param roundedAmount 用于存储四舍五入的数量的参数
         * @returns 四舍五入后的整数
         */
        public static roundWithRoundedAmount(value: number, roundedAmount: Ref<number>): number {
            let rounded = Math.round(value);
            roundedAmount.value = value - (rounded * Math.round(value / rounded));
            return rounded;
        }

        /**
         * 将一个数值限制在 [0,1] 范围内
         * @param value 要限制的数值
         * @returns 限制后的数值
         */
        public static clamp01(value: number): number {
            if (value < 0)
                return 0;

            if (value > 1)
                return 1;

            return value;
        }

        /**
         * 计算从一个向量到另一个向量之间的角度
         * @param from 起始向量
         * @param to 目标向量
         * @returns 两个向量之间的角度（弧度制）
         */
        public static angleBetweenVectors(from: Vector2, to: Vector2): number {
            // 使用 Math.atan2() 方法计算出两个向量之间的夹角，返回的是弧度制角度
            return Math.atan2(to.y - from.y, to.x - from.x);
        }

        /**
         * 将极角和极径转换为向量坐标
         * @param angleRadians 极角弧度值
         * @param length 极径长度
         * @returns 对应向量坐标
         */
        public static angleToVector(angleRadians: number, length: number): Vector2 {
            // 根据给定的极角弧度值，使用三角函数计算出向量的x坐标和y坐标
            const x = Math.cos(angleRadians) * length;
            const y = Math.sin(angleRadians) * length;

            // 使用上一步得到的坐标值创建一个新的Vector2对象并返回
            return new Vector2(x, y);
        }

        /**
         * 将一个数加上1，并在结果等于指定长度时将其设置为0
         * @param t 要加上1的数
         * @param length 指定长度
         * @returns 加上1后的结果，如果等于指定长度，则为0
         */
        public static incrementWithWrap(t: number, length: number): number {
            // 将给定数t加上1。
            t++;

            // 如果结果等于指定长度，则返回0。
            if (t == length) {
                return 0;
            }

            // 否则，返回结果。
            return t;
        }

        /**
         * 将一个数减去1，并在结果小于0时将其设置为指定长度减去1
         * @param t 要减去1的数
         * @param length 指定长度
         * @returns 减去1后的结果，如果小于0，则为指定长度减去1
         */
        public static decrementWithWrap(t: number, length: number): number {
            // 将给定数t减去1。
            t--;

            // 如果结果小于0，则返回指定长度减去1。
            if (t < 0) {
                return length - 1;
            }

            // 否则，返回结果。
            return t;
        }

        /**
         * 计算直角三角形斜边长度，即求两个数的欧几里得距离
         * @param x 直角三角形的一条直角边
         * @param y 直角三角形的另一条直角边
         * @returns 三角形斜边长度
         */
        public static hypotenuse(x: number, y: number): number {
            // 将x的平方与y的平方相加。
            let sumOfSquares = x * x + y * y;

            // 对和进行平方根运算。
            let result = Math.sqrt(sumOfSquares);

            // 返回结果。
            return result;
        }

        /**
         * 计算大于给定数字的最小二次幂
         * @param x 给定数字
         * @returns 大于给定数字的最小二次幂
         */
        public static closestPowerOfTwoGreaterThan(x: number): number {
            x--; // 将给定数字减1，得到一个二进制数的掩码。
            x |= (x >> 1); // 将掩码的右侧一半全部设置为1。
            x |= (x >> 2);
            x |= (x >> 4);
            x |= (x >> 8);
            x |= (x >> 16); // 连续将掩码右移，并将右侧一半全部设置为1，直到得到一个全为1的掩码。
            return (x + 1); // 将全为1的掩码加1，得到的结果就是大于给定数字的最小二次幂。
        }

        /**
         * 将数字舍入到最接近的指定值
         * @param value 需要被舍入的数字
         * @param roundToNearest 指定的舍入值
         * @returns 舍入后的结果
         */
        public static roundToNearest(value: number, roundToNearest: number): number {
            const quotient: number = value / roundToNearest; // 将数字除以指定值，得到商。
            const roundedQuotient: number = Math.round(quotient); // 将商四舍五入到最接近的整数。
            const result: number = roundedQuotient * roundToNearest; // 将舍入后的整数乘以指定值，得到最终结果。
            return result;
        }

        /**
         * 判断给定值是否接近于零
         * @param value 给定值
         * @param ep 阈值（可选，默认为Epsilon）
         * @returns 如果接近于零，返回true，否则返回false
         */
        public static withinEpsilon(value: number, ep: number = this.Epsilon): boolean {
            // 判断给定值的绝对值是否小于给定的阈值ep。
            return Math.abs(value) < ep;
        }

        /**
         * 逐渐逼近目标值
         * @param start 起始值
         * @param end 目标值
         * @param shift 逼近步长
         * @returns 逼近后的值
         */
        public static approach(start: number, end: number, shift: number): number {
            // 判断起始值是否小于目标值。
            if (start < end) {
                // 如果是，返回起始值加上shift和目标值中的较小值。
                return Math.min(start + shift, end);
            }

            // 如果不是，返回起始值减去shift和目标值中的较大值。
            return Math.max(start - shift, end);
        }

        /**
         * 逐渐逼近目标角度
         * @param start 起始角度
         * @param end 目标角度
         * @param shift 逼近步长
         * @returns 最终角度
         */
        public static approachAngle(start: number, end: number, shift: number): number {
            // 调用this.deltaAngle()方法，获取起始角度和目标角度之间的夹角。
            let deltaAngle: number = this.deltaAngle(start, end);

            // 判断夹角是否小于等于shift，如果是，直接返回目标角度。
            if (-shift < deltaAngle && deltaAngle < shift) {
                return end;
            }

            // 如果夹角大于shift，则调用this.approach()方法，逐渐逼近目标角度。
            let newAngle: number = this.approach(start, start + deltaAngle, shift);

            // 通过调用this.repeat()方法，将最终的角度限制在0到360度之间。
            newAngle = this.repeat(newAngle, 360);

            // 返回最终的角度。
            return newAngle;
        }

        /**
         * 计算向量在另一个向量上的投影向量
         * @param self 要投影的向量
         * @param other 目标向量
         * @returns 投影向量
         */
        public static project(self: Vector2, other: Vector2): Vector2 {
            // 通过调用Vector2.dot()方法，计算出self向量和other向量的点积。
            let amt: number = self.dot(other) / other.lengthSquared();

            // 通过调用Vector2.lengthSquared()方法，计算出other向量的长度的平方。
            // 将点积除以长度的平方，得到self向量在other向量上的投影长度。
            // 通过调用Vector2.scale()方法，将投影长度与other向量的方向向量相乘，得到投影向量。
            let vec: Vector2 = other.scale(amt);

            // 返回投影向量。
            return vec;
        }

        /**
         * 逐渐接近目标角度
         * @param start 当前角度值（弧度制）
         * @param end 目标角度值（弧度制）
         * @param shift 每次逐渐接近目标角度的增量（弧度制）
         * @returns 逐渐接近目标角度后的角度值（弧度制）
         */
        public static approachAngleRadians(start: number, end: number, shift: number): number {
            // 通过调用deltaAngleRadians()方法，计算出当前角度值和目标角度值之间的弧度差值。
            let deltaAngleRadians: number = this.deltaAngleRadians(start, end);

            // 如果弧度差值的绝对值小于shift，则返回目标角度值。
            if (-shift < deltaAngleRadians && deltaAngleRadians < shift) {
                return end;
            }

            // 否则，通过调用approach()方法，逐渐将当前角度值接近目标角度值。
            let result: number = this.approach(start, start + deltaAngleRadians, shift);

            // 将计算结果使用repeat()方法转换成[0, 2π)之间的角度值，并返回。
            return this.repeat(result, Math.PI * 2);
        }

        /**
         * 判断两个数值是否在指定公差内近似相等
         * @param value1 第一个数值
         * @param value2 第二个数值
         * @param tolerance 指定公差，默认为 Epsilon 常量
         * @returns 是否在指定公差内近似相等
         */
        public static approximately(value1: number, value2: number, tolerance: number = this.Epsilon): boolean {
            // 计算两个数值之差的绝对值是否小于等于指定公差。
            return Math.abs(value1 - value2) <= tolerance;
        }

        /**
         * 计算两个角度值之间的角度差值
         * @param current 当前角度值
         * @param target 目标角度值
         * @returns 角度差值
         */
        public static deltaAngle(current: number, target: number): number {
            // 通过调用repeat()方法，计算出当前角度值和目标角度值之间的差值。
            let num: number = this.repeat(target - current, 360);

            // 如果差值大于180度，则将差值减去360度，得到[-180度, 180度]之间的差值。
            if (num > 180) {
                num -= 360;
            }

            // 返回差值。
            return num;
        }

        /**
         * 判断给定数值是否在指定区间内
         * @param value 给定数值
         * @param min 区间最小值
         * @param max 区间最大值
         * @returns 是否在指定区间内
         */
        public static between(value: number, min: number, max: number): boolean {
            // 比较给定数值是否大于等于最小值并且小于等于最大值。
            return value >= min && value <= max;
        }

        /**
         * 计算两个弧度值之间的角度差值
         * @param current 当前弧度值
         * @param target 目标弧度值
         * @returns 角度差值
         */
        public static deltaAngleRadians(current: number, target: number): number {
            // 通过调用repeat()方法，计算出当前弧度值和目标弧度值之间的差值。
            let num: number = this.repeat(target - current, 2 * Math.PI);

            // 如果差值大于π，则将差值减去2π，得到[-π, π]之间的差值。
            if (num > Math.PI) {
                num -= 2 * Math.PI;
            }

            // 返回差值。
            return num;
        }

        /**
         * 将给定的数值限定在一个循环范围内
         * @param t 给定的数值
         * @param length 循环范围长度
         * @returns 限定在循环范围内的数值
         */
        public static repeat(t: number, length: number): number {
            // 计算给定数值除以循环范围长度的整数部分，即循环次数。
            const num: number = Math.floor(t / length);

            // 用给定数值减去循环次数乘以循环范围长度，得到限定在循环范围内的数值。
            const result: number = t - num * length;

            // 返回限定后的数值。
            return result;
        }

        /**
         * 将给定的浮点数向下取整为整数
         * @param f 给定的浮点数
         * @returns 向下取整后的整数
         */
        public static floorToInt(f: number): number {
            // 使用Math.floor()方法，将给定的浮点数向下取整为最接近它的小于等于它的整数。
            const flooredValue: number = Math.floor(f);

            // 调用toInt()方法，将结果转换为整数类型。
            return this.toInt(flooredValue);
        }

        /**
         * 绕着一个点旋转
         * @param position 原点坐标
         * @param speed 旋转速度
         * @returns 经过旋转后的点坐标
         */
        public static rotateAround(position: Vector2, speed: number): Vector2 {
            // 计算旋转角度，使用当前时间与旋转速度的乘积作为参数进行计算。
            const angleInRadians: number = Time.totalTime * speed;

            // 通过三角函数，计算出在当前时间下，距离原点为1的点在x轴和y轴上的坐标值。
            const cosValue: number = Math.cos(angleInRadians);
            const sinValue: number = Math.sin(angleInRadians);

            // 将计算出的x轴和y轴的坐标值加上原点的坐标值，得到旋转后的点的坐标值。
            const rotatedX: number = position.x + cosValue;
            const rotatedY: number = position.y + sinValue;

            // 创建一个新的Vector2对象，将上面得到的旋转后的点的坐标值作为参数，返回该对象。
            return new Vector2(rotatedX, rotatedY);
        }

        /**
         * 绕给定中心点旋转指定角度后得到的新点坐标
         * @param point 要旋转的点的坐标
         * @param center 旋转中心点的坐标
         * @param angleIndegrees 旋转的角度，单位为度
         * @returns 旋转后的新点的坐标，返回值类型为Vector2
         */
        public static rotateAround2(point: Vector2, center: Vector2, angleIndegrees: number) {
            const { x: cx, y: cy } = center;
            const { x: px, y: py } = point;

            const angleInRadians = this.toRadians(angleIndegrees); // 将角度值转换为弧度值
            const cos = Math.cos(angleInRadians); // 计算cos值
            const sin = Math.sin(angleInRadians); // 计算sin值

            const rotatedX = cos * (px - cx) - sin * (py - cy) + cx; // 计算旋转后的新点的x坐标
            const rotatedY = sin * (px - cx) + cos * (py - cy) + cy; // 计算旋转后的新点的y坐标

            return new Vector2(rotatedX, rotatedY); // 返回旋转后的新点的坐标
        }

        /**
         * 计算以给定点为圆心、给定半径的圆上某一点的坐标
         * @param circleCenter 圆心坐标
         * @param radius 圆半径
         * @param angleInDegrees 角度值（度数制）
         * @returns 计算出的圆上某一点的坐标
         */
        public static pointOnCircle(circleCenter: Vector2, radius: number, angleInDegrees: number): Vector2 {
            // 将给定角度值转换为弧度值，以便使用三角函数计算坐标值。
            const radians: number = this.toRadians(angleInDegrees);

            // 根据弧度值，通过三角函数（cos和sin）计算出该角度对应的x和y坐标的值（其中x坐标对应cos值，y坐标对应sin值）。
            const x: number = Math.cos(radians) * radius;
            const y: number = Math.sin(radians) * radius;

            // 将x坐标值乘以半径，再加上圆心的x坐标，得到该点在x轴上的绝对坐标。
            const absoluteX: number = x + circleCenter.x;
            // 将y坐标值乘以半径，再加上圆心的y坐标，得到该点在y轴上的绝对坐标。
            const absoluteY: number = y + circleCenter.y;

            // 创建一个新的Vector2对象，将上面得到的x和y坐标作为参数，返回该对象。
            return new Vector2(absoluteX, absoluteY);
        }

        /**
         * 计算以给定点为圆心、给定半径的圆上某一点的坐标
         * @param circleCenter 圆心坐标
         * @param radius 圆半径
         * @param angleInRadians 角度值（弧度制）
         * @returns 计算出的圆上某一点的坐标
         */
        public static pointOnCircleRadians(circleCenter: Vector2, radius: number, angleInRadians: number): Vector2 {
            // 根据给定角度值，通过三角函数（cos和sin）计算出该角度对应的x和y坐标的值（其中x坐标对应cos值，y坐标对应sin值）。
            const x: number = Math.cos(angleInRadians) * radius;
            const y: number = Math.sin(angleInRadians) * radius;
            
            // 将x坐标值乘以半径，再加上圆心的x坐标，得到该点在x轴上的绝对坐标。
            const absoluteX: number = x + circleCenter.x;
            // 将y坐标值乘以半径，再加上圆心的y坐标，得到该点在y轴上的绝对坐标。
            const absoluteY: number = y + circleCenter.y;

            // 创建一个新的Vector2对象，将上面得到的x和y坐标作为参数，返回该对象。
            return new Vector2(absoluteX, absoluteY);
        }

        /**
         * 生成一个Lissajous曲线上的点的坐标
         * @param xFrequency x方向上的频率，默认值为2
         * @param yFrequency y方向上的频率，默认值为3
         * @param xMagnitude x方向上的振幅，默认值为1
         * @param yMagnitude y方向上的振幅，默认值为1
         * @param phase 相位，默认值为0
         * @returns 在Lissajous曲线上的点的坐标，返回值类型为Vector2
         */
        public static lissajou(xFrequency = 2, yFrequency = 3, xMagnitude = 1, yMagnitude = 1, phase = 0) {
            const x = Math.sin(Time.totalTime * xFrequency + phase) * xMagnitude; // 计算x方向上的坐标
            const y = Math.cos(Time.totalTime * yFrequency) * yMagnitude; // 计算y方向上的坐标

            return new Vector2(x, y); // 返回在Lissajous曲线上的点的坐标
        }

        /**
         * 生成阻尼的 Lissajous 曲线
         * @param xFrequency x 轴上的频率
         * @param yFrequency y 轴上的频率
         * @param xMagnitude x 轴上的振幅
         * @param yMagnitude y 轴上的振幅
         * @param phase x 轴相位差
         * @param damping 阻尼值
         * @param oscillationInterval 振荡间隔
         */
        public static lissajouDamped(
            xFrequency: number = 2,
            yFrequency: number = 3,
            xMagnitude: number = 1,
            yMagnitude: number = 1,
            phase: number = 0.5,
            damping: number = 0,
            oscillationInterval: number = 5
        ): Vector2 {
            // 将时间戳限制在振荡间隔内
            const wrappedTime = this.pingPong(Time.totalTime, oscillationInterval);

            // 计算阻尼值
            const damped = Math.pow(Math.E, -damping * wrappedTime);

            // 计算 x 和 y 方向上的振荡值
            const x = damped * Math.sin(Time.totalTime * xFrequency + phase) * xMagnitude;
            const y = damped * Math.cos(Time.totalTime * yFrequency) * yMagnitude;

            // 返回二维向量
            return new Vector2(x, y);
        }

        /**
         * 计算在曲线上特定位置的值。
         * @param value1 第一个插值点的值
         * @param tangent1 第一个插值点的切线或方向向量
         * @param value2 第二个插值点的值
         * @param tangent2 第二个插值点的切线或方向向量
         * @param amount 在这两个点之间进行插值的位置
         * @returns 在曲线上特定位置的值
         */
        public static hermite(value1: number, tangent1: number, value2: number, tangent2: number, amount: number) {
            let s = amount;
            let sCubed = s * s * s;
            let sSquared = s * s;

            // 如果在第一个插值点，直接返回第一个插值点的值
            if (amount === 0) {
                return value1;
            }
            // 如果在第二个插值点，直接返回第二个插值点的值
            else if (amount === 1) {
                return value2;
            }

            // 否则，根据Hermite插值公式计算特定位置的值
            let v1 = value1, v2 = value2, t1 = tangent1, t2 = tangent2;
            let result = (2 * v1 - 2 * v2 + t2 + t1) * sCubed +
                (3 * v2 - 3 * v1 - 2 * t1 - t2) * sSquared +
                t1 * s +
                v1;

            return result;
        }

        /**
         * 判断给定的数字是否有效
         * 如果输入的数字是 NaN 或正无穷大，该函数将返回 false；否则返回 true
         * @param x 
         * @returns 
         */
        public static isValid(x: number): boolean {
            // 如果输入的数字是 NaN，返回 false
            if (Number.isNaN(x)) {
                return false;
            }
        
            // 如果输入的数字是正无穷大，返回 false
            // 注意，负无穷大在这里被认为是有效的数字
            if (x === Infinity) {
                return false;
            }
        
            // 如果输入的数字既不是 NaN，也不是正无穷大，返回 true
            return true;
        }

        /**
         * 平滑阻尼运动，将当前位置平滑过渡到目标位置，返回一个包含当前位置和当前速度的对象
         * @param current 当前位置
         * @param target 目标位置
         * @param currentVelocity 当前速度
         * @param smoothTime 平滑时间
         * @param maxSpeed 最大速度
         * @param deltaTime 时间增量
         * @returns 一个包含当前位置和当前速度的对象，类型为{ value: number; currentVelocity: number }
         */
        public static smoothDamp(current: number, target: number, currentVelocity: number, smoothTime: number, maxSpeed: number, deltaTime: number): { value: number; currentVelocity: number } {
            smoothTime = Math.max(0.0001, smoothTime); // 平滑时间至少为0.0001，避免出现除以0的情况
            const omega: number = 2 / smoothTime; // 根据平滑时间计算阻尼系数
            const x: number = omega * deltaTime; // 计算阻尼系数与时间增量的乘积
            const exp: number = 1 / (1 + 0.48 * x + 0.235 * x * x); // 计算阻尼比
            const maxDelta: number = maxSpeed * smoothTime; // 计算最大速度与平滑时间的乘积
            let delta: number = current - target; // 计算当前位置与目标位置之间的距离
            delta = MathHelper.clamp(delta, -maxDelta, maxDelta); // 将距离限制在最大速度和最大速度的相反数之间
            target = current - delta; // 计算新的目标位置
            const temp: number = (currentVelocity + omega * delta) * deltaTime; // 计算当前速度和阻尼力的和乘以时间增量
            currentVelocity = (currentVelocity - omega * temp) * exp; // 计算新的当前速度
            let newValue: number = target + (delta + temp) * exp; // 计算新的当前位置
            if (current > target === newValue > target) { // 如果新的当前位置超过了目标位置，则将当前位置设置为目标位置，并计算新的当前速度
                newValue = target;
                currentVelocity = (newValue - target) / deltaTime;
            }
            return { value: newValue, currentVelocity }; // 返回包含当前位置和当前速度的对象
        }

        /**
         * 平滑插值两个二维向量
         * @param current 当前向量
         * @param target 目标向量
         * @param currentVelocity 当前速度向量
         * @param smoothTime 平滑插值时间
         * @param maxSpeed 最大速度
         * @param deltaTime 帧间隔时间
         * @returns 插值后的结果向量
         */
        public static smoothDampVector(current: Vector2, target: Vector2, currentVelocity: Vector2, smoothTime: number, maxSpeed: number, deltaTime: number): Vector2 {
            const v = Vector2.zero; // 创建一个初始向量v，其x和y坐标都为0。

            // 对当前向量的x和y坐标进行平滑插值，得到插值结果和当前速度。
            const resX = this.smoothDamp(
                current.x,
                target.x,
                currentVelocity.x,
                smoothTime,
                maxSpeed,
                deltaTime
            );
            v.x = resX.value; // 将插值结果赋值给向量v的x坐标。
            currentVelocity.x = resX.currentVelocity; // 将当前速度赋值给向量currentVelocity的x坐标。

            const resY = this.smoothDamp(
                current.y,
                target.y,
                currentVelocity.y,
                smoothTime,
                maxSpeed,
                deltaTime
            );
            v.y = resY.value; // 将插值结果赋值给向量v的y坐标。
            currentVelocity.y = resY.currentVelocity; // 将当前速度赋值给向量currentVelocity的y坐标。

            return v; // 返回向量v。
        }

        /**
         * 将一个值从一个区间映射到另一个区间
         * @param value 需要映射的值
         * @param leftMin 所在区间的最小值
         * @param leftMax 所在区间的最大值
         * @param rightMin 需要映射到的目标区间的最小值
         * @param rightMax 需要映射到的目标区间的最大值
         * @returns 
         */
        public static mapMinMax(value: number, leftMin: number, leftMax: number, rightMin: number, rightMax: number): number {
            // 先将 value 限制在 [leftMin, leftMax] 区间内
            let clampedValue = MathHelper.clamp(value, leftMin, leftMax);
            // 计算映射到 [rightMin, rightMax] 区间内的值
            return rightMin + (clampedValue - leftMin) * (rightMax - rightMin) / (leftMax - leftMin);
        }

        /**
         * 返回一个给定角度的单位向量。角度被解释为弧度制。
         * @param angle - 给定角度，以弧度制表示。
         * @returns 一个新的已归一化的二维向量。
         */
        public static fromAngle(angle: number) {
            // 返回一个新的二维向量，其中x和y分别设置为给定角度的余弦和正弦值，然后进行归一化以产生单位向量。
            return new Vector2(Math.cos(angle), Math.sin(angle)).normalizeEqual();
        }

        /**
         * 将一个数字转换为最接近的整数
         * @param val 需要被转换的数字
         * @returns 最接近的整数
         */
        public static toInt(val: number): number {
            if (val > 0) { // 如果数字大于0，则向下舍入为最接近的整数。
                return Math.floor(val);
            } else { // 如果数字小于等于0，则向上舍入为最接近的整数。
                return Math.ceil(val);
            }
        }
    }
}
