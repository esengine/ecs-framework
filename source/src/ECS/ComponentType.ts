module es {
    export class ComponentType {
        public static INDEX = 0;
    
        private index_ = 0;
        private type_: Class;
    
        constructor(type: Class, index?: number) {
            if (index !== undefined) {
                this.index_ = ComponentType.INDEX++;
            } else {
                this.index_ = index;
            }
            this.type_ = type;
        }
    
        public getName(): string {
            return getClassName(this.type_);
        }
    
        public getIndex(): number {
            return this.index_;
        }
    
        public toString(): string {
            return "ComponentType[" + getClassName(ComponentType) + "] (" + this.index_ + ")";
        }
    }
    
}