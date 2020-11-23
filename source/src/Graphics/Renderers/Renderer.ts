module es {
    /**
     * 渲染器被添加到场景中并处理所有对RenderableComponent的实际调用
     */
    export abstract class Renderer {
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

        protected constructor(renderOrder: number) {
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
    }
}
