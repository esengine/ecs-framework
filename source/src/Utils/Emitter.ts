class Emitter<T> {
    private _messageTable: Map<T, FuncPack[]>;

    constructor(){
        this._messageTable = new Map<T, FuncPack[]>();
    }

    public addObserver(eventType: T, handler: Function, context: any){
        let list: FuncPack[] = this._messageTable.get(eventType);
        if (!list){
            list = [];
            this._messageTable.set(eventType, list);
        }

        if (list.contains(handler))
            console.warn("您试图添加相同的观察者两次");
        list.push(new FuncPack(handler, context));
    }

    public removeObserver(eventType: T, handler: Function){
        this._messageTable.get(eventType).remove(handler);
    }

    public emit(eventType: T, data?: any){
        let list: FuncPack[] = this._messageTable.get(eventType);
        if (list){
            for (let i = list.length - 1; i >= 0; i --)
                list[i].func.call(list[i].context, data);
        }
    }
}

class FuncPack {
    public func: Function;
    public context: any;

    constructor(func: Function, context: any){
        this.func = func;
        this.context = context;
    }
}