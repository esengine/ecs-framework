module es {
    export enum DebugDrawType {
        line,
        hollowRectangle,
        pixel,
        text
    }

    export class DebugDrawItem {
        public rectangle: Rectangle;
        public color: number;
        public duration: number;
        public drawType: DebugDrawType;
        public text: string;
        public start: Vector2;
        public end: Vector2;
        public x: number;
        public y: number;
        public size: number;

        constructor(rectangle: Rectangle, color: number, duration: number) {
            this.rectangle = rectangle;
            this.color = color;
            this.duration = duration;
            this.drawType = DebugDrawType.hollowRectangle;
        }

        public draw(shape: egret.Shape): boolean {
            switch (this.drawType) {
                case DebugDrawType.line:
                    // DrawUtils.drawLine(shape, this.start, this.end, this.color);
                    break;
                case DebugDrawType.hollowRectangle:
                    // DrawUtils.drawHollowRect(shape, this.rectangle, this.color);
                    break;
                case DebugDrawType.pixel:
                    // DrawUtils.drawPixel(shape, new Vector2(this.x, this.y), this.color, this.size);
                    break;
                case DebugDrawType.text:
                    break;
            }

            this.duration -= Time.deltaTime;
            return this.duration < 0;
        }
    }
}


