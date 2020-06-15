class Emitter<T> {
    private _messageTable: Map<T, Function[]>;

    constructor(){
        this._messageTable = new Map<T, Function[]>();
    }

    public addObserver(eventType: T, handler: Function){
        let list: Function[] = this._messageTable.get(eventType);
        if (!list){
            list = [];
            this._messageTable.set(eventType, list);
        }

        if (list.contains(handler))
            console.warn("您试图添加相同的观察者两次");
        list.push(handler);
    }

    public removeObserver(eventType: T, handler: Function){
        this._messageTable.get(eventType).remove(handler);
    }

    public emit(eventType: T, data: any){
        let list: Function[] = this._messageTable.get(eventType);
        for (let i = list.length - 1; i >= 0; i --)
            list[i](data);
    }
}