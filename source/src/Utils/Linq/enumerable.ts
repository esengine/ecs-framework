module linq {
    export class Enumerable {
        /**
         * 在指定范围内生成一个整数序列。
         */
        public static range(start: number, count: number): List<number> {
            let result = new List<number>();
            while (count--) {
                result.add(start++)
            }
            return result
        }

        /**
         * 生成包含一个重复值的序列。
         */
        public static repeat<T>(element: T, count: number): List<T> {
            let result = new List<T>();
            while (count--) {
                result.add(element)
            }
            return result
        }
    }
}