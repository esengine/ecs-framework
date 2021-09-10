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

        public update() {
            this.updateKeyboardState();
            this.updateInputTouch();
        }

        updateKeyboardState() {

        }

        updateInputTouch() {

        }

        /**
         * 将屏幕坐标转换为舞台坐标
         * @param screenCoords 
         */
        public screenToStageCoordinates(screenCoords: Vector2) {
            if (this.camera == null)
                return screenCoords;

            return this.camera.screenToWorldPoint(screenCoords);
        }

        /**
         * 将舞台坐标转换为屏幕坐标
         * @param stageCoords 
         * @returns 
         */
        public stageToScreenCoordinates(stageCoords: Vector2) {
            if (this.camera == null)
                return stageCoords;

            return this.camera.worldToScreenPoint(stageCoords);
        }

        public hit(point: Vector2): Element {
            point = this.root.parentToLocalCoordianates(point);
            return this.root.hit(point);
        }
    }
}