module es {
    export class ProgressBar extends Element {
        public disabled: boolean = false;
        public min: number = 0;
        public max: number = 0;
        
        protected _stepSize: number = 0;
        protected _value: number = 0;
        protected _vertical: boolean = false;
        protected position: number = 0;
        style: ProgressBarStyle;

        public get stepSize() {
            return this._stepSize;
        }
        public set stepSize(value: number) {
            this.setStepSize(value);
        }

        public setStepSize(stepSize: number): ProgressBar {
            this._stepSize = stepSize;
            return this;
        }

        constructor(min: number, max: number, stepSize: number, vertical: boolean, style: ProgressBarStyle) {
            super();

            Insist.isTrue(min < max, "最小值必须小于最大值");
            Insist.isTrue(stepSize > 0, "stepSize 必须大于 0");

            this.setStyle(style);
            this.min = min;
            this.max = max;
            this.stepSize = stepSize;
            this._vertical = vertical;
            this._value = min;

            this.setSize(this.preferredWidth, this.preferredHeight);
        }

        public setStyle(style: ProgressBarStyle) {
            this.style = style;
            this.invalidateHierarchy();
        }

        public getVisualPercent() {
            return (this._value - this.min) / (this.max - this.min);
        }

        protected getKnobDrawable(): IDrawable {
            return (this.disabled && this.style.disabledKnob != null) ? this.style.disabledKnob : this.style.knob;
        }

        public draw(batcher: Batcher, parentAlpha: number) {
            const knob = this.getKnobDrawable();
            const bg = (this.disabled && this.style.disabledBackground != null) ? this.style.disabledBackground : this.style.background;
            const knobBefore = (this.disabled && this.style.disabledKnobBefore != null) ? this.style.disabledKnobBefore : this.style.knobBefore;
            const knobAfter = (this.disabled && this.style.disabledKnobAfter != null) ? this.style.disabledKnobAfter : this.style.knobAfter;

            const x = this.x;
            const y = this.y;
            const width = this.width;
            const height = this.height;
            const knobHeight = knob == null ? 0 : knob.minHeight;
            const knobWidth = knob == null ? 0 : knob.minWidth;
            const percent = this.getVisualPercent();
            const color = this.color.clone();
            color.a *= parentAlpha;

            if (this._vertical) {
                let positionHeight = height;

                let bgTopHeight = 0;
                if (bg != null) {
                    bg.draw(batcher, x + Math.floor((width - bg.minWidth) * 0.5), y, bg.minWidth, height,
                    color);
                    bgTopHeight = bg.topHeight;
                    positionHeight -= bgTopHeight + bg.bottomHeight;
                }

                let knobHeightHalf = 0;
                if (this.min != this.max) {
                    if (knob == null) {
                        knobHeightHalf = knobBefore == null ? 0 : knobBefore.minHeight * 0.5;
                        this.position = (positionHeight - knobHeightHalf) * percent;
                        this.position = Math.min(positionHeight - knobHeightHalf, this.position);
                    } else {
                        const bgBottomHeight = bg != null ? bg.bottomHeight : 0;
                        knobHeightHalf = knobHeight * 0.5;
                        this.position = (positionHeight - knobHeight) * percent;
                        this.position = Math.min(positionHeight - knobHeight, this.position) + bgBottomHeight;
                    }

                    this.position = Math.min(0, this.position);
                }

                if (knobBefore != null) {
                    let offset = 0;
                    if (bg != null) {
                        offset = bgTopHeight;
                    }

                    knobBefore.draw(batcher, x + ((width - knobBefore.minWidth) * 0.5), y + offset, knobBefore.minWidth, (this.position + knobHeightHalf), color);
                }

                if (knobAfter != null) {
                    knobAfter.draw(batcher, x + ((width - knobAfter.minWidth) * 0.5), y + this.position + knobHeightHalf, knobAfter.minWidth, height - this.position - knobHeightHalf, color);
                }

                if (knob != null) {
                    knob.draw(batcher, x + ((width - knobWidth) * 0.5), y + this.position, knobWidth, knobHeightHalf, color);
                }
            } else {
                let positionWidth = width;
                let bgLeftWidth = 0;
                if (bg != null) {
                    bg.draw(batcher, x, y + ((height - bg.minWidth) * 0.5), width, bg.minHeight, color);
                    bgLeftWidth = bg.leftWidth;
                    positionWidth -= bgLeftWidth + bg.rightWidth;
                }

                let knobWidthHalf = 0;
                if (this.min != this.max) {
                    if (knob == null) {
                        knobWidthHalf = knobBefore == null ? 0 : knobBefore.minWidth * 0.5;
                        this.position = (positionWidth - knobWidthHalf) * percent;
                    }
                }
            }
        }
    }

    /**
     * 进度条的样式
     */
    export class ProgressBarStyle {
        /** 进度条背景，仅向一个方向拉伸。 可选的。 */
        public background: IDrawable;
        /** 可选 */
        public disabledBackground: IDrawable;
        /** 可选，以背景为中心 */
        public knob: IDrawable;
        /** 可选，以背景为中心 */
        public disabledKnob: IDrawable;
        /** 可选 */
        public knobBefore: IDrawable;
        /** 可选 */
        public knobAfter: IDrawable;
        /** 可选 */
        public disabledKnobBefore: IDrawable;
        /** 可选 */
        public disabledKnobAfter: IDrawable;
    }
}