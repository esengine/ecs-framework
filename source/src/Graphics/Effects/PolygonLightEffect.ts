class PolygonLightEffect extends egret.CustomFilter {
    private static vertSrc = "attribute vec2 aVertexPosition;\n" +
    "attribute vec2 aTextureCoord;\n" +

    "uniform vec2 projectionVector;\n" +

    "varying vec2 vTextureCoord;\n" +

    "const vec2 center = vec2(-1.0, 1.0);\n" +

    "void main(void) {\n" +
    "   gl_Position = vec4( (aVertexPosition / projectionVector) + center , 0.0, 1.0);\n" +
    "   vTextureCoord = aTextureCoord;\n" +
    "}";
    private static fragmentSrc = "precision lowp float;\n" +
    "varying vec2 vTextureCoord;\n" +
    "uniform sampler2D uSampler;\n" +

    "#define SAMPLE_COUNT 15\n" +

    "uniform vec2 _sampleOffsets[SAMPLE_COUNT];\n" +
    "uniform float _sampleWeights[SAMPLE_COUNT];\n" +

    "void main(void) {\n" +
    "vec4 c = vec4(0, 0, 0, 0);\n" +
    "for( int i = 0; i < SAMPLE_COUNT; i++ )\n" +
    "   c += texture2D( uSampler, vTextureCoord + _sampleOffsets[i] ) * _sampleWeights[i];\n" +
    "gl_FragColor = c;\n" +
    "}";

    constructor(){
        super(PolygonLightEffect.vertSrc, PolygonLightEffect.fragmentSrc);
    }
}