module es {
    export class EqualityComparer<T> implements IEqualityComparer<T> {
        public static default<T>() {
            return new EqualityComparer<T>();
        }

        protected constructor() { }

        public equals(x: T, y: T): boolean {
            if (typeof x["equals"] == 'function') {
                return x["equals"](y);
            } else {
                return x === y;
            }
        }

        public getHashCode(o: T): number {
            if (typeof o == 'number') {
                return this._getHashCodeForNumber(o);
            }

            if (typeof o == 'string') {
                return this._getHashCodeForString(o);
            }

            let hashCode = 385229220;
            this.forOwn(o, (value) => {
                if (typeof value == 'number') {
                    hashCode += this._getHashCodeForNumber(value);
                } else if (typeof value == 'string') {
                    hashCode += this._getHashCodeForString(value);
                } else if (typeof value == 'object') {
                    this.forOwn(value, () => {
                        hashCode += this.getHashCode(value);
                    });
                }
            });

            return hashCode;
        }

        private _getHashCodeForNumber(n: number): number {
            return n;
        }

        private _getHashCodeForString(s: string): number {
            let hashCode = 385229220;

            for (let i = 0; i < s.length; i++) { 
                hashCode = (hashCode * -1521134295) ^ s.charCodeAt(i);
            }

            return hashCode;
        }

        private forOwn(object, iteratee){
            object = Object(object);
            Object.keys(object).forEach((key) => iteratee(object[key], key, object));
        }
    }
}