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
                for (let i = 0, s = this.allSet.length; i < s; ++ i) {
                    let type = this.allSet[i];
                    if (!components.get(ComponentTypeManager.getIndexFor(type)))
                        return false;
                }
            }

            if (this.exclusionSet.length != 0) {
                for (let i = 0, s = this.exclusionSet.length; i < s; ++ i) {
                    let type = this.exclusionSet[i];
                    if (components.get(ComponentTypeManager.getIndexFor(type)))
                        return false;
                }
            }

            if (this.oneSet.length != 0) {
                for (let i = 0, s = this.oneSet.length; i < s; ++ i) {
                    let type = this.oneSet[i];
                    if (components.get(ComponentTypeManager.getIndexFor(type)))
                        return true;
                }
            }

            return true;
        }

        public all(...types: any[]): Matcher {
            let t;
            for (let i = 0, s = types.length; i < s; ++ i) {
                t = types[i];
                this.allSet.push(t);
            }

            return this;
        }

        public exclude(...types: any[]) {
            let t;
            for (let i = 0, s = types.length; i < s; ++ i) {
                t = types[i];
                this.exclusionSet.push(t);
            }

            return this;
        }

        public one(...types: any[]) {
            for (let i = 0, s = types.length; i < s; ++ i) {
                const t = types[i];
                this.oneSet.push(t);
            }

            return this;
        }
    }
}
