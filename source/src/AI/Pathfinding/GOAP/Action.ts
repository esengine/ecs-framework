module es {
    export class Action {
        /**
         * Action的可选名称。用于调试目的
         */
        public name: string;

        /**
         * 执行动作的成本。 改变它将会影响到计划期间的行动/选择。
         */
        public cost: number = 1;

        public _preConditions: Set<[string, boolean]> = new Set<[string, boolean]>();
        public _postConditions: Set<[string, boolean]> = new Set<[string, boolean]>();

        constructor(name?: string, cost: number = 1){
            this.name = name;
            this.cost = cost;
        }

        public setPrecondition(conditionName: string, value: boolean){
            this._preConditions.add([conditionName, value]);
        }

        public setPostcondition(conditionName: string, value: boolean){
            this._preConditions.add([conditionName, value]);
        }

        /**
         * 在ActionPlanner进行plan之前调用。让Action有机会设置它的分数，或者在没有用的情况下选择退出。
         * 例如，如果Action是要拿起一把枪，但世界上没有枪，返回false将使Action不被ActionPlanner考虑
         */
        public validate(): boolean{
            return true;
        }

        public toString(): string{
            return `[Action] ${this.name} - cost: ${this.cost}`;
        }
    }
}