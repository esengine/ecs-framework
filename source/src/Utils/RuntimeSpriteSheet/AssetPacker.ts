module es {
    import Bitmap = egret.Bitmap;

    export class AssetPacker {
        protected itemsToRaster: TextureToPack[] = [];
        public onProcessCompleted: Function;
        public useCache: boolean = false;
        public cacheName: string = "";

        protected _sprites: Map<string, egret.Texture> = new Map<string, egret.Texture>();
        protected allow4096Textures = false;

        public addTextureToPack(texture: egret.Texture, customID: string){
            this.itemsToRaster.push(new TextureToPack(texture, customID));
        }

        public async process(allow4096Textures: boolean = false){
            this.allow4096Textures = allow4096Textures;
            if (this.useCache){
                if (this.cacheName == "") {
                    console.error("未指定缓存名称");
                    return;
                }

                let cacheExist = await RES.getResByUrl(this.cacheName);

                if (!cacheExist)
                    this.createPack();
                else
                    this.loadPack();
            }else{
                this.createPack();
            }
        }

        protected async loadPack() {
            let loaderTexture = await RES.getResByUrl(this.cacheName);
            if (this.onProcessCompleted) this.onProcessCompleted();
            return loaderTexture;
        }

        protected createPack(){
            let textures: egret.Bitmap[] = [];
            let images = [];

            for (let itemToRaster of this.itemsToRaster){
                textures.push(new Bitmap(itemToRaster.texture));
                images.push(itemToRaster.id);
            }

            let textureSize = this.allow4096Textures ? 4096 : 2048;

            let rectangles = [];
            for (let i = 0; i < textures.length; i ++){
                if (textures[i].width > textureSize || textures[i].height > textureSize){
                    throw new Error("一个纹理的大小比图集的大小大");
                }else{
                    rectangles.push(new Rectangle(0, 0, textures[i].width, textures[i].height));
                }
            }

            const padding = 1;
            let numSpriteSheet = 0;
            while (rectangles.length > 0){
                let texture = new egret.RenderTexture();

                let packer: RectanglePacker = new RectanglePacker(textureSize, textureSize, padding);
                for (let i = 0; i < rectangles.length; i ++)
                    packer.insertRectangle(Math.floor(rectangles[i].width), Math.floor(rectangles[i].height), i);

                packer.packRectangles();

                if (packer.rectangleCount > 0){
                    let rect = new IntegerRectangle();
                    let textureAssets: TextureAsset[] = [];
                    let garbageRect: Rectangle[] = [];
                    let garabeTextures: egret.Texture[] = [];
                    let garbageImages: string[] = [];

                    for (let j = 0; j < packer.rectangleCount; j ++){
                        rect = packer.getRectangle(j, rect);
                        let index = packer.getRectangleId(j);
                        texture.drawToTexture(textures[index], new Rectangle(rect.x, rect.y, rect.width, rect.height));

                        let textureAsset: TextureAsset = new TextureAsset();
                        textureAsset.x = rect.x;
                        textureAsset.y = rect.y;
                        textureAsset.width = rect.width;
                        textureAsset.height = rect.height;
                        textureAsset.name = images[index];

                        textureAssets.push(textureAsset);

                        garbageRect.push(rectangles[index]);
                        garabeTextures.push(textures[index].texture);
                        garbageImages.push(images[index]);
                    }

                    for (let garbage of garbageRect)
                        rectangles.remove(garbage);

                    for (let garbage of garabeTextures)
                        textures.removeAll(a => {return a.texture.hashCode == garbage.hashCode});

                    for (let garbage of garbageImages)
                        images.remove(garbage);

                    if (this.cacheName != ""){
                        texture.saveToFile("image/png", this.cacheName);
                        ++ numSpriteSheet;
                    }

                    for (let textureAsset of textureAssets)
                        this._sprites.set(textureAsset.name, texture);
                }
            }

            if (this.onProcessCompleted) this.onProcessCompleted();
        }

        public dispose(){
            this._sprites.forEach((asset, name) => {
                asset.dispose();
                RES.destroyRes(name);
            });
            this._sprites.clear();
        }

        public getTexture(id: string){
            return this._sprites.get(id);
        }
    }
}