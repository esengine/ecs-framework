module es {
    /** 各种辅助方法来辅助绘图 */
    export class DrawUtils {
        public static getColorMatrix(color: number): egret.ColorMatrixFilter {
            let colorMatrix = [
                1, 0, 0, 0, 0,
                0, 1, 0, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 0, 1, 0
            ];
            colorMatrix[0] = Math.floor(color / 256 / 256) / 255;
            colorMatrix[6] = Math.floor(color / 256 % 256) / 255;
            colorMatrix[12] = color % 256 / 255;
            return new egret.ColorMatrixFilter(colorMatrix);
        }
    }
}
