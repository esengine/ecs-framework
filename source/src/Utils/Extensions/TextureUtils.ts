module es {
    export class TextureUtils {
        public static premultiplyAlpha(pixels: number[]) {
            let b = pixels[0];
            for (let i = 0; i < pixels.length; i += 4) {
                if (b[i + 3] != 255) {
                    let alpha = b[i + 3] / 255;
                    b[i + 0] = b[i + 0] * alpha;
                    b[i + 1] = b[i + 1] * alpha;
                    b[i + 2] = b[i + 2] * alpha;
                }
            }
        }
    }
}