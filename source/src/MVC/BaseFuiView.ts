///<reference path="./BaseView.ts" />
/** 用于承载fui界面 */
class BaseFuiView extends BaseView {
    /** 界面名称 */
    protected _name: string;

    constructor(name: string){
        super();
        this.name = name;
    }
}