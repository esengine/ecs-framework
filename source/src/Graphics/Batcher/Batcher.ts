module es {
    /**
     * 用于集中处理所有graphics绘制逻辑
     */
    export class Batcher implements IBatcher {
        public static readonly TYPE_DEBUG = "debug";
        public static readonly TYPE_NORMAL = "normal";
        /** 根据不同的batcherType来使用不同的graphics来进行绘制 */
        private _batcherSprite: Map<string, egret.Sprite>;
        public camera: ICamera | null = null;
        public strokeNum: number = 0;
        public sprite: egret.Sprite;
    
        public readonly MAX_STROKE = 2048;

        constructor() {
            this._batcherSprite = new Map<string, egret.Sprite>();
        }

        begin(cam: ICamera, batcherType: string = Batcher.TYPE_NORMAL) {
            if (!this._batcherSprite.has(batcherType)) {
                this.sprite = new egret.Sprite();
                this.sprite.name = "batcher_" + batcherType;
                this._batcherSprite.set(batcherType, this.sprite);
                Core.stage.addChild(this.sprite);
                return;
            }

            this.sprite = this._batcherSprite.get(batcherType);
            this.sprite.graphics.clear();
            this.camera = cam;
            this.strokeNum = 0;
        }

        end() {
            if (this.strokeNum > 0) {
                this.strokeNum = 0;
                this.sprite.graphics.endFill();
            }
        }

        /**
         * 绘制点
         * @param points 点列表
         * @param color 颜色
         * @param thickness 粗细 默认1
         */
        drawPoints(points: Vector2[], color: Color, thickness: number = 2) {
            if (points.length < 2)
                return;

            for (let i = 1; i < points.length; i++)
                this.drawLine(points[i - 1], points[i], color, thickness);
        }

        /**
         * 绘制多边形
         * @param position 多边形位置
         * @param points 多边形点
         * @param color 颜色
         * @param closePoly 是否关闭图形
         * @param thickness 粗细
         */
        drawPolygon(position: Vector2, points: Vector2[], color: Color, closePoly: boolean, thickness: number = 2) {
            if (points.length < 2)
                return;

            for (let i = 1; i < points.length; i ++)
                this.drawLine(Vector2.add(position, points[i - 1]), Vector2.add(position, points[i]), color, thickness);

            if (closePoly)
                this.drawLine(Vector2.add(position, points[points.length - 1]), Vector2.add(position, points[0]), color, thickness);
        }

        /**
         * 绘制空心矩形
         * @param x 坐标x
         * @param y 坐标y
         * @param width 宽度
         * @param height 高度
         * @param color 颜色
         * @param thickness 边框粗细
         */
        drawHollowRect(x: number, y: number, width: number, height: number, color: Color, thickness: number = 2) {
            this.sprite.graphics.lineStyle(thickness, color.toHexEgret(), color.a);

            const tl = Vector2Ext.round(new Vector2(x, y));
            const tr = Vector2Ext.round(new Vector2(x + width, y));
            const br = Vector2Ext.round(new Vector2(x + width, y + height));
            const bl = Vector2Ext.round(new Vector2(x, y + height));

            this.drawLine(tl, tr, color, thickness);
            this.drawLine(tr, br, color, thickness);
            this.drawLine(br, bl, color, thickness);
            this.drawLine(bl, tl, color, thickness);
        }

        /**
         * 绘制圆形
         * @param position 位置
         * @param radius 半径
         * @param color 颜色
         * @param thickness 粗细
         */
        drawCircle(position: Vector2, radius: number, color: Color, thickness: number = 2) {
            const bounds = new Rectangle(position.x - radius, position.y - radius, radius * 2, radius * 2);
            if (this.camera && !this.camera.bounds.intersects(bounds))
                return;

            this.sprite.graphics.lineStyle(thickness, color.toHexEgret(), color.a);
            this.sprite.graphics.drawCircle(position.x, position.y, radius);
            this.strokeNum ++;
            this.flushBatch();
        }

        /**
         * 绘制低精度袁
         * @param position 位置
         * @param radius 半径
         * @param color 颜色
         * @param thickness 边框粗细
         * @param resolution 圆边数
         */
        drawCircleLow(position: Vector2, radius: number, color: Color, thickness: number = 2, resolution?: number) {
            let last = Vector2.unitX.multiplyScaler(radius);
            let lastP = Vector2Ext.perpendicularFlip(last);

            for (let i = 1; i <= resolution; i ++) {
                const at = MathHelper.angleToVector(i * MathHelper.PiOver2 / resolution, radius);
                const atP = Vector2Ext.perpendicularFlip(at);

                this.drawLine(Vector2.add(position, last), Vector2.add(position, at), color, thickness);
                this.drawLine(position.sub(last), position.sub(at), color, thickness);
                this.drawLine(Vector2.add(position, lastP), Vector2.add(position, atP), color, thickness);
                this.drawLine(position.sub(lastP), position.sub(atP), color, thickness);

                last = at;
                lastP = atP;
            }
        }

        /**
         * 绘制矩形
         * @param x 位置x
         * @param y 位置y
         * @param width 宽度
         * @param height 高度
         * @param color 颜色
         */
        drawRect(x: number, y: number, width: number, height: number, color: Color) {
            const rect = new Rectangle(x, y, width, height);
            if (this.camera && !this.camera.bounds.intersects(rect))
                return;
                
            this.sprite.graphics.lineStyle(1, color.toHexEgret(), color.a);
            this.sprite.graphics.drawRect(Math.trunc(x), Math.trunc(y), Math.trunc(width), Math.trunc(height));
            this.strokeNum ++;
            this.flushBatch();
        }

        /**
         * 绘制线
         * @param start 起始点坐标
         * @param end 终点坐标
         * @param color 颜色
         * @param thickness 粗细
         */
        drawLine(start: Vector2, end: Vector2, color: Color, thickness: number) {
            const bounds = RectangleExt.boundsFromPolygonVector([start, end]);
            if (this.camera && !this.camera.bounds.intersects(bounds))
                return;
    
            this.sprite.graphics.lineStyle(thickness, color.toHexEgret(), color.a);
            this.sprite.graphics.moveTo(start.x, start.y);
            this.sprite.graphics.lineTo(end.x, end.y);
            this.strokeNum ++;
            this.flushBatch();
        }

        /**
         * 绘制点
         * @param position 位置
         * @param color 颜色
         * @param size 大小
         */
        drawPixel(position: Vector2, color: Color, size?: number) {
            const destRect = new Rectangle(Math.trunc(position.x), Math.trunc(position.y), size, size);
            if (size != 1) {
                destRect.x -= Math.trunc(size * 0.5);
                destRect.y -= Math.trunc(size * 0.5);
            }

            if (this.camera && !this.camera.bounds.intersects(destRect))
                return;

            this.sprite.graphics.lineStyle(size, color.toHexEgret(), color.a);
            this.sprite.graphics.drawRect(destRect.x, destRect.y, destRect.width, destRect.height);
            this.strokeNum ++;
            this.flushBatch();
        }

        drawSprite(sprite: Sprite, position: Vector2, color: Color, rotation: number,
            origin: Vector2, scale: Vector2) {
                if (!sprite) return;
                // 这里可以将未加入场景的Sprite进行绘制
                if (sprite.parent == null) {
                    Core.stage.addChild(sprite);
                }
                sprite.x = position.x;
                sprite.y = position.y;
                sprite.rotation = rotation;
                sprite.scaleX = scale.x;
                sprite.scaleY = scale.y;
                sprite.anchorOffsetX = origin.x;
                sprite.anchorOffsetY = origin.y;

                const colorMatrix = [
                    1, 0, 0, 0, 0,
                    0, 1, 0, 0, 0,
                    0, 0, 1, 0, 0,
                    0, 0, 0, 1, 0
                ];
                colorMatrix[0] = color.r / 255;
                colorMatrix[6] = color.g / 255;
                colorMatrix[12] = color.b / 255;
                const colorFilter = new egret.ColorMatrixFilter(colorMatrix);
                sprite.filters = [colorFilter];
                sprite.alpha = color.a;
            }

        public flushBatch() {
            if (this.strokeNum >= this.MAX_STROKE) {
                this.strokeNum = 0;
                this.sprite.graphics.endFill();
            }
        }
    }
}