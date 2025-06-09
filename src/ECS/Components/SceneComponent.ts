import type { Scene } from '../Scene';

/**
 * 场景组件基类
 * 附加到场景的组件，用于实现场景级别的功能
 */
export class SceneComponent {
    /** 组件所属的场景 */
    public scene!: Scene;
    /** 更新顺序 */
    public updateOrder: number = 0;
    /** 是否启用 */
    private _enabled: boolean = true;

    /** 获取是否启用 */
    public get enabled(): boolean {
        return this._enabled;
    }

    /** 设置是否启用 */
    public set enabled(value: boolean) {
        if (this._enabled !== value) {
            this._enabled = value;
            if (this._enabled) {
                this.onEnabled();
            } else {
                this.onDisabled();
            }
        }
    }

    /**
     * 当组件启用时调用
     */
    public onEnabled(): void {
    }

    /**
     * 当组件禁用时调用
     */
    public onDisabled(): void {
    }

    /**
     * 当组件从场景中移除时调用
     */
    public onRemovedFromScene(): void {
    }

    /**
     * 每帧更新
     */
    public update(): void {
    }

    /**
     * 比较组件的更新顺序
     * @param other 其他组件
     * @returns 比较结果
     */
    public compare(other: SceneComponent): number {
        return this.updateOrder - other.updateOrder;
    }
}