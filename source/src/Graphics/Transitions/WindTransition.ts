module es {
    export class WindTransition extends SceneTransition {
        private _mask: egret.Shape;
        private _windEffect: egret.CustomFilter;

        public duration = 1;
        public set windSegments(value: number) {
            this._windEffect.uniforms._windSegments = value;
        }
        public set size(value: number) {
            this._windEffect.uniforms._size = value;
        }
        public easeType = egret.Ease.quadOut;
        constructor(sceneLoadAction: Function) {
            super(sceneLoadAction);

            let vertexSrc =  "attribute vec2 aVertexPosition;\n" +
                "attribute vec2 aTextureCoord;\n" +

                "uniform vec2 projectionVector;\n" +

                "varying vec2 vTextureCoord;\n" +

                "const vec2 center = vec2(-1.0, 1.0);\n" +

                "void main(void) {\n" +
                "   gl_Position = vec4( (aVertexPosition / projectionVector) + center , 0.0, 1.0);\n" +
                "   vTextureCoord = aTextureCoord;\n" +
                "}";
            let fragmentSrc = "precision lowp float;\n" +
                "varying vec2 vTextureCoord;\n" +
                "uniform sampler2D uSampler;\n" +
                "uniform float _progress;\n" +
                "uniform float _size;\n" +
                "uniform float _windSegments;\n" +

                "void main(void) {\n" +
                "vec2 co = floor(vec2(0.0, vTextureCoord.y * _windSegments));\n" +
                "float x = sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453;\n" +
                "float r = x - floor(x);\n" +
                "float m = smoothstep(0.0, -_size, vTextureCoord.x * (1.0 - _size) + _size * r - (_progress * (1.0 + _size)));\n" +
                "vec4 fg = texture2D(uSampler, vTextureCoord);\n" +
                "gl_FragColor = mix(fg, vec4(0, 0, 0, 0), m);\n" +
                "}";

            this._windEffect = new egret.CustomFilter(vertexSrc, fragmentSrc, {
                _progress: 0,
                _size: 0.3,
                _windSegments: 100
            });

            this._mask = new egret.Shape();
            this._mask.graphics.beginFill(0xFFFFFF, 1);
            this._mask.graphics.drawRect(0, 0, Core.graphicsDevice.viewport.width, Core.graphicsDevice.viewport.height);
            this._mask.graphics.endFill();
            this._mask.filters = [this._windEffect];
        }

        public async onBeginTransition() {
            this.loadNextScene();
            await this.tickEffectProgressProperty(this._windEffect, this.duration, this.easeType);
            this.transitionComplete();
        }
    }
}
