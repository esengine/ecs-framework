module es {
    export class GaussianBlurEffect extends egret.CustomFilter {
        // private static blur_frag = "precision mediump float;\n" +
        // "uniform vec2 blur;\n" +
        // "uniform sampler2D uSampler;\n" +
        // "varying vec2 vTextureCoord;\n" +
        // "uniform vec2 uTextureSize;\n" +
        // "void main()\n" +
        // "{\n " +
        // "const int sampleRadius = 5;\n" +
        // "const int samples = sampleRadius * 2 + 1;\n" +
        // "vec2 blurUv = blur / uTextureSize;\n" +
        // "vec4 color = vec4(0, 0, 0, 0);\n" +
        // "vec2 uv = vec2(0.0, 0.0);\n" +
        // "blurUv /= float(sampleRadius);\n" +

        // "for (int i = -sampleRadius; i <= sampleRadius; i++) {\n" +
        // "uv.x = vTextureCoord.x + float(i) * blurUv.x;\n" +
        // "uv.y = vTextureCoord.y + float(i) * blurUv.y;\n" +
        // "color += texture2D(uSampler, uv);\n" +
        // "}\n" +

        // "color /= float(samples);\n" +
        // "gl_FragColor = color;\n" +
        // "}";

        private static blur_frag = "precision mediump float;\n" +
            "uniform sampler2D uSampler;\n" +
            "uniform float screenWidth;\n" +
            "uniform float screenHeight;\n" +

            "float normpdf(in float x, in float sigma)\n" +
            "{\n" +
            "return 0.39894*exp(-0.5*x*x/(sigma*sigma))/sigma;\n" +
            "}\n" +

            "void main()\n" +
            "{\n" +
            "vec3 c = texture2D(uSampler, gl_FragCoord.xy / vec2(screenWidth, screenHeight).xy).rgb;\n" +

            "const int mSize = 11;\n" +
            "const int kSize = (mSize - 1)/2;\n" +
            "float kernel[mSize];\n" +
            "vec3 final_colour = vec3(0.0);\n" +

            "float sigma = 7.0;\n" +
            "float z = 0.0;\n" +
            "for (int j = 0; j <= kSize; ++j)\n" +
            "{\n" +
            "kernel[kSize+j] = kernel[kSize-j] = normpdf(float(j),sigma);\n" +
            "}\n" +

            "for (int j = 0; j < mSize; ++j)\n" +
            "{\n" +
            "z += kernel[j];\n" +
            "}\n" +

            "for (int i = -kSize; i <= kSize; ++i)\n" +
            "{\n" +
            "for (int j = -kSize; j <= kSize; ++j)\n" +
            "{\n" +
            "final_colour += kernel[kSize+j]*kernel[kSize+i]*texture2D(uSampler, (gl_FragCoord.xy+vec2(float(i),float(j))) / vec2(screenWidth, screenHeight).xy).rgb;\n" +
            "}\n}\n" +
            "gl_FragColor = vec4(final_colour/(z*z), 1.0);\n" +
            "}";

        constructor(){
            super(PostProcessor.default_vert, GaussianBlurEffect.blur_frag,{
                screenWidth: Core.graphicsDevice.viewport.width,
                screenHeight: Core.graphicsDevice.viewport.height
            });
        }
    }
}
