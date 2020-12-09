module es {
    /**
     * 代表右手4x4浮点矩阵，可以存储平移、比例和旋转信息
     */
    export class Matrix {
        public m11: number;
        public m12: number;
        public m13: number;
        public m14: number;
        public m21: number;
        public m22: number;
        public m23: number;
        public m24: number;
        public m31: number;
        public m32: number;
        public m33: number;
        public m34: number;
        public m41: number;
        public m42: number;
        public m43: number;
        public m44: number;

        /**
         * 为自定义的正交视图创建一个新的投影矩阵
         * @param left 
         * @param right 
         * @param top 
         * @param zFarPlane 
         * @param result 
         */
        public static createOrthographicOffCenter(left: number, right: number, bottom: number, top: number, zNearPlane: number, zFarPlane: number, result: Matrix = new Matrix()) {
            result.m11 = 2 / (right - left);
            result.m12 = 0;
            result.m13 = 0;
            result.m14 = 0;
            result.m21 = 0;
            result.m22 = 2 / (top - bottom);
            result.m23 = 0;
            result.m24 = 0;
            result.m31 = 0;
            result.m32 = 0;
            result.m33 = 1 / (zNearPlane - zFarPlane);
            result.m34 = 0;
            result.m41 = (left + right) / (left - right);
            result.m42 = (top + bottom) / (bottom - top);
            result.m43 = zNearPlane / (zNearPlane - zFarPlane);
            result.m44 = 1;
        }

        /**
         * 创建一个新的矩阵，其中包含两个矩阵的乘法。
         * @param matrix1 
         * @param matrix2 
         * @param result 
         */
        public static multiply(matrix1: Matrix, matrix2: Matrix, result: Matrix = new Matrix()) {
            let m11 = (((matrix1.m11 * matrix2.m11) + (matrix1.m12 * matrix2.m21)) + (matrix1.m13 * matrix2.m31)) + (matrix1.m14 * matrix2.m41);
            let m12 = (((matrix1.m11 * matrix2.m12) + (matrix1.m12 * matrix2.m22)) + (matrix1.m13 * matrix2.m32)) + (matrix1.m14 * matrix2.m42);
            let m13 = (((matrix1.m11 * matrix2.m13) + (matrix1.m12 * matrix2.m23)) + (matrix1.m13 * matrix2.m33)) + (matrix1.m14 * matrix2.m43);
            let m14 = (((matrix1.m11 * matrix2.m14) + (matrix1.m12 * matrix2.m24)) + (matrix1.m13 * matrix2.m34)) + (matrix1.m14 * matrix2.m44);
            let m21 = (((matrix1.m21 * matrix2.m11) + (matrix1.m22 * matrix2.m21)) + (matrix1.m23 * matrix2.m31)) + (matrix1.m24 * matrix2.m41);
            let m22 = (((matrix1.m21 * matrix2.m12) + (matrix1.m22 * matrix2.m22)) + (matrix1.m23 * matrix2.m32)) + (matrix1.m24 * matrix2.m42);
            let m23 = (((matrix1.m21 * matrix2.m13) + (matrix1.m22 * matrix2.m23)) + (matrix1.m23 * matrix2.m33)) + (matrix1.m24 * matrix2.m43);
            let m24 = (((matrix1.m21 * matrix2.m14) + (matrix1.m22 * matrix2.m24)) + (matrix1.m23 * matrix2.m34)) + (matrix1.m24 * matrix2.m44);
            let m31 = (((matrix1.m31 * matrix2.m11) + (matrix1.m32 * matrix2.m21)) + (matrix1.m33 * matrix2.m31)) + (matrix1.m34 * matrix2.m41);
            let m32 = (((matrix1.m31 * matrix2.m12) + (matrix1.m32 * matrix2.m22)) + (matrix1.m33 * matrix2.m32)) + (matrix1.m34 * matrix2.m42);
            let m33 = (((matrix1.m31 * matrix2.m13) + (matrix1.m32 * matrix2.m23)) + (matrix1.m33 * matrix2.m33)) + (matrix1.m34 * matrix2.m43);
            let m34 = (((matrix1.m31 * matrix2.m14) + (matrix1.m32 * matrix2.m24)) + (matrix1.m33 * matrix2.m34)) + (matrix1.m34 * matrix2.m44);
            let m41 = (((matrix1.m41 * matrix2.m11) + (matrix1.m42 * matrix2.m21)) + (matrix1.m43 * matrix2.m31)) + (matrix1.m44 * matrix2.m41);
            let m42 = (((matrix1.m41 * matrix2.m12) + (matrix1.m42 * matrix2.m22)) + (matrix1.m43 * matrix2.m32)) + (matrix1.m44 * matrix2.m42);
            let m43 = (((matrix1.m41 * matrix2.m13) + (matrix1.m42 * matrix2.m23)) + (matrix1.m43 * matrix2.m33)) + (matrix1.m44 * matrix2.m43);
           	let m44 = (((matrix1.m41 * matrix2.m14) + (matrix1.m42 * matrix2.m24)) + (matrix1.m43 * matrix2.m34)) + (matrix1.m44 * matrix2.m44);
            result.m11 = m11;
			result.m12 = m12;
			result.m13 = m13;
			result.m14 = m14;
			result.m21 = m21;
			result.m22 = m22;
			result.m23 = m23;
			result.m24 = m24;
			result.m31 = m31;
			result.m32 = m32;
			result.m33 = m33;
			result.m34 = m34;
			result.m41 = m41;
			result.m42 = m42;
			result.m43 = m43;
			result.m44 = m44;
        }
    }
}