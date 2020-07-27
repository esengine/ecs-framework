module component {
    import Component = es.Component;
    import Vector2 = es.Vector2;
    import Mover = es.Mover;
    import SpriteRenderer = es.SpriteRenderer;
    import Time = es.Time;
    import Input = es.Input;
    import CollisionResult = es.CollisionResult;

    export class PlayerController extends Component {
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
                let moveLeft: number = 0;
                let moveRight: number = 0;
                let speed = 100;
                let worldPos = this.entity.scene.camera.mouseToWorldPoint();
                if (worldPos.x < this.spriteRenderer.transform.position.x){
                    moveLeft = -1;
                } else if(worldPos.x > this.spriteRenderer.transform.position.x){
                    moveLeft = 1;
                }

                if (worldPos.y < this.spriteRenderer.transform.position.y){
                    moveRight = -1;
                } else if(worldPos.y > this.spriteRenderer.transform.position.y){
                    moveRight = 1;
                }
                let collisionResult = new CollisionResult();
                this.mover.move(new Vector2(moveLeft * speed * Time.deltaTime, moveRight * speed * Time.deltaTime), collisionResult);
            }
        }
    }
}
