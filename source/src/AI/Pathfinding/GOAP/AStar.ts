///<reference path="./AStarStorage.ts" />
module es {
    export class AStarNode implements IEquatable<AStarNode>, IPoolable {
        /**
         * 这个节点的世界状态
         */
        public worldState: WorldState;

        /**
         * 到目前为止的花费
         */
        public costSoFar: number;

        /**
         * 剩余成本的启发式（不要高估！）
         */
        public heuristicCost: number;

        /**
         * costSoFar+heuristicCost(g+h)组合
         */
        public costSoFarAndHeuristicCost: number;

        /**
         * 与此节点相关的动作
         */
        public action: Action;

        /**
         * 父节点
         */
        public parent: AStarNode;

        /**
         * 
         */
        public parentWorldState: WorldState;

        /**
         * 
         */
        public depth: number;

        /**
         * 
         * @param other 
         */
        public equals(other: AStarNode): boolean {
            let care = this.worldState.dontCare ^ -1;
            return (this.worldState.values & care) == (other.worldState.values & care);
        }

        public compareTo(other: AStarNode){
            return this.costSoFarAndHeuristicCost - other.costSoFarAndHeuristicCost;
        }

        public reset(){
            this.action = null;
            this.parent = null;
        }

        public clone(): AStarNode{
            let node = new AStarNode();
            node.action = this.action;
            node.costSoFar = this.costSoFar;
            node.depth = this.depth;
            node.parent = this.parent;
            node.parentWorldState = this.parentWorldState;
            node.heuristicCost = this.heuristicCost;
            node.worldState = this.worldState;
            return node;
        }

        public toString(): string{
            return `[cost: ${this.costSoFar} | heuristic: ${this.heuristicCost}]: ${this.action}`;
        }
    }

    export class AStar {
        public static storage: AStarStorage = new AStarStorage();

        /**
         * 制定达到理想世界状态的行动计划
         * @param ap 
         * @param start 
         * @param goal 
         * @param selectedNodes 
         */
        public static plan(ap: ActionPlanner, start: WorldState, goal: WorldState, selectedNodes: AStarNode[] = null){
            this.storage.clear();

            let currentNode = Pool.obtain<AStarNode>(AStarNode);
            currentNode.worldState = start;
            currentNode.parentWorldState = start;
            currentNode.costSoFar = 0;
            currentNode.heuristicCost = this.calculateHeuristic(start, goal);
            currentNode.costSoFarAndHeuristicCost = currentNode.costSoFar + currentNode.heuristicCost;
            currentNode.depth = 1;

            this.storage.addToOpenList(currentNode);

            while(true){
                // 无路可走，无路可寻
                if (!this.storage.hasOpened()){
                    this.storage.clear();
                    return null;
                }

                currentNode = this.storage.removeCheapestOpenNode();

                this.storage.addToClosedList(currentNode);

                // 全部完成。 我们达到了我们的目标
                if (goal.equals(currentNode.worldState)){
                    let plan = this.reconstructPlan(currentNode, selectedNodes);
                    this.storage.clear();
                    return plan;
                }

                let neighbors = ap.getPossibleTransitions(currentNode.worldState);
                for (let i = 0; i < neighbors.length; i++){
                    let cur = neighbors[i];
                    let opened = this.storage.findOpened(cur);
                    let closed = this.storage.findClosed(cur);
                    let cost = currentNode.costSoFar + cur.costSoFar;

                    // 如果neighbors处于open状态，且成本小于g(neighbors)。
                    if (opened != null && cost < opened.costSoFar){
                        // 将neighbors从OPEN中移除，因为新的路径更好。
                        this.storage.removeOpened(opened);
                        opened = null;
                    }

                    // 如果neighbors在CLOSED，且成本小于g(neighbors)
                    if (closed != null && cost < closed.costSoFar){
                        // 从CLOSED中删除neighbors
                        this.storage.removeClosed(closed);
                    }

                    // 如果neighbors不在OPEN，neighbors不在CLOSED。
                    if (opened == null && closed == null){
                        let nb = Pool.obtain<AStarNode>(AStarNode);
                        nb.worldState = cur.worldState;
                        nb.costSoFar = cost;
                        nb.heuristicCost = this.calculateHeuristic(cur.worldState, goal);
                        nb.costSoFarAndHeuristicCost = nb.costSoFar + nb.heuristicCost;
                        nb.action = cur.action;
                        nb.parentWorldState = currentNode.worldState;
                        nb.parent = currentNode;
                        nb.depth = currentNode.depth + 1;
                        this.storage.addToOpenList(nb);
                    }
                }

                ListPool.free<AStarNode>(neighbors);
            }
        }

        /**
         * 内部函数，通过从最后一个节点到初始节点的追踪来重建计划。
         * @param goalNode 
         * @param selectedNodes 
         */
        public static reconstructPlan(goalNode: AStarNode, selectedNodes: AStarNode[]){
            let totalActionsInPlan = goalNode.depth - 1;
            let plan: Action[] = new Array(totalActionsInPlan);

            let curnode = goalNode;
            for (let i = 0; i <= totalActionsInPlan - 1; i ++){
                // 如果我们被传递了一个节点，可以选择将该节点添加到列表中
                if (selectedNodes != null)
                    selectedNodes.push(curnode.clone());
                plan.push(curnode.action);
                curnode = curnode.parent;
            }

            // 我们的节点从目标回到了起点，所以把它们反过来。
            if (selectedNodes != null)
                selectedNodes.reverse();

            return plan;
        }

        /**
         * 
         * @param fr 
         * @param to 
         */
        public static calculateHeuristic(fr: WorldState, to: WorldState){
            let care = (to.dontCare ^ -1);
            let diff = (fr.values & care) ^ (to.values & care);
            let dist = 0;

            for (let i = 0; i < ActionPlanner.MAX_CONDITIONS; ++i)
                if ((diff & (1 << i)) != 0)
                    dist ++;
            return dist;
        }
    }
}