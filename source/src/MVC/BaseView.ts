/** 所有视图的基类 */
class BaseView extends egret.DisplayObjectContainer {
    /** 界面数据 */
    protected _data: any;
    /** 在打开界面前触发 */
    protected init(){

    }

    /** 窗口打开时触发 */
    public show(data?: any) {

    }

    /** 刷新界面数据 由mvc控制 */
    public refreshData(data?: any){
        this._data = data;
    }

    /** 刷新界面逻辑 */
    public refreshView(){

    }

    /** 关闭窗口 */
    public close() {

    }

    /** 销毁窗口 */
    public destroy(){
        if (this.parent){
            this.parent.removeChild(this);
        }

        /** 循环删除此界面下所有节点 */
        while (this.numChildren > 0) {
            this.removeChildAt(0);
        }
    }
}