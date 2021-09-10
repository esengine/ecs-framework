module es {
    /**
     * 创建一个新滑块
     * 它的宽度由给定的 prefWidth 参数决定，其高度由滑块 {@link NinePatchSprite} 的最大高度决定。
     * 最小值和最大值确定此滑块的值可以采用的范围，stepSize 参数指定各个值之间的距离
     * 例如。 min 可以是 4，max 可以是 10，stepSize 可以是 0.2，总共给你 30 个值，4.0 4.2、4.4 等等。
     */
    export class Slider extends ProgressBar implements IInputListener {
        constructor(min: number, max: number, stepSize: number, vertical: boolean, style: SliderStyle) {
            super(min, max, stepSize, vertical, style);
        }
    }

    export class SliderStyle extends ProgressBarStyle {

    }
}