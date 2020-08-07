module es {
    export interface IWeightedGraph<T> {
        /**
         *
         * @param node
         */
        getNeighbors(node: T): T[];

        /**
         *
         * @param from
         * @param to
         */
        cost(from: T, to: T): number;
    }
}
