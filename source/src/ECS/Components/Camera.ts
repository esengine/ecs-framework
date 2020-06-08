///<reference path="../Component.ts"/>
class Camera extends Component {
    private _zoom;
    private _origin: Vector2;
    private _transformMatrix: Matrix2D = Matrix2D.identity;
    private _inverseTransformMatrix = Matrix2D.identity;

    public get transformMatrix(){
        this.updateMatrixes();

        return this._transformMatrix;
    }

    constructor() {
        super();
    }

    public initialize() {

    }

    public update(){
        SceneManager.getActiveScene().entities.buffer.forEach(entity => entity.components.forEach(component => {
            if (component.displayRender){
                let has = this.entity.scene.$children.indexOf(component.displayRender)
                if (has == -1){
                    this.entity.scene.stage.addChild(component.displayRender);
                }
            }
        }));
    }

    public setPosition(position: Vector2){
        this.entity.transform.setPosition(position);

        return this;
    }

    public updateMatrixes(){
        this._transformMatrix = Matrix2D.createTranslation(-this.entity.transform.position.x, -this.entity.transform.position.y);
    }

    public destory() {

    }
}