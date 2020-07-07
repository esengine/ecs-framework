///<reference path="./Collider.ts" />
class BoxCollider extends Collider {
    public get width(){
        return (this.shape as Box).width;
    }

    public set width(value: number){
        this.setWidth(value);
    }

    public setWidth(width: number): BoxCollider{
        this._colliderRequiresAutoSizing = false;
        let box = this.shape as Box;
        if (width != box.width){
            box.updateBox(width, box.height);
            this._isPositionDirty = true;
            if (this.entity && this._isParentEntityAddedToScene)
                Physics.updateCollider(this);
        }

        return this;
    }

    public get height(){
        return (this.shape as Box).height;
    }

    public set height(value: number){
        this.setHeight(value);
    }

    public setHeight(height: number){
        this._colliderRequiresAutoSizing = false;
        let box = this.shape as Box;
        if (height != box.height){
            box.updateBox(box.width, height);
            this._isPositionDirty = true;
            if (this.entity && this._isParentEntityAddedToScene)
                Physics.updateCollider(this);
        }
    }

    constructor(){
        super();

        // 我们在这里插入一个1x1框作为占位符，直到碰撞器在下一阵被添加到实体并可以获得更精确的自动调整大小数据
        this.shape = new Box(1, 1);
        this._colliderRequiresAutoSizing = true;
    }

    public setSize(width: number, height: number){
        this._colliderRequiresAutoSizing = false;
        let box = this.shape as Box;
        if (width != box.width || height != box.height){
            box.updateBox(width, height);
            this._isPositionDirty = true;
            if (this.entity && this._isParentEntityAddedToScene)
                Physics.updateCollider(this);
        }

        return this;
    }
}