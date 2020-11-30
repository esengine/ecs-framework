module es {
    export class SceneComponent implements IComparer<SceneComponent> {
        /**
         * 这个场景组件被附加到的场景
         */
        public scene: Scene;

        /**
         * 如果启用了SceneComponent，则为true。状态的改变会导致调用onEnabled/onDisable。
         */
        public get enabled(){
            return this._enabled;
        }

        /**
         * 如果启用了SceneComponent，则为true。状态的改变会导致调用onEnabled/onDisable。
         * @param value
         */
        public set enabled(value: boolean){
            this.setEnabled(value);
        }

        /**
         * 更新此场景中SceneComponents的顺序
         */
        public updateOrder: number = 0;

        public _enabled: boolean = true;

        /**
         * 在启用此SceneComponent时调用
         */
        public onEnabled(){
        }

        /**
         * 当禁用此SceneComponent时调用
         */
        public onDisabled(){
        }

        /**
         * 当该SceneComponent从场景中移除时调用
         */
        public onRemovedFromScene(){
        }

        /**
         * 在实体更新之前每一帧调用
         */
        public update(){
        }

        /**
         * 启用/禁用这个SceneComponent
         * @param isEnabled
         */
        public setEnabled(isEnabled: boolean): SceneComponent{
            if (this._enabled != isEnabled){
                this._enabled = isEnabled;

                if (this._enabled){
                    this.onEnabled();
                }else{
                    this.onDisabled();
                }
            }

            return this;
        }

        /**
         * 设置SceneComponent的updateOrder并触发某种SceneComponent
         * @param updateOrder
         */
        public setUpdateOrder(updateOrder: number){
            if (this.updateOrder != updateOrder){
                this.updateOrder = updateOrder;
                Core.scene._sceneComponents.sort(this);
            }

            return this;
        }

        public compare(other: SceneComponent): number{
            return this.updateOrder - other.updateOrder;
        }
    }
}