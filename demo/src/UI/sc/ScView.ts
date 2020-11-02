module sc {
    export class ScView extends BaseView {
        private _ui: FUI.sc.UI_View_sc;
        private _sceneList: SceneData[] = [
            new SceneData("空白场景", samples.BasicScene),
            new SceneData("Tiled Tiles", samples.AnimatedTilesScene),
            new SceneData("Linecasting", samples.LineCastingScene),
            new SceneData("Ninja Adventure", samples.NinjaAdventureScene),
            new SceneData("GOAP", samples.GoapScene),
        ];

        private _transitionList: TransitionData[] = [
            new TransitionData("渐变", es.FadeTransition),
            new TransitionData("wind", es.WindTransition),
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

            for (let i = 0; i < this._transitionList.length; i ++){
                this._ui.m_combo_transition.items.push(this._transitionList[i].name);
            }
            this._ui.m_combo_transition.selectedIndex = 0;
        }

        public scItemRender(index: number, item: FUI.sc.UI_btn_sc){
            let sceneData = this._sceneList[index];
            item.m_name.text = sceneData.name;
            item.data = sceneData.type;
            item.addClickListener(this.scItemOnClick, this);
        }

        private scItemOnClick(evt: egret.Event){
            let data = evt.currentTarget.data;
            let currentTransition = this._transitionList[this._ui.m_combo_transition.selectedIndex].type;
            es.Core.startSceneTransition(new currentTransition(()=>{
                es.Core.scene.camera.position = es.Vector2.zero;
                return new data();
            }));
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

    export class TransitionData {
        public name: string;
        public type: any;

        constructor(name: string, type: any){
            this.name = name;
            this.type = type;
        }
    }
}