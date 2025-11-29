/**
 * 全局管理器的基类。所有全局管理器都应该从此类继承。
 */
export class GlobalManager {
    private _enabled: boolean = false;

    /**
     * 获取或设置管理器是否启用
     */
    public get enabled() {
        return this._enabled;
    }

    public set enabled(value: boolean) {
        this.setEnabled(value);
    }

    /**
     * 设置管理器是否启用
     * @param isEnabled 如果为true，则启用管理器；否则禁用管理器
     */
    public setEnabled(isEnabled: boolean) {
        if (this._enabled != isEnabled) {
            this._enabled = isEnabled;
            if (this._enabled) {
                // 如果启用了管理器，则调用onEnabled方法
                this.onEnabled();
            } else {
                // 如果禁用了管理器，则调用onDisabled方法
                this.onDisabled();
            }
        }
    }

    /**
     * 在启用管理器时调用的回调方法
     */
    protected onEnabled() {
    }

    /**
     * 在禁用管理器时调用的回调方法
     */
    protected onDisabled() {
    }

    /**
     * 更新管理器状态的方法
     */
    public update() {
    }
}
