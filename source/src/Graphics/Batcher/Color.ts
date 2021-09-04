module es {
    export class Color extends cc.Color {
        /**
         * 红色通道
         */
        public r: number;
        /**
         * 绿色通道
         */
        public g: number;
        /**
         * 蓝色通道
         */
        public b: number;
        /**
         * 透明度通道 (仅0-1之间)
         */
        public a: number;

        /**
         * 色调
         */
        public h: number;
        /**
         * 饱和
         */
        public s: number;
        /**
         * 亮度
         */
        public l: number;

        /**
         * 从 r, g, b, a 创建一个新的 Color 实例 
         *
         * @param r  颜色的红色分量 (0-255) 
         * @param g  颜色的绿色成分 (0-255) 
         * @param b  颜色的蓝色分量 (0-255) 
         * @param a  颜色的 alpha 分量 (0-1.0) 
         */
        constructor(r: number, g: number, b: number, a?: number) {
            super(r, g, b, a);
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a != null ? a : 1;
        }

        /**
         * 从 r, g, b, a 创建一个新的 Color 实例 
         *
         * @param r  颜色的红色分量 (0-255) 
         * @param g  颜色的绿色成分 (0-255) 
         * @param b  颜色的蓝色分量 (0-255) 
         * @param a  颜色的 alpha 分量 (0-1.0) 
         */
        public static fromRGB(r: number, g: number, b: number, a?: number): Color {
            return new Color(r, g, b, a);
        }

        /**
         * 从十六进制字符串创建一个新的 Color 实例 
         *
         * @param hex  #ffffff 形式的 CSS 颜色字符串，alpha 组件是可选的 
         */
        public static createFromHex(hex: string): Color {
            const color = new Color(1, 1, 1);
            color.fromHex(hex);
            return color;
        }

        /**
         * 从 hsl 值创建一个新的 Color 实例 
         *
         * @param h  色调表示 [0-1] 
         * @param s  饱和度表示为 [0-1] 
         * @param l  亮度表示 [0-1] 
         * @param a  透明度表示 [0-1] 
         */
        public static fromHSL(
            h: number,
            s: number,
            l: number,
            a: number = 1.0
        ): Color {
            const temp = new HSLColor(h, s, l, a);
            return temp.toRGBA();
        }

        /**
         * 将当前颜色调亮指定的量 
         *
         * @param factor
         */
        public lighten(factor: number = 0.1): Color {
            const temp = HSLColor.fromRGBA(this.r, this.g, this.b, this.a);
            temp.l += temp.l * factor;
            return temp.toRGBA();
        }

        /**
         * 将当前颜色变暗指定的量 
         *
         * @param factor 
         */
        public darken(factor: number = 0.1): Color {
            const temp = HSLColor.fromRGBA(this.r, this.g, this.b, this.a);
            temp.l -= temp.l * factor;
            return temp.toRGBA();
        }

        /**
         * 使当前颜色饱和指定的量 
         *
         * @param factor
         */
        public saturate(factor: number = 0.1): Color {
            const temp = HSLColor.fromRGBA(this.r, this.g, this.b, this.a);
            temp.s += temp.s * factor;
            return temp.toRGBA();
        }

        /**
         * 按指定量降低当前颜色的饱和度 
         *
         * @param factor
         */
        public desaturate(factor: number = 0.1): Color {
            const temp = HSLColor.fromRGBA(this.r, this.g, this.b, this.a);
            temp.s -= temp.s * factor;
            return temp.toRGBA();
        }

        /**
         * 将一种颜色乘以另一种颜色，得到更深的颜色
         *
         * @param color 
         */
        public mulitiply(color: Color): Color {
            const newR = (((color.r / 255) * this.r) / 255) * 255;
            const newG = (((color.g / 255) * this.g) / 255) * 255;
            const newB = (((color.b / 255) * this.b) / 255) * 255;
            const newA = color.a * this.a;
            return new Color(newR, newG, newB, newA);
        }

        /**
         * 筛选另一种颜色，导致颜色较浅 
         *
         * @param color 
         */
        public screen(color: Color): Color {
            const color1 = color.invert();
            const color2 = color.invert();
            return color1.mulitiply(color2).invert();
        }

        /**
         * 反转当前颜色 
         */
        public invert(): Color {
            return new Color(255 - this.r, 255 - this.g, 255 - this.b, 1.0 - this.a);
        }

        /**
         * 将当前颜色与另一个颜色平均 
         *
         * @param color
         */
        public average(color: Color): Color {
            const newR = (color.r + this.r) / 2;
            const newG = (color.g + this.g) / 2;
            const newB = (color.b + this.b) / 2;
            const newA = (color.a + this.a) / 2;
            return new Color(newR, newG, newB, newA);
        }

        /**
         * 返回颜色的 CSS 字符串表示形式。 
         *
         * @param format 
         */
        public toString(format: 'rgb' | 'hsl' | 'hex' = 'rgb') {
            switch (format) {
                case 'rgb':
                    return this.toRGBA();
                case 'hsl':
                    return this.toHSLA();
                case 'hex':
                    return this.toHex();
                default:
                    throw new Error('Invalid Color format');
            }
        }

        /**
         * 返回颜色分量的十六进制值 
         * @param c 
         * @see https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
         */
        private _componentToHex(c: number) {
            const hex = c.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }

        /**
         *返回颜色的十六进制表示
         */
        public toHex(): string {
            return (
                '#' +
                this._componentToHex(this.r) +
                this._componentToHex(this.g) +
                this._componentToHex(this.b) +
                this._componentToHex(this.a)
            );
        }

        /**
         * 返回egret颜色的十六进制表示
         * @returns 
         */
        public toHexEgret(): number {
            return Number("0x" + this._componentToHex(this.r) +
            this._componentToHex(this.g) +
            this._componentToHex(this.b));
        }

        /**
         * 从十六进制字符串设置颜色 
         *
         * @param hex  #ffffff 形式的 CSS 颜色字符串，alpha 组件是可选的 
         */
        public fromHex(hex: string) {
            const hexRegEx: RegExp = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i;
            const match = hex.match(hexRegEx);
            if (match) {
                const r = parseInt(match[1], 16);
                const g = parseInt(match[2], 16);
                const b = parseInt(match[3], 16);
                let a = 1;
                if (match[4]) {
                    a = parseInt(match[4], 16) / 255;
                }
                this.r = r;
                this.g = g;
                this.b = b;
                this.a = a;
            } else {
                throw new Error('Invalid hex string: ' + hex);
            }
        }

        /**
         * 返回颜色的 RGBA 表示
         */
        public toRGBA() {
            const result =
                String(this.r.toFixed(0)) +
                ', ' +
                String(this.g.toFixed(0)) +
                ', ' +
                String(this.b.toFixed(0));
            if (this.a !== undefined || this.a != null) {
                return 'rgba(' + result + ', ' + String(this.a) + ')';
            }
            return 'rgb(' + result + ')';
        }

        /**
         * 返回颜色的 HSLA 表示
         */
        public toHSLA() {
            return HSLColor.fromRGBA(this.r, this.g, this.b, this.a).toString();
        }

        /**
         * 返回颜色的 CSS 字符串表示形式
         */
        public fillStyle() {
            return this.toString();
        }

        /**
         * 返回当前颜色的克隆
         */
        public clone(): Color {
            return new Color(this.r, this.g, this.b, this.a);
        }

        /**
         * Black (#000000)
         */
        public static Black: Color = Color.createFromHex('#000000');

        /**
         * White (#FFFFFF)
         */
        public static White: Color = Color.createFromHex('#FFFFFF');

        /**
         * Gray (#808080)
         */
        public static Gray: Color = Color.createFromHex('#808080');

        /**
         * Light gray (#D3D3D3)
         */
        public static LightGray: Color = Color.createFromHex('#D3D3D3');

        /**
         * Dark gray (#A9A9A9)
         */
        public static DarkGray: Color = Color.createFromHex('#A9A9A9');

        /**
         * Yellow (#FFFF00)
         */
        public static Yellow: Color = Color.createFromHex('#FFFF00');

        /**
         * Orange (#FFA500)
         */
        public static Orange: Color = Color.createFromHex('#FFA500');

        /**
         * Red (#FF0000)
         */
        public static Red: Color = Color.createFromHex('#FF0000');

        /**
         * Vermillion (#FF5B31)
         */
        public static Vermillion: Color = Color.createFromHex('#FF5B31');

        /**
         * Rose (#FF007F)
         */
        public static Rose: Color = Color.createFromHex('#FF007F');

        /**
         * Magenta (#FF00FF)
         */
        public static Magenta: Color = Color.createFromHex('#FF00FF');

        /**
         * Violet (#7F00FF)
         */
        public static Violet: Color = Color.createFromHex('#7F00FF');

        /**
         * Blue (#0000FF)
         */
        public static Blue: Color = Color.createFromHex('#0000FF');

        /**
         * Azure (#007FFF)
         */
        public static Azure: Color = Color.createFromHex('#007FFF');

        /**
         * Cyan (#00FFFF)
         */
        public static Cyan: Color = Color.createFromHex('#00FFFF');

        /**
         * Viridian (#59978F)
         */
        public static Viridian: Color = Color.createFromHex('#59978F');

        /**
         * Green (#00FF00)
         */
        public static Green: Color = Color.createFromHex('#00FF00');

        /**
         * Chartreuse (#7FFF00)
         */
        public static Chartreuse: Color = Color.createFromHex('#7FFF00');

        /**
         * Transparent (#FFFFFF00)
         */
        public static Transparent: Color = Color.createFromHex('#FFFFFF00');
    }

    /**
     * 内部 HSL 颜色表示 
     *
     * http://en.wikipedia.org/wiki/HSL_and_HSV
     * http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
     */
    class HSLColor {
        constructor(
            public h: number,
            public s: number,
            public l: number,
            public a: number
        ) { }

        public static hue2rgb(p: number, q: number, t: number): number {
            if (t < 0) {
                t += 1;
            }
            if (t > 1) {
                t -= 1;
            }
            if (t < 1 / 6) {
                return p + (q - p) * 6 * t;
            }
            if (t < 1 / 2) {
                return q;
            }
            if (t < 2 / 3) {
                return p + (q - p) * (2 / 3 - t) * 6;
            }
            return p;
        }

        public static fromRGBA(
            r: number,
            g: number,
            b: number,
            a: number
        ): HSLColor {
            r /= 255;
            g /= 255;
            b /= 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h = (max + min) / 2;
            let s = h;
            const l = h;

            if (max === min) {
                h = s = 0; // achromatic
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r:
                        h = (g - b) / d + (g < b ? 6 : 0);
                        break;
                    case g:
                        h = (b - r) / d + 2;
                        break;
                    case b:
                        h = (r - g) / d + 4;
                        break;
                }
                h /= 6;
            }

            return new HSLColor(h, s, l, a);
        }

        public toRGBA(): Color {
            let r: number;
            let g: number;
            let b: number;

            if (this.s === 0) {
                r = g = b = this.l; // achromatic
            } else {
                const q =
                    this.l < 0.5
                        ? this.l * (1 + this.s)
                        : this.l + this.s - this.l * this.s;
                const p = 2 * this.l - q;
                r = HSLColor.hue2rgb(p, q, this.h + 1 / 3);
                g = HSLColor.hue2rgb(p, q, this.h);
                b = HSLColor.hue2rgb(p, q, this.h - 1 / 3);
            }

            return new Color(r * 255, g * 255, b * 255, this.a);
        }

        public toString(): string {
            const h = this.h.toFixed(0);
            const s = this.s.toFixed(0);
            const l = this.l.toFixed(0);
            const a = this.a.toFixed(0);
            return `hsla(${h}, ${s}, ${l}, ${a})`;
        }
    }
}