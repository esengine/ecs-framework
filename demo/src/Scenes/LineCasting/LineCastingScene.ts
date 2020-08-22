module samples {
    import Vector2 = es.Vector2;
    import SpriteRenderer = es.SpriteRenderer;
    import BoxCollider = es.BoxCollider;

    export class LineCastingScene extends SampleScene {
        public initialize(): void {
            super.initialize();

            this.content.loadRes("moon_png").then((moonTex: egret.Texture) => {
                let playerEntity = this.createEntity("player");
                playerEntity.position = new Vector2(es.Core.scene.width / 2, es.Core.scene.height / 2);
                playerEntity.addComponent(new SpriteRenderer(moonTex));
                let coll = new BoxCollider().setSize(moonTex.textureWidth, moonTex.textureHeight);
                playerEntity.addComponent(coll);
                playerEntity.position = new Vector2(200, 100);

                let lineCaster = this.createEntity("linecaster").addComponent(new LineCaster());
                lineCaster.transform.position = new Vector2(300, 100);

                manager.AlterManager.alter_tips("lineCasting加载成功");
            });
        }
    }
}