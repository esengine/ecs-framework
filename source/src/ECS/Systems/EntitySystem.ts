class EntitySystem {
    private _scene: Scene;
    private _entities: Entity[] = [];
    private _matcher: Matcher;

    public get matcher(){
        return this._matcher;
    }

    public get scene(){
        return this._scene;
    }

    public set scene(value: Scene){
        this._scene = value;
        this._entities = [];
    }

    constructor(matcher?: Matcher){
        this._matcher = matcher ? matcher : Matcher.empty();
    }

    public initialize(){
        
    }

    public update(){
        this.begin();
        this.process(this._entities);
    }

    public lateUpdate(){
        this.lateProcess(this._entities);
        this.end();
    }

    protected begin(){

    }

    protected process(entities: Entity[]){

    }

    protected lateProcess(entities: Entity[]){

    }

    protected end(){

    }
}