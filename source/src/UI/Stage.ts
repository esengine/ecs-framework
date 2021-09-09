module es {
    export class Stage {
        public static debug: boolean = false;
        public entity: Entity;

        root: Group;
        public camera: Camera;

        /**
         * 返回包含 stageCoords 中所有元素的根组
         * @returns 
         */
        public getRoot() {
            return this.root;
        }

        public getWidth() {
            return Core.stage.stageWidth;
        }

        public getHeight() {
            return Core.stage.stageHeight;
        }

        constructor() {
            this.root = new Group();
            this.root.setStage(this);
        }
    }
}