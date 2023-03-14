module es {
    export class MatrixHelper {
        /**
         * 该静态方法用于计算两个 Matrix2D 对象的和。
         * @param {Matrix2D} matrix1 - 加数矩阵。
         * @param {Matrix2D} matrix2 - 加数矩阵。
         * @returns {Matrix2D} - 计算结果的 Matrix2D 对象。
         */
        public static add(matrix1: Matrix2D, matrix2: Matrix2D): Matrix2D {
            // 创建一个新的 Matrix2D 对象以存储计算结果。
            const result = new Matrix2D();

            // 计算两个矩阵的和。
            result.m11 = matrix1.m11 + matrix2.m11;
            result.m12 = matrix1.m12 + matrix2.m12;
            result.m21 = matrix1.m21 + matrix2.m21;
            result.m22 = matrix1.m22 + matrix2.m22;
            result.m31 = matrix1.m31 + matrix2.m31;
            result.m32 = matrix1.m32 + matrix2.m32;

            // 返回计算结果的 Matrix2D 对象。
            return result;
        }

        /**
         * 该静态方法用于计算两个 Matrix2D 对象的商。
         * @param {Matrix2D} matrix1 - 被除数矩阵。
         * @param {Matrix2D} matrix2 - 除数矩阵。
         * @returns {Matrix2D} - 计算结果的 Matrix2D 对象。
         */
        public static divide(matrix1: Matrix2D, matrix2: Matrix2D): Matrix2D {
            // 创建一个新的 Matrix2D 对象以存储计算结果。
            const result = new Matrix2D();

            // 计算两个矩阵的商。
            result.m11 = matrix1.m11 / matrix2.m11;
            result.m12 = matrix1.m12 / matrix2.m12;
            result.m21 = matrix1.m21 / matrix2.m21;
            result.m22 = matrix1.m22 / matrix2.m22;
            result.m31 = matrix1.m31 / matrix2.m31;
            result.m32 = matrix1.m32 / matrix2.m32;

            // 返回计算结果的 Matrix2D 对象。
            return result;
        }

        /**
         * 该静态方法用于计算两个 Matrix2D 对象或一个 Matrix2D 对象和一个数字的乘积。
         * @param {Matrix2D} matrix1 - 第一个矩阵。
         * @param {Matrix2D | number} matrix2 - 第二个矩阵或一个数字。
         * @returns {Matrix2D} - 计算结果的 Matrix2D 对象。
         */
        public static multiply(matrix1: Matrix2D, matrix2: Matrix2D | number): Matrix2D {
            // 创建一个新的 Matrix2D 对象以存储计算结果。
            const result = new Matrix2D();

            // 根据第二个参数的类型执行不同的计算。
            if (matrix2 instanceof Matrix2D) {
                // 执行矩阵乘法。
                result.m11 = matrix1.m11 * matrix2.m11 + matrix1.m12 * matrix2.m21;
                result.m12 = matrix1.m11 * matrix2.m12 + matrix1.m12 * matrix2.m22;
                result.m21 = matrix1.m21 * matrix2.m11 + matrix1.m22 * matrix2.m21;
                result.m22 = matrix1.m21 * matrix2.m12 + matrix1.m22 * matrix2.m22;
                result.m31 = matrix1.m31 * matrix2.m11 + matrix1.m32 * matrix2.m21 + matrix2.m31;
                result.m32 = matrix1.m31 * matrix2.m12 + matrix1.m32 * matrix2.m22 + matrix2.m32;
            } else {
                // 执行矩阵和标量的乘法。
                result.m11 = matrix1.m11 * matrix2;
                result.m12 = matrix1.m12 * matrix2;
                result.m21 = matrix1.m21 * matrix2;
                result.m22 = matrix1.m22 * matrix2;
                result.m31 = matrix1.m31 * matrix2;
                result.m32 = matrix1.m32 * matrix2;
            }

            // 返回计算结果的 Matrix2D 对象。
            return result;
        }

        /**
         * 该静态方法用于计算两个 Matrix2D 对象的差。
         * @param {Matrix2D} matrix1 - 第一个矩阵。
         * @param {Matrix2D} matrix2 - 第二个矩阵。
         * @returns {Matrix2D} - 计算结果的 Matrix2D 对象。
         */
        public static subtract(matrix1: Matrix2D, matrix2: Matrix2D): Matrix2D {
            // 创建一个新的 Matrix2D 对象以存储计算结果。
            const result = new Matrix2D();

            // 计算两个矩阵的差。
            result.m11 = matrix1.m11 - matrix2.m11;
            result.m12 = matrix1.m12 - matrix2.m12;
            result.m21 = matrix1.m21 - matrix2.m21;
            result.m22 = matrix1.m22 - matrix2.m22;
            result.m31 = matrix1.m31 - matrix2.m31;
            result.m32 = matrix1.m32 - matrix2.m32;

            // 返回计算结果的 Matrix2D 对象。
            return result;
        }
    }
}