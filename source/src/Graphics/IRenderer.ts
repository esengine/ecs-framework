module es {
    export interface IRenderer {
        /**
         * Batcher使用的材料。任何RenderableComponent都可以覆盖它
         */
        material: IMaterial;
        /** 
        * 渲染器用于渲染的Camera(实际上是它的transformMatrix和culling的边界)。
        * 这是一个方便的字段，不是必需的。
        * 渲染器子类可以在调用beginRender时选择使用的摄像机
        */
        camera: ICamera;
        /**
         * 指定场景调用渲染器的顺序
         */
        renderOrder: number;
        /**
         * 如果renderTarget不是空的，这个渲染器将渲染到RenderTarget中，而不是渲染到屏幕上
         */
        renderTexture;
        /**
         * 标志，决定是否要调试渲染。
         * 渲染方法接收一个bool(debugRenderEnabled)让渲染器知道全局调试渲染是否开启/关闭。
         * 然后渲染器使用本地的bool来决定是否应该调试渲染
         */
        shouldDebugRender: boolean;
        /**
         * 如果为true，场景将使用场景RenderTarget调用SetRenderTarget。
         * 如果Renderer有一个renderTexture，默认的实现会返回true
         */
        wantsToRenderToSceneRenderTarget: boolean;
        /**
         * 如果为true，场景将在所有后处理器完成后调用渲染方法。
         * 这必须在调用Scene.addRenderer生效之前设置为true，并且Renderer不应该有renderTexture。
         * 使用这种类型的渲染器的主要原因是为了让你可以在不进行后期处理的情况下，在Scene的其余部分上渲染你的UI。
         * ScreenSpaceRenderer是一个将此设置为真的Renderer例子
         */
        wantsToRenderAfterPostProcessors: boolean;
        /**
         * 当Renderer被添加到场景中时被调用
         * @param scene 
         */
        onAddedToScene(scene: Scene);
        /**
         * 当场景结束或该渲染器从场景中移除时，调用该函数，用于清理
         */
        unload();
        render(scene: Scene);
        /**
         * 当默认的场景RenderTarget被调整大小时，以及在场景已经开始的情况下添加一个Renderer时，会被调用。
         * @param newWidth 
         * @param newHeight 
         */
        onSceneBackBufferSizeChanged(newWidth: number, newHeight: number);
        compare(other: IRenderer): number;
    }
}