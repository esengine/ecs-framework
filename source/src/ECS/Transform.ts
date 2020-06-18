enum DirtyType{
    clean,
    positionDirty,
    scaleDirty,
    rotationDirty,
}

enum ComponentTransform{
    position,
    scale,
    rotation
}

class Transform {
    /** 相关联的实体 */
    public readonly entity: Entity;
    private _children: Transform[];
    private _parent: Transform;

    private _localPosition: Vector2;
    private _localRotation: number = 0;
    private _localScale: Vector2;

    private _translationMatrix: Matrix2D;
    private _rotationMatrix: Matrix2D;
    private _scaleMatrix: Matrix2D;

    private _worldTransform = new Matrix2D();
    private _worldToLocalTransform = new Matrix2D();
    private _worldInverseTransform = new Matrix2D();

    private _rotation: number = 0;
    private _position: Vector2;
    private _scale: Vector2;

    private _localTransform;
    private _hierachyDirty: DirtyType;
    private _localDirty: boolean;
    private _localPositionDirty: boolean;
    private _localScaleDirty: boolean;
    private _localRotationDirty: boolean;
    private _positionDirty: boolean;
    private _worldToLocalDirty: boolean;
    private _worldInverseDirty: boolean;

    public get childCount(){
        return this._children.length;
    }

    constructor(entity: Entity){
        this.entity = entity;
        this._scale = this._localScale = Vector2.one;
        this._children = [];
    }

    public getChild(index: number){
        return this._children[index];
    }

    public get worldInverseTransform(){
        this.updateTransform();
        if (this._worldInverseDirty){
            this._worldInverseTransform = Matrix2D.invert(this._worldTransform, this._worldInverseTransform);
            this._worldInverseDirty = false;
        }

        return this._worldInverseTransform;
    }

    public get localToWorldTransform(){
        this.updateTransform();
        return this._worldTransform;
    }

