module es {
    /**
     * 渲染器使用自己的不移动的摄像机进行渲染。
     */
    export class ScreenSpaceRenderer extends Renderer {
        public renderLayers: number[];

        constructor(renderOrder: number, ...renderLayers: number[]){
            super(renderOrder, null);
            renderLayers.sort();
            renderLayers.reverse();
            this.renderLayers = renderLayers;
        }

        public render(scene: Scene) {
            this.beginRender(this.camera);

            for (let i = 0; i < this.renderLayers.length; i ++){
                let renderables = scene.renderableComponents.componentsWithRenderLayer(this.renderLayers[i]);
                for (let j = 0; j < renderables.length; j ++){
                    let renderable = renderables[j];
                    if (renderable.enabled && renderable.isVisibleFromCamera(this.camera))
                        this.renderAfterStateCheck(renderable, this.camera);
                }
            }

            if (this.shouldDebugRender && Core.debugRenderEndabled)
                this.debugRender(scene, this.camera);
        }

        protected debugRender(scene: es.Scene, cam: es.Camera) {
            for (let i = 0; i < this.renderLayers.length; i ++){
                let renderables = scene.renderableComponents.componentsWithRenderLayer(this.renderLayers[i]);
                for (let j = 0; j < renderables.length; j ++){
                    let entity = renderables[j];
                    if (entity.enabled)
                        entity.debugRender();
                }
            }
        }

        public onSceneBackBufferSizeChanged(newWidth: number, newHeight: number) {
            super.onSceneBackBufferSizeChanged(newWidth, newHeight);

            if (!this.camera)
                this.camera = Core.scene.createEntity("screenspace camera").addComponent(new Camera());
        }
    }
}
