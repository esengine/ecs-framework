module es {
    interface IdentityHashMap {
        [key: string]: ComponentType;
    }

    export class ComponentTypeFactory {
        private componentTypes_: IdentityHashMap;

        private componentTypeCount_ = 0;

        public types: Bag<ComponentType>;

        constructor() {
            this.componentTypes_ = {};
            this.types = new Bag<ComponentType>();
        }

        public getTypeFor(c): ComponentType {
            if ("number" === typeof c) {
                return this.types.get(c);
            }

            let type: ComponentType = this.componentTypes_[getClassName(c)];

            if (type == null) {
                const index: number = this.componentTypeCount_++;
                type = new ComponentType(c, index);
                this.componentTypes_[getClassName(c)] = type;
                this.types.set(index, type);
            }

            return type;
        }

        public getIndexFor(c): number {
            return this.getTypeFor(c).getIndex();
        }
    }
}