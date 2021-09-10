module es {
    /**
     * 仅渲染指定的 renderLayers 的渲染器
     * 当与渲染不同渲染层的其他 RenderLayerRenderer 一起使用时，有助于将 UI 渲染与游戏的其余部分分开
     */
    export class RenderLayerRenderer extends Renderer {
        /** 此渲染器将渲染的渲染层 */
        public renderLayers: number[];

        constructor(renderOrder: number, ...renderLayers: number[]) {
            super(renderOrder, null);
            renderLayers = renderLayers.sort((a, b)=>a - b);
            renderLayers = renderLayers.reverse();
            this.renderLayers = renderLayers;
        }

        public render(scene: Scene): void {
            const cam = this.camera ? this.camera : scene.camera;
            this.beginRender(cam);

            for (let i = 0; i < this.renderLayers.length; i ++) {
                const renderables = scene.renderableComponents.componentsWithRenderLayer(this.renderLayers[i]);
                for (let j = 0; j < renderables.length; j ++) {
                    const renderable = renderables[j];
                    if (renderable.enabled && renderable.isVisibleFromCamera(cam))
                        this.renderAfterStateCheck(renderable, cam);
                }
            }

            if (this.shouldDebugRender && Core.debugRenderEnabled)
                this.debugRender(scene, cam);

            this.endRender();
        }

        protected debugRender(scene: Scene, cam: Camera) {
            Graphics.instance.batcher.end();
            Graphics.instance.batcher.begin(cam);

            for (let i = 0; i < this.renderLayers.length; i ++) {
                const renderables = scene.renderableComponents.componentsWithRenderLayer(this.renderLayers[i]);
                for (let j = 0; j < renderables.length; j ++) {
                    const renderable = renderables[j];
                    if (renderable.enabled && renderable.isVisibleFromCamera(cam))
                        renderable.debugRender(Graphics.instance.batcher);
                }
            }

            super.debugRender(scene, cam);
        }
    }
}