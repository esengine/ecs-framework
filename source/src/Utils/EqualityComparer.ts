module es {
    export class EqualityComparer<T> implements IEqualityComparer {
        public static default<T>(){
            return new EqualityComparer<T>();
        }

        protected constructor(){ }

        public equals(x: T, y: T): boolean{
            if (typeof x["equals"] == 'function'){
                return x["equals"](y);
            } else {
                return x === y;
            }
        }
    }
}