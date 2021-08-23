module es {
    export class ContentManager {
        _loadedAssets: Map<string, object> = new Map();

        public loadTexture(name: string): Promise<egret.Texture> {
            return new Promise((resolve, reject)=>{
                const asset = this._loadedAssets.get(name);
                if (asset) {
                    return resolve(asset as egret.Texture);
                }
    
                RES.addEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, (event: RES.ResourceEvent)=>{
                    reject(`资源:${event.resItem.name}加载失败`);
                }, this);
                RES.getResAsync(name, (texture)=>{
                    resolve(texture as egret.Texture);
                }, this);
            });
        }
    }
}