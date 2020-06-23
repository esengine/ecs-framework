class GaussianBlurEffect extends egret.CustomFilter {
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
    "vec4 c = 0;\n" +
    "for( int i = 0; i < SAMPLE_COUNT; i++ )\n" +
    "   c += texture2D( s0, texCoord + _sampleOffsets[i] ) * _sampleWeights[i];\n" +
    "gl_FragColor = c;\n" +
    "}";
    private _sampleWeights: number[];
    private _verticalSampleOffsets: Vector2[];
    private _horizontalSampleOffsets: Vector2[];
    private _blurAmount = 2;
    private _horizontalBlurDelta = 0.01;
    private _verticalBlurDelta = 0.01;

    public get blurAmount(){
        return this._blurAmount;
    }
    public set blurAmount(value: number){
        if (this._blurAmount != value){
            if (value == 0)
                value = 0.001;

            this._blurAmount = value;
            this.calculateSampleWeights();
        }
    }

    public get horizontalBlurDelta(){
        return this._horizontalBlurDelta;
    }
    public set horizontalBlurDelta(value: number){
        if (value != this._horizontalBlurDelta){
            this._horizontalBlurDelta = value;
            this.setBlurEffectParameters(this._horizontalBlurDelta, 0, this._horizontalSampleOffsets);
        }
    }

    public get verticalBlurDelta(){
        return this._verticalBlurDelta;
    }
    public set verticalBlurDelta(value: number){
        if (value != this._verticalBlurDelta){
            this._verticalBlurDelta = value;
            this.setBlurEffectParameters(0, this._verticalBlurDelta, this._verticalSampleOffsets);
        }
    }

    constructor(){
        super(GaussianBlurEffect.vertSrc, GaussianBlurEffect.fragmentSrc);

        this._sampleWeights = [];
        this._verticalSampleOffsets = [];
        this._horizontalSampleOffsets = [];

        this._verticalSampleOffsets[0] = Vector2.zero;
        this._horizontalSampleOffsets[0] = Vector2.zero;

        this.calculateSampleWeights();
        this.setBlurEffectParameters(this._horizontalBlurDelta, 0, this._horizontalSampleOffsets);
        this.prepareForHorizontalBlur();
    }

    public prepareForHorizontalBlur(){
        this.uniforms._sampleOffsets = this._horizontalSampleOffsets;
    }

    public prepareForVerticalBlur(){
        this.uniforms._sampleOffsets = this._verticalSampleOffsets;
    }

    private calculateSampleWeights(){
        this._sampleWeights[0] = this.computeGaussian(0);
        let totalWeights = this._sampleWeights[0];

        for (let i = 0; i < 15 / 2; i ++){
            let weight = this.computeGaussian(i + 1);
            this._sampleWeights[i * 2 + 1] = weight;
            this._sampleWeights[i * 2 + 2] = weight;

            totalWeights += weight * 2;
        }

        for (let i = 0; i < this._sampleWeights.length; i ++){
            this._sampleWeights[i] /= totalWeights;
        }

        this.uniforms._sampleWeights = this._sampleWeights;
    }

    private setBlurEffectParameters(dx: number, dy: number, offsets: Vector2[]){
        for (let i = 0; i < 15 / 2; i ++){
            let sampleOffset = i * 2 + 1.5;
            let delta = Vector2.subtract( new Vector2(dx, dy), new Vector2(sampleOffset));

            offsets[i * 2 + 1] = delta;
            offsets[i * 2 + 2] = new Vector2(-delta);
        }
    }

    private computeGaussian(n: number){
        return ((1 / Math.sqrt(2 * Math.PI * this._blurAmount)) * Math.exp(-(n * n) / (2 * this._blurAmount * this._blurAmount)));
    }
}