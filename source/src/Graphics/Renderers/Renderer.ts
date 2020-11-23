module es {
    /**
     * 渲染器被添加到场景中并处理所有对RenderableComponent的实际调用
     */
    export abstract class Renderer {
        /**
         * 渲染器用于渲染的摄像机(实际上是用于剔除的变换矩阵和边界)
         * 不是必须的
         * Renderer子类可以选择调用beginRender时使用的摄像头
         */
        public camera: Camera;
        /**
         * 指定场景调用渲染器的顺序
         */
        public readonly renderOrder: number = 0;
        /**
         * 这个渲染器的标志，决定它是否应该调试渲染。
         * render方法接收一个bool (debugRenderEnabled)，让渲染器知道全局调试渲染是否打开/关闭。
         * 渲染器然后使用本地bool来决定它是否应该调试渲染。
         */
        public shouldDebugRender: boolean = true;

        protected constructor(renderOrder: number, camera: Camera = null) {
            this.camera = camera;
            this.renderOrder = renderOrder;
        }

        /**
         * 当渲染器被添加到场景时调用
         * @param scene
         */
        public onAddedToScene(scene: Scene) {
        }

        /**
         * 当场景结束或渲染器从场景中移除时调用。使用这个进行清理。
         */
        public unload() {
        }

        public abstract render(scene: Scene);

        /**
         * 当默认场景渲染目标被调整大小和当场景已经开始添加渲染器时调用
         * @param newWidth
         * @param newHeight
         */
        public onSceneBackBufferSizeChanged(newWidth: number, newHeight: number) {

        }

        public compareTo(other: Renderer): number {
            return this.renderOrder - other.renderOrder;
        }

        /**
         *
         * @param cam
         */
        protected beginRender(cam: Camera) {
        }

        /**
         *
         * @param renderable
         * @param cam
         */
        protected renderAfterStateCheck(renderable: IRenderable, cam: Camera) {
            renderable.render(cam);
        }

        /**
         * 默认debugRender方法只循环遍历所有实体并调用entity.debugRender
         * @param scene
         * @param cam
         */
        protected debugRender(scene: Scene, cam: Camera){
            for (let i = 0; i < scene.entities.count; i ++){
                let entity = scene.entities.buffer[i];
                if (entity.enabled)
                    entity.debugRender(cam);
            }
        }
    }
}
