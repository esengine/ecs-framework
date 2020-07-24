module transform {
    export enum Component {
        position,
        scale,
        rotation,
    }
}

module es {
    export enum DirtyType {
        clean,
        positionDirty,
        scaleDirty,
        rotationDirty,
    }

    export class Transform {
        /** 与此转换关联的实体 */
        public readonly entity: Entity;
        /**
         * 获取此转换的父转换
         */
        public get parent() {
            return this._parent;
        }

        /**
         * 设置此转换的父转换
         * @param value
         */
        public set parent(value: Transform) {
            this.setParent(value);
        }

        /**
         * 这个转换的所有子元素
         */
        public get childCount() {
            return this._children.length;
        }

        /**
         * 变换在世界空间中的位置
         */
        public get position(): Vector2 {
            this.updateTransform();
            if (this._positionDirty){
                if (!this.parent){
                    this._position = this._localPosition;
                }else{
                    this.parent.updateTransform();
                    this._position = Vector2Ext.transformR(this._localPosition, this.parent._worldTransform);
                }

                this._positionDirty = false;
            }

            return this._position;
        }

        /**
         * 变换在世界空间中的位置
         * @param value
         */
        public set position(value: Vector2){
            this.setPosition(value.x, value.y);
        }

        /**
         * 转换相对于父转换的位置。如果转换没有父元素，则与transform.position相同
         */
        public get localPosition(): Vector2 {
            this.updateTransform();
            return this._localPosition;
        }

        /**
         * 转换相对于父转换的位置。如果转换没有父元素，则与transform.position相同
         * @param value
         */
        public set localPosition(value: Vector2){
            this.setLocalPosition(value);
        }

        /**
         * 在世界空间中以弧度旋转的变换
         */
        public get rotation(): number {
            this.updateTransform();
            return this._rotation;
        }

        /**
         * 变换在世界空间的旋转度
         */
        public get rotationDegrees(): number {
            return MathHelper.toDegrees(this._rotation);
        }

        /**
         * 变换在世界空间的旋转度
         * @param value
         */
        public set rotationDegrees(value: number){
            this.setRotation(MathHelper.toRadians(value));
        }

        /**
         * 变换在世界空间的旋转度
         * @param value
         */
        public set rotation(value: number){
            this.setRotation(value);
        }

        /**
         * 相对于父变换的旋转，变换的旋转。如果转换没有父元素，则与transform.rotation相同
         */
        public get localRotation(): number {
            this.updateTransform();
            return this._localRotation;
        }

        /**
         * 相对于父变换的旋转，变换的旋转。如果转换没有父元素，则与transform.rotation相同
         * @param value
         */
        public set localRotation(value: number){
            this.setLocalRotation(value);
        }

        /**
         * 旋转相对于父变换旋转的角度
         */
        public get localRotationDegrees(): number {
            return MathHelper.toDegrees(this._localRotation);
        }

        /**
         * 旋转相对于父变换旋转的角度
         * @param value
         */
        public set localRotationDegrees(value: number){
            this.localRotation = MathHelper.toRadians(value);
        }

        /**
         * 变换在世界空间的缩放
         */
        public get scale(): Vector2{
            this.updateTransform();
            return this._scale;
        }

        /**
         * 变换在世界空间的缩放
         * @param value
         */
        public set scale(value: Vector2){
            this.setScale(value);
        }

        /**
         * 转换相对于父元素的比例。如果转换没有父元素，则与transform.scale相同
         */
        public get localScale(): Vector2 {
            this.updateTransform();
            return this._localScale;
        }

        /**
         * 转换相对于父元素的比例。如果转换没有父元素，则与transform.scale相同
         * @param value
         */
        public set localScale(value: Vector2){
            this.setLocalScale(value);
        }

        public get worldInverseTransform(): Matrix2D {
            this.updateTransform();
            if (this._worldInverseDirty){
                this._worldInverseTransform = this._worldTransform.invert();
                this._worldInverseDirty = false;
            }

            return this._worldInverseTransform;
        }

        public get localToWorldTransform(): Matrix2D {
            this.updateTransform();
            return this._worldTransform;
        }

