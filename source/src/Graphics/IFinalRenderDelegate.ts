module es {
    /**
     * 可选接口，可以添加到任何对象中，用于特殊情况下需要覆盖最终渲染到屏幕。
     * 请注意，如果有IFinalRenderDelegate存在，Scene.screenshotRequestCallback将不会像预期的那样工作。
     */
    export interface IFinalRenderDelegate {
        /**
         * 在添加到场景中时调用
         * @param scene 
         */
        onAddedToScene(scene: Scene);
        /**
         * 当后置缓冲区大小改变时调用
         * @param newWidth 
         * @param newHeight 
         */
        onSceneBackBufferSizeChanged(newWidth: number, newHeight: number);
        /**
         * 这个被场景调用，这样就可以处理最终的渲染。渲染应该在finalRenderTarget中完成。
         * 在大多数情况下，finalRenderTarget将是空的，所以渲染将只是到回缓冲区。
         * finalRenderTarget只有在场景转换的第一帧时才会被设置，其中转换已经请求了上一个场景的渲染
         * @param finalRenderTarget 
         * @param source 
         * @param finalRenderDestinationRect 
         */
        handleFinalRender(finalRenderTarget, source, finalRenderDestinationRect: Rectangle);
        /**
         * 场景结束时调用。在这里释放任何资源
         */
        unload();
    }
}