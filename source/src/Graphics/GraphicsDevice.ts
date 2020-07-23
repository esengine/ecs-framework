module es {
    export class GraphicsDevice {
        private viewport: Viewport;

        public graphicsCapabilities: GraphicsCapabilities;

        constructor(){
            this.graphicsCapabilities = new GraphicsCapabilities();
            this.graphicsCapabilities.initialize(this);
        }
    }
}