        public get worldToLocalTransform(): Matrix2D {
            if (this._worldToLocalDirty){
                if (!this.parent){
                    this._worldToLocalTransform = Matrix2D.create().identity();
                }else{
                    this.parent.updateTransform();
                    this._worldToLocalTransform = this.parent._worldTransform.invert();
                }

                this._worldToLocalDirty = false;
            }

            return this._worldToLocalTransform;
        }

        public _parent: Transform;
        public hierarchyDirty: DirtyType;

        public _localDirty: boolean;
        public _localPositionDirty: boolean;
        public _localScaleDirty: boolean;
        public _localRotationDirty: boolean;
        public _positionDirty: boolean;
        public _worldToLocalDirty: boolean;
        public _worldInverseDirty: boolean;

        /**
         * 值会根据位置、旋转和比例自动重新计算
         */
        public _localTransform: Matrix2D;
        /**
         * 值将自动从本地和父矩阵重新计算。
         */
        public _worldTransform = Matrix2D.create().identity();
        public _worldToLocalTransform = Matrix2D.create().identity();
        public _worldInverseTransform = Matrix2D.create().identity();

        public _rotationMatrix: Matrix2D;
        public _translationMatrix: Matrix2D;
        public _scaleMatrix: Matrix2D;

        public _position: Vector2;
        public _scale: Vector2;
        public _rotation: number;

        public _localPosition: Vector2;
        public _localScale: Vector2;
        public _localRotation: number;

        public _children: Transform[];

        constructor(entity: Entity) {
            this.entity = entity;
            this.scale = Vector2.one;
            this._children = [];
        }

        /**
         * 返回在索引处的转换子元素
         * @param index
         */
        public getChild(index: number): Transform {
            return this._children[index];
        }

        /**
         * 设置此转换的父转换
         * @param parent
         */
        public setParent(parent: Transform): Transform {
            if (this._parent == parent)
                return this;

            if (!this._parent) {
                this._parent._children.remove(this);
                this._parent._children.push(this);
            }

            this._parent = parent;
            this.setDirty(DirtyType.positionDirty);

            return this;
        }

        /**
         * 设置转换在世界空间中的位置
         * @param x
         * @param y
         */
        public setPosition(x: number, y: number): Transform {
            let position = new Vector2(x, y);
            if (position == this._position)
                return this;

            this._position = position;
            if (this.parent){
                this.localPosition = Vector2Ext.transformR(this._position, this._worldToLocalTransform);
            } else {
                this.localPosition = position;
            }
            this._positionDirty = false;

            return this;
        }

        /**
         * 设置转换相对于父转换的位置。如果转换没有父元素，则与transform.position相同
         * @param localPosition
         */
        public setLocalPosition(localPosition: Vector2): Transform {
            if (localPosition == this._localPosition)
                return this;

            this._localPosition = localPosition;
            this._localDirty = this._positionDirty = this._localPositionDirty = this._localRotationDirty = this._localScaleDirty = true;
            this.setDirty(DirtyType.positionDirty);

            return this;
        }


        /**
         * 设置变换在世界空间的旋转度
         * @param radians
         */
        public setRotation(radians: number): Transform {
            this._rotation = radians;
            if (this.parent){
                this.localRotation = this.parent.rotation + radians;
            } else {
                this.localRotation = radians;
            }

            return this;
        }

        /**
         * 设置变换在世界空间的旋转度
         * @param degrees
         */
        public setRotationDegrees(degrees: number): Transform {
            return this.setRotation(MathHelper.toRadians(degrees));
        }

        /**
         * 旋转精灵的顶部，使其朝向位置
         * @param pos
         */
        public lookAt(pos: Vector2) {
            let sign = this.position.x > pos.x ? -1 : 1;
            let vectorToAlignTo = Vector2.normalize(Vector2.subtract(this.position, pos));
            this.rotation = sign * Math.acos(Vector2.dot(vectorToAlignTo, Vector2.unitY));
        }

        /**
         * 相对于父变换的旋转设置变换的旋转。如果转换没有父元素，则与transform.rotation相同
         * @param radians
         */
        public setLocalRotation(radians: number){
            this._localRotation = radians;
            this._localDirty = this._positionDirty = this._localPositionDirty = this._localRotationDirty = this._localScaleDirty = true;
            this.setDirty(DirtyType.rotationDirty);

            return this;
        }

