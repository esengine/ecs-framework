///<reference path="../ECS/Core.ts" />
module es {
    export class Colors {
        public static renderableBounds = 0xffff00;
        public static renderableCenter = 0x9932CC;
        public static colliderBounds = 0x555555;
        public static colliderEdge = 0x8B0000;
        public static colliderPosition = 0xFFFF00;
        public static colliderCenter = 0xFF0000;
    }

    export class Size {
        public static get lineSizeMultiplier(){
            return Math.max(Math.ceil(Core.scene.x / Core.scene.width), 1);
        }
    }

    export class Debug {
        private static _debugDrawItems: DebugDrawItem[] = [];

        public static drawHollowRect(rectanle: Rectangle, color: number, duration = 0) {
            this._debugDrawItems.push(new DebugDrawItem(rectanle, color, duration));
        }

        public static render() {
            if (this._debugDrawItems.length > 0) {
                let debugShape = new egret.Shape();
                if (Core.scene) {
                    Core.scene.addChild(debugShape);
                }

                for (let i = this._debugDrawItems.length - 1; i >= 0; i--) {
                    let item = this._debugDrawItems[i];
                    if (item.draw(debugShape))
                        this._debugDrawItems.removeAt(i);
                }
            }
        }
    }
}
