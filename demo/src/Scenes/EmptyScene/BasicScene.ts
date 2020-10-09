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

                this.entities.frameAllocate = true;
                this.entities.maxAllocate = 10;
                for (let i = 0; i < 10000; i ++){
                    this.createEntity("");
                }
            });
        }

        public update(){
            super.update();
            console.log(this.entities.buffer.length);
        }
    }
}