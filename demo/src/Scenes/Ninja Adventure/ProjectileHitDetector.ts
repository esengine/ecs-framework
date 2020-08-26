module es {
    /**
     * 简单的组件，可以检测它是否被弹丸击中。当被击中时，它会闪烁并在被击中一定次数后自我毁灭。
     */
    export class ProjectileHitDetector extends Component implements ITriggerListener{
        public hitsUntilDead: number = 10;
        public _hitCounter: number;
        public _sprite: SpriteRenderer;

        public onAddedToEntity(): void {
            this._sprite = this.entity.getComponent<SpriteRenderer>(SpriteRenderer);
        }

        public onTriggerEnter(other: es.Collider, local: es.Collider): any {
            this._hitCounter ++;
            if (this.hitsUntilDead >= this.hitsUntilDead){
                this.entity.destroy();
                return;
            }

            this._sprite.color = 0xFF0000;
            Core.schedule(0.1, false, this, timer => {
               this._sprite.color = 0x000000;
            });
        }

        public onTriggerExit(other: es.Collider, local: es.Collider): any {
        }
    }
}