///<reference path="../Component.ts"/>
class Camera extends Component {
    private _zoom;
    private _origin: Vector2;
    private _transformMatrix: Matrix2D = Matrix2D.identity;
    private _inverseTransformMatrix = Matrix2D.identity;

    private _minimumZoom = 0.3;
    private _maximumZoom = 3;
    private _areMatrixesDirty = true;
    private _inset: CameraInset;
    private _bounds: Rectangle;
    private _areBoundsDirty = true;

    public get bounds(){
        if (this._areMatrixesDirty)
            this.updateMatrixes();

        if (this._areBoundsDirty){
            let stage = this.entity.scene.stage;
            let topLeft = this.screenToWorldPoint(new Vector2(this._inset.left, this._inset.top));
            let bottomRight = this.screenToWorldPoint(new Vector2(stage.stageWidth - this._inset.right, stage.stageHeight - this._inset.bottom));

            if (this.entity.transform.rotation != 0){
                let topRight = this.screenToWorldPoint(new Vector2(stage.stageWidth - this._inset.right, this._inset.top));
                let bottomLeft = this.screenToWorldPoint(new Vector2(this._inset.left, stage.stageHeight - this._inset.bottom));

                let minX = MathHelper.minOf(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x);
                let maxX = MathHelper.maxOf(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x);
                let minY = MathHelper.minOf(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y);
                let maxY = MathHelper.maxOf(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y);

                this._bounds.location = new Vector2(minX, minY);
                this._bounds.width = maxX - minX;
                this._bounds.height = maxY - minY;
            }else{
                this._bounds.location = topLeft;
                this._bounds.width = bottomRight.x - topLeft.x;
                this._bounds.height = bottomRight.y - topLeft.y;
            }

            this._areBoundsDirty = false;
        }

        return this._bounds;
    }

    public get zoom(){
        if (this._zoom == 0)
            return 1;

        if (this._zoom < 1)
            return MathHelper.map(this._zoom, this._minimumZoom, 1, -1, 0);

        return MathHelper.map(this._zoom, 1, this._maximumZoom, 0, 1);
    }

    public set zoom(value: number){
        this.setZoom(value);
    }

    public get minimumZoom(){
        return this._minimumZoom;
    }

    public set minimumZoom(value: number){
        this.setMinimumZoom(value);
    }

    public get maximumZoom(){
        return this._maximumZoom;
    }

    public set maximumZoom(value: number){
        this.setMaximumZoom(value);
    }

    public get origin(){
        return this._origin;
    }

    public set origin(value: Vector2){
        if (this._origin != value){
            this._origin = value;
            this._areMatrixesDirty = true;
        }
    }

    public get transformMatrix(){
        if (this._areBoundsDirty)
            this.updateMatrixes();
        return this._transformMatrix;
    }

    public get inverseTransformMatrix(){
        if (this._areBoundsDirty)
            this.updateMatrixes();
        return this._inverseTransformMatrix;
    }

    constructor() {
        super();

        this.setZoom(0);
    }

    public setMinimumZoom(minZoom: number): Camera{
        if (this._zoom < minZoom)
            this._zoom = this.minimumZoom;

        this._minimumZoom = minZoom;
        return this;
    }

    public setMaximumZoom(maxZoom: number): Camera {
        if (this._zoom > maxZoom)
            this._zoom = maxZoom;

        this._maximumZoom = maxZoom;
        return this;
    }

    public setZoom(zoom: number){
        let newZoom = MathHelper.clamp(zoom, -1, 1);
        if (newZoom == 0){
            this._zoom = 1;
        } else if(newZoom < 0){
            this._zoom = MathHelper.map(newZoom, -1, 0, this._minimumZoom, 1);
        } else {
            this._zoom = MathHelper.map(newZoom, 0, 1, 1, this._maximumZoom);
        }

        this._areMatrixesDirty = true;

        return this;
    }

    public initialize() {

    }

    public update(){
        
    }

    public setPosition(position: Vector2){
        this.entity.transform.setPosition(position);

        return this;
    }

    public updateMatrixes(){
        if (!this._areMatrixesDirty)
            return;

        let tempMat: Matrix2D;
        this._transformMatrix = Matrix2D.createTranslation(-this.entity.transform.position.x, -this.entity.transform.position.y);
        if (this._zoom != 1){
            tempMat = Matrix2D.createScale(this._zoom, this._zoom);
            this._transformMatrix = Matrix2D.multiply(this._transformMatrix, tempMat);
        }

        tempMat = Matrix2D.createTranslation(this._origin.x, this._origin.y, tempMat);
        this._transformMatrix = Matrix2D.multiply(this._transformMatrix, tempMat);

        this._inverseTransformMatrix = Matrix2D.invert(this._transformMatrix);

        this._areBoundsDirty = true;
        this._areMatrixesDirty = false;
    }

    public screenToWorldPoint(screenPosition: Vector2){
        this.updateMatrixes();
        return Vector2.transform(screenPosition, this._inverseTransformMatrix);
    }

    public worldToScreenPoint(worldPosition: Vector2){
        this.updateMatrixes();
        return Vector2.transform(worldPosition, this._transformMatrix);
    }

    public destory() {

    }
}

class CameraInset {
    public left;
    public right;
    public top;
    public bottom;
}