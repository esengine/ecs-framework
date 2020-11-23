module es {
    export class MatrixHelper {
        /**
         * 创建一个新的Matrix2D，其中包含两个矩阵的和
         * @param matrix1 
         * @param matrix2 
         */
        public static add(matrix1: Matrix2D, matrix2: Matrix2D): Matrix2D {
            let result = Matrix2D.identity;
            result.m11 = matrix1.m11 + matrix2.m11;
            result.m12 = matrix1.m12 + matrix2.m12;

            result.m21 = matrix1.m21 + matrix2.m21;
            result.m22 = matrix1.m22 + matrix2.m22;

            result.m31 = matrix1.m31 + matrix2.m31;
            result.m32 = matrix1.m32 + matrix2.m32;

            return result;
        }

        /**
         * 将一个Matrix2D的元素除以另一个矩阵的元素
         * @param matrix1 
         * @param matrix2 
         */
        public static divide(matrix1: Matrix2D, matrix2: Matrix2D) {
            let result = Matrix2D.identity;

            result.m11 = matrix1.m11 / matrix2.m11;
            result.m12 = matrix1.m12 / matrix2.m12;
            result.m21 = matrix1.m21 / matrix2.m21;
            result.m22 = matrix1.m22 / matrix2.m22;
            result.m31 = matrix1.m31 / matrix2.m31;
            result.m32 = matrix1.m32 / matrix2.m32;

            return result;
        }

        /**
         * 创建一个新的Matrix2D，包含两个矩阵的乘法
         * @param matrix1 
         * @param matrix2 
         */
        public static mutiply(matrix1: Matrix2D, matrix2: Matrix2D | number) {
            let result = Matrix2D.identity;
            if (matrix2 instanceof Matrix2D) {
                let m11 = (matrix1.m11 * matrix2.m11) + (matrix1.m12 * matrix2.m21);
                let m12 = (matrix2.m11 * matrix2.m12) + (matrix1.m12 * matrix2.m22);
    
                let m21 = (matrix1.m21 * matrix2.m11) + (matrix1.m22 * matrix2.m21);
                let m22 = (matrix1.m21 * matrix2.m12) + (matrix1.m22 * matrix2.m22);
    
                let m31 = (matrix1.m31 * matrix2.m11) + (matrix1.m32 * matrix2.m21) + matrix2.m31;
                let m32 = (matrix1.m31 * matrix2.m12) + (matrix1.m32 * matrix2.m22) + matrix2.m32;
    
                result.m11 = m11;
                result.m12 = m12;
                
                result.m21 = m21;
                result.m22 = m22;
    
                result.m31 = m31;
                result.m32 = m32;
            } else if (typeof matrix2 == "number"){
                result.m11 = matrix1.m11 * matrix2;
                result.m12 = matrix1.m12 * matrix2;

                result.m21 = matrix1.m21 * matrix2;
                result.m22 = matrix1.m22 * matrix2;

                result.m31 = matrix1.m31 * matrix2;
                result.m32 = matrix1.m32 * matrix2;
            }

            return result;
        }

        /**
         * 创建一个新的Matrix2D，包含一个矩阵与另一个矩阵的减法。
         * @param matrix1 
         * @param matrix2 
         */
        public static subtract(matrix1: Matrix2D, matrix2: Matrix2D) {
            let result = Matrix2D.identity;

            result.m11 = matrix1.m11 - matrix2.m11;
            result.m12 = matrix1.m12 - matrix2.m12;
            
            result.m21 = matrix1.m21 - matrix2.m21;
            result.m22 = matrix1.m22 - matrix2.m22;

            result.m31 = matrix1.m31 - matrix2.m31;
            result.m32 = matrix1.m32 - matrix2.m32;

            return result;
        }
    }
}