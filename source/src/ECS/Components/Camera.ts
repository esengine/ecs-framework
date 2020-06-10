///<reference path="../Component.ts"/>
class Camera extends Component {
    private _zoom;
    private _origin: Vector2;
    private _transformMatrix: Matrix2D = Matrix2D.identity;
    private _inverseTransformMatrix = Matrix2D.identity;

    private _minimumZoom = 0.3;
    private _maximumZoom = 3;
    private _areMatrixesDirty = true;

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
        this.updateMatrixes();

        return this._transformMatrix;
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

        this._areMatrixesDirty = false;
    }

    public destory() {

    }
}