module es {
    /**
     * SceneTransition用于从一个场景过渡到另一个场景，或在一个场景内进行效果转换。
     * 如果sceneLoadAction为null，框架将执行场景内过渡，而不是加载新的场景中间过渡。
     */
    export abstract class SceneTransition {
        /** 该函数应返回新加载的场景 */
        protected sceneLoadAction: () => Scene;

        /**
         * 在loadNextScene执行时调用
         * 这在进行场景间转换时非常有用，这样您就可以知道何时可以重新设置相机或重置任何实体
         */
        public onScreenObscured: Function;

        /**
         * 转换完成后调用，以便调用其他工作，例如启动另一个场景转换
         */
        public onTransitionCompleted: Function;

        /** 
         * 指示此转换是否将加载新场景的标志
         */
        public _loadsNewScene: boolean = false;

        private _hasPreviousSceneRender: boolean = false;

        public get hasPreviousSceneRender() {
            if (!this._hasPreviousSceneRender) {
                this._hasPreviousSceneRender = true;
                return false;
            }

            return true;
        }

        /**
         * 将此用于两部分过渡。例如，褪色会先褪色为黑色，然后当_isNewSceneLoaded变为true时会褪色。
         * 对于场景内转换，应在中点将isNewSceneLoaded设置为true，就像加载了新场景一样
         */
        public _isNewSceneLoaded: boolean = false;

        protected constructor(sceneLoadAction: () => Scene) {
            this.sceneLoadAction = sceneLoadAction;
            this._loadsNewScene = sceneLoadAction != null;
        }

        protected * LoadNextScene() {
            // 如果我们有渲染界面，可以在这让玩家知道屏幕是模糊的（正在加载）
            if (this.onScreenObscured != null)
                this.onScreenObscured();

            // 如果我们不加载一个新场景，我们只需设置标志
            if (!this._loadsNewScene) {
                this._isNewSceneLoaded = true;
                yield "break";
            }

            Core.scene = this.sceneLoadAction();
            this._isNewSceneLoaded = true;

            while (!this._isNewSceneLoaded)
                yield null;
        }

        /**
         * 在前一个场景出现第一次（也是唯一一次）后调用。
         * 此时，可以在生成一帧后加载新场景（因此第一次渲染调用发生在场景加载之前）
         */
        public * onBeginTransition(): any {
            yield null;
            yield Core.startCoroutine(this.LoadNextScene());

            this.transitionComplete();
        }

        /**
         * 在渲染场景之前调用
         */
        public preRender() { }

        /**
         * 在这里进行所有渲染
         */
        public render() { }

        /**
         * 当过渡完成且新场景已设置时，将调用此函数
         */
        protected transitionComplete() {
            Core.Instance._sceneTransition = null;

            if (this.onTransitionCompleted != null)
                this.onTransitionCompleted();
        }
    }
}