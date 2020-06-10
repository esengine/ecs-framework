class Vector2Ext {
    /**
     * 检查三角形是CCW还是CW
     * @param a 
     * @param center 
     * @param c 
     */
    public static isTriangleCCW(a: Vector2, center: Vector2, c: Vector2){
        return this.cross(Vector2.subtract(center, a), Vector2.subtract(c, center)) < 0;
    }

    /**
     * 计算二维伪叉乘点(Perp(u)， v)
     * @param u 
     * @param v 
     */
    public static cross(u: Vector2, v: Vector2){
        return u.y * v.x - u.x * v.y;
    }
}