module es {
    export class Color {
        /**
         * 存储为RGBA
         */
        private _packedValue: number;

        /**
         * 从代表红、绿、蓝和alpha值的标量构造RGBA颜色。
         */
        constructor(r: number, g: number,b: number, alpha: number){
            if (((r | g |b | alpha) & 0xFFFFFF00) != 0){
                let clampedR = MathHelper.clamp(r, 0, 255);
                let clampedG = MathHelper.clamp(g, 0, 255);
                let clampedB = MathHelper.clamp(b, 0, 255);
                let clampedA = MathHelper.clamp(alpha, 0, 255);

                this._packedValue = (clampedA << 24) | (clampedB << 16) | (clampedG << 8) | (clampedR);
            }else{
                this._packedValue = (alpha << 24 ) | (b << 16) | (g << 8) | r;
            }
        }

        public get b(){
            return this._packedValue >> 16;
        }

        public set b(value: number){
            this._packedValue = (this._packedValue & 0xff00ffff) | (value << 16);
        }

        public get g(){
            return this._packedValue >> 8;
        }

        public set g(value: number){
            this._packedValue = (this._packedValue & 0xffff00ff) | (value << 8)
        }

        public get r(){
            return this._packedValue;
        }

        public set r(value: number){
            this._packedValue = (this._packedValue & 0xffffff00) | value;
        }

        public get a(){
            return this._packedValue >> 24;
        }

        public set a(value: number){
            this._packedValue = (this._packedValue & 0x00ffffff) | (value << 24);
        }

        public get packedValue(){
            return this._packedValue;
        }

        public set packedValue(value: number){
            this._packedValue = value;
        }

        public equals(other: Color):boolean{
            return this._packedValue == other._packedValue;
        }
    }
}