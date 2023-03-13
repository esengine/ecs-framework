module es {
    /**
     * 定义一个实体匹配器类。
     */
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
            if (this.allSet.length !== 0) {
                for (let i = 0; i < this.allSet.length; i++) {
                    const type = this.allSet[i];
                    if (!components.get(ComponentTypeManager.getIndexFor(type))) {
                        return false;
                    }
                }
            }

            if (this.exclusionSet.length !== 0) {
                for (let i = 0; i < this.exclusionSet.length; i++) {
                    const type = this.exclusionSet[i];
                    if (components.get(ComponentTypeManager.getIndexFor(type))) {
                        return false;
                    }
                }
            }

            if (this.oneSet.length !== 0) {
                for (let i = 0; i < this.oneSet.length; i++) {
                    const type = this.oneSet[i];
                    if (components.get(ComponentTypeManager.getIndexFor(type))) {
                        return true;
                    }
                }
                return false;
            }

            return true;
        }

        /**
        * 添加所有包含的组件类型。
        * @param types 所有包含的组件类型列表
        */
        public all(...types: (new (...args: any[]) => Component)[]): Matcher {
            this.allSet.push(...types);
            return this;
        }

        /**
         * 添加排除包含的组件类型。
         * @param types 排除包含的组件类型列表
         */
        public exclude(...types: (new (...args: any[]) => Component)[]): Matcher {
            this.exclusionSet.push(...types);
            return this;
        }

        /**
         * 添加至少包含其中之一的组件类型。
         * @param types 至少包含其中之一的组件类型列表
         */
        public one(...types: (new (...args: any[]) => Component)[]): Matcher {
            this.oneSet.push(...types);
            return this;
        }
    }
}
