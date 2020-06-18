class GlobalManager {
    public static globalManagers: GlobalManager[] = [];
    private _enabled: boolean;

    public get enabled(){
        return this._enabled;
    }
    public set enabled(value: boolean){
        this.setEnabled(value);
    }
    public setEnabled(isEnabled: boolean){
        if (this._enabled != isEnabled){
            this._enabled = isEnabled;
            if (this._enabled){
                this.onEnabled();
            } else {
                this.onDisabled();
            }
        }
    }

    public onEnabled(){}

    public onDisabled(){}

    public update(){}

    public static registerGlobalManager(manager: GlobalManager){
        this.globalManagers.push(manager);
        manager.enabled = true;
    }

    public static unregisterGlobalManager(manager: GlobalManager){
        this.globalManagers.remove(manager);
        manager.enabled = false;
    }

    public static getGlobalManager<T extends GlobalManager>(type){
        for (let i = 0; i < this.globalManagers.length; i ++){
            if (this.globalManagers[i] instanceof type)
                return this.globalManagers[i] as T;
        }

        return null;
    }
}