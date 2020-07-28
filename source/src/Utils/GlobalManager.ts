module es {
    export class GlobalManager {
        public _enabled: boolean;

        /**
         * 如果true则启用了GlobalManager。
         * 状态的改变会导致调用OnEnabled/OnDisable
         */
        public get enabled() {
            return this._enabled;
        }

        /**
         * 如果true则启用了GlobalManager。
         * 状态的改变会导致调用OnEnabled/OnDisable
         * @param value
         */
        public set enabled(value: boolean) {
            this.setEnabled(value);
        }

        /**
         * 启用/禁用这个GlobalManager
         * @param isEnabled
         */
        public setEnabled(isEnabled: boolean) {
            if (this._enabled != isEnabled) {
                this._enabled = isEnabled;
                if (this._enabled) {
                    this.onEnabled();
                } else {
                    this.onDisabled();
                }
            }
        }

        /**
         * 此GlobalManager启用时调用
         */
        public onEnabled() {
        }

        /**
         * 此GlobalManager禁用时调用
         */
        public onDisabled() {
        }

        /**
         * 在frame .update之前调用每一帧
         */
        public update() {
        }
    }
}
