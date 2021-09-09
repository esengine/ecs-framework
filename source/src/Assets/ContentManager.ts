module es {
    export interface IDisposable {
        dispose();
    }

    export class ContentManager {
        private _loadedAssets: Map<string, any> = new Map();
        private _disposableAssets: IDisposable[] = [];
        private _disposed: boolean = false;

        private static contentManagers: WeakSet<ContentManager> = new WeakSet();

        constructor() {
            ContentManager.addContentManager(this);

            RES.addEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.itemLoadError, this);
        }

        public getResAsync<T>(name: string): Promise<T> {
            return new Promise((resolve)=>{
                const asset = this._loadedAssets.get(name);
                if (asset) {
                    return resolve(asset as T);
                }
    
                RES.getResAsync(name, (texture)=>{
                    const result = texture as T;
                    if (texture != null) {
                        this._loadedAssets.set(name, result);
                    }
                    resolve(result);
                }, this);
            });
        }

        public getRes<T>(name: string) {
            const asset = this._loadedAssets.get(name);
            if (asset) {
                return asset as T;
            }

            const result = RES.getRes(name) as T;
            if (result != null) {
                this._loadedAssets.set(name, result);
            }
            return result;
        }

        public unloadAsset(assetName: string) {
            if (StringUtils.isNullOrEmpty(assetName)) {
                throw new Error("assetName 错误的参数");
            }

            if (this._disposed) {
                throw new Error("contentManager 已经被销毁");
            }

            let asset = this._loadedAssets.get(assetName);
            if (asset && typeof(asset['dispose']) == 'function') {
                let disposable = asset as IDisposable;
                if (disposable != null) {
                    disposable.dispose();
                    new List(this._disposableAssets).remove(disposable);
                }

                this._loadedAssets.delete(assetName);
            }
        }

        private static addContentManager(contentManager: ContentManager) {
            let contains = false;
            if (this.contentManagers.has(contentManager)) {
                contains = true;
                this.contentManagers.delete(contentManager);
            }

            if (!contains) {
                this.contentManagers.add(contentManager);
            }
        }

        private static removeContentManager(contentManager: ContentManager) {
            if (this.contentManagers.has(contentManager)) {
                this.contentManagers.delete(contentManager);
            }
        }

        public dispose() {
            if (!this._disposed) {
                this.unload();
                this._disposed = true;
            }

            ContentManager.removeContentManager(this);
        }

        public unload() {
            RES.removeEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.itemLoadError, this);

            for (let dispoable of this._disposableAssets) {
                if (dispoable != null)
                    dispoable.dispose();
            }

            this._disposableAssets.length = 0;
            this._loadedAssets.clear();
        }

        private itemLoadError(event: RES.ResourceEvent) {
            Debug.error(`资源:${event.resItem.name}加载失败`);
        }
    }
}