/** 窗口控制器 */
class ViewManager {
    private static _single: ViewManager;
    /** 已打开的列表 存储视图实例 */
    private _openDic: BaseView[] = [];
    /** 跳过关闭的列表 用于主视图 存储视图类型 */
    private _skipCloseDic = [];
    /** 层级管理器 */
    private _layerManager: LayerManager;

    public static getInstance(): ViewManager{
        if (!this._single) this._single = new ViewManager();

        return this._single;
    }

    constructor(){
        this._layerManager = LayerManager.getInstance();
    }

    /**
     * 打开界面
     * @param viewCls 视图类型
     * @param viewData 视图数据
     */
    public openView(viewCls, viewData?: any): Promise<any>{
        return new Promise((resolve, reject)=>{
            let newView: BaseView = this.getView<BaseView>(viewCls);
            if (!newView) newView = new viewCls();

            if (this.isOpenView(viewCls)){
                newView.refresh(viewData);
                return;
            }

            this._openDic.push(newView);
            FguiUtils.load(newView.name).then(()=>{
                newView.init();
                newView.baseShow(viewData);
                newView.show();

                this._layerManager.addLayerToView(newView);
                resolve();
            }).catch(()=>{
                this._openDic.remove(newView);
                newView.destroy();
                newView = null;
                reject();
            });
        });
    }

    /**
     * 根据视图关闭
     * @param view 视图实例
     */
    public closeView(view: BaseView){
        let wantToCloseView = this._openDic.firstOrDefault(a => {
            return a == view;
        })
        if (wantToCloseView) {
            this._openDic.remove(wantToCloseView);

            wantToCloseView.destroy();
            wantToCloseView = null;
        }
    }

    /**
     * 关闭所有视图
     */
    public closeAll(){
        for (let z = 0; z < this._openDic.length; z++) {
            let element = this._openDic[z];
            let canClose = true;
            for (let i = 0; i < this._skipCloseDic.length; i ++){
                if (element == this.getView(this._skipCloseDic[i])){
                    canClose = false;
                }
            }
            if (canClose) {
                this.closeView(element);
                z--;
            }
        }
    }

    /**
     * 根据视图类型关闭窗口
     * @param viewCls 视图类型
     */
    public closeViewByCls(viewCls){
        let wantToCloseView = this._openDic.firstOrDefault(a => {
            return a instanceof viewCls;
        })
        if (wantToCloseView) {
            this._openDic.remove(wantToCloseView);
            wantToCloseView.destroy();
            wantToCloseView = null;
        }
    }

    /**
     * 根据视图类型获得窗口
     * 如果窗口未打开则返回null
     * @param viewCls 视图类型
     */
    public getView<T>(viewCls: new () => T): T{
        let result: any = this._openDic.firstOrDefault(a => {
            return a instanceof viewCls;
        });

        return result as T;
    }

    /**
     * 根据视图类型获得窗口是否打开
     * @param viewCls 
     */
    public isOpenView(viewCls: any): boolean {
        return this._openDic.findIndex(a => {
            return a instanceof viewCls;
        }) != -1;
    }
}