    public get worldToLocalTransform(){
        if (this._worldToLocalDirty){
            if (!this.parent){
                this._worldInverseTransform = new Matrix2D();
            } else{
                this.parent.updateTransform();
                this._worldToLocalTransform = Matrix2D.invert(this.parent._worldTransform, this._worldToLocalTransform);
            }

            this._worldToLocalDirty = false;
        }

        return this._worldToLocalTransform;
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

    public get rotation() {
        this.updateTransform();
        return this._rotation;
    }

    public set rotation(value: number){
        this.setRotation(value);
    }

    public get localRotation(){
        this.updateTransform();
        return this._localRotation;
    }

    public set localRotation(value: number){
        this.setLocalRotation(value);
    }

    public get position(){
        this.updateTransform();
        if (!this.parent){
            this._position = this._localPosition;
        }else{
            this.parent.updateTransform();
            this._position = Vector2Ext.transformR(this._localPosition, this.parent._worldTransform);
        }
        
        return this._position;
    }

    public set position(value: Vector2){
        this.setPosition(value);
    }

    public get localPosition(){
        this.updateTransform();
        return this._localPosition;
    }

    public set localPosition(value: Vector2){
        this.setLocalPosition(value);
    }

    public get scale(){
        this.updateTransform();
        return this._scale;
    }

    public set scale(value: Vector2){
        this.setScale(value);
    }

    public get localScale(){
        this.updateTransform();
        return this._localScale;
    }

    public set localScale(value: Vector2){
        this.setLocalScale(value);
    }

    public get rotationDegrees(){
        return MathHelper.toDegrees(this._rotation);
    }

    public set rotationDegrees(value: number){
        this.setRotation(MathHelper.toRadians(value));
    }

    public get localRotationDegrees(){
        return MathHelper.toDegrees(this._localRotation);
    }

    public set localRotationDegrees(value: number){
        this.localRotation = MathHelper.toRadians(value);
    }

    public setLocalScale(scale: Vector2){
        this._localScale = scale;
        this._localDirty = this._positionDirty = this._localScaleDirty = true;
        this.setDirty(DirtyType.scaleDirty);

        return this;
    }

    public setScale(scale: Vector2){
        this._scale = scale;
        if (this.parent){
            this.localScale = Vector2.divide(scale, this.parent._scale);
        }else{
            this.localScale = scale;
        }

        return this;
    }

    public setLocalRotationDegrees(degrees: number){
        return this.setLocalRotation(MathHelper.toRadians(degrees));
    }

    public setLocalRotation(radians: number){
        this._localRotation = radians;
        this._localDirty = this._positionDirty = this._localPositionDirty = this._localRotationDirty = this._localScaleDirty = true;
        this.setDirty(DirtyType.rotationDirty);

        return this;
    }

    public setRotation(radians: number){
        this._rotation = radians;
        if (this.parent){
            this.localRotation = this.parent.rotation + radians;
        } else {
            this.localRotation = radians;
        }

        return this;
    }

    public setRotationDegrees(degrees: number){
        return this.setRotation(MathHelper.toRadians(degrees));
    }

    public setLocalPosition(localPosition: Vector2){
        if (localPosition == this._localPosition)
            return this;

        this._localPosition = localPosition;
        this._localDirty = this._positionDirty = this._localPositionDirty = this._localRotationDirty = this._localScaleDirty = true;
        this.setDirty(DirtyType.positionDirty);

        return this;
    }

    public setPosition(position: Vector2){
        if (position == this._position)
            return this;

        this._position = position;
        if (this.parent){
            this.localPosition = Vector2.transform(this._position, this._worldToLocalTransform);
        }else{
            this.localPosition = position;
        }

        return this;
    }

    public setDirty(dirtyFlagType: DirtyType){
        if ((this._hierachyDirty & dirtyFlagType) == 0){
            this._hierachyDirty |= dirtyFlagType;

            switch (dirtyFlagType){
                case DirtyType.positionDirty:
                    this.entity.onTransformChanged(ComponentTransform.position);
                    break;
                case DirtyType.rotationDirty:
                    this.entity.onTransformChanged(ComponentTransform.rotation);
                    break;
                case DirtyType.scaleDirty:
                    this.entity.onTransformChanged(ComponentTransform.scale);
                    break;
            }

            if (this._children == null)
                this._children = [];

            for (let i = 0; i < this._children.length; i ++){
                this._children[i].setDirty(dirtyFlagType);
            }
        }
    }

    public updateTransform(){
        if (this._hierachyDirty != DirtyType.clean){
            if (this.parent)
                this.parent.updateTransform();

            if (this._localDirty){
                if (this._localPositionDirty){
                    this._translationMatrix = Matrix2D.createTranslation(this._localPosition.x, this._localPosition.y);
                    this._localPositionDirty = false;
                }

                if (this._localRotationDirty){
                    this._rotationMatrix = Matrix2D.createRotation(this._localRotation);
                    this._localRotationDirty = false;
                }
                

                if (this._localScaleDirty){
                    this._scaleMatrix = Matrix2D.createScale(this._localScale.x, this._localScale.y);
                    this._localScaleDirty = false;
                }
                

                this._localTransform = Matrix2D.multiply(this._scaleMatrix, this._rotationMatrix);
                this._localTransform = Matrix2D.multiply(this._localTransform, this._translationMatrix);
    
                if (!this.parent){
                    this._worldTransform = this._localTransform;
                    this._rotation = this._localRotation;
                    this._scale = this._localScale;
                    this._worldInverseDirty = true;
                }

                this._localDirty = false;
            }
           
            if (this.parent){
                this._worldTransform = Matrix2D.multiply(this._localTransform, this.parent._worldTransform);
    
                this._rotation = this._localRotation + this.parent._rotation;
                this._scale = Vector2.multiply( this.parent._scale, this._localScale);
                this._worldInverseDirty = true;
            }
            
            this._worldToLocalDirty = true;
            this._positionDirty = true;
            this._hierachyDirty = DirtyType.clean;
        }
        
    }
}