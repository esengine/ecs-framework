module es {
    export class WorldState implements IEquatable<WorldState> {
        /**
         * 我们使用条件索引上的位掩码移位来翻转位。
         */
        public values: number;

        /**
         * 比特掩码用于明确表示false。
         * 我们需要一个单独的负值存储空间，因为一个值的缺失并不一定意味着它是假的
         */
        public dontCare: number;

        /**
         * 是必需的，这样我们就可以从字符串名称中获取条件索引
         */
        public planner: ActionPlanner;

        /**
         * 
         * @param planner 
         */
        public static create(planner: ActionPlanner): WorldState {
            return new WorldState(planner, 0, -1);
        }

        /**
         * 
         * @param planner 
         * @param values 
         * @param dontcare 
         */
        constructor(planner: ActionPlanner, values: number, dontcare: number){
            this.planner = planner;
            this.values = values;
            this.dontCare = dontcare;
        }

        public set(conditionId: number | string, value: boolean): boolean {
            if (typeof conditionId == "string"){
                return this.set(this.planner.findConditionNameIndex(conditionId), value);
            }
            
            this.values = value ? (this.values | (1 << conditionId)) : (this.values & ~(1 << conditionId));
            this.dontCare ^= (1 << conditionId);
            return true;
        }

        /**
         * 
         * @param other 
         */
        public equals(other: WorldState): boolean {
            let care = this.dontCare ^ -1;
            return (this.values & care) == (other.values & care);
        }

        /**
         * 用于调试目的。提供一个包含所有前提条件的可读字符串
         * @param planner 
         */
        public describe(planner: ActionPlanner): string {
            let s = "";
            for (let i = 0; i < ActionPlanner.MAX_CONDITIONS; i ++){
                if ((this.dontCare & (1 << i)) == 0){
                    let val = planner.conditionNames[i];
                    if (val == null) 
                        continue;

                    let set = ((this.values & (1 << i)) != 0);
                    if (s.length > 0)
                        s += ", ";
                    s += (set ? val.toUpperCase() : val);
                }
            }

            return s;
        }
    }
}