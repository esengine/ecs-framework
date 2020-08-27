///<reference path="VirtualInput.ts"/>
///<reference path="VirtualIntegerAxis.ts"/>
module es {
    /**
     * 用-1和1之间的浮点数表示的虚拟输入
     */
    export class VirtualAxis extends VirtualInput {
        public nodes: VirtualAxisNode[] = [];

        public get value() {
            for (let i = 0; i < this.nodes.length; i++) {
                let val = this.nodes[i].value;
                if (val != 0)
                    return val;
            }

            return 0;
        }

        constructor(...nodes: VirtualAxisNode[]) {
            super();
            this.nodes.concat(nodes);
        }

        public update() {
            for (let i = 0; i < this.nodes.length; i++)
                this.nodes[i].update();
        }
    }

    export class KeyboardKeys extends VirtualAxisNode {
        public overlapBehavior: OverlapBehavior;
        public positive: Keys;
        public negative: Keys;
        public _value: number = 0;
        public _turned: boolean;

        constructor(overlapBehavior: OverlapBehavior, negative: Keys, positive: Keys) {
            super();
            this.overlapBehavior = overlapBehavior;
            this.negative = negative;
            this.positive = positive;
        }

        public update() {
            if (Input.isKeyDown(this.positive)) {
                if (Input.isKeyDown(this.negative)) {
                    switch (this.overlapBehavior) {
                        default:
                        case es.OverlapBehavior.cancelOut:
                            this._value = 0;
                            break;
                        case es.OverlapBehavior.takeNewer:
                            if (!this._turned) {
                                this._value *= -1;
                                this._turned = true;
                            }
                            break;
                        case es.OverlapBehavior.takeOlder:
                            break;
                    }
                } else {
                    this._turned = false;
                    this._value = 1;
                }
            } else if (Input.isKeyDown(this.negative)) {
                this._turned = false;
                this._value = -1;
            } else {
                this._turned = false;
                this._value = 0;
            }
        }

        public get value(){
            return this._value;
        }
    }
}