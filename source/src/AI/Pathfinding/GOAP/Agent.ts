module es {
    /**
     * Agent提供了一个简单明了的方式来使用计划书。
     * 它根本不需要使用，因为它只是ActionPlanner的一个方便的封装器，使其更容易获得计划和存储结果。
     */
    export abstract class Agent {
        public actions: Action[];
        public _planner: ActionPlanner;

        constructor(){
            this._planner = new ActionPlanner();
        }

        public plan(debugPlan: boolean = false){
            let nodes: AStarNode[] = null;
            if (debugPlan)
                nodes = [];
            this.actions = this._planner.plan(this.getWorldState(), this.getGoalState(), nodes);

            if (nodes != null && nodes.length > 0){
                console.log("---- ActionPlanner plan ----");
                console.log(`plan cost = ${nodes[nodes.length - 1].costSoFar}`);
                console.log(`${"               start"}\t${this.getWorldState().describe(this._planner)}`);
                for (let i = 0; i < nodes.length; i++){
                    console.log(`${i}: ${nodes[i].action.name}\t${nodes[i].worldState.describe(this._planner)}`);
                    Pool.free<AStarNode>(nodes[i]);
                }
            }

            return this.hasActionPlan();
        }

        public hasActionPlan(){
            return this.actions != null && this.actions.length > 0;
        }

        public abstract getWorldState(): WorldState;

        public abstract getGoalState(): WorldState;
    }
}