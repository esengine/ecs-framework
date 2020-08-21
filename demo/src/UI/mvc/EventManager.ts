class EventManager {
    private static _single: EventManager;
    private _dict: any;
    private _eventList: EventVo[];

    public static getInstance() {
        if (!this._single) this._single = new EventManager();
        return this._single;
    }

    constructor() {
        this._dict = {};
        this._eventList = [];
    }

    /**
     * 添加消息监听
     * @param type 
     * @param listener 
     * @param thisObj 
     */
    public addListener(type: string | symbol, listener: Function, thisObj: any): void {
        var arr: any[] = this._dict[type];
        if (arr == null) {
            arr = [];
            this._dict[type] = arr;
        }
        var i: number, len: number = arr.length;
        for (i = 0; i < len; i++) {
            if (arr[i][0] == listener && arr[i][1] == thisObj) return;
        }
        arr.push([listener, thisObj]);
    }

    /**
     * 移除监听
     * @param type 
     * @param listener 
     * @param thisObj 
     */
    public removeListener(type: string | symbol, listener: Function, thisObj: any): void {
        var arr: any[] = this._dict[type];
        if (arr == null) return;

        var i: number, len: number = Array.length;
        for (i = 0; i < len; i++) {
            if (arr[i][0] == listener && arr[i][1] == thisObj) {
                arr.splice(i, 1);
                i--;
                break;
            }
        }

        if (arr.length == 0) {
            delete this._dict[type];
            this._dict[type] = null;
        }
    }

    /**
     * 事件派发
     * @param type 
     * @param param 
     */
    public dispatch(type: string | symbol, ...param: any[]): void {
        if (this._dict[type] == null) return;

        var vo: EventVo = new EventVo();
        vo.type = type;
        vo.param = param;

        this.dealMsg(vo);
    }

    /**
     * 事件处理
     * @param vo 
     */
    private dealMsg(vo: EventVo): void {
        var listeners: Array<any> = this._dict[vo.type];
        if (listeners && listeners.length > 0) {
            var i: number = 0, len: number = listeners.length, listener: Array<any> = null;
            while (i < len) {
                listener = listeners[i];
                listener[0].apply(listener[1], vo.param);
                if (listeners.length != len) {
                    len = listeners.length;
                    i--;
                }
                i++;
            }
        }
        vo.dispose();
    }
}

class EventVo {
    public type: string | symbol;
    public param: any[];
    public dispose() {
        this.type = null;
        this.param = null;
    }
}