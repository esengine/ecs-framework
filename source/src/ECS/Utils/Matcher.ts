module es {
    export class Matcher {
        protected allSet = new BitSet();
        protected exclusionSet = new BitSet();
        protected oneSet = new BitSet();

        public static empty() {
            return new Matcher();
        }

        public getAllSet() {
            return this.allSet;
        }

        public getExclusionSet() {
            return this.exclusionSet;
        }

        public getOneSet() {
            return this.oneSet;
        }

        public isInterestedEntity(e: Entity) {
            return this.isInterested(e.componentBits);
        }

        public isInterested(componentBits: BitSet) {
            // 检查实体是否拥有该方面中定义的所有组件
            if (!this.allSet.isEmpty()) {
                for (let i = this.allSet.nextSetBit(0); i >= 0; i = this.allSet.nextSetBit(i + 1)) {
                    if (!componentBits.get(i))
                        return false;
                }
            }

            // 如果我们仍然感兴趣，检查该实体是否拥有任何一个排除组件，如果有，那么系统就不感兴趣
            if (!this.exclusionSet.isEmpty() && this.exclusionSet.intersects(componentBits))
                return false;

            // 如果我们仍然感兴趣，检查该实体是否拥有oneSet中的任何一个组件。如果是，系统就会感兴趣
            if (!this.oneSet.isEmpty() && !this.oneSet.intersects(componentBits))
                return false;

            return true;
        }

        public all(...types: any[]): Matcher {
            types.forEach(type => {
                this.allSet.set(ComponentTypeManager.getIndexFor(type));
            });

            return this;
        }

        public exclude(...types: any[]) {
            types.forEach(type => {
                this.exclusionSet.set(ComponentTypeManager.getIndexFor(type));
            });

            return this;
        }

        public one(...types: any[]) {
            types.forEach(type => {
                this.oneSet.set(ComponentTypeManager.getIndexFor(type));
            });

            return this;
        }
    }
}
