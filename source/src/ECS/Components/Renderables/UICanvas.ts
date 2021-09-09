module es {
    /**
     * 包含 Stage 并委托 update/render/debugRender 调用的简单组件
     */
    export class UICanvas extends RenderableComponent implements IUpdatable {
        public stage: Stage;

        public update() {
        }

        public render(batcher: IBatcher, camera: ICamera): void {
        }
    }
}