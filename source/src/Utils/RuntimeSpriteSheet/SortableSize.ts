module es {
    /**
     * 用于根据维度对插入的矩形进行排序
     */
    export class SortableSize {
        public width: number;
        public height: number;
        public id: number;

        constructor(width: number, height: number, id: number){
            this.width = width;
            this.height = height;
            this.id = id;
        }
    }
}