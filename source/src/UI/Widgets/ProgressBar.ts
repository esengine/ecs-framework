module es {
    export class ProgressBar extends Element {
        constructor(min: number, max: number, stepSize: number, vertical: boolean, style) {
            super();
        }
    }

    /**
     * 进度条的样式
     */
    export class ProgressBarStyle {
        /** 进度条背景，仅向一个方向拉伸。 可选的。 */
        public background: IDrawable;
    }
}