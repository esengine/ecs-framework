/** 
 * 所有可渲染组件的基类 
 */
abstract class RenderableComponent extends Component {
    private _isVisible: boolean;
    private _areBoundsDirty = true;
    private _bounds: Rectangle;
    private _localOffset: Vector2;

    public get width(){
        return this.bounds.width;
    }

    public get height(){
        return this.bounds.height;
    }

    public get isVisible(){
        return this._isVisible;
    }

    public set isVisible(value: boolean){
        this._isVisible = value;

        if (this._isVisible)
            this.onBecameVisible();
        else
            this.onBecameInvisible();
    }

    public get bounds(): Rectangle{
        if (this._areBoundsDirty){
            this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, Vector2.Zero,
                this.entity.transform.scale, this.entity.transform.rotation, this.width, this.height);
            this._areBoundsDirty = false;
        }

        return this._bounds;
    }

    protected onBecameVisible(){}

    protected onBecameInvisible(){}

    public isVisibleFromCamera(camera: Camera): boolean{
        this.isVisible = camera.bounds.intersects(this.bounds);
        return this.isVisible;
    }
}