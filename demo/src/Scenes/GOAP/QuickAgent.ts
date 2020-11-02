module samples {
    export class QuickAgent extends es.Agent {
        private planner: es.ActionPlanner;
        constructor(){
            super();
            this.planner = new es.ActionPlanner();

            let action = new es.Action("scout");
            action.setPrecondition("armedwithgun", true);
            action.setPostcondition("enemyvisible", true);
            this.planner.addAction(action);
        }

        public getWorldState(): es.WorldState {
            let state = es.WorldState.create(this.planner);
            return state;
        }
        public getGoalState(): es.WorldState {
            return es.WorldState.create(this.planner);
        }
    }
}