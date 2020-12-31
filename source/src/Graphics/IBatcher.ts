module es {
    export interface IBatcher {
        /**
         * 创建投影矩阵时要使用的矩阵
         */
        transformMatrix: Matrix;
        /**
         * 如果为true，则将在绘制目标位置之前将其四舍五入
         */
        shouldRoundDestinations: boolean;
        disposed();
        begin(effect, transformationMatrix?: Matrix, disableBatching?: boolean);
        end();
        prepRenderState();
        /**
         * 设置是否应忽略位置舍入。在为调试绘制基元时很有用
         */
        setIgnoreRoundingDestinations(shouldIgnore: boolean);
        drawHollowRect(rect: Rectangle, color: number, thickness?: number);
        drawHollowBounds(x: number, y: number, width: number, height: number, color: number, thickness: number);
        drawLine(start: Vector2, end: Vector2, color: number, thickness);
        drawLineAngle(start: Vector2, radians: number, length: number, color: number, thickness: number);
        draw(texture, position: Vector2, color?: number, rotation?: number, origin?: Vector2, scale?: Vector2, effects?);
        flushBatch();
        drawPrimitives(texture, baseSprite: number, batchSize: number);
        drawPixel(position: Vector2, color: number, size?: number);
        drawPolygon(position: Vector2, points: Vector2[], color: number, closePoly?: boolean, thickness?: number);
        drawCircle(position: Vector2, radius: number, color: number, thickness?: number, resolution?: number);
    }
}