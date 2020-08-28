module samples {
    export class BasicScene extends SampleScene {
        public async onStart() {
            super.onStart();
            manager.AlterManager.alter_tips("空白场景加载成功");

             this.content.loadRes("moon_png").then(moonTexture => {
                let moonEntity = this.createEntity("moon");
                moonEntity.position = new es.Vector2(0, 0);
                moonEntity.addComponent(new es.SpriteRenderer(moonTexture));

                this.camera.entity.addComponent(new es.FollowCamera(moonEntity));
            });
        }

        public update(){
            super.update();
            let moonEntity = this.findEntity("moon");
            if (!moonEntity)
                return;
            let spriteRenderer = moonEntity.getComponent<es.SpriteRenderer>(es.SpriteRenderer);
            console.log(spriteRenderer.bounds, this.camera.bounds);
        }
    }
}