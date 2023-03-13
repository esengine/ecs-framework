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
         * 将值（在leftMin-leftMax范围内）映射到一个在rightMin-rightMax范围内的值 
         * @param value
         * @param leftMin
         * @param leftMax
         * @param rightMin
         * @param rightMax
         */
        public static map(value: number, leftMin: number, leftMax: number, rightMin: number, rightMax: number) {
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
         * 将值从某个任意范围映射到1到0范围
         * 这相当于map01的取反
         * @param value 
         * @param min 
         * @param max 
         * @returns 
         */
        public static map10(value: number, min: number, max: number) {
            return 1 - this.map01(value, min, max);
        }

        /**
         * 使用三次方程在两个值之间进行插值
         * @param value1 
         * @param value2 
         * @param amount 
         */
        public static smoothStep(value1: number, value2: number, amount: number) {
            let result = this.clamp(amount, 0, 1);
            result = MathHelper.hermite(value1, 0, value2, 0, result);

            return result;
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
         * 确定值是否以2为底
         * @param value 
         * @returns 
         */
        public static isPowerOfTwo(value: number) {
            return (value > 0) && ((value % (value - 1)) == 0);
        }

        public static lerp(from: number, to: number, t: number) {
            return from + (to - from) * this.clamp01(t);
        }

        public static betterLerp(a: number, b: number, t: number, epsilon: number): number {
            return Math.abs(a - b) < epsilon ? b : MathHelper.lerp(a, b, t);
        }

        /**
         * 使度数的角度在a和b之间
         * 用于处理360度环绕 
         * @param a 
         * @param b 
         * @param t 
         * @returns 
         */
        public static lerpAngle(a: number, b: number, t: number) {
            let num = this.repeat(b - a, 360);
            if (num > 180)
                num -= 360;

            return a + num * this.clamp01(t);
        }

        /**
         * 使弧度的角度在a和b之间
         * @param a 
         * @param b 
         * @param t 
         * @returns 
         */
        public static lerpAngleRadians(a: number, b: number, t: number) {
            let num = this.repeat(b - a, Math.PI * 2);
            if (num > Math.PI)
                num -= Math.PI * 2;

            return a + num * this.clamp01(t);
        }

        /**
         * 循环t使其不大于长度且不小于0 
         * @param t 
         * @param length 
         * @returns 
         */
        public static pingPong(t: number, length: number) {
            t = this.repeat(t, length * 2);
            return length - Math.abs(t - length);
        }

        /**
         * 如果value> = threshold返回其符号，否则返回0 
         * @param value 
         * @param threshold 
         * @returns 
         */
        public static signThreshold(value: number, threshold: number) {
            if (Math.abs(value) >= threshold)
                return Math.sign(value);
            else
                return 0;
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
         * 在两个值之间线性插值
         * 此方法是MathHelper.Lerp的效率较低，更精确的版本。
         */
        public static lerpPrecise(value1: number, value2: number, amount: number) {
            return ((1 - amount) * value1) + (value2 * amount);
        }

        public static clamp(value: number, min: number, max: number) {
            if (value < min)
                return min;

            if (value > max)
                return max;

            return value;
        }

        public static snap(value: number, increment: number) {
            return Math.round(value / increment) * increment;
        }

        /**
         * 给定圆心、半径和角度，得到圆周上的一个点。0度是3点钟。
         * @param circleCenter
         * @param radius
         * @param angleInDegrees
         */
        public static pointOnCirlce(circleCenter: Vector2, radius: number, angleInDegrees: number) {
            let radians = MathHelper.toRadians(angleInDegrees);
            return new Vector2(Math.cos(radians) * radians + circleCenter.x,
                Math.sin(radians) * radians + circleCenter.y);
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
         * 将值四舍五入并返回它和四舍五入后的数值
         * @param value 
         * @param roundedAmount 
         * @returns 
         */
        public static roundWithRoundedAmount(value: number, roundedAmount: Ref<number>) {
            let rounded = Math.round(value);
            roundedAmount.value = value - (rounded * Math.round(value / rounded));
            return rounded;
        }

        /**
         * 数值限定在0-1之间
         * @param value
         */
        public static clamp01(value: number) {
            if (value < 0)
                return 0;

            if (value > 1)
                return 1;

            return value;
        }

        public static angleBetweenVectors(from: Vector2, to: Vector2) {
            return Math.atan2(to.y - from.y, to.x - from.x);
        }

        public static angleToVector(angleRadians: number, length: number) {
            return new Vector2(Math.cos(angleRadians) * length, Math.sin(angleRadians) * length);
        }

        /**
         * 增加t并确保它总是大于或等于0并且小于长度
         * @param t
         * @param length
         */
        public static incrementWithWrap(t: number, length: number) {
            t++;
            if (t == length)
                return 0;

            return t;
        }

        /**
         * 递减t并确保其始终大于或等于0且小于长度 
         * @param t 
         * @param length 
         * @returns 
         */
        public static decrementWithWrap(t: number, length: number) {
            t--;
            if (t < 0)
                return length - 1;

            return t;
        }

        /**
         * 返回sqrt（x * x + y * y） 
         * @param x 
         * @param y 
         * @returns 
         */
        public static hypotenuse(x: number, y: number) {
            return Math.sqrt(x * x + y * y);
        }

        public static closestPowerOfTwoGreaterThan(x: number) {
            x--;
            x |= (x >> 1);
            x |= (x >> 2);
            x |= (x >> 4);
            x |= (x >> 8);
            x |= (x >> 16);

            return (x + 1);
        }

        /**
         * 以roundToNearest为步长，将值舍入到最接近的数字。例如：在125中找到127到最近的5个结果
         * @param value 
         * @param roundToNearest 
         */
        public static roundToNearest(value: number, roundToNearest: number) {
            return Math.round(value / roundToNearest) * roundToNearest;
        }

        /**
         * 检查传递的值是否在某个阈值之下。对于小规模、精确的比较很有用
         * @param value 
         * @param ep 
         */
        public static withinEpsilon(value: number, ep: number = this.Epsilon) {
            return Math.abs(value) < ep;
        }

        /**
         * 由上移量向上移。start可以小于或大于end。例如:开始是2，结束是10，移位是4，结果是6
         * @param start
         * @param end
         * @param shift
         */
        public static approach(start: number, end: number, shift: number): number {
            if (start < end)
                return Math.min(start + shift, end);

            return Math.max(start - shift, end);
        }

        /**
         * 通过偏移量钳位结果并选择最短路径，将起始角度向终止角度移动，起始值可以小于或大于终止值。 
         * 示例1：开始是30，结束是100，移位是25，结果为55
         * 示例2：开始是340，结束是30，移位是25，结果是5（365换为5） 
         * @param start 
         * @param end 
         * @param shift 
         * @returns 
         */
        public static approachAngle(start: number, end: number, shift: number) {
            let deltaAngle = this.deltaAngle(start, end);
            if (-shift < deltaAngle && deltaAngle < shift)
                return end;

            return this.repeat(this.approach(start, start + deltaAngle, shift), 360);
        }

        /**
         * 将 Vector 投影到另一个 Vector 上
         * @param other 
         */
        public static project(self: Vector2, other: Vector2) {
            let amt = self.dot(other) / other.lengthSquared();
            let vec = other.scale(amt);
            return vec;
        }

        /**
         * 通过将偏移量（全部以弧度为单位）夹住结果并选择最短路径，起始角度朝向终止角度。
         * 起始值可以小于或大于终止值。 
         * 此方法的工作方式与“角度”方法非常相似，唯一的区别是使用弧度代替度，并以2 * Pi代替360。 
         * @param start 
         * @param end 
         * @param shift 
         * @returns 
         */
        public static approachAngleRadians(start: number, end: number, shift: number) {
            let deltaAngleRadians = this.deltaAngleRadians(start, end);
            if (-shift < deltaAngleRadians && deltaAngleRadians < shift)
                return end;

            return this.repeat(this.approach(start, start + deltaAngleRadians, shift), Math.PI * 2);
        }

        /**
         * 使用可接受的检查公差检查两个值是否大致相同 
         * @param value1 
         * @param value2 
         * @param tolerance 
         * @returns 
         */
        public static approximately(value1: number, value2: number, tolerance: number = this.Epsilon) {
            return Math.abs(value1 - value2) <= tolerance;
        }

        /**
         * 计算两个给定角之间的最短差值（度数）
         * @param current 
         * @param target 
         */
        public static deltaAngle(current: number, target: number) {
            let num = this.repeat(target - current, 360);
            if (num > 180)
                num -= 360;

            return num;
        }

        /**
         * 检查值是否介于最小值/最大值（包括最小值/最大值）之间 
         * @param value 
         * @param min 
         * @param max 
         * @returns 
         */
        public static between(value: number, min: number, max: number) {
            return value >= min && value <= max;
        }

        /**
         * 计算以弧度为单位的两个给定角度之间的最短差 
         * @param current 
         * @param target 
         * @returns 
         */
        public static deltaAngleRadians(current: number, target: number) {
            let num = this.repeat(target - current, 2 * Math.PI);
            if (num > Math.PI)
                num -= 2 * Math.PI;

            return num;
        }

        /**
         * 循环t，使其永远不大于长度，永远不小于0
         * @param t 
         * @param length 
         */
        public static repeat(t: number, length: number) {
            return t - Math.floor(t / length) * length;
        }

        public static floorToInt(f: number) {
            return this.toInt(Math.floor(f));
        }

        /**
         * 将值绕一圈移动的助手
         * @param position 
         * @param speed 
         * @returns 
         */
        public static rotateAround(position: Vector2, speed: number) {
            let time = Time.totalTime * speed;

            let x = Math.cos(time);
            let y = Math.sin(time);

            return new Vector2(position.x + x, position.y + y);
        }

        /**
         * 旋转是相对于当前位置而不是总旋转。 
         * 例如，如果您当前处于90度并且想要旋转到135度，则可以使用45度而不是135度的角度
         * @param point 
         * @param center 
         * @param angleIndegrees 
         */
        public static rotateAround2(point: Vector2, center: Vector2, angleIndegrees: number) {
            angleIndegrees = this.toRadians(angleIndegrees);
            let cos = Math.cos(angleIndegrees);
            let sin = Math.sin(angleIndegrees);
            let rotatedX = cos * (point.x - center.x) - sin * (point.y - center.y) + center.x;
            let rotatedY = sin * (point.x - center.x) + cos * (point.y - center.y) + center.y;

            return new Vector2(rotatedX, rotatedY);
        }

        /**
         * 根据圆的中心，半径和角度在圆的圆周上得到一个点。 0度是3点钟方向
         * @param circleCenter 
         * @param radius 
         * @param angleInDegrees 
         */
        public static pointOnCircle(circleCenter: Vector2, radius: number, angleInDegrees: number) {
            let radians = this.toRadians(angleInDegrees);
            return new Vector2(Math.cos(radians) * radius + circleCenter.x, Math.sin(radians) * radius + circleCenter.y);
        }

        /**
         * 根据圆的中心，半径和角度在圆的圆周上得到一个点。 0弧度是3点钟方向
         * @param circleCenter 
         * @param radius 
         * @param angleInRadians 
         * @returns 
         */
        public static pointOnCircleRadians(circleCenter: Vector2, radius: number, angleInRadians: number) {
            return new Vector2(Math.cos(angleInRadians) * radius + circleCenter.x, Math.sin(angleInRadians) * radius + circleCenter.y);
        }

        /**
         * lissajou曲线 
         * @param xFrequency 
         * @param yFrequency 
         * @param xMagnitude 
         * @param yMagnitude 
         * @param phase 
         * @returns 
         */
        public static lissajou(xFrequency: number = 2, yFrequency: number = 3, xMagnitude: number = 1, yMagnitude: number = 1, phase: number = 0) {
            let x = Math.sin(Time.totalTime * xFrequency + phase) * xMagnitude;
            let y = Math.cos(Time.totalTime * yFrequency) * yMagnitude;

            return new Vector2(x, y);
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
         * 此函数用于确保数不是NaN或无穷大
         * @param x 
         * @returns 
         */
        public static isValid(x: number) {
            if (Number.isNaN(x)) {
                return false;
            }

            return x !== Infinity;
        }

        public static smoothDamp(current: number, target: number, currentVelocity: number, smoothTime: number, maxSpeed: number, deltaTime: number): { value: number; currentVelocity: number } {
            smoothTime = Math.max(0.0001, smoothTime);
            const num: number = 2 / smoothTime;
            const num2: number = num * deltaTime;
            const num3: number =
                1 /
                (1 + (num2 + (0.48 * (num2 * num2) + 0.235 * (num2 * (num2 * num2)))));
            let num4: number = current - target;
            const num5: number = target;
            const num6: number = maxSpeed * smoothTime;
            num4 = this.clamp(num4, num6 * -1, num6);
            target = current - num4;
            const num7: number = (currentVelocity + num * num4) * deltaTime;
            currentVelocity = (currentVelocity - num * num7) * num3;
            let num8: number = target + (num4 + num7) * num3;
            if (num5 - current > 0 === num8 > num5) {
                num8 = num5;
                currentVelocity = (num8 - num5) / deltaTime;
            }
            return { value: num8, currentVelocity };
        }

        public static smoothDampVector(current: Vector2, target: Vector2, currentVelocity: Vector2, smoothTime: number, maxSpeed: number, deltaTime: number): Vector2 {
            const v = Vector2.zero;

            const resX = this.smoothDamp(
                current.x,
                target.x,
                currentVelocity.x,
                smoothTime,
                maxSpeed,
                deltaTime
            );
            v.x = resX.value;
            currentVelocity.x = resX.currentVelocity;

            const resY = this.smoothDamp(
                current.y,
                target.y,
                currentVelocity.y,
                smoothTime,
                maxSpeed,
                deltaTime
            );
            v.y = resY.value;
            currentVelocity.y = resY.currentVelocity;

            return v;
        }

        /**
         * 将值（在 leftMin - leftMax 范围内）映射到 rightMin - rightMax 范围内的值 
         * @param value 
         * @param leftMin 
         * @param leftMax 
         * @param rightMin 
         * @param rightMax 
         * @returns 
         */
        public static mapMinMax(value: number, leftMin: number, leftMax: number, rightMin: number, rightMax): number {
            return rightMin + ((MathHelper.clamp(value, leftMin, leftMax) - leftMin) * (rightMax - rightMin)) / (leftMax - leftMin);
        }

        public static fromAngle(angle: number) {
            return new Vector2(Math.cos(angle), Math.sin(angle)).normalizeEqual();
        }

        public static toInt(val: number){
            return val>0 ? Math.floor(val):Math.ceil(val);
        }
    }
}
