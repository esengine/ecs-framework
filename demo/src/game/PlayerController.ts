class PlayerController extends Component {
    private down: boolean = false;
    private touchPoint: Vector2 = Vector2.zero;

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
        if (this.down){
            let camera = SceneManager.getActiveScene().camera;
            let worldVec = camera.screenToWorldPoint(this.touchPoint);
            this.entity.position = Vector2.lerp(this.entity.position, Vector2.add(worldVec, 
            new Vector2(this.entity.scene.stage.stageWidth / 2, this.entity.scene.stage.stageHeight / 2)), Time.deltaTime);
        }
    }
}