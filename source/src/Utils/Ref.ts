module es {
    /**
     * 使得number/string/boolean类型作为对象引用来进行传递
     */
    export class Ref<T extends number | string | boolean> {
        public value: T;

        constructor(value: T){
            this.value = value;
        }
    }
}