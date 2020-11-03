module samples {
    export class MinerState {
        public readonly maxFatigue = 10;
        public readonly maxGold = 8;
        public readonly maxThirst = 5;

        public fatigue: number = 10;
        public thirst: number = 0;
        public gold: number = 0;
        public goldInBank: number = 0;

        public currentLocation: Location = Location.home;
    }

    export class GoapScene extends SampleScene {
        public _destinationLocation: Location;
        public planner: es.ActionPlanner;
        public _actionPlan: es.Action[];

        public minerState: MinerState;

        public initialize(): void {
            super.initialize();

            // 在我们做任何事情之前，我们需要一个行动计划
            this.planner = new es.ActionPlanner();
            this.minerState = new MinerState();

            // 设置我们的动作并将它们添加到计划器中
            let sleep = new es.Action("sleep");
            sleep.setPrecondition("fatigued", true);
            sleep.setPostcondition("fatigued", false);
            this.planner.addAction(sleep);

            let drink = new es.Action("drink");
            drink.setPrecondition("thirsty", true);
            drink.setPostcondition("thirsty", false);
            this.planner.addAction(drink);

            let mine = new es.Action("mine");
            mine.setPrecondition("hasenoughgold", false);
            mine.setPostcondition("hasenoughgold", true);
            this.planner.addAction(mine);

            let depositGold = new es.Action("depositGold");
            depositGold.setPrecondition("hasenoughgold", true);
            depositGold.setPostcondition("hasenoughgold", false);
            this.planner.addAction(depositGold);

            // 制定一个计划，让我们从当前状态运行到目标状态
            this._actionPlan = this.planner.plan(this.getWorldState(), this.getGoalState());
            if (this._actionPlan != null && this._actionPlan.length > 0){
                this.goTo();
                console.log(`得到了一个行动计划与${this._actionPlan.length}行动`);
            } else {
                console.log(`没有满足我们目标的行动计划`);
            }
        }

        private goTo(){
            let action = this._actionPlan[this._actionPlan.length - 1].name;
            switch (action){
                case "sleep":
                    this._destinationLocation = Location.home;
                    break;
                case "drink":
                    this._destinationLocation = Location.saloon;
                    break;
                case "mine":
                    this._destinationLocation = Location.mine;
                    break;
                case "depositeGold":
                    this._destinationLocation = Location.bank;
                    break;
            }

            if (this.minerState.currentLocation == this._destinationLocation){

            } else {
                this.minerState.currentLocation = Location.inTransit;
            }
        }

        public getWorldState(): es.WorldState {
            let worldState = this.planner.createWorldState();
            worldState.set("fatigued", this.minerState.fatigue >= this.minerState.maxFatigue);
            worldState.set("thirsty", this.minerState.thirst >= this.minerState.maxThirst);
            worldState.set("hasenoughgold", this.minerState.gold >= this.minerState.maxGold);

            return worldState;
        }

        public getGoalState(): es.WorldState {
            let goalState = this.planner.createWorldState();

            if (this.minerState.fatigue >= this.minerState.maxFatigue){
                goalState.set("fatigued", false);
            } else if(this.minerState.thirst >= this.minerState.maxThirst){
                goalState.set("thirsty", false);
            } else if(this.minerState.gold >= this.minerState.maxGold){
                goalState.set("hasenoughgold", false);
            } else {
                goalState.set("hasenoughgold", true);
            }

            return goalState;
        }
    }

    enum Location {
        inTransit,
        bank,
        mine,
        home, 
        saloon,
    }
}