module es {
    /** 各种辅助方法来辅助绘图 */
    export class DrawUtils {
        public static drawLine(shape: egret.Shape, start: Vector2, end: Vector2, color: number, thickness: number = 1) {
            this.drawLineAngle(shape, start, MathHelper.angleBetweenVectors(start, end), Vector2.distance(start, end), color, thickness);
        }

        public static drawCircle(shape: egret.Shape, position: Vector2, radius: number, color: number){
            shape.graphics.beginFill(color);
            shape.graphics.drawCircle(position.x, position.y, radius);
            shape.graphics.endFill();
        }

        public static drawPoints(shape: egret.Shape, position: Vector2, points: Vector2[], color: number,
                                 closePoly: boolean = true, thickness: number = 1){
            if (points.length < 2)
                return;

            for (let i = 1; i < points.length; i ++)
                this.drawLine(shape, Vector2.add(position, points[i - 1]), Vector2.add(position, points[i]), color, thickness);

            if (closePoly)
                this.drawLine(shape, Vector2.add(position, points[points.length - 1]), Vector2.add(position, points[0]), color, thickness);
        }

        public static drawString(textField: egret.TextField, text: string, position: Vector2, color: number, rotation: number,
                                 origin: Vector2, scale: number){

        }

        public static drawLineAngle(shape: egret.Shape, start: Vector2, radians: number, length: number, color: number, thickness = 1) {
            shape.graphics.beginFill(color);
            shape.graphics.drawRect(start.x, start.y, 1, 1);
            shape.graphics.endFill();

            shape.scaleX = length;
            shape.scaleY = thickness;
            shape.$anchorOffsetX = 0;
            shape.$anchorOffsetY = 0;
            shape.rotation = radians;
        }

        public static drawHollowRect(shape: egret.Shape, rect: Rectangle, color: number, thickness = 1) {
            this.drawHollowRectR(shape, rect.x, rect.y, rect.width, rect.height, color, thickness);
        }

        public static drawHollowRectR(shape: egret.Shape, x: number, y: number, width: number, height: number, color: number, thickness = 1) {
            let tl = new Vector2(x, y).round();
            let tr = new Vector2(x + width, y).round();
            let br = new Vector2(x + width, y + height).round();
            let bl = new Vector2(x, y + height).round();

            this.drawLine(shape, tl, tr, color, thickness);
            this.drawLine(shape, tr, br, color, thickness);
            this.drawLine(shape, br, bl, color, thickness);
            this.drawLine(shape, bl, tl, color, thickness);
        }

        public static drawPixel(shape: egret.Shape, position: Vector2, color: number, size: number = 1) {
            let destRect = new Rectangle(position.x, position.y, size, size);
            if (size != 1) {
                destRect.x -= size * 0.5;
                destRect.y -= size * 0.5;
            }

            shape.graphics.beginFill(color);
            shape.graphics.drawRect(destRect.x, destRect.y, destRect.width, destRect.height);
            shape.graphics.endFill();
        }

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
