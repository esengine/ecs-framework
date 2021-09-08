module es {
    /**
     * 渲染器被添加到场景中并处理对 RenderableComponent.render 和 Entity.debugRender 的所有实际调用
     * 一个简单的渲染器可以只启动 Batcher.instanceGraphics.batcher 或者它可以创建自己的本地 Batcher 实例
     * 如果它需要它进行某种自定义渲染, 请注意，最佳做法是确保所有渲染器都具有较低的 renderOrders 以避免出现问题
     * 给他们一个负的 renderOrder 是处理这个问题的好策略
     */
    export abstract class Renderer {
        /**
         * 此渲染器用于渲染的相机（实际上是它的 transformMatrix 和用于剔除的边界）
         * 这不是必需的字段
         * Renderer 子类可以选择调用 beginRender 时使用的相机
         */
        public camera: Camera;
        /**
         * 指定场景调用渲染器的顺序
         */
        public readonly renderOrder: number = 0;
        /**
         * 此渲染器的标志，决定是否应调试渲染。 render 方法接收一个 bool (debugRenderEnabled)
         * 让渲染器知道全局调试渲染是否打开/关闭。 然后渲染器使用本地 bool 来决定它是否应该调试渲染。
         */
        public shouldDebugRender: boolean = true;

        constructor(renderOrder: number, camera: Camera) {
            this.renderOrder = renderOrder;
            this.camera = camera;
        }

        /**
         * 当渲染器添加到场景时调用
         * @param scene 
         */
        public onAddedToScene(scene: es.Scene) { }

        /**
         * 当场景结束或此渲染器从场景中移除时调用。 使用它进行清理
         */
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

        public abstract render(scene: Scene): void;

        /**
         * 渲染 RenderableComponent 刷新 Batcher 并在必要时重置当前材质
         * @param renderable 
         * @param cam 
         * @returns 
         */
        protected renderAfterStateCheck(renderable: IRenderable, cam: ICamera) {
            if (!Graphics.instance)
                return;

            renderable.render(Graphics.instance.batcher, cam);
        }

        /**
         * 默认的 debugRender 方法只是遍历所有实体并调用 entity.debugRender
         * 请注意，此时您正处于批处理中间，因此您可能需要调用 Batcher.End 和 Batcher.begin 以清除任何等待渲染的材质和项目。
         * @param scene 
         * @returns 
         */
        protected debugRender(scene: Scene, cam: Camera) {
            if (!Graphics.instance)
                return;

            es.Physics.debugDraw(2);

            for (let i = 0; i < scene.entities.count; i++) {
                let entity = scene.entities.buffer[i];
                if (entity.enabled) {
                    entity.debugRender(Graphics.instance.batcher);
                }
            }
        }
    }
}