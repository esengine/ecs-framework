class PlayerController extends Component {
    private down: boolean = false;
    private touchPoint: Vector2 = Vector2.zero;
    private mover: Mover;

    public onAddedToEntity(){
        this.entity.scene.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.touchBegin, this);
        this.entity.scene.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.touchBegin, this);
        this.entity.scene.stage.addEventListener(egret.TouchEvent.TOUCH_END, this.touchEnd, this);
    }

    private touchBegin(evt: egret.TouchEvent){
        this.down = true;
        this.touchPoint = new Vector2(evt.stageX, evt.stageY);
    }

    private touchEnd(evt: egret.TouchEvent){
        this.down = false;
        this.touchPoint = new Vector2(evt.stageX, evt.stageY);
    }

    public update(){
        if (!this.mover)
            this.mover = this.entity.getComponent<Mover>(Mover);

        if (!this.mover)
            return;

        if (this.down){
            let camera = SceneManager.scene.camera;
            this.mover.move(Input.touchPositionDelta);
            console.log(Input.touchPositionDelta);
        }
    }
}