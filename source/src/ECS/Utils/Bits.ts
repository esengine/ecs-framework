module es {
    export class Bits {
        private _bit: {[index: number]: number} = {};

        public set(index: number, value: number) {
            this._bit[index] = value;
        }

        public get(index: number): number {
            let v = this._bit[index];
            return v == null ? 0 : v;
        }
    }
}