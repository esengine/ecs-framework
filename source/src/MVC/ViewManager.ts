class ViewManager extends BaseSingle {
    private _openDic: BaseFuiView[] = [];

    /**
     * 刷新界面
     * @param viewClass 界面类型 
     * @param data 界面数据
     */
    public refreshView(viewClass: any, data?: any){
        let view = this.getView<BaseFuiView>(viewClass);

        if (view){
            /** 压入数据 */
            view.refreshData(data);
            /** 执行刷新逻辑 */
            view.refreshView();
        }
    }

    /**
     * 打开界面
     * @param viewClass 界面类型
     * @param data 界面数据
     * @param complete 界面加载完成回调
     */
    public openView(viewClass: any, data?: any, complete?: Function){
        let newView = this.getView<BaseFuiView>(viewClass);
        if (!newView){
            newView = new viewClass();
        }

        /** 如果界面已打开 则执行刷新界面 */
        if (this.existView(viewClass)){
            newView.refreshData(data);
            newView.refreshView();
            return;
        }

        this._openDic.push(newView);
        // TODO: 加载资源
    }

    /**
     * 获取界面 可能为null
     * @param viewClass 界面类型
     */
    public getView<T>(viewClass: any): T {
        let result: any = this._openDic.firstOrDefault(a => {
            return a instanceof viewClass;
        });

        return result as T;
    }

    /**
     * 界面是否存在
     * @param viewClass 界面类型
     */
    public existView(viewClass: any): boolean {
        return this._openDic.findIndex(a => {
            return a instanceof viewClass;
        }) != -1;
    }
}