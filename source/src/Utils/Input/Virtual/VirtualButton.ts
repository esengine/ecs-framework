///<reference path="./VirtualInput.ts" />
module es {
    /**
     * 用布尔值表示的虚拟输入。除了简单地检查当前按钮状态，
     * 您还可以询问它是否刚刚被按下或释放了这个框架。
     * 您还可以将按下的按钮存储在缓冲区中一段有限的时间，或者直到调用consumeBuffer()将其使用为止。
     */
    export class VirtualButton extends VirtualInput{
        public nodes: Node[] = [];
        public bufferTime: number = 0;
        public firstRepeatTime: number = 0;
        public mutiRepeatTime: number = 0;
        public isRepeating: boolean;

        public _bufferCounter: number = 0;
        public _repeatCounter: number = 0;
        public _willRepeat: boolean;

        constructor(bufferTime: number = 0, ...nodes: Node[]){
            super();
            this.nodes = nodes;
            this.bufferTime = bufferTime;
        }

        public setRepeat(firstRepeatTime: number, mutiRepeatTime: number = firstRepeatTime){
            this.firstRepeatTime = firstRepeatTime;
            this.mutiRepeatTime = mutiRepeatTime;
            this._willRepeat = this.firstRepeatTime > 0;
            if (!this._willRepeat)
                this.isRepeating = false;
        }

        public update() {
            this._bufferCounter -= Time.unscaledDeltaTime;
            this.isRepeating = false;

            let check = false;
            for (let i = 0; i < this.nodes.length; i ++){
                this.nodes[i].update();
                if (this.nodes[i].isPressed){
                    this._bufferCounter = this.bufferTime;
                    check = true;
                }else if(this.nodes[i].isDown){
                    check = true;
                }
            }

            if (!check){
                this._repeatCounter = 0;
                this._bufferCounter = 0;
            }else if(this._willRepeat){
                if (this._repeatCounter == 0){
                    this._repeatCounter = this.firstRepeatTime;
                }else{
                    this._repeatCounter -= Time.unscaledDeltaTime;
                    if (this._repeatCounter <= 0){
                        this.isRepeating = true;
                        this._repeatCounter = this.mutiRepeatTime;
                    }
                }
            }
        }

        public get isDown(){
            for (let node of this.nodes){
                if (node.isDown)
                    return true;
            }

            return false;
        }

        public get isPressed(){
            if (this._bufferCounter > 0 || this.isRepeating)
                return true;

            for (let node of this.nodes){
                if (node.isPressed)
                    return true;
            }

            return false;
        }

        public get isReleased(){
            for (let node of this.nodes){
                if (node.isReleased)
                    return true;
            }
            return false;
        }

        public consumeBuffer(){
            this._bufferCounter = 0;
        }

        /**
         * 添加一个键盘键到这个虚拟按钮
         * @param key
         */
        public addKeyboardKey(key: Keys): VirtualButton{
            this.nodes.push(new KeyboardKey(key));
            return this;
        }
    }

    export abstract class Node extends VirtualInputNode {
        public abstract isDown: boolean;
        public abstract isPressed: boolean;
        public abstract isReleased: boolean;
    }

    export class KeyboardKey extends Node {
        public key: Keys;

        constructor(key: Keys){
            super();

            this.key = key;
        }

        public get isDown(){
            return Input.isKeyDown(this.key);
        }

        public get isPressed(){
            return Input.isKeyPressed(this.key);
        }

        public get isReleased(){
            return Input.isKeyReleased(this.key);
        }
    }
}