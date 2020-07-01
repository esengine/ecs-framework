/** 
 * 所有可渲染组件的基类 
 */
abstract class RenderableComponent extends PooledComponent implements IRenderable {
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
        return new Rectangle(this.getBounds().x, this.getBounds().y, this.getBounds().width, this.getBounds().height);
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
        this.isVisible = camera.getBounds().intersects(this.getBounds());
        return this.isVisible;
    }

    public onEntityTransformChanged(comp: ComponentTransform){
        this._areBoundsDirty = true;
    }
}