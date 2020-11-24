module es {
    export class ComponentTypeManager {
        private static _componentTypesMask: Map<any, number> = new Map<any, number>();

        public static add(type) {
            if (!this._componentTypesMask.has(type))
                this._componentTypesMask.set(type, this._componentTypesMask.size);
        }

        public static getIndexFor(type) {
            let v = -1;
            if (!this._componentTypesMask.has(type)) {
                this.add(type);
                v = this._componentTypesMask.get(type);
            } else {
                v = this._componentTypesMask.get(type);
            }

            return v;
        }
    }
}
