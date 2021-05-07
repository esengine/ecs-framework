module es {
    export class Matcher {
        protected allSet: (new (...args: any[]) => Component)[] = [];
        protected exclusionSet: (new (...args: any[]) => Component)[] = [];
        protected oneSet: (new (...args: any[]) => Component)[] = [];

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

        public isInterested(components: Bits) {
            if (this.allSet.length != 0) {
                for (let s of this.allSet) {
                    if (!components.get(ComponentTypeManager.getIndexFor(s)))
                        return false;
                }
            }

            if (this.exclusionSet.length != 0) {
                for (let s of this.exclusionSet) {
                    if (components.get(ComponentTypeManager.getIndexFor(s)))
                        return false;
                }
            }

            if (this.oneSet.length != 0) {
                for (let s of this.oneSet) {
                    if (components.get(ComponentTypeManager.getIndexFor(s)))
                        return true;
                }
            }

            return true;
        }

        public all(...types: any[]): Matcher {
            let t;
            for (t of types) {
                this.allSet.push(t);
            }

            return this;
        }

        public exclude(...types: any[]) {
            let t;
            for (t of types) {
                this.exclusionSet.push(t);
            }

            return this;
        }

        public one(...types: any[]) {
            for (const t of types) {
                this.oneSet.push(t);
            }

            return this;
        }
    }
}
