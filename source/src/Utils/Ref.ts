module es {
    export class Ref<T> {
        public value: T;

        constructor(value: T) {
            this.value = value;
        }
    }
}