class BaseView extends egret.DisplayObjectContainer {
    private _name: string;
    public get name(){
        return this._name;
    }
    public set name(value: string){
        this._name = value;
    }
    public viewLayer: viewLayer = viewLayer.pop;
    /** 是否可以被销毁 */
    protected _destoryChildren: boolean;
    protected _isDispose: boolean;
    /** fui界面 */
    protected _fuiView: fairygui.GComponent;
    /** 是否已经显示 */
    protected _isShow: boolean;
    /** 视图数据 */
    protected _showData: any;

    constructor(name?: string){
        super();
        this._isDispose = false;
        if (name){
            this.name = name;
        }
    }

    /**
     * 当界面被初始化时调用
     */
    public init(){
        this._destoryChildren = true;
    }

    /**
     * 当界面大小被改变时
     */
    public resize(){
        if (this._fuiView && this._isShow){
            this._fuiView.width = LayerManager.getInstance().stage.stageWidth;
            this._fuiView.height = LayerManager.getInstance().stage.stageHeight;
        }
    }

    /**
     * 
     * @param showData 
     */
    public baseShow(showData?: any){
        this._isShow = true;
        this._showData = showData;
        egret.callLater(this.resize, this);
    }

    /**
     * 打开界面时调用
     */
    public show() {

    }

    /**
     * 当界面关闭时调用
     */
    public close() {
        this._isShow = false;
        ViewManager.getInstance().closeView(this);
    }

    /**
     * 
     * @param showData 
     */
    public baseRefresh(showData?: any){
        this._showData = showData;
    }

    /**
     * 当界面刷新时调用
     */
    public refresh(showData?: any){
        this._showData = showData;
    }    

    /**
     * 当界面销毁时调用
     */
    public destroy(){
        this._isDispose = true;
        if (this.parent)
            this.parent.removeChild(this);

        if (this._destoryChildren){
            this._fuiView = null;
            while (this.numChildren > 0){
                this.removeChildAt(0);
            }
            this._destoryChildren = false;
        }
    }
}