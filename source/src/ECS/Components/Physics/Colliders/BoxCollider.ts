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

        this.shape = new Box(1, 1);
        this._colliderRequiresAutoSizing = true;
    }
}