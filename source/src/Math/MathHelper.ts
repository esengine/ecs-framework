class MathHelper {
    /**
     * 将弧度转换成角度。
     * @param radians 用弧度表示的角
     */
    public static ToDegrees(radians: number){
        return radians * 57.295779513082320876798154814105;
    }

    /**
     * 将角度转换为弧度
     * @param degrees 
     */
    public static ToRadians(degrees: number){
        return degrees * 0.017453292519943295769236907684886;
    }
}