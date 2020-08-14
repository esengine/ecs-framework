module es {
    export class TextureToPack {
        public texture: egret.Texture;
        public id: string;

        constructor(texture: egret.Texture, id: string){
            this.texture = texture;
            this.id = id;
        }
    }
}