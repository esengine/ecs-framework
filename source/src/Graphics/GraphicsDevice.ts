module es {
    export class GraphicsDevice {
        public graphicsCapabilities: GraphicsCapabilities;

        constructor() {
            this.setup();
            this.graphicsCapabilities = new GraphicsCapabilities();
            this.graphicsCapabilities.initialize(this);
        }

        private _viewport: Viewport;

        public get viewport(): Viewport {
            return this._viewport;
        }

        private setup() {
            this._viewport = new Viewport(0, 0, Core._instance.stage.stageWidth, Core._instance.stage.stageHeight);
        }
    }
}
