module sc {
    export class ScView extends BaseView {
        private _ui: FUI.sc.UI_View_sc;
        private _sceneList: SceneData[] = [
            new SceneData("空白场景", samples.BasicScene),
            new SceneData("Tiled Tiles", samples.AnimatedTilesScene),
            new SceneData("Linecasting", samples.LineCastingScene),
        ];

        constructor() {
            super("sc");
        }

        public init() {
            this._ui = this._fuiView = FUI.sc.UI_View_sc.createInstance();
            this.addChild(this._ui.displayObject);
            super.init();
        }

        public show() {
            this._ui.m_list_sc.callbackThisObj = this;
            this._ui.m_list_sc.itemRenderer = this.scItemRender;
            this._ui.m_list_sc.numItems = this._sceneList.length;
        }

        public scItemRender(index: number, item: FUI.sc.UI_btn_sc){
            let sceneData = this._sceneList[index];
            item.m_name.text = sceneData.name;
            item.data = sceneData.type;
            item.addClickListener(this.scItemOnClick, this);
        }

        private scItemOnClick(evt: egret.Event){
            let data = evt.currentTarget.data;
            es.Core.scene = new data();
            es.Core.scene.camera.position = es.Vector2.zero;
        }

        public destroy() {
            if (this._ui) {
                this._ui.dispose();
                this._ui = null;
            }
            super.destroy();
        }
    }

    export class SceneData {
        public name: string;
        public type: any;

        constructor(name: string, type: any){
            this.name = name;
            this.type = type;
        }
    }
}