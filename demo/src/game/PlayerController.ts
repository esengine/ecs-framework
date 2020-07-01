class PlayerController extends Component {
    private down: boolean = false;
    private touchPoint: Vector2 = Vector2.zero;
    private mover: Mover;
    private spriteRenderer: SpriteRenderer;

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

        if (!this.spriteRenderer)
            this.spriteRenderer = this.entity.getComponent<SpriteRenderer>(SpriteRenderer);

        if (!this.mover)
            return;

        if (!SpriteRenderer)
            return;

        if (this.down){
            let camera = SceneManager.scene.camera;
            let moveLeft: number = 0;
            let moveRight: number = 0;
            let speed = 200;
            let worldPos = Input.touchPosition;
            if (worldPos.x < this.spriteRenderer.x){
                moveLeft = -1;
            } else if(worldPos.x > this.spriteRenderer.x){
                moveLeft = 1;
            }

            if (worldPos.y < this.spriteRenderer.y){
                moveRight = -1;
            } else if(worldPos.y > this.spriteRenderer.y){
                moveRight = 1;
            }
            this.mover.move(new Vector2(moveLeft * speed * Time.deltaTime, moveRight * speed * Time.deltaTime));
        }
    }
}