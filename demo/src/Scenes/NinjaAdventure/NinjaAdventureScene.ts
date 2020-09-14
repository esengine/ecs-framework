module samples {
    import CircleCollider = es.CircleCollider;
    import Flags = es.Flags;
    import SpriteRenderer = es.SpriteRenderer;
    import ProjectileHitDetector = es.ProjectileHitDetector;
    import FollowCamera = es.FollowCamera;
    import TiledMapLoader = es.TiledMapLoader;
    import TiledMapRenderer = es.TiledMapRenderer;
    import Vector2 = es.Vector2;
    import ProjectileMover = es.ProjectileMover;
    import Sprite = es.Sprite;
    import SpriteAnimator = es.SpriteAnimator;
    import SpriteAnimation = es.SpriteAnimation;

    export class NinjaAdventureScene extends SampleScene {
        public async onStart() {
            super.onStart();

            let tiledEntity = this.createEntity("tiled-map-entity");
            TiledMapLoader.loadTmxMap(new es.TmxMap(), "tilemap_json").then(map => {
                let tiledMapRenderer = tiledEntity.addComponent(new TiledMapRenderer(map, "collision"));
                tiledMapRenderer.setLayersToRender("tiles", "terrain", "details");

                tiledMapRenderer.renderLayer = 10;

                let tiledMapDetailsComp = tiledEntity.addComponent(new TiledMapRenderer(map));
                tiledMapRenderer.setLayerToRender("above-details");
                tiledMapRenderer.renderLayer = -1;

                let topLeft = new Vector2(map.tileWidth, map.tileWidth);
                let bottomRight = new Vector2(map.tileWidth * (map.width - 1),
                    map.tileWidth * (map.height - 1));
                tiledEntity.addComponent(new CameraBounds(topLeft, bottomRight));
            });


            let playerEntity = this.createEntity("player");
            playerEntity.position = new es.Vector2(256 / 2, 224 / 2);
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

            manager.AlterManager.alter_tips("Ninja 场景加载成功");
        }

        /**
         * 创建抛射物并使其运动
         * @param position
         * @param velocity
         */
        public createProjectiles(position: Vector2, velocity: Vector2) {
            // 创建一个实体来存放投射程序及其逻辑
            let entity = this.createEntity("projectile");
            entity.position = position;
            entity.addComponent(new ProjectileMover());
            entity.addComponent(new FireballProjectileController(velocity));

            let collider = entity.addComponent(new CircleCollider());
            Flags.setFlagExclusive(collider.collidesWithLayers, 0);
            Flags.setFlagExclusive(collider.physicsLayer, 1);

            this.content.loadRes("plume_png").then(()=>{
                let texture = RES.getRes("plume_png");
                let sprites = Sprite.spritesFromAtlas(texture, 16, 16);
                let animator = entity.addComponent(new SpriteAnimator());
                animator.renderLayer = 1;

                animator.addAnimation("default", new SpriteAnimation(sprites));
                animator.play("default");
            });

            return entity;
        }
    }
}