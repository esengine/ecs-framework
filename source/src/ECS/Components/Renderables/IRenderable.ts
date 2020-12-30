module es {
    /**
     * 接口，当应用于一个Component时，它将被注册到场景渲染器中。
     * 请仔细实现这个功能 改变像layerDepth/renderLayer/material这样的东西需要更新Scene RenderableComponentList
     */
    export interface IRenderable {
        /** 包裹此对象的AABB。用来进行相机筛选 */
        bounds: Rectangle;
        /** 这个IRenderable是否应该被渲染 */
        enabled: boolean;
        /** 
         * 标准的Batcher图层深度，0为前面，1为后面。
         * 改变这个值会触发场景中可渲染组件列表的排序 
         */
        layerDepth: number;
        /** 
         * 较低的renderLayers在前面，较高的在後面，就像layerDepth一样，但不是限制在0-1。
         * 请注意，这意味着较高的renderLayers首先被发送到Batcher。在使用模板缓冲区时，这是一个重要的事实 
         */
        renderLayer: number;
        /**
         * 由渲染器使用，用于指定该精灵应如何渲染。
         * 如果非空，当组件从实体中移除时，它会被自动处理。
         */
        material;
        /**
         * 这个Renderable的可见性。
         * 状态的改变最终会调用onBecameVisible/onBecameInvisible方法
         */
        isVisible: boolean;
        /**
         * 用于检索一个已经铸造的Material子类的帮助程序
         */
        getMaterial<T extends IMaterial>(): T;
        /**
         * 如果Renderables的边界与Camera.bounds相交，则返回true。
         * 处理isVisible标志的状态切换。
         * 在你的渲染方法中使用这个方法来决定你是否应该渲染
         * @param camera 
         */
        isVisibleFromCamera(camera: ICamera): boolean;
        /**
         * 被渲染器调用。摄像机可以用来进行裁剪，并使用Batcher实例进行绘制
         * @param batcher 
         * @param camera 
         */
        render(batcher: IBatcher, camera: ICamera);
        /**
         * 只有在没有对撞机的情况下才会渲染边界。
         * 始终在原点上渲染一个正方形
         * @param batcher 
         */
        debugRender(batcher: IBatcher);
    }

    /**
     * 对IRenderables进行排序的比较器。
     * 首先按 RenderLayer 排序，然后按 LayerDepth 排序。
     * 如果出现平局，则使用材料作为平局的断定器，以避免渲染状态的改变
     */
    export class RenderableComparer implements IComparer<IRenderable> {
        public compare(self: IRenderable, other: IRenderable): number {
            let res = other.renderLayer - self.renderLayer;
            if (res == 0) {
                res = other.layerDepth - self.layerDepth;
                if (res == 0) {
                    if (self.material == other.material)
                        return 0;

                    if (other.material == null)
                        return -1;

                    return 1;
                }
            }

            return res;
        }
    }
}