module es {
    export class Out<T> {
        public value: T;

        constructor(value: T = null) {
            this.value = value;
        }
    }
}