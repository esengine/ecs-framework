module es {
    export class AStarStorage {
        /**
         * 我们可以存储的最大节点数
         */
        public static readonly MAX_NODES = 128;

        public _opened: AStarNode[] = new Array(AStarStorage.MAX_NODES);
        public _closed: AStarNode[] = new Array(AStarStorage.MAX_NODES);
        public _numOpened: number;
        public _numClosed: number;
        
        public _lastFoundOpened: number;
        public _lastFoundClosed: number;

        constructor(){}

        public clear(){
            for (let i = 0; i < this._numOpened; i ++){
                Pool.free<AStarNode>(this._opened[i]);
                this._opened[i] = null;
            }

            for (let i = 0; i < this._numClosed; i ++){
                Pool.free<AStarNode>(this._closed[i]);
                this._closed[i] = null;
            }

            this._numOpened = this._numClosed = 0;
            this._lastFoundClosed = this._lastFoundOpened = 0;
        }

        public findOpened(node: AStarNode): AStarNode {
            for (let i = 0; i < this._numOpened; i ++){
                let care = node.worldState.dontCare ^ -1;
                if ((node.worldState.values & care) == (this._opened[i].worldState.values & care)){
                    this._lastFoundClosed = i;
                    return this._closed[i];
                }
            }

            return null;
        }

        public findClosed(node: AStarNode): AStarNode {
            for (let i = 0; i < this._numClosed; i ++){
                let care = node.worldState.dontCare ^ -1;
                if ((node.worldState.values & care) == (this._closed[i].worldState.values & care)){
                    this._lastFoundClosed = i;
                    return this._closed[i];
                }
            }

            return null;
        }

        public hasOpened(): boolean {
            return this._numOpened > 0;
        }

        public removeOpened(node: AStarNode){
            if (this._numOpened > 0)
                this._opened[this._lastFoundOpened] = this._opened[this._numOpened - 1];
            this._numOpened --;
        }

        public removeClosed(node: AStarNode) {
            if (this._numClosed > 0)
                this._closed[this._lastFoundClosed] = this._closed[this._numClosed - 1];
            this._numClosed--;
        }

        public isOpen(node: AStarNode): boolean{
            return this._opened.indexOf(node) > -1;
        }

        public isClosed(node: AStarNode): boolean {
            return this._closed.indexOf(node) > -1;
        }

        public addToOpenList(node: AStarNode){
            this._opened[this._numOpened++] = node;
        }

        public addToClosedList(node: AStarNode){
            this._closed[this._numClosed++] = node;
        }

        /**
         * 
         */
        public removeCheapestOpenNode(): AStarNode {
            let lowestVal = Number.MAX_VALUE;
            this._lastFoundOpened = -1;
            for (let i = 0; i < this._numOpened; i ++){
                if (this._opened[i].costSoFarAndHeuristicCost < lowestVal){
                    lowestVal = this._opened[i].costSoFarAndHeuristicCost;
                    this._lastFoundOpened = i;
                }
            }

            var val = this._opened[this._lastFoundOpened];
            this.removeOpened(val);
            return val;
        }
    }
}