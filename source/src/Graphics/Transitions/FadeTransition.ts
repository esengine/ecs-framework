///<reference path="./SceneTransition.ts"/>
module es {
    export class FadeTransition extends SceneTransition {
        public fadeToColor: number = 0x000000;
        public fadeOutDuration = 0.4;
        public fadeEaseType: Function = egret.Ease.quadInOut;
        public delayBeforeFadeInDuration = 0.1;
        private _mask: egret.Shape;
        private _alpha: number = 0;

        constructor(sceneLoadAction: Function) {
            super(sceneLoadAction);
            this._mask = new egret.Shape();
        }

        public async onBeginTransition() {
            this._mask.graphics.beginFill(this.fadeToColor, 1);
            this._mask.graphics.drawRect(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);
            this._mask.graphics.endFill();
            SceneManager.stage.addChild(this._mask);

            egret.Tween.get(this).to({ _alpha: 1}, this.fadeOutDuration * 1000, this.fadeEaseType)
                .call(async () => {
                    await this.loadNextScene();
                }).wait(this.delayBeforeFadeInDuration).call(() => {
                egret.Tween.get(this).to({ _alpha: 0 }, this.fadeOutDuration * 1000, this.fadeEaseType).call(() => {
                    this.transitionComplete();
                    SceneManager.stage.removeChild(this._mask);
                });
            });
        }

        public render(){
            this._mask.graphics.clear();
            this._mask.graphics.beginFill(this.fadeToColor, this._alpha);
            this._mask.graphics.drawRect(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);
            this._mask.graphics.endFill();
        }
    }
}
