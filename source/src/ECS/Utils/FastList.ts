module es {
    /**
     * 围绕一个数组的非常基本的包装，当它达到容量时自动扩展。
     * 注意，在迭代时应该这样直接访问缓冲区，但使用FastList.length字段。
     * 
     * @tutorial 
     * for( var i = 0; i <= list.length; i++ ) 
     *      var item = list.buffer[i];
     */
    export class FastList<T> {
        /**
         * 直接访问后备缓冲区。
         * 不要使用buffer.Length! 使用FastList.length
         */
        public buffer: T[];

        /**
         * 直接访问缓冲区内填充项的长度。不要改变。
         */
        public length: number = 0;

        constructor(size: number = 5) {
            this.buffer = new Array(size);
        }

        /**
         * 清空列表并清空缓冲区中的所有项目
         */
        public clear() {
            this.buffer.length = 0;
            this.length = 0;
        }

        /**
         *  和clear的工作原理一样，只是它不会将缓冲区中的所有项目清空。
         */
        public reset() {
            this.length = 0;
        }

        /**
         * 将该项目添加到列表中
         * @param item 
         */
        public add(item: T) {
            if (this.length == this.buffer.length)
                this.buffer.length = Math.max(this.buffer.length << 1, 10);
            this.buffer[this.length++] = item;
        }

        /**
         * 从列表中删除该项目
         * @param item 
         */
        public remove(item: T){
            let comp = EqualityComparer.default<T>();
            for (let i = 0; i < this.length; ++i){
                if (comp.equals(this.buffer[i], item)){
                    this.removeAt(i);
                    return;
                }
            }
        }

        /**
         * 从列表中删除给定索引的项目。
         * @param index 
         */
        public removeAt(index: number){
            if (index >= this.length)
                throw new Error("index超出范围！");

            this.length --;
            this.buffer.removeAt(index);
        }

        /**
         * 检查项目是否在FastList中
         * @param item 
         */
        public contains(item: T){
            let comp = EqualityComparer.default<T>();
            for (let i = 0; i < this.length; ++ i){
                if (comp.equals(this.buffer[i], item))
                    return true;
            }

            return false;
        }

        /**
         * 如果缓冲区达到最大，将分配更多的空间来容纳额外的ItemCount。
         * @param additionalItemCount 
         */
        public ensureCapacity(additionalItemCount: number = 1){
            if (this.length + additionalItemCount >= this.buffer.length)
                this.buffer.length = Math.max(this.buffer.length << 1, this.length + additionalItemCount);
        }

        /**
         * 添加数组中的所有项目
         * @param array 
         */
        public addRange(array: T[]){
            for (let item of array)
                this.add(item);
        }

        /**
         * 对缓冲区中的所有项目进行排序，长度不限。
         */
        public sort(comparer: IComparer<T>){
            this.buffer.sort(comparer.compare);
        }
    }
}