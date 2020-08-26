module samples {
    import CircleCollider = es.CircleCollider;
    import Flags = es.Flags;
    import SpriteRenderer = es.SpriteRenderer;
    import ProjectileHitDetector = es.ProjectileHitDetector;
    import FollowCamera = es.FollowCamera;

    export class NinjaAdventureScene extends SampleScene {
        public async onStart() {
            super.onStart();

            let playerEntity = this.createEntity("player");
            playerEntity.position = new es.Vector2(256, 224);
            playerEntity.addComponent(new Ninja());
            let collider = playerEntity.addComponent(new CircleCollider());

            // 我们只希望与默认图层0上的组件发生冲突
            Flags.setFlagExclusive(collider.collidesWithLayers, 0);
            // 移动到第1层 保证自己的图层不会如果增加攻击方式则不会攻击到自身
            Flags.setFlagExclusive(collider.physicsLayer, 1);

            this.camera.entity.addComponent(new FollowCamera(playerEntity));

            this.content.loadRes("moon_png").then(moonTexture => {
                let moonEntity = this.createEntity("moon");
                moonEntity.position = new es.Vector2(412, 460);
                moonEntity.addComponent(new SpriteRenderer(moonTexture));
                moonEntity.addComponent(new ProjectileHitDetector());
                moonEntity.addComponent(new CircleCollider());
            });
        }

        public update(){
            super.update();

            this.findEntity("player").position.x -= es.Time.deltaTime * 10;
            this.findEntity("player").position.y -= es.Time.deltaTime * 10;
        }
    }
}