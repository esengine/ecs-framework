module es {
    export class ContentManager {
        _loadedAssets: Map<string, object> = new Map();

        public loadTexture(name: string): Promise<cc.Texture2D> {
            return new Promise((resolve, reject)=>{
                const asset = this._loadedAssets.get(name);
                if (asset) {
                    return resolve(asset as cc.Texture2D);
                }

                cc.resources.load(name, cc.Texture2D, (err, assets)=>{
                    if (err == null) {
                        resolve(assets as cc.Texture2D);
                    } else {
                        reject(`资源加载失败: ${err}`);
                    }
                });
            });
        }
    }
}