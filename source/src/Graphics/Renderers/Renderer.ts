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

        protected constructor(renderOrder: number, camera: Camera = null){
            this.camera = camera;
            this.renderOrder = renderOrder;
        }

        /**
         * 当渲染器被添加到场景时调用
         * @param scene
         */
        public onAddedToScene(scene: Scene){}

        /**
         * 当场景结束或渲染器从场景中移除时调用。使用这个进行清理。
         */
        public unload(){ }

        /**
         *
         * @param cam
         */
        protected beginRender(cam: Camera){ }

        public abstract render(scene: Scene);

        /**
         *
         * @param renderable
         * @param cam
         */
        protected renderAfterStateCheck(renderable: IRenderable, cam: Camera){
            renderable.render(cam);
        }

        /**
         * 当默认场景渲染目标被调整大小和当场景已经开始添加渲染器时调用
         * @param newWidth
         * @param newHeight
         */
        public onSceneBackBufferSizeChanged(newWidth: number, newHeight: number){

        }

        public compareTo(other: Renderer): number{
            return this.renderOrder - other.renderOrder;
        }
    }
}
