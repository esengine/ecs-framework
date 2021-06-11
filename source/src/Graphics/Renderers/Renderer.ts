module es {
    export abstract class Renderer {
        public camera: ICamera;
        public readonly renderOrder: number = 0;
        public shouldDebugRender: boolean = true;
        protected renderDirty: boolean = true;
    
        constructor(renderOrder: number, camera: ICamera) {
            this.renderOrder = renderOrder;
            this.camera = camera;

            Core.emitter.addObserver(CoreEvents.renderChanged, this.onRenderChanged, this);
        }
    
        public onAddedToScene(scene: es.Scene) { }
    
        public unload() { }
    
        protected beginRender(cam: ICamera) {
            if (!Graphics.instance)
                return;

            Graphics.instance.batcher.begin(cam);
        }
    
        protected endRender() {
            if (!Graphics.instance)
                return;

            Graphics.instance.batcher.end();
        }

        protected onRenderChanged() {
            this.renderDirty = true;
        }
    
        public abstract render(scene: Scene): void;
    
        protected renderAfterStateCheck(renderable: IRenderable, cam: ICamera) {
            if (!Graphics.instance)
                return;
            
            renderable.render(Graphics.instance.batcher, cam);
        }
    
        protected debugRender(scene: Scene) {
            if (!Graphics.instance)
                return;
            
            es.Physics.debugDraw(2);

            for (let i = 0; i < scene.entities.count; i ++) {
                let entity = scene.entities.buffer[i];
                if (entity.enabled) {
                    entity.debugRender(Graphics.instance.batcher);
                }
            }
        }
    }
}