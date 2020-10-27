module es {
    export interface IComparer<T>{
        compare(x: T, y: T): number;
    }
}