declare class fui {}

class ContentManager {
    protected loadedAssets: Map<string, any> = new Map<string, any>();

    /** 异步加载资源 */
    public loadRes(name: string, local: boolean = true): Promise<any> {
        return new Promise((resolve, reject) => {
            let res = this.loadedAssets.get(name);
            if (res) {
                resolve(res);
                return;
            }

            if (local) {
                RES.getResAsync(name).then((data) => {
                    this.loadedAssets.set(name, data);
                    resolve(data);
                }).catch((err) => {
                    console.error("资源加载错误:", name, err);
                    reject(err);
                });
            } else {
                RES.getResByUrl(name).then((data) => {
                    this.loadedAssets.set(name, data);
                    resolve(data);
                }).catch((err) => {
                    console.error("资源加载错误:", name, err);
                    reject(err);
                });
            }
        })
    }

    public dispose() {
        this.loadedAssets.forEach(value => {
            let assetsToRemove = value;
            assetsToRemove.dispose();
        });

        this.loadedAssets.clear();
    }
}