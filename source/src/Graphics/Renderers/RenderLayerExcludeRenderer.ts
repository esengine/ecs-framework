module es {
    /**
     * 仅渲染除一个渲染层之外的所有渲染层的渲染器。
     * 当与 RenderLayerRenderer 结合使用时，有助于将 UI 渲染与游戏的其余部分分开
     */
    export class RenderLayerExcludeRenderer extends Renderer {
        public excludedRenderLayers: number[];

        constructor(renderOrder: number, ...excludedRenderLayers: number[]) {
            super(renderOrder, null);
            this.excludedRenderLayers = excludedRenderLayers;
        }

        public render(scene: Scene): void {
            const cam = this.camera ? this.camera : scene.camera;
            this.beginRender(cam);

            for (let i = 0; i < scene.renderableComponents.count; i++) {
                const renderable = scene.renderableComponents.get(i);
                if (this.excludedRenderLayers.indexOf(renderable.renderLayer) == -1 &&
                    renderable.enabled && renderable.isVisibleFromCamera(cam)) {
                    this.renderAfterStateCheck(renderable, cam);
                }
            }

            if (this.shouldDebugRender && Core.debugRenderEndabled)
                this.debugRender(scene, cam);

            this.endRender();
        }

        protected debugRender(scene: Scene, cam: Camera) {
            for (let i = 0; i < scene.renderableComponents.count; i ++) {
                const renderable = scene.renderableComponents.get(i);
                if (this.excludedRenderLayers.indexOf(renderable.renderLayer) == -1 &&
                    renderable.enabled && renderable.isVisibleFromCamera(cam))
                    renderable.debugRender(Graphics.instance.batcher);
            }

            super.debugRender(scene, cam);
        }
    }
}