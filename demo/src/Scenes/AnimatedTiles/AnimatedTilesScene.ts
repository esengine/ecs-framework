module samples {
    export class AnimatedTilesScene extends SampleScene {
        constructor(){
            super(true, true);
        }

        public initialize(){
            super.initialize();

            let tiledEntity = this.createEntity("tiled-map-entity");
            try {
                es.TiledMapLoader.loadTmxMap(new es.TmxMap(), "orthogonal-outside_json").then(map => {
                    tiledEntity.addComponent(new es.TiledMapRenderer(map));
                    manager.AlterManager.alter_tips("Tiled tiles场景加载成功");
                });
            } catch (err){
                console.error(err);
            }
        }
    }
}