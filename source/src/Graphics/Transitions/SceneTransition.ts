module es {
    /**
     * SceneTransition用于从一个场景过渡到另一个场景或在一个有效果的场景中过渡
     */
    export abstract class SceneTransition {
        /** 是否加载新场景的标志 */
        public loadsNewScene: boolean;
        /**
         * 将此用于两个部分的转换。例如，淡出会先淡出到黑色，然后当isNewSceneLoaded为true，它会淡出。
         * 对于场景过渡，isNewSceneLoaded应该在中点设置为true，这就标识一个新的场景被加载了。
         */
        public isNewSceneLoaded: boolean;
        /** 在loadNextScene执行时调用。这在进行场景间过渡时很有用，这样你就知道什么时候可以更多地使用相机或者重置任何实体 */
        public onScreenObscured: Function;
        /** 当转换完成执行时调用，以便可以调用其他工作，比如启动另一个转换。 */
        public onTransitionCompleted: Function;
        /** 返回新加载场景的函数 */
        protected sceneLoadAction: Function;

        constructor(sceneLoadAction: Function) {
            this.sceneLoadAction = sceneLoadAction;
            this.loadsNewScene = sceneLoadAction != null;
        }

        private _hasPreviousSceneRender: boolean;

        public get hasPreviousSceneRender() {
            if (!this._hasPreviousSceneRender) {
                this._hasPreviousSceneRender = true;
                return false;
            }

            return true;
        }

        public preRender() {
        }

        public render() {

        }

        public async onBeginTransition() {
            await this.loadNextScene();
            this.transitionComplete();
        }

        public tickEffectProgressProperty(filter: egret.CustomFilter, duration: number, easeType: Function, reverseDirection = false): Promise<boolean> {
            return new Promise((resolve) => {
                let start = reverseDirection ? 1 : 0;
                let end = reverseDirection ? 0 : 1;

                egret.Tween.get(filter.uniforms).set({_progress: start}).to({_progress: end}, duration * 1000, easeType).call(() => {
                    resolve();
                });
            });
        }

        protected transitionComplete() {
            Core._instance._sceneTransition = null;

            if (this.onTransitionCompleted) {
                this.onTransitionCompleted();
            }
        }

        protected async loadNextScene() {
            if (this.onScreenObscured)
                this.onScreenObscured();

            if (!this.loadsNewScene) {
                this.isNewSceneLoaded = true;
            }

            Core.scene = await this.sceneLoadAction();
            this.isNewSceneLoaded = true;
        }
    }
}
