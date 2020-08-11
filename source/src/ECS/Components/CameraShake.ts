module es {
    export class CameraShake extends Component {
        public _shakeDirection: Vector2 = Vector2.zero;
        public _shakeOffset: Vector2 = Vector2.zero;
        public _shakeIntensity = 0;
        public _shakeDegredation = 0.95;

        /**
         * 如果震动已经在运行，只有震动强度>当前shakeIntensity, 将覆盖当前值
         * 如果shake当前不是活动的，它将被启动。
         * @param shakeIntensify 震动强度
         * @param shakeDegredation 较高的值会导致更快的停止震动
         * @param shakeDirection 0只会导致x/y轴上的振动。任何其他的值将导致通过在抖动方向*强度是相机移动偏移
         */
        public shake(shakeIntensify = 15, shakeDegredation = 0.9, shakeDirection = Vector2.zero){
            this.enabled = true;
            if (this._shakeIntensity < shakeIntensify) {
                this._shakeDirection = shakeDirection;
                this._shakeIntensity = shakeIntensify;
                if (shakeDegredation < 0 || shakeDegredation >= 1){
                    shakeDegredation = 0.95;
                }

                this._shakeDegredation = shakeDegredation;
            }
        }

        public update() {
            if (Math.abs(this._shakeIntensity) > 0){
                this._shakeOffset = this._shakeDirection;
                if (this._shakeOffset.x != 0 || this._shakeOffset.y != 0){
                    this._shakeOffset.normalize();
                }else{
                    this._shakeOffset.x = this._shakeOffset.x + Math.random() - 0.5;
                    this._shakeOffset.y = this._shakeOffset.y + Math.random() - 0.5;
                }

                // TODO: 这需要乘相机变焦
                this._shakeOffset.multiply(new Vector2(this._shakeIntensity));
                this._shakeIntensity *= -this._shakeDegredation;
                if (Math.abs(this._shakeIntensity) <= 0.01){
                    this._shakeIntensity = 0;
                    this.enabled = false;
                }
            }

            this.entity.scene.camera.position.add(this._shakeOffset);
        }
    }
}