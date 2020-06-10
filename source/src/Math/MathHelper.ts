class MathHelper {
    /**
     * 将弧度转换成角度。
     * @param radians 用弧度表示的角
     */
    public static toDegrees(radians: number){
        return radians * 57.295779513082320876798154814105;
    }

    /**
     * 将角度转换为弧度
     * @param degrees 
     */
    public static toRadians(degrees: number){
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
    public static map(value: number, leftMin: number, leftMax: number, rightMin: number, rightMax: number){
        return rightMin + (value - leftMin) * (rightMax - rightMin) / (leftMax - leftMin);
    }

    public static clamp(value: number, min: number, max: number){
        if (value < min)
            return min;

        if (value > max)
            return max;

        return value;
    }

    public static minOf(a: number, b: number, c: number, d: number){
        return Math.min(a, Math.min(b, Math.min(c, d)));
    }

    public static maxOf(a: number, b: number, c: number, d: number){
        return Math.max(a, Math.max(b, Math.max(c, d)));
    }
}