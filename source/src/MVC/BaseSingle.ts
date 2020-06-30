/** 用于表示单例类 */
class BaseSingle {
    private static _instance: any;

    public static getInstance<T>(): T {
        if (this._instance == null) {
            this._instance = new this();
        }
        return this._instance;
    }

    /**清除fgui元素 */
    protected clearFuiObj(obj: fairygui.GObject): boolean {
        if (obj) {
            egret.Tween.removeTweens(obj.displayObject);
            if (obj.displayObject && obj.displayObject.parent) {
                obj.displayObject.parent.removeChild(obj.displayObject);
            }
            obj.dispose();
            obj = null;
            return true;
        }
        return false;
    }
}