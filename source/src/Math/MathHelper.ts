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
         * mapps值(在leftMin - leftMax范围内)到rightMin - rightMax范围内的值
         * @param value
         * @param leftMin
         * @param leftMax
         * @param rightMin
         * @param rightMax
         */
        public static map(value: number, leftMin: number, leftMax: number, rightMin: number, rightMax: number) {
            return rightMin + (value - leftMin) * (rightMax - rightMin) / (leftMax - leftMin);
        }

        public static lerp(value1: number, value2: number, amount: number) {
            return value1 + (value2 - value1) * amount;
        }

        public static clamp(value: number, min: number, max: number) {
            if (value < min)
                return min;

            if (value > max)
                return max;

            return value;
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
         * 循环t，使其永远不大于长度，永远不小于0
         * @param t 
         * @param length 
         */
        public static repeat(t: number, length: number) {
            return t - Math.floor(t / length) * length;
        }
    }
}
