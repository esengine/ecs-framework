module samples {
    import CircleCollider = es.CircleCollider;
    import Flags = es.Flags;
    import SpriteRenderer = es.SpriteRenderer;

    export class NinjaAdventureScene extends SampleScene {
        constructor() {
            super(true, true);
        }

        public initialize(): void {
            super.initialize();

            let playerEntity = this.createEntity("player");
            playerEntity.position = new es.Vector2(256, 224);
            playerEntity.addComponent(new Ninja());
            let collider = playerEntity.addComponent(new CircleCollider());

            // 我们只希望与默认图层0上的组件发生冲突
            Flags.setFlagExclusive(collider.collidesWithLayers, 0);
            // 移动到第1层 保证自己的图层不会如果增加攻击方式则不会攻击到自身
            Flags.setFlagExclusive(collider.physicsLayer, 1);

            this.content.loadRes("moon_png").then(moonTexture => {
                let moonEntity = this.createEntity("moon");
                moonEntity.position = new es.Vector2(412, 460);
                moonEntity.addComponent(new SpriteRenderer(moonTexture));
                moonEntity.addComponent(new CircleCollider());
            });
        }
    }
}