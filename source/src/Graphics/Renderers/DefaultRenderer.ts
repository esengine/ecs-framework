///<reference path="Renderer.ts" />
module es {
    export class DefaultRenderer extends Renderer {
        constructor(renderOrder: number = 0, camera: ICamera = null) {
            super(renderOrder, camera);
        }

        public render(scene: Scene): void {
            let cam = this.camera ? this.camera : scene.camera;
            this.beginRender(cam);

            for (let i = 0; i < scene.renderableComponents.count; i ++) {
                let renderable = scene.renderableComponents.get(i);
                if (renderable.enabled && renderable.isVisibleFromCamera(scene.camera))
                    this.renderAfterStateCheck(renderable, cam);
            }

            if (this.shouldDebugRender && es.Core.debugRenderEndabled) {
                this.debugRender(scene);
            }

            this.endRender();
        }
    }
}