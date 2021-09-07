module es {
    export class ColorExt {
        private static readonly HEX = "0123456789ABCDEF";

        public static lerp(from: Color, to: Color, t: number): Color {
            const t255 = t * 255;
            return new Color(from.r + (to.r - from.r) * t255 / 255, from.g + (to.g - from.g) * t255 / 255,
                from.b + (to.b - from.b) * t255 / 255, from.a + (to.a - from.a) * t255 / 255);
        }

        public static lerpOut(from: Color, to: Color, t: number) {
            const t255 = t * 255;
            const result = new Color();
            result.r = from.r + (to.r - from.r) * t255 / 255;
            result.g = from.g + (to.g - from.g) * t255 / 255;
            result.b = from.b + (to.b - from.b) * t255 / 255;
            result.a = from.a + (to.a - from.a) * t255 / 255;
            return result;
        }
    }
}