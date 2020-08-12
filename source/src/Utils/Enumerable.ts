module es {
    export class Enumerable {
        /**
         * 生成包含一个重复值的序列
         * @param element 要重复的值
         * @param count 在生成的序列中重复该值的次数
         */
        public static repeat<T>(element: T, count: number){
            let result = [];
            while (count--) {
                result.push(element)
            }
            return result;
        }
    }
}