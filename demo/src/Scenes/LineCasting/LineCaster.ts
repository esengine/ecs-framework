module samples {
    import RenderableComponent = es.RenderableComponent;
    import Vector2 = es.Vector2;
    import Physics = es.Physics;

    export class LineCaster extends RenderableComponent {
        private _lastPosition = new Vector2(101, 101);
        private _collisionPosition = new Vector2(-1, -1);
        private _pixelShape1: egret.Shape;
        private _pixelShape2: egret.Shape;
        private _lineShape: egret.Shape;
        private _pixelShape3: egret.Shape;
        private _delayTime = 0.2;
        private _pressTime = 0;
        private _canTouch = true;

        public get width(){
            return 1000;
        }

        public get height(){
            return 1000;
        }

        constructor() {
            super();

            this._pixelShape1 = new egret.Shape();
            this._pixelShape2 = new egret.Shape();
            this._lineShape = new egret.Shape();
            this._pixelShape3 = new egret.Shape();

            this.displayObject = new egret.DisplayObjectContainer();
            let displayContainer = this.displayObject as egret.DisplayObjectContainer;
            displayContainer.addChild(this._pixelShape1);
            displayContainer.addChild(this._pixelShape2);
            displayContainer.addChild(this._pixelShape3);
            displayContainer.addChild(this._lineShape);
        }

        public render(camera: es.Camera): any {
            this._pixelShape1.graphics.clear();
            this._pixelShape1.graphics.beginFill(0xffff00);
            this._pixelShape1.graphics.lineStyle(4, 0xffff00);
            this._pixelShape1.graphics.moveTo(this._lastPosition.x, this._lastPosition.y);
            this._pixelShape1.graphics.endFill();

            this._pixelShape2.graphics.clear();
            this._pixelShape2.graphics.beginFill(0xffffff);
            this._pixelShape2.graphics.lineStyle(4, 0xffffff);
            this._pixelShape2.graphics.moveTo(this.transform.position.x, this.transform.position.y);
            this._pixelShape2.graphics.endFill();

            this._lineShape.graphics.clear();
            this._lineShape.graphics.beginFill(0xffffff);
            this._lineShape.graphics.lineStyle(1, 0xffffff);
            this._lineShape.graphics.moveTo(this._lastPosition.x, this._lastPosition.y);
            this._lineShape.graphics.lineTo(this.transform.position.x, this.transform.position.y);
            this._lineShape.graphics.endFill();

            this._pixelShape3.graphics.clear();
            if (this._collisionPosition.x > 0 && this._collisionPosition.y > 0){
                this._pixelShape3.graphics.beginFill(0xff0000);
                this._pixelShape3.graphics.lineStyle(10, 0xff0000);
                this._pixelShape3.graphics.moveTo(this._collisionPosition.x, this._collisionPosition.y);
                this._pixelShape3.graphics.endFill();
            }
        }

        public update(): void {
            if (!this._canTouch){
                if (this._pressTime > this._delayTime){
                    this._canTouch = true;
                    this._pressTime = 0;
                }else{
                    this._pressTime += es.Time.deltaTime;
                }
                return;
            }

            if (!es.Input.touchPosition.equals(Vector2.zero)){
                this._lastPosition = this.transform.position;
                this.transform.position = es.Input.touchPosition;
                this._collisionPosition = new Vector2(-1, -1);
                this._canTouch = false;
            }
        }
    }
}