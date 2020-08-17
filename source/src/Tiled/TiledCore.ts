module es {
    export class TmxDocument {
        public tmxDirectory: string;
        constructor(){
            this.tmxDirectory = "resource/assets/";
        }
    }

    export interface ITmxElement {
        name: string;
    }

    export class TmxImage {
        public texture: egret.Bitmap;
        public bitmap: egret.SpriteSheet;
        public source: string;
        public format: string;
        public data: any;
        public trans: number;
        public width: number;
        public height: number;

        public dispose(){
            if (this.bitmap){
                this.bitmap.dispose();
                this.bitmap = null;
            }
        }
    }
}