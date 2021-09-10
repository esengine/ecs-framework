module es {
    /**
     * 包含 Stage 并委托 update/render/debugRender 调用的简单组件
     */
    export class UICanvas extends RenderableComponent implements IUpdatable {
        public getwidth() {
            return this.stage.getWidth();
        }

        public getheight() {
            return this.stage.getHeight();
        }

        public stage: Stage;

        constructor() {
            super();
            this.stage = new Stage();
        }

        public onAddedToEntity() {
            this.stage.entity = this.entity;
        }

        public update() {
        }

        public render(batcher: IBatcher, camera: ICamera): void {
        }
    }
}