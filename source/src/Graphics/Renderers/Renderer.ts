module es {
    export abstract class Renderer {
        public camera: ICamera;
        public readonly renderOrder: number = 0;
        public shouldDebugRender: boolean = true;
    
        constructor(renderOrder: number, camera: ICamera) {
            this.renderOrder = renderOrder;
            this.camera = camera;
        }
    
        public onAddedToScene(scene: es.Scene) { }
    
        public unload() { }
    
        protected beginRender(cam: ICamera) {
            Graphics.instance.batcher.begin(cam);
        }
    
        protected endRender() {
            Graphics.instance.batcher.end();
        }
    
        public abstract render(scene: Scene): void;
    
        protected renderAfterStateCheck(renderable: IRenderable, cam: ICamera) {
            renderable.render(Graphics.instance.batcher, cam);
        }
    
        protected debugRender(scene: Scene) {
            for (let i = 0; i < scene.entities.count; i ++) {
                let entity = scene.entities.buffer[i];
                if (entity.enabled) {
                    entity.debugRender(Graphics.instance.batcher);
                }
            }
        }
    }
}