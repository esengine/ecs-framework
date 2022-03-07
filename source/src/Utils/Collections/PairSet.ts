module es {
    export class PairSet<T> {
        public get all(): Array<Pair<T>> {
            return this._all;
        }

        public has(pair: Pair<T>) {
            const index = this._all.findIndex(p => p.equals(pair));
            return index > -1;
        }

        public add(pair: Pair<T>) {
            if (!this.has(pair)) {
                this._all.push(pair);
            }
        }

        public remove(pair: Pair<T>) {
            const index = this._all.findIndex(p => p.equals(pair));
            if (index > -1) {
                const temp = this._all[index];
                this._all[index] = this._all[this._all.length - 1];
                this._all[this._all.length - 1] = temp;
                this._all = this._all.slice(0, this._all.length - 1);
            }
        }

        public clear() {
            this._all = [];
        }

        public union(other: PairSet<T>) {
            const otherAll = other.all;

            if (otherAll.length > 0)
                for (let i = 0; i < otherAll.length; i ++) {
                    const elem = otherAll[i];
                    this.add(elem);
                }
        }

        public except(other: PairSet<T>) {
            const otherAll = other.all;

            if (otherAll.length > 0)
            for (let i = 0; i < otherAll.length; i ++) {
                const elem = otherAll[i];
                this.remove(elem);
            }
        }

        private _all: Array<Pair<T>> = new Array<Pair<T>>();
    }
}