module es {
    /**
     * 除了一个渲染层，只渲染所有的渲染器。
     * 当与RenderLayerRenderer一起使用时，将UI渲染与游戏的其他部分分离开来。
     */
    export class RenderLayerExcludeRenderer extends Renderer {
        public excludedRenderLayers: number[];

        constructor(renderOrder: number, ...excludedRenderLayers: number[]){
            super(renderOrder, null);
            this.excludedRenderLayers = excludedRenderLayers;
        }

        public render(scene: es.Scene) {
            let cam = this.camera ? this.camera : scene.camera;
            this.beginRender(cam);

            for (let i = 0; i < scene.renderableComponents.count; i ++) {
                let renderable = scene.renderableComponents.buffer[i];
                if (!this.excludedRenderLayers.contains(renderable.renderLayer) && renderable.enabled &&
                    renderable.isVisibleFromCamera(cam))
                    this.renderAfterStateCheck(renderable, cam);
            }

            if (this.shouldDebugRender && Core.debugRenderEndabled)
                this.debugRender(scene, cam);
        }

        protected debugRender(scene: es.Scene, cam: es.Camera) {
            for (let i = 0; i < scene.renderableComponents.count; i ++){
                let renderable = scene.renderableComponents.buffer[i];
                if (!this.excludedRenderLayers.contains(renderable.renderLayer) && renderable.enabled &&
                    renderable.isVisibleFromCamera(cam))
                    renderable.debugRender(cam);
            }

            super.debugRender(scene, cam);
        }
    }
}