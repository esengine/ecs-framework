class GaussianBlurPostProcessor extends PostProcessor {
    private _renderTargetScale = 1;
    public get renderTargetScale(){
        return this._renderTargetScale;
    }
    public set renderTargetScale(value: number){
        if (this._renderTargetScale != value){
            this._renderTargetScale = value;
            this.updateEffectDeltas();
        }
    }

    public onAddedToScene(scene: Scene){
        super.onAddedToScene(scene);
        this.effect = new GaussianBlurEffect();
    }

    public onSceneBackBufferSizeChanged(newWidth: number, newHeight: number){
        this.updateEffectDeltas();
    }

    private updateEffectDeltas(){
        let effect = this.effect as GaussianBlurEffect;
        effect.horizontalBlurDelta = 1 / (this.scene.stage.stageWidth * this._renderTargetScale);
        effect.verticalBlurDelta = 1 / (this.scene.stage.stageHeight * this._renderTargetScale);
    }

    public process(){
        let effect = this.effect as GaussianBlurEffect;
        effect.prepareForHorizontalBlur();
        this.drawFullscreenQuad();
        
        effect.prepareForVerticalBlur();
        this.drawFullscreenQuad();
    }
}