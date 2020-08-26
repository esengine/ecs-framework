module samples {
    import ScreenSpaceRenderer = es.ScreenSpaceRenderer;
    import RenderLayerExcludeRenderer = es.RenderLayerExcludeRenderer;
    import SpriteRenderer = es.SpriteRenderer;

    export class SampleScene extends es.Scene {
        public static readonly screenSpaceRenderLayer = 999;

        public static _needsFullRender: boolean;
        public _screenSpaceRenderer: ScreenSpaceRenderer;

        constructor(addExcludeRenderer: boolean = true, needsFullRender: boolean = false){
            super();
            SampleScene._needsFullRender = needsFullRender;

            if (needsFullRender){
                this._screenSpaceRenderer = this.addRenderer(new ScreenSpaceRenderer(100, SampleScene.screenSpaceRenderLayer));
                this._screenSpaceRenderer.shouldDebugRender = false;
            }else{
                this.addRenderer(new ScreenSpaceRenderer(100, SampleScene.screenSpaceRenderLayer));
            }

            if (addExcludeRenderer)
                this.addRenderer(new RenderLayerExcludeRenderer(0, SampleScene.screenSpaceRenderLayer));
        }
    }
}