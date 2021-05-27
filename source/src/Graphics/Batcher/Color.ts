module es {
    export class Color {
        public a: number = 255;
        public r: number = 255;
        public g: number = 255;
        public b: number = 255;
        
        constructor(r: number, g: number, b: number, a: number = 255) {
            this.a = a;
            this.r = r;
            this.g = g;
            this.b = b;
        }
    }
}