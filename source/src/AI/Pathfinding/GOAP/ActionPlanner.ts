module es {
    export class ActionPlanner {
        public static readonly MAX_CONDITIONS: number = 64;

        /**
         * 与所有世界状态原子相关的名称
         */
        public conditionNames: string[] = new Array(ActionPlanner.MAX_CONDITIONS);

        public _actions: Action[] = [];
        public _viableActions: Action[] = [];

        /**
         * 所有行动的前提条件
         */
        public _preConditions: WorldState[] = new Array(ActionPlanner.MAX_CONDITIONS);

        /**
         * 所有行动的后置条件（行动效果）
         */
        public _postConditions: WorldState[] = new Array(ActionPlanner.MAX_CONDITIONS);

        /**
         * 世界状态原子的数量
         */
        public _numConditionNames: number;

        constructor(){
            this._numConditionNames = 0;
            for (let i = 0; i < ActionPlanner.MAX_CONDITIONS; ++i){
                this.conditionNames[i] = null;
                this._preConditions[i] = WorldState.create(this);
                this._postConditions[i] = WorldState.create(this);
            }
        }

        /**
         * 读取世界状态对象的便利方法
         */
        public createWorldState(): WorldState {
            return WorldState.create(this);
        }

        public addAction(action: Action){
            let actionId = this.findActionIndex(action);
            if (actionId == -1)
                throw new Error("无法找到或创建行动");

            action._preConditions.forEach((preCondition)=>{
                let conditionId = this.findConditionNameIndex(preCondition[0]);
                if (conditionId == -1)
                    throw new Error("无法找到或创建条件名称");

                this._preConditions[actionId].set(conditionId, preCondition[1]);
            });

            action._postConditions.forEach((postCondition)=>{
                let conditionId = this.findConditionNameIndex(postCondition[0]);
                if (conditionId == -1)
                    throw new Error("找不到条件名称");

                this._postConditions[actionId].set(conditionId, postCondition[1]);
            });
        }

        public plan(startState: WorldState, goalState: WorldState, selectedNode = null){
            this._viableActions.length = 0;
            for (let i = 0; i < this._actions.length; i++){
                if (this._actions[i].validate())
                    this._viableActions.push(this._actions[i]);
            }

            return AStar.plan(this, startState, goalState, selectedNode);
        }

        public getPossibleTransitions(fr: WorldState){
            let result = ListPool.obtain<AStarNode>();
            for (let i = 0; i < this._viableActions.length; ++i){
                let pre = this._preConditions[i];
                let care = (pre.dontCare ^ -1);
                let met = ((pre.values & care) == (fr.values & care));
                if (met){
                    let node = Pool.obtain<AStarNode>(AStarNode);
                    node.action = this._viableActions[i];
                    node.costSoFar = this._viableActions[i].cost;
                    node.worldState = this.applyPostConditions(this, i, fr);
                    result.push(node);
                }
            }

            return result;
        }

        public applyPostConditions(ap: ActionPlanner, actionnr: number, fr: WorldState){
            let pst = ap._postConditions[actionnr];
            let unaffected = pst.dontCare;
            let affected = (unaffected ^ -1);

            fr.values = (fr.values & unaffected) | (pst.values & affected);
            fr.dontCare &= pst.dontCare;
            return fr;
        }

        public findConditionNameIndex(conditionName: string){
            let idx;
            for (idx = 0; idx < this._numConditionNames; ++idx){
                if (this.conditionNames[idx] == conditionName)
                    return idx;
            }

            if (idx < ActionPlanner.MAX_CONDITIONS - 1){
                this.conditionNames[idx] = conditionName;
                this._numConditionNames ++;
                return idx;
            }

            return -1;
        }

        public findActionIndex(action: Action): number{
            let idx = this._actions.indexOf(action);
            if (idx > -1)
                return idx;

            this._actions.push(action);
            return this._actions.length - 1;
        }
    }
}