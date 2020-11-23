module es {
    /**
     * 当该接口应用到组件时，它将注册组件以场景渲染器显示
     * 该接口请谨慎实现
     */
    export interface IRenderable {
        /**
         * 对象的AABB用于相机剔除
         */
        bounds: Rectangle;
        /**
         * 这个组件是否应该被渲染
         */
        enabled: boolean;
        /**
         * 较低的渲染层在前面，较高的在后面
         */
        renderLayer: number;
        /**
         * 可渲染的可见性。状态的改变会调用onBecameVisible/onBecameInvisible方法
         */
        isVisible: boolean;
    }

    /**
     * 用于排序IRenderables的比较器
     */
    export class RenderableComparer {
        public compare(self: IRenderable, other: IRenderable) {
            return other.renderLayer - self.renderLayer;
        }
    }
}
