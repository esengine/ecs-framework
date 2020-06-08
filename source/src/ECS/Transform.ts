class Transform {
    /** 相关联的实体 */
    public readonly entity: Entity;
    private _children: Transform[];
    private _parent: Transform;

    public get childCount(){
        return this._children.length;
    }

    constructor(entity: Entity){
        this.entity = entity;
        this._children = [];
    }

    public getChild(index: number){
        return this._children[index];
    }

    public get parent(){
        return this._parent;
    }

    public set parent(value: Transform){
        this.setParent(value);
    }

    public setParent(parent: Transform){
        if (this._parent == parent)
            return this;

        if (this._parent)
            this._parent._children.remove(this);

        if (parent)
            parent._children.push(this);

        this._parent = parent;

        return this;
    }
}