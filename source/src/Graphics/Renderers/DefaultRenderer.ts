///<reference path="./Renderer.ts" />
class DefaultRenderer extends Renderer {
    public render(scene: Scene) {
        let cam = this.camera ? this.camera : scene.camera;

        for (let i = 0; i < scene.renderableComponents.count; i++){
            let renderable = scene.renderableComponents.buffer[i];
            if (renderable.enabled && renderable.isVisibleFromCamera(cam))
                this.renderAfterStateCheck(renderable, cam);
        }
    }
}