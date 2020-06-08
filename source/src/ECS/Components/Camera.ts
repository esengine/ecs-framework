class Camera {
    private _displayContent: egret.DisplayObject;

    constructor(displayObject: egret.DisplayObject){
        this._displayContent = displayObject;
    }

    public destory(){
        this._displayContent = null;
    }
}