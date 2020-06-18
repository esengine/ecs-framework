class Vector2Ext {
    /**
     * 检查三角形是CCW还是CW
     * @param a 
     * @param center 
     * @param c 
     */
    public static isTriangleCCW(a: Vector2, center: Vector2, c: Vector2) {
        return this.cross(Vector2.subtract(center, a), Vector2.subtract(c, center)) < 0;
    }

    /**
     * 计算二维伪叉乘点(Perp(u)， v)
     * @param u 
     * @param v 
     */
    public static cross(u: Vector2, v: Vector2) {
        return u.y * v.x - u.x * v.y;
    }

    /**
     * 返回与传入向量垂直的向量
     * @param first 
     * @param second 
     */
    public static perpendicular(first: Vector2, second: Vector2) {
        return new Vector2(-1 * (second.y - first.y), second.x - first.x);
    }

    /**
     * Vector2的临时解决方案
     * 标准化把向量弄乱了
     * @param vec 
     */
    public static normalize(vec: Vector2) {
        let magnitude = Math.sqrt((vec.x * vec.x) + (vec.y * vec.y));
        if (magnitude > MathHelper.Epsilon) {
            vec = Vector2.divide(vec, new Vector2(magnitude));
        } else {
            vec.x = vec.y = 0;
        }

        return vec;
    }

    public static transformA(sourceArray: Vector2[], sourceIndex: number, matrix: Matrix2D,
        destinationArray: Vector2[], destinationIndex: number, length: number) {
            for (let i = 0; i < length; i ++){
                let position = sourceArray[sourceIndex + i];
                let destination = destinationArray[destinationIndex + i];
                destination.x = (position.x * matrix.m11) + (position.y * matrix.m21) + matrix.m31;
                destination.y = (position.x * matrix.m12) + (position.y * matrix.m22) + matrix.m32;
                destinationArray[destinationIndex + i] = destination;
            }
    }

    public static transformR(position: Vector2, matrix: Matrix2D){
        let x = (position.x * matrix.m11) + (position.y * matrix.m21) + matrix.m31;
        let y = (position.x * matrix.m12) + (position.y * matrix.m22) + matrix.m32;
        return new Vector2(x, y);
    }

    public static transform(sourceArray: Vector2[], matrix: Matrix2D, destinationArray: Vector2[]) {
        this.transformA(sourceArray, 0, matrix, destinationArray, 0, sourceArray.length);
    }
}