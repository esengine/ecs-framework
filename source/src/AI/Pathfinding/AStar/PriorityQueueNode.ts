module es {
    export class PriorityQueueNode {
        /**
         * 插入此节点的优先级。在将节点添加到队列之前必须设置
         */
        public priority: number = 0;
        /**
         * 由优先级队列使用-不要编辑此值。表示插入节点的顺序
         */
        public insertionIndex: number = 0;
        /**
         * 由优先级队列使用-不要编辑此值。表示队列中的当前位置
         */
        public queueIndex: number = 0;
    }
}
