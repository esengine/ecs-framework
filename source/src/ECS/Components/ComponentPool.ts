module es {
    export class ComponentPool<T extends PooledComponent> {
        private _cache: T[];
        private _type: any;

        constructor(typeClass: any) {
            this._type = typeClass;
            this._cache = [];
        }

        public obtain(): T {
            try {
                return this._cache.length > 0 ? this._cache.shift() : new this._type();
            } catch (err) {
                throw new Error(this._type + err);
            }
        }

        public free(component: T) {
            component.reset();
            this._cache.push(component);
        }
    }
}
