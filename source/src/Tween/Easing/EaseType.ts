module es {
    export enum EaseType {
        linear,

        sineIn,
        sineOut,
        sineInOut,

        quadIn,
        quadOut,
        quadInOut,

        quintIn,
        quintOut,
        quintInOut,

        cubicIn,
        cubicOut,
        cubicInOut,

        quartIn,
        quartOut,
        quartInOut,

        expoIn,
        expoOut,
        expoInOut,

        circleIn,
        circleOut,
        circleInOut,

        elasticIn,
        elasticOut,
        elasticInOut,
        punch,

        backIn,
        backOut,
        backInOut,

        bounceIn,
        bounceOut,
        bounceInOut
    }

    /**
     * 助手的一个方法，它接收一个EaseType，并通过给定的持续时间和时间参数来应用该Ease方程。
     * 我们这样做是为了避免传来传去的Funcs为垃圾收集器制造大量垃圾
     */
    export class EaseHelper {
        /**
         * 返回 easeType 的相反 EaseType
         * @param easeType 
         */
        public static oppositeEaseType(easeType: EaseType) {
            switch (easeType) {
                case EaseType.linear:
                    return easeType;

                case EaseType.backIn:
                    return EaseType.backOut;
                case EaseType.backOut:
                    return EaseType.backIn;
                case EaseType.backInOut:
                    return easeType;

                case EaseType.bounceIn:
                    return EaseType.bounceOut;
                case EaseType.bounceOut:
                    return EaseType.bounceIn;
                case EaseType.bounceInOut:
                    return easeType;

                case EaseType.circleIn:
                    return EaseType.circleOut;
                case EaseType.circleOut:
                    return EaseType.circleIn;
                case EaseType.circleInOut:
                    return easeType;

                case EaseType.cubicIn:
                    return EaseType.cubicOut;
                case EaseType.cubicOut:
                    return EaseType.cubicIn;
                case EaseType.circleInOut:
                    return easeType;

                case EaseType.punch:
                    return easeType;

                case EaseType.expoIn:
                    return EaseType.expoOut;
                case EaseType.expoOut:
                    return EaseType.expoIn;
                case EaseType.expoInOut:
                    return easeType;

                case EaseType.quadIn:
                    return EaseType.quadOut;
                case EaseType.quadOut:
                    return EaseType.quadIn;
                case EaseType.quadInOut:
                    return easeType;

                case EaseType.quartIn:
                    return EaseType.quadOut;
                case EaseType.quartOut:
                    return EaseType.quartIn;
                case EaseType.quadInOut:
                    return easeType;

                case EaseType.sineIn:
                    return EaseType.sineOut;
                case EaseType.sineOut:
                    return EaseType.sineIn;
                case EaseType.sineInOut:
                    return easeType;

                default:
                    return easeType;
            }
        }

        public static ease(easeType: EaseType, t: number, duration: number) {
            switch (easeType) {
                case EaseType.linear:
                    return Easing.Linear.easeNone(t, duration);

                case EaseType.backIn:
                    return Easing.Back.easeIn(t, duration);
                case EaseType.backOut:
                    return Easing.Back.easeOut(t, duration);
                case EaseType.backInOut:
                    return Easing.Back.easeInOut(t, duration);

                case EaseType.bounceIn:
                    return Easing.Bounce.easeIn(t, duration);
                case EaseType.bounceOut:
                    return Easing.Bounce.easeOut(t, duration);
                case EaseType.bounceInOut:
                    return Easing.Bounce.easeInOut(t, duration);

                case EaseType.circleIn:
                    return Easing.Circular.easeIn(t, duration);
                case EaseType.circleOut:
                    return Easing.Circular.easeOut(t, duration);
                case EaseType.circleInOut:
                    return Easing.Circular.easeInOut(t, duration);

                case EaseType.cubicIn:
                    return Easing.Cubic.easeIn(t, duration);
                case EaseType.cubicOut:
                    return Easing.Cubic.easeOut(t, duration);
                case EaseType.cubicInOut:
                    return Easing.Cubic.easeInOut(t, duration);

                case EaseType.elasticIn:
                    return Easing.Elastic.easeIn(t, duration);
                case EaseType.elasticOut:
                    return Easing.Elastic.easeOut(t, duration);
                case EaseType.elasticInOut:
                    return Easing.Elastic.easeInOut(t, duration);
                case EaseType.punch:
                    return Easing.Elastic.punch(t, duration);

                case EaseType.expoIn:
                    return Easing.Exponential.easeIn(t, duration);
                case EaseType.expoOut:
                    return Easing.Exponential.easeOut(t, duration);
                case EaseType.expoInOut:
                    return Easing.Exponential.easeInOut(t, duration);

                case EaseType.quadIn:
                    return Easing.Quadratic.easeIn(t, duration);
                case EaseType.quadOut:
                    return Easing.Quadratic.easeOut(t, duration);
                case EaseType.quadInOut:
                    return Easing.Quadratic.easeInOut(t, duration);

                case EaseType.quadIn:
                    return Easing.Quadratic.easeIn(t, duration);
                case EaseType.quadOut:
                    return Easing.Quadratic.easeOut(t, duration);
                case EaseType.quadInOut:
                    return Easing.Quadratic.easeInOut(t, duration);

                case EaseType.quintIn:
                    return Easing.Quintic.easeIn(t, duration);
                case EaseType.quintOut:
                    return Easing.Quintic.easeOut(t, duration);
                case EaseType.quintInOut:
                    return Easing.Quintic.easeInOut(t, duration);

                case EaseType.sineIn:
                    return Easing.Sinusoidal.easeIn(t, duration);
                case EaseType.sineOut:
                    return Easing.Sinusoidal.easeOut(t, duration);
                case EaseType.sineInOut:
                    return Easing.Sinusoidal.easeInOut(t, duration);

                default:
                    return Easing.Linear.easeNone(t, duration);
            }
        }
    }
}