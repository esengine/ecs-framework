module es {
    export class Hash {
        /**
         * 从一个字节数组中计算一个哈希值
         * @param data 
         */
        public static computeHash(...data: number[]) {
            const p: number = 16777619;
            let hash = 2166136261;

            for (let i = 0; i < data.length; i++)
                hash = (hash ^ data[i]) * p;

            hash += hash << 13;
            hash ^= hash >> 7;
            hash += hash << 3;
            hash ^= hash >> 17;
            hash += hash << 5;
            return hash;
        }
    }
}