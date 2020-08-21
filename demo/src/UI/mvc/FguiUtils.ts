class FguiUtils {
    /** 包的命名空间 */
    public static packageNamespace: any;
    /** 加载fgui资源 */
    public static load(name: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let existPkg = fairygui.UIPackage.getByName(name);
            if (existPkg) {
                resolve();
            }

            RES.loadGroup(name, 0).then(()=>{
                fairygui.UIPackage.addPackage(name);
                if (this.packageNamespace[name][name + "Binder"])
                    this.packageNamespace[name][name + "Binder"].bindAll();

                resolve();
            }).catch(err => {
                console.error("loadfgui error:" + err);
                reject();
            });
        });

    }
}