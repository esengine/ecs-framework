/** 
 * 所有可渲染组件的基类 
 */
abstract class RenderableComponent extends Component implements IRenderable {
    private _isVisible: boolean;
    protected _areBoundsDirty = true;
    protected _bounds: Rectangle = new Rectangle();
    protected _localOffset: Vector2 = Vector2.zero;

    public color: number = 0x000000;

    public get width(){
        return this.getWidth();
    }

    public get height(){
        return this.getHeight();
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
            this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, new Vector2(0, 0),
                this.entity.transform.scale, this.entity.transform.rotation, this.width, this.height);
            this._areBoundsDirty = false;
        }

        return this._bounds;
    }

    protected getWidth(){
        return this.bounds.width;
    }

    protected getHeight(){
        return this.bounds.height;
    }

    protected onBecameVisible(){}

    protected onBecameInvisible(){}

    public abstract render(camera: Camera);

    public isVisibleFromCamera(camera: Camera): boolean{
        this.isVisible = camera.bounds.intersects(this.bounds);
        return this.isVisible;
    }

    public onEntityTransformChanged(comp: ComponentTransform){
        this._areBoundsDirty = true;
    }
}