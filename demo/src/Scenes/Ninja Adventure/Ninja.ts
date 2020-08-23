module samples {
    import SpriteAnimator = es.SpriteAnimator;
    import Mover = es.Mover;

    export class Ninja extends es.Component {
        public _animator: SpriteAnimator;

        public _mover: Mover;

        public onAddedToEntity(): void {
            let characterPng = RandomUtils.randint(1, 6);
            this.entity.scene.content.loadRes(`${characterPng}_png`).then(texture => {
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

                this._animator.play("walkDown");
            });
        }
    }
}