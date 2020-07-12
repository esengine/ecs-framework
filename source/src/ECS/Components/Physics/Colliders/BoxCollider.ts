///<reference path="./Collider.ts" />
class BoxCollider extends Collider {
    public get width(){
        return (this.shape as Box).width;
    }

    public set width(value: number){
        this.setWidth(value);
    }

    /**
     * 设置BoxCollider的宽度
     * @param width 
     */
    public setWidth(width: number): BoxCollider{
        this._colliderRequiresAutoSizing = false;
        let box = this.shape as Box;
        if (width != box.width){
            // 更新框，改变边界，如果我们需要更新物理系统中的边界
            box.updateBox(width, box.height);
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

    /**
     * 设置BoxCollider的高度
     * @param height 
     */
    public setHeight(height: number){
        this._colliderRequiresAutoSizing = false;
        let box = this.shape as Box;
        if (height != box.height){
            // 更新框，改变边界，如果我们需要更新物理系统中的边界
            box.updateBox(box.width, height);
            if (this.entity && this._isParentEntityAddedToScene)
                Physics.updateCollider(this);
        }
    }

    /**
     * 零参数构造函数要求RenderableComponent在实体上，这样碰撞器可以在实体被添加到场景时调整自身的大小。
     */
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
            // 更新框，改变边界，如果我们需要更新物理系统中的边界
            box.updateBox(width, height);
            if (this.entity && this._isParentEntityAddedToScene)
                Physics.updateCollider(this);
        }

        return this;
    }
}