module es {
    export class TextureAssets {
        public assets: TextureAsset[];
        constructor(assets: TextureAsset[]){
            this.assets = assets;
        }
    }

    export class TextureAsset {
        public x: number;
        public y: number;
        public width: number;
        public height: number;
        public name: string;
    }
}