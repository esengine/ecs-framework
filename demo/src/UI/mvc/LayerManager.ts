/**
 * 视图类型
 */
enum viewLayer {
    pop,
}

/**
 * 视图管理器
 */
class LayerManager {
    private static _single: LayerManager;
    public static getInstance(): LayerManager{
        if (!this._single) this._single = new LayerManager();

        return this._single;
    }

    private _stage: egret.Stage;
    /** 弹窗层 */
    public popLayer: egret.DisplayObjectContainer;
    public tipsLayer: egret.DisplayObjectContainer;
    /** 获取舞台 */
    public get stage(){
        return this._stage;
    }

    public init(stage: egret.Stage){
        this._stage = stage;

        this.popLayer = new egret.DisplayObjectContainer();
        this.tipsLayer = new egret.DisplayObjectContainer();

        this._stage.addChild(this.popLayer);
        this._stage.addChild(this.tipsLayer);
    }

    /**
     * 添加到layer上
     * @param view 
     */
    public addLayerToView(view: BaseView){
        let layerName = viewLayer[view.viewLayer] + "Layer";
        this[layerName].addChild(view);
    }
}