        /**
         * 相对于父变换的旋转设置变换的旋转。如果转换没有父元素，则与transform.rotation相同
         * @param degrees
         */
        public setLocalRotationDegrees(degrees: number): Transform {
            return this.setLocalRotation(MathHelper.toRadians(degrees));
        }

        /**
         * 设置变换在世界空间中的缩放
         * @param scale
         */
        public setScale(scale: Vector2): Transform {
            this._scale = scale;
            if (this.parent){
                this.localScale = Vector2.divide(scale, this.parent._scale);
            }else{
                this.localScale = scale;
            }
            return this;
        }

        /**
         * 设置转换相对于父对象的比例。如果转换没有父元素，则与transform.scale相同
         * @param scale
         */
        public setLocalScale(scale: Vector2): Transform {
            this._localScale = scale;
            this._localDirty = this._positionDirty = this._localScaleDirty = true;
            this.setDirty(DirtyType.scaleDirty);

            return this;
        }

        /**
         * 对精灵坐标进行四舍五入
         */
        public roundPosition() {
            this.position = this._position.round();
        }

        public updateTransform(){
            if (this.hierarchyDirty != DirtyType.clean){
                if (this.parent)
                    this.parent.updateTransform();

                if (this._localDirty){
                    if (this._localPositionDirty){
                        this._translationMatrix = Matrix2D.create().translate(this._localPosition.x, this._localPosition.y);
                        this._localPositionDirty = false;
                    }

                    if (this._localRotationDirty){
                        this._rotationMatrix = Matrix2D.create().rotate(this._localRotation);
                        this._localRotationDirty = false;
                    }

                    if (this._localScaleDirty){
                        this._scaleMatrix = Matrix2D.create().scale(this._localScale.x, this._localScale.y);
                        this._localScaleDirty = false;
                    }

                    this._localTransform = this._scaleMatrix.multiply(this._rotationMatrix);
                    this._localTransform = this._localTransform.multiply(this._translationMatrix);

                    if (!this.parent){
                        this._worldTransform = this._localTransform;
                        this._rotation = this._localRotation;
                        this._scale = this._localScale;
                        this._worldInverseDirty = true;
                    }

                    this._localDirty = false;
                }

                if (this.parent){
                    this._worldTransform = this._localTransform.multiply(this.parent._worldTransform);

                    this._rotation = this._localRotation + this.parent._rotation;
                    this._scale = Vector2.multiply(this.parent._scale, this._localScale);
                    this._worldInverseDirty = true;
                }

                this._worldToLocalDirty = true;
                this._positionDirty = true;
                this.hierarchyDirty = DirtyType.clean;
            }
        }

        public setDirty(dirtyFlagType: DirtyType){
            if ((this.hierarchyDirty & dirtyFlagType) == 0){
                this.hierarchyDirty |= dirtyFlagType;

                switch (dirtyFlagType) {
                    case es.DirtyType.positionDirty:
                        this.entity.onTransformChanged(transform.Component.position);
                        break;
                    case es.DirtyType.rotationDirty:
                        this.entity.onTransformChanged(transform.Component.rotation);
                        break;
                    case es.DirtyType.scaleDirty:
                        this.entity.onTransformChanged(transform.Component.scale);
                        break;
                }

                if (!this._children)
                    this._children = [];

                // 告诉子项发生了变换
                for (let i = 0; i < this._children.length; i ++)
                    this._children[i].setDirty(dirtyFlagType);
            }
        }

        /**
         * 从另一个transform属性进行拷贝
         * @param transform
         */
        public copyFrom(transform: Transform) {
            this._position = transform.position;
            this._localPosition = transform._localPosition;
            this._rotation = transform._rotation;
            this._localRotation = transform._localRotation;
            this._scale = transform._scale;
            this._localScale = transform._localScale;

            this.setDirty(DirtyType.positionDirty);
            this.setDirty(DirtyType.rotationDirty);
            this.setDirty(DirtyType.scaleDirty);
        }

        public toString(): string{
            return `[Transform: parent: ${this.parent}, position: ${this.position}, rotation: ${this.rotation},
                scale: ${this.scale}, localPosition: ${this._localPosition}, localRotation: ${this._localRotation},
                localScale: ${this._localScale}]`;
        }
    }
}