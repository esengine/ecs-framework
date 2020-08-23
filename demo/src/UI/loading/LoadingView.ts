module loading {
    import commonBinder = FUI.common.commonBinder;
    import ResourceInfo = RES.ResourceInfo;

    export class LoadingView extends BaseView implements RES.PromiseTaskReporter {
        private _ui: FUI.loading.UI_View_loading;
        private _loadGroup = ["preload", "common", "characters"];
        private _maxProgress = 0;
        private _currentProgress = 0;

        constructor() {
            super("loading");
        }

        public init() {
            this._ui = this._fuiView = FUI.loading.UI_View_loading.createInstance();
            this.addChild(this._ui.displayObject);
            super.init();
        }

        public async show() {
            this._ui.m_pg_loading.value = 0;
            for (let i = 0; i < this._loadGroup.length; i ++){
                this._maxProgress += RES.getGroupByName(this._loadGroup[i]).length;
            }
            this._ui.m_pg_loading.max = this._maxProgress;
            for (let i = 0; i < this._loadGroup.length; i ++){
                await RES.loadGroup(this._loadGroup[i], 0, this);
            }
        }

        public onProgress(current: number, total: number, resItem: ResourceInfo): void {
            this._ui.m_pg_loading.tweenValue(this._currentProgress++, 1);
            if (this._currentProgress == this._maxProgress) {
                if (resItem.name == "common"){
                    fairygui.UIPackage.addPackage(resItem.name);
                    commonBinder.bindAll();
                }
                egret.setTimeout(() => {
                    this.openMainScene();
                }, this, 1000)
            }
        }

        public openMainScene() {
            es.Core.scene = new samples.BasicScene();
            EventManager.getInstance().dispatch(sc.ScEvents.OPENVIEW);
            this.close();
        }

        public destroy() {
            if (this._ui) {
                this._ui.dispose();
                this._ui = null;
            }
            super.destroy();
        }
    }
}