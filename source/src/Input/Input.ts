module es {
    export class TouchState {
        public x = 0;
        public y = 0;
        public touchPoint: number = -1;
        public touchDown: boolean = false;

        public get position() {
            return new Vector2(this.x, this.y);
        }

        public reset() {
            this.x = 0;
            this.y = 0;
            this.touchDown = false;
            this.touchPoint = -1;
        }
    }

    export class Input {
        private static _init: boolean = false;
        private static _previousTouchState: TouchState = new TouchState();
        private static _resolutionOffset: Vector2 = Vector2.zero;
        private static _touchIndex: number = 0;

        private static _gameTouchs: TouchState[] = [];
        private static _mousePosition: Vector2 = new Vector2(-1, -1);

        /**
         * 触摸列表 存放最大个数量触摸点信息
         * 可通过判断touchPoint是否为-1 来确定是否为有触摸
         * 通过判断touchDown 判断触摸点是否有按下
         */
        public static get gameTouchs() {
            return this._gameTouchs;
        }

        private static _resolutionScale: Vector2 = Vector2.one;

        /** 获取缩放值 默认为1 */
        public static get resolutionScale() {
            return this._resolutionScale;
        }

        private static _totalTouchCount: number = 0;

        /** 当前触摸点数量 */
        public static get totalTouchCount() {
            return this._totalTouchCount;
        }

        /** 返回第一个触摸点的坐标 */
        public static get touchPosition() {
            if (!this._gameTouchs[0])
                return Vector2.zero;
            return this._gameTouchs[0].position;
        }

        public static get mousePosition() {
            return this._mousePosition;
        }

        public static _virtualInputs: VirtualInput[] = [];

        /** 获取最大触摸数 */
        public static get maxSupportedTouch(): number {
            return Core.stage.maxTouches;
        }

        /** 获取第一个触摸点距离上次距离的增量 */
        public static get touchPositionDelta() {
            let delta = this.touchPosition.sub(this._previousTouchState.position);
            if (delta.magnitude() > 0) {
                this.setpreviousTouchState(this._gameTouchs[0]);
            }
            return delta;
        }

        public static initialize() {
            if (this._init)
                return;

            this._init = true;
            Input._previousMouseState = new MouseState();
            Input._currentMouseState = new MouseState();

            Core.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.touchBegin, this);
            Core.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.touchMove, this);
            Core.stage.addEventListener(egret.TouchEvent.TOUCH_END, this.touchEnd, this);
            Core.stage.addEventListener(egret.TouchEvent.TOUCH_CANCEL, this.touchEnd, this);
            Core.stage.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, this.touchEnd, this);

            document.addEventListener('mousedown', this.mouseDown.bind(this));
            document.addEventListener('mouseup', this.mouseUp.bind(this));
            document.addEventListener('mousemove', this.mouseMove.bind(this));
            document.addEventListener('mouseleave', this.mouseLeave.bind(this));

            this.initTouchCache();
        }

        public static update() {
            KeyboardUtils.update();
            for (let i = 0; i < this._virtualInputs.length; i++)
                this._virtualInputs[i].update();

            this._previousMouseState = this._currentMouseState.clone();
        }

        public static scaledPosition(position: Vector2) {
            let scaledPos = new Vector2(position.x - this._resolutionOffset.x, position.y - this._resolutionOffset.y);
            return scaledPos.multiply(this.resolutionScale);
        }

        /**
         * 只有在当前帧按下并且在上一帧没有按下时才算press
         * @param key
         */
        public static isKeyPressed(key: Keys): boolean {
            return new List(KeyboardUtils.currentKeys).contains(key) && !new List(KeyboardUtils.previousKeys).contains(key);
        }

        public static isKeyPressedBoth(keyA: Keys, keyB: Keys) {
            return this.isKeyPressed(keyA) || this.isKeyPressed(keyB);
        }

        public static isKeyDown(key: Keys): boolean {
            return new List(KeyboardUtils.currentKeys).contains(key);
        }

        public static isKeyDownBoth(keyA: Keys, keyB: Keys) {
            return this.isKeyDown(keyA) || this.isKeyDown(keyB);
        }

        public static isKeyReleased(key: Keys) {
            return !new List(KeyboardUtils.currentKeys).contains(key) && new List(KeyboardUtils.previousKeys).contains(key);
        }

        public static isKeyReleasedBoth(keyA: Keys, keyB: Keys) {
            return this.isKeyReleased(keyA) || this.isKeyReleased(keyB);
        }

        public static get leftMouseButtonPressed() {
            return this._currentMouseState.leftButton == ButtonState.pressed &&
                this._previousMouseState.leftButton == ButtonState.released;
        }

        public static get rightMouseButtonPressed() {
            return this._currentMouseState.rightButton == ButtonState.pressed &&
                this._previousMouseState.rightButton == ButtonState.released;
        }

        public static get leftMouseButtonDown() {
            return this._currentMouseState.leftButton == ButtonState.pressed;
        }

        public static get leftMouseButtonRelease() {
            return this._currentMouseState.leftButton == ButtonState.released;
        }

        public static get rightMouseButtonDown() {
            return this._currentMouseState.rightButton == ButtonState.pressed;
        }

        public static get rightMouseButtonRelease() {
            return this._currentMouseState.rightButton == ButtonState.released;
        }

        private static _previousMouseState: MouseState;
        private static _currentMouseState: MouseState;

        private static initTouchCache() {
            this._totalTouchCount = 0;
            this._touchIndex = 0;
            this._gameTouchs.length = 0;
            for (let i = 0; i < this.maxSupportedTouch; i++) {
                this._gameTouchs.push(new TouchState());
            }
        }

        private static touchBegin(evt: egret.TouchEvent) {
            if (this._touchIndex < this.maxSupportedTouch) {
                this._gameTouchs[this._touchIndex].touchPoint = evt.touchPointID;
                this._gameTouchs[this._touchIndex].touchDown = evt.touchDown;
                this._gameTouchs[this._touchIndex].x = evt.stageX;
                this._gameTouchs[this._touchIndex].y = evt.stageY;
                if (this._touchIndex == 0) {
                    this.setpreviousTouchState(this._gameTouchs[0]);
                }
                this._touchIndex++;
                this._totalTouchCount++;
            }
        }

        private static touchMove(evt: egret.TouchEvent) {
            if (evt.touchPointID == this._gameTouchs[0].touchPoint) {
                this.setpreviousTouchState(this._gameTouchs[0]);
            }
    
            let touchIndex = this._gameTouchs.findIndex(touch => touch.touchPoint == evt.touchPointID);
            if (touchIndex != -1) {
                let touchData = this._gameTouchs[touchIndex];
                touchData.x = evt.stageX;
                touchData.y = evt.stageY;
            }
        }


        private static touchEnd(evt: egret.TouchEvent) {
            let touchIndex = this._gameTouchs.findIndex(touch => touch.touchPoint == evt.touchPointID);
            if (touchIndex != -1) {
                let touchData = this._gameTouchs[touchIndex];
                touchData.reset();
                if (touchIndex == 0)
                    this._previousTouchState.reset();
                this._totalTouchCount--;
                if (this.totalTouchCount == 0) {
                    this._touchIndex = 0;
                }
            }
        }

        private static mouseDown(event: MouseEvent) {
            if (event.button == 0) {
                this._currentMouseState.leftButton = ButtonState.pressed;
            } else if (event.button == 1) {
                this._currentMouseState.middleButton = ButtonState.pressed;
            } else if (event.button == 2) {
                this._currentMouseState.rightButton = ButtonState.pressed;
            }
        }

        private static mouseUp(event: MouseEvent) {
            if (event.button == 0) {
                this._currentMouseState.leftButton = ButtonState.released;
            } else if (event.button == 1) {
                this._currentMouseState.middleButton = ButtonState.released;
            } else if (event.button == 2) {
                this._currentMouseState.rightButton = ButtonState.released;
            }
        }

        private static mouseMove(event: MouseEvent) {
            this._mousePosition = new Vector2(event.screenX, event.screenY);
        }

        private static mouseLeave(event: MouseEvent) {
            this._mousePosition = new Vector2(-1, -1);
            this._currentMouseState = new MouseState();
        }

        private static setpreviousTouchState(touchState: TouchState) {
            this._previousTouchState = new TouchState();
            this._previousTouchState.x = touchState.position.x;
            this._previousTouchState.y = touchState.position.y;
            this._previousTouchState.touchPoint = touchState.touchPoint;
            this._previousTouchState.touchDown = touchState.touchDown;
        }
    }
}
