module es {
    export class PrototypeSpriteRenderer extends SpriteRenderer {
        public get width(): number {
            return this._width;
        }

        public get height(): number {
            return this._height;
        }

        public get bounds(): Rectangle {
            if (this._areBoundsDirty){
                this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, this._origin, this.entity.transform.scale,
                    this.entity.transform.rotation, this._width, this._height);
                this._areBoundsDirty = false;
            }

            return this._bounds;
        }

        public skewTopX: number = 0;
        public skewBottomX: number = 0;
        public skewLeftY: number = 0;
        public skewRightY: number = 0;

        public _width: number = 0;
        public _height: number = 0;

        constructor(width: number = 50, height: number = 50){
            super(Graphics.Instance.pixelTexture);
            this._width = width;
            this._height = height;
        }

        public setWidth(width: number): PrototypeSpriteRenderer {
            this._width = width;
            return this;
        }

        public setHeight(height: number): PrototypeSpriteRenderer {
            this._height = height;
            return this;
        }

        public setSkew(skewTopX: number, skewBottomX: number, skewLeftY: number, skewRightY: number): PrototypeSpriteRenderer{
            this.skewTopX = skewTopX;
            this.skewBottomX = skewBottomX;
            this.skewLeftY = skewLeftY;
            this.skewRightY = skewRightY;
            return this;
        }

        public onAddedToEntity() {
            this.originNormalized = Vector2Ext.halfVector();
        }

        public render(camera: es.Camera) {

        }
    }
}