module samples {
    import SpriteAnimator = es.SpriteAnimator;
    import Mover = es.Mover;
    import VirtualButton = es.VirtualButton;
    import VirtualIntegerAxis = es.VirtualIntegerAxis;
    import KeyboardKey = es.KeyboardKey;
    import KeyboardKeys = es.KeyboardKeys;
    import OverlapBehavior = es.OverlapBehavior;
    import Vector2 = es.Vector2;
    import Time = es.Time;
    import Keys = es.Keys;
    import CollisionResult = es.CollisionResult;
    import SubpixelVector2 = es.SubpixelVector2;
    import ITriggerListener = es.ITriggerListener;

    export class Ninja extends es.Component implements ITriggerListener{
        public _animator: SpriteAnimator;

        public _subpixelV2: SubpixelVector2 = new SubpixelVector2();
        public _mover: Mover;
        public _moveSpeed = 100;
        public _projectileVelocity: Vector2 = new Vector2(175);

        public _fireInput: VirtualButton;
        public _xAxisInput: VirtualIntegerAxis;
        public _yAxisInput: VirtualIntegerAxis;

        public onAddedToEntity(): void {
            let characterPng = RandomUtils.randint(1, 6);
            let texture = RES.getRes(`${characterPng}_png`);
            let sprites = es.Sprite.spritesFromAtlas(texture, 16, 16);

            this._mover = this.entity.addComponent(new Mover());
            this._animator = this.entity.addComponent(new SpriteAnimator());

            this._animator.addAnimation("walkLeft", new es.SpriteAnimation([
                sprites[2],
                sprites[6],
                sprites[10],
                sprites[14]
            ], 4));

            this._animator.addAnimation("walkRight", new es.SpriteAnimation([
                sprites[3],
                sprites[7],
                sprites[11],
                sprites[15]
            ], 4));

            this._animator.addAnimation("walkDown", new es.SpriteAnimation([
                sprites[0],
                sprites[4],
                sprites[8],
                sprites[12]
            ], 4));

            this._animator.addAnimation("walkUp", new es.SpriteAnimation([
                sprites[1],
                sprites[5],
                sprites[9],
                sprites[13]
            ], 4));

            this.setupInput();
        }

        public onRemovedFromEntity(): void {
            this._fireInput.deregister();
        }

        public setupInput(){
            // 设置输入射击一个火球。我们允许在键盘z上使用
            this._fireInput = new VirtualButton();
            this._fireInput.nodes.push(new KeyboardKey(Keys.z));

            this._xAxisInput = new VirtualIntegerAxis();
            this._xAxisInput.nodes.push(new KeyboardKeys(OverlapBehavior.takeNewer, Keys.left, Keys.right));

            this._yAxisInput = new VirtualIntegerAxis();
            this._yAxisInput.nodes.push(new KeyboardKeys(OverlapBehavior.takeNewer, Keys.up, Keys.down));
        }

        public update(): void {
            let moveDir = new Vector2(this._xAxisInput.value, this._yAxisInput.value);
            let animation = "walkDown";

            if (moveDir.x < 0)
                animation = "walkLeft";
            else if(moveDir.x > 0)
                animation = "walkRight";

            if (moveDir.y < 0)
                animation = "walkUp";
            else if(moveDir.y > 0)
                animation = "walkDown";

            if (!moveDir.equals(Vector2.zero)){
                if (!this._animator.isAnimationActive(animation))
                    this._animator.play(animation);
                else
                    this._animator.unPause();

                let movement = Vector2.multiply(moveDir, new Vector2(this._moveSpeed * Time.deltaTime));
                let res: CollisionResult = new CollisionResult();
                this._mover.calculateMovement(movement, res);
                this._subpixelV2.update(movement);
                this._mover.applyMovement(movement);
            }else{
                this._animator.pause();
            }

            if (this._fireInput.isPressed){
                let dir = Vector2.zero;
                switch (this._animator.currentAnimationName) {
                    case "walkUp":
                        dir.y = -1;
                        break;
                    case "walkDown":
                        dir.y = 1;
                        break;
                    case "walkRight":
                        dir.x = 1;
                        break;
                    case "walkLeft":
                        dir.x = -1;
                        break;
                    default:
                        dir = new Vector2(1, 0);
                        break;
                }

                let ninjaScene = this.entity.scene as NinjaAdventureScene;
                ninjaScene.createProjectiles(this.entity.transform.position, Vector2.multiply(this._projectileVelocity, dir));
            }
        }

        public onTriggerEnter(other: es.Collider, local: es.Collider): any {
            console.log(`triggerEnter: ${other.entity.name}`);
        }

        public onTriggerExit(other: es.Collider, local: es.Collider): any {
            console.log(`triggerExit: ${other.entity.name}`);
        }
    }
}