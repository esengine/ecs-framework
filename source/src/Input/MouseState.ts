module es {
    export enum ButtonState {
        pressed,
        released,
    }
    
    export class MouseState {
        public leftButton: ButtonState = ButtonState.released;
        public middleButton: ButtonState = ButtonState.released;
        public rightButton: ButtonState = ButtonState.released;
    
        public clone() {
            let mouseState = new MouseState();
            mouseState.leftButton = this.leftButton;
            mouseState.middleButton = this.middleButton;
            mouseState.rightButton = this.rightButton;
            return mouseState;
        }
    }
}