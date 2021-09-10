module es {
    export class Element implements ILayout {
        protected _stage: Stage;
        public parent: Group;

        protected _visible: boolean = true;
        protected _needsLayout = true;
        protected _layoutEnabled: boolean = true;
        protected touchable: Touchable = Touchable.enabled;

        public x: number = 0;
        public y: number = 0;
        public width: number = 0;
        public height: number = 0;
        public color: Color = Color.White;
        protected originX: number = 0;
        protected originY: number = 0;
        protected scaleX: number = 1;
        protected scaleY: number = 1;
        protected rotation: number = 0;

        public get preferredWidth() {
            return 0;
        }

        public get preferredHeight() {
            return 0;
        }

        public fillParent: boolean = false;
        public get layoutEnabled() {
            return this._layoutEnabled;
        }
        public set layoutEnabled(value: boolean) {
            if (this._layoutEnabled != value) {
                this._layoutEnabled = value;

                if (this._layoutEnabled)
                    this.invalidateHierarchy();
            }
        }

        public getWidth() {
            return this.width;
        }

        public getHeight() {
            return this.height;
        }

        /**
         * 返回父元素，如果不在组中，则返回 null
         * @returns 
         */
        public getParent() {
            return this.parent;
        }

        /**
         * 当元素添加到组中或从组中删除时由框架调用
         * @param newParent 如果元素已从父元素中移除，则父元素可能为 null
         */
        public setParent(newParent: Group) {
            this.parent = newParent;
        }

        /**
         * 如果此元素处理输入事件，则返回 true
         * @returns 
         */
        public isTouchable() {
            return this.touchable == Touchable.enabled;
        }

        public getTouchable() {
            return this.touchable;
        }

        /**
         * 确定如何将触摸事件分发到此元素。 默认值为 {@link Touchable.enabled}。
         * @param touchable 
         */
        public setTouchable(touchable: Touchable) {
            this.touchable = touchable;
        }

        /**
         * 返回此元素当前所在的舞台，如果不在阶段，则返回 null。
         * @returns 
         */
        public getStage() {
            return this._stage;
        }
        /**
         * 当此元素或任何父元素添加到舞台中的组时，由框架调用
         * 如果元素或任何父元素不再处于阶段，则 stage 可能为 null
         * @param stage 
         */
        public setStage(stage: Stage) {
            this._stage = stage;
        }

        public setIsVisible(visible: boolean) {
            this._visible = visible;
        }

        public isVisible() {
            return this._visible;
        }

        /**
         * 如果为 false，则不会绘制元素并且不会接收触摸事件。 默认为真。
         * @param visible 
         */
        public setVisible(visible: boolean) {
            this._visible = visible;
        }

        /**
         * 如果此方法被覆盖，则应调用 super 方法或 {@link validate()} 以确保小部件布局。
         * @param batcher 
         * @param parentAlpha 
         */
        public draw(batcher: Batcher, parentAlpha: number) {
            this.validate();
        }

        public invalidate() {
            this._needsLayout = true;
        }

        public invalidateHierarchy() {
            if (!this._layoutEnabled)
                return;

            this.invalidate();
            
            if (this.parent instanceof Element) {
                (<Element>this.parent).invalidateHierarchy();
            }
        }

        public validate() {
            if (!this._layoutEnabled)
                return;

            if (this.fillParent && this.parent != null) {
                const stage = this.getStage();

                let parentWidth: number, parentHeight: number;

                if (stage != null && this.parent == stage.getRoot()) {
                    parentWidth = stage.getWidth();
                    parentHeight = stage.getHeight();
                } else {
                    parentWidth = this.parent.getWidth();
                    parentHeight = this.parent.getHeight();
                }

                if (this.width != parentWidth || this.height != parentHeight) {
                    this.setSize(parentWidth, parentHeight);
                    this.invalidate();
                }
            }

            if (!this._needsLayout)
                return;

            this._needsLayout = false;
            this.layout();
        }

        public layout() {

        }

        public setSize(width: number, height: number) {
            if (this.width == width && this.height == height)
                return;

            this.width = width;
            this.height = height;
            this.sizeChanged();
        }

        /**
         * 如果此 Element 和所有父元素都可见，则返回 true
         * @returns 
         */
        public areParentsVisible() {
            if (!this._visible)
                return false;

            if (this.parent != null)
                return this.parent.areParentsVisible();

            return this._visible;
        }

        public hit(point: Vector2): Element {
            // 如果我们不是 Touchable 或者我们或任何parent不可见
            if (this.touchable != Touchable.enabled || !this.areParentsVisible())
                return null;

            if (point.x >= 0 && point.x < this.width && point.y >= 0 && point.y < this.height)
                return this;

            return null;
        }

        protected sizeChanged() {
            this.invalidate();
        }

        public pack() {
            this.setSize(this.preferredWidth, this.preferredHeight);
            this.validate();
        }
    }
}