module es {
    export class GraphicsDevice {
        private _viewport: Viewport;
        public get viewport(): Viewport{
            return this._viewport;
        }

        public graphicsCapabilities: GraphicsCapabilities;

        constructor(){
            this.setup();
            this.graphicsCapabilities = new GraphicsCapabilities();
            this.graphicsCapabilities.initialize(this);
        }

        private setup(){
            this._viewport = new Viewport(0, 0, Core._instance.stage.stageWidth, Core._instance.stage.stageHeight);
        }
    }
